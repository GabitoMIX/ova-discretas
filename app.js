/*
 * OVA Matemáticas Discretas
 * ------------------------
 * Este archivo contiene la aplicación de una sola página: datos de los
 * módulos, renderizado de vistas, actividades interactivas, laboratorios,
 * audio, progreso local, evaluación final, certificado y playgrounds.
 */

const STORAGE_KEY = "ova-discretas-progress-v1";

// Renderiza fórmulas LaTeX con MathJax cuando está disponible; si no carga,
// usa un fallback local suficiente para la notación del OVA.
let mathJaxRetryTimer = null;

function renderMath(root = document.body) {
  const target = root || document.body;
  if (window.MathJax && window.MathJax.typesetPromise) {
    restoreLocalLatex(target);
    window.MathJax.typesetClear?.([target]);
    window.MathJax.typesetPromise([target]).catch((error) => {
      console.warn("MathJax no pudo renderizar una formula.", error);
      renderLocalLatex(target);
    });
    return;
  }
  renderLocalLatex(target);
  queueMathJaxRender(target);
}

function queueMathJaxRender(root) {
  if (mathJaxRetryTimer || window.MathJax?.typesetPromise) return;
  mathJaxRetryTimer = window.setTimeout(() => {
    mathJaxRetryTimer = null;
    if (window.MathJax?.typesetPromise) renderMath(root);
  }, 450);
}

function inlineMath(tex) {
  return `\\(${tex}\\)`;
}

function displayMath(tex) {
  return `<div class="math-display">\\[${tex}\\]</div>`;
}

function setMathHtml(selector, html) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.innerHTML = html;
  renderMath(element);
}

// Todo HTML que proviene de datos editables pasa por escapeHtml antes de
// insertarse en atributos o controles para evitar markup accidental.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Modal de confirmación personalizado para reemplazar confirm() del navegador
function showCustomConfirm(message, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "ova-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  
  overlay.innerHTML = `
    <div class="ova-modal-card">
      <div class="ova-modal-header">
        <h4>Confirmación</h4>
      </div>
      <div class="ova-modal-body">
        <p>${message}</p>
      </div>
      <div class="ova-modal-footer">
        <button type="button" class="secondary-button" id="ovaModalCancel">Cancelar</button>
        <button type="button" class="primary-button" id="ovaModalConfirm" style="background: var(--bad); border-color: var(--bad); color: #ffffff;">Reiniciar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  void overlay.offsetWidth; // Forzar reflow para animación
  overlay.classList.add("active");
  
  const cancelBtn = overlay.querySelector("#ovaModalCancel");
  const confirmBtn = overlay.querySelector("#ovaModalConfirm");
  
  function close() {
    overlay.classList.remove("active");
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
    });
  }
  
  cancelBtn.addEventListener("click", () => {
    playSound("nav");
    close();
  });
  
  confirmBtn.addEventListener("click", () => {
    playSound("complete");
    close();
    if (onConfirm) onConfirm();
  });
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      playSound("nav");
      close();
    }
  });
}

// Modal de alerta personalizado para reemplazar alert() del navegador
function showCustomAlert(message) {
  const overlay = document.createElement("div");
  overlay.className = "ova-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  
  overlay.innerHTML = `
    <div class="ova-modal-card">
      <div class="ova-modal-header">
        <h4>Aviso</h4>
      </div>
      <div class="ova-modal-body">
        <p>${message}</p>
      </div>
      <div class="ova-modal-footer">
        <button type="button" class="primary-button" id="ovaModalOk">Entendido</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  void overlay.offsetWidth; // Forzar reflow
  overlay.classList.add("active");
  
  const okBtn = overlay.querySelector("#ovaModalOk");
  
  function close() {
    overlay.classList.remove("active");
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
    });
  }
  
  okBtn.addEventListener("click", () => {
    playSound("nav");
    close();
  });
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      playSound("nav");
      close();
    }
  });
}

// Oculta o muestra el hero institucional según la vista
function setHeroVisibility(visible) {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  if (visible) {
    hero.style.display = "";
  } else {
    hero.style.display = "none";
  }
}

// Fallback pequeno para que la app siga siendo legible si MathJax no carga
// por falta de internet o bloqueo del CDN.
function renderLocalLatex(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue.includes("\\") || parent.closest("script, style, textarea, select, .latex-inline, .latex-display")) {
        return NodeFilter.FILTER_REJECT;
      }
      return /\\{1,2}[\(\[]/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(replaceLatexTextNode);
}

function replaceLatexTextNode(node) {
  const pattern = /\\{1,2}\(([\s\S]+?)\\{1,2}\)|\\{1,2}\[([\s\S]+?)\\{1,2}\]/g;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(node.nodeValue)) !== null) {
    if (match.index > lastIndex) {
      fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex, match.index)));
    }
    const isDisplay = Boolean(match[2]);
    const rawTex = match[1] || match[2] || "";
    const element = document.createElement(isDisplay ? "div" : "span");
    element.className = isDisplay ? "latex-display" : "latex-inline";
    element.dataset.latexSource = rawTex;
    element.dataset.latexDisplay = String(isDisplay);
    element.innerHTML = latexToHtml(rawTex);
    fragment.append(element);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < node.nodeValue.length) {
    fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex)));
  }
  node.replaceWith(fragment);
}

function restoreLocalLatex(root) {
  root.querySelectorAll("[data-latex-source]").forEach((element) => {
    const tex = element.dataset.latexSource || "";
    const delimiter = element.dataset.latexDisplay === "true" ? ["\\[", "\\]"] : ["\\(", "\\)"];
    element.replaceWith(document.createTextNode(`${delimiter[0]}${tex}${delimiter[1]}`));
  });
}

window.addEventListener("mathjax-ready", () => {
  renderMath(document.querySelector("#appView") || document.body);
});

window.addEventListener("load", () => {
  window.setTimeout(() => renderMath(document.querySelector("#appView") || document.body), 250);
});

function latexToHtml(tex) {
  let html = escapeHtml(tex.trim());
  html = html.replace(/\\binom\{([^{}]+)\}\{([^{}]+)\}/g, (_, top, bottom) => {
    return `<span class="latex-binom">( <span class="latex-stack"><span>${latexToHtml(top)}</span><span>${latexToHtml(bottom)}</span></span> )</span>`;
  });
  html = html.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, top, bottom) => {
    return `<span class="latex-frac"><span class="num">${latexToHtml(top)}</span><span class="den">${latexToHtml(bottom)}</span></span>`;
  });
  html = html.replace(/\\texttt\{([^{}]+)\}/g, (_, value) => `<code>${escapeHtml(value)}</code>`);
  html = html.replace(/\\mathrm\{([^{}]+)\}/g, (_, value) => `<span class="math-roman">${escapeHtml(value)}</span>`);
  html = html.replace(/\\mathcal\{([^{}]+)\}/g, (_, value) => `<span class="mathcal">${escapeHtml(value)}</span>`);
  const namedSymbolHtml = {
    alpha: "&alpha;",
    beta: "&beta;",
    epsilon: "&epsilon;",
    Sigma: "&Sigma;",
    lambda: "&lambda;"
  };
  html = html.replace(/\\(alpha|beta|epsilon|Sigma|lambda)\^\{([^{}]+)\}/g, (_, symbol, exp) => {
    return `${namedSymbolHtml[symbol]}<sup>${latexToHtml(exp)}</sup>`;
  });
  html = html.replace(/\\(alpha|beta|epsilon|Sigma|lambda)\^([A-Za-z0-9*]+)/g, (_, symbol, exp) => {
    return `${namedSymbolHtml[symbol]}<sup>${latexToHtml(exp)}</sup>`;
  });
  html = html.replace(/([A-Za-z0-9)\]}])\^\{([^{}]+)\}/g, (_, base, exp) => `${base}<sup>${latexToHtml(exp)}</sup>`);
  html = html.replace(/([A-Za-z0-9)\]}])\^([A-Za-z0-9*]+)/g, (_, base, exp) => `${base}<sup>${latexToHtml(exp)}</sup>`);
  html = html.replace(/([A-Za-z0-9)\]}])_\{([^{}]+)\}/g, (_, base, sub) => `${base}<sub>${latexToHtml(sub)}</sub>`);
  html = html.replace(/([A-Za-z0-9)\]}])_([A-Za-z0-9]+)/g, (_, base, sub) => `${base}<sub>${latexToHtml(sub)}</sub>`);
  const symbols = {
    "\\land": "&and;",
    "\\lor": "&or;",
    "\\to": "&rarr;",
    "\\leftrightarrow": "&harr;",
    "\\le": "&le;",
    "\\ge": "&ge;",
    "\\cap": "&cap;",
    "\\cup": "&cup;",
    "\\subseteq": "&sube;",
    "\\in": "&in;",
    "\\notin": "&notin;",
    "\\varnothing": "&empty;",
    "\\emptyset": "&empty;",
    "\\lambda": "&lambda;",
    "\\alpha": "&alpha;",
    "\\beta": "&beta;",
    "\\epsilon": "&epsilon;",
    "\\Sigma": "&Sigma;",
    "\\triangle": "&#9651;",
    "\\neg": "&not;",
    "\\approx": "&asymp;",
    "\\%": "%"
  };
  for (const [source, replacement] of Object.entries(symbols)) {
    html = html.replaceAll(source, replacement);
  }
  return html.replaceAll("\\{", "{").replaceAll("\\}", "}").replaceAll("\\", "");
}

// Fuente principal de contenido. Para editar un modulo, cambiar su objeto:
// titulo, PDF de apoyo, objetivos, ejemplo y preguntas de autoevaluacion.
const modules = [
  {
    id: "logic",
    number: 1,
    title: "Logica proposicional",
    slidePath: "COSAS%20DEL%20AULA/PROPOSICIONES%20LOGICAS.pdf",
    summary:
      "Proposiciones simples y compuestas, conectivos logicos, tablas de verdad, tautologias y equivalencias.",
    outcomes: [
      "Reconocer cuando una frase puede tratarse como proposicion.",
      "Construir proposiciones compuestas con \\(\\neg p\\), \\(p \\land q\\), \\(p \\lor q\\), \\(p \\to q\\) y \\(p \\leftrightarrow q\\).",
      "Usar tablas de verdad para decidir si un enunciado es tautologia, contradiccion o contingencia."
    ],
    example:
      "Si \\(p\\): \"el algoritmo termina\" y \\(q\\): \"la salida es correcta\", entonces \\(p \\to q\\) se lee: si el algoritmo termina, la salida es correcta. Solo es falsa cuando \\(p\\) es verdadera y \\(q\\) es falsa.",
    quiz: [
      {
        prompt: "Una proposicion es:",
        options: [
          "Una pregunta abierta.",
          "Un enunciado que puede ser verdadero o falso.",
          "Una orden sin valor de verdad."
        ],
        answer: 1,
        feedback:
          "Correcto: en logica proposicional se trabaja con enunciados que tienen valor de verdad."
      },
      {
        prompt: "La conjuncion \\(p \\land q\\) es verdadera cuando:",
        options: ["al menos una es verdadera.", "ambas son falsas.", "p y q son verdaderas."],
        answer: 2,
        feedback: "Bien: la conjuncion exige que las dos proposiciones sean verdaderas."
      },
      {
        prompt: "El condicional \\(p \\to q\\) es falso cuando:",
        options: ["p es verdadera y q es falsa.", "p es falsa y q es verdadera.", "p y q son verdaderas."],
        answer: 0,
        feedback: "Exacto: prometer p -> q falla unicamente si ocurre p y no ocurre q."
      }
    ]
  },
  {
    id: "sets",
    number: 2,
    title: "Conjuntos y diagramas de Venn",
    slidePath: "COSAS%20DEL%20AULA/MAT%20DIS%20CONJUNTOS.pdf",
    summary:
      "Pertenencia, subconjuntos, conjunto universal, union, interseccion, diferencia, complemento y diferencia simetrica.",
    outcomes: [
      "Representar conjuntos por extension y por comprension.",
      "Identificar pertenencia \\(\\in\\), subconjunto \\(\\subseteq\\), conjunto vacio \\(\\varnothing\\) y conjunto potencia \\(\\mathcal{P}(A)\\).",
      "Resolver operaciones entre conjuntos apoyandose en diagramas de Venn."
    ],
    example:
      "Con \\(A=\\{1,2,3,5\\}\\), \\(B=\\{2,4,5,6\\}\\) y \\(U=\\{1,2,3,4,5,6,7,8\\}\\), la interseccion \\(A \\cap B\\) contiene los elementos que aparecen en ambos conjuntos: \\(\\{2,5\\}\\).",
    quiz: [
      {
        prompt: "Si \\(A=\\{1,2,3\\}\\) y \\(B=\\{3,4\\}\\), entonces \\(A \\cup B\\) es:",
        options: ["\\(\\{3\\}\\)", "\\(\\{1,2\\}\\)", "\\(\\{1,2,3,4\\}\\)"],
        answer: 2,
        feedback: "Correcto: la union toma todos los elementos sin repetirlos."
      },
      {
        prompt: "El simbolo \"2 pertenece a \\(A\\)\" se escribe:",
        options: ["\\(2 \\subseteq A\\)", "\\(2 \\in A\\)", "\\(A \\in 2\\)"],
        answer: 1,
        feedback: "Bien. En pantalla usamos e como version ASCII de pertenece."
      },
      {
        prompt: "La diferencia \\(A - B\\) contiene:",
        options: [
          "Elementos que estan en A y no estan en B.",
          "Elementos que estan en ambos conjuntos.",
          "Elementos que no estan en el universo."
        ],
        answer: 0,
        feedback: "Exacto: A - B conserva lo exclusivo de A."
      }
    ]
  },
  {
    id: "strings",
    number: 3,
    title: "Alfabetos, cadenas y lenguajes",
    slidePath: "COSAS%20DEL%20AULA/Taller_Cadenas_Lenguajes_.pdf",
    summary:
      "Alfabetos, longitud, concatenacion, potencia, reversa, prefijos, sufijos, subcadenas y lenguajes formales.",
    outcomes: [
      "Diferenciar alfabeto, cadena y lenguaje.",
      "Calcular longitud \\(|w|\\), concatenacion \\(\\alpha\\beta\\), potencia \\(\\alpha^n\\) y reversa \\(\\alpha^R\\) de una cadena.",
      "Validar cadenas contra reglas formales usadas en programacion."
    ],
    example:
      "Si \\(\\alpha=\\texttt{data}\\) y \\(\\beta=\\texttt{base}\\), entonces \\(\\alpha\\beta=\\texttt{database}\\) y \\(\\beta\\alpha=\\texttt{basedata}\\). La concatenacion no siempre es conmutativa.",
    quiz: [
      {
        prompt: "Si \\(\\beta=\\texttt{programacion}\\), entonces \\(|\\beta|\\) es:",
        options: ["11", "12", "10"],
        answer: 1,
        feedback: "Correcto: programacion tiene 12 caracteres."
      },
      {
        prompt: "La reversa de \\(1010110\\) es:",
        options: ["\\(0110101\\)", "\\(1010110\\)", "\\(0101110\\)"],
        answer: 0,
        feedback: "Bien: se leen los simbolos de derecha a izquierda."
      },
      {
        prompt: "Un lenguaje formal es:",
        options: [
          "Un unico simbolo.",
          "Una operacion entre numeros reales.",
          "Un conjunto de cadenas sobre un alfabeto."
        ],
        answer: 2,
        feedback: "Exacto: un lenguaje define que cadenas son validas."
      }
    ]
  },
  {
    id: "probability",
    number: 4,
    title: "Espacios muestrales y eventos",
    slidePath: "COSAS%20DEL%20AULA/5. espacio muestral y eventos.pdf",
    summary:
      "Espacio muestral, eventos, experimentos aleatorios, conteo de resultados y probabilidad condicional basica.",
    outcomes: [
      "Describir el espacio muestral de experimentos sencillos.",
      "Definir eventos \\(E\\) como subconjuntos del espacio muestral \\(E \\subseteq S\\).",
      "Calcular probabilidades por conteo cuando los resultados son equiprobables: \\(P(E)=\\frac{|E|}{|S|}\\)."
    ],
    example:
      "Al lanzar un dado, \\(S=\\{1,2,3,4,5,6\\}\\). El evento obtener un numero divisible por 3 es \\(E=\\{3,6\\}\\); por tanto \\(P(E)=\\frac{2}{6}=\\frac{1}{3}\\).",
    quiz: [
      {
        prompt: "Un evento es:",
        options: [
          "Un subconjunto del espacio muestral.",
          "Siempre todo el espacio muestral.",
          "Un resultado imposible."
        ],
        answer: 0,
        feedback: "Correcto: un evento agrupa resultados de interes."
      },
      {
        prompt: "Al lanzar dos monedas, cuantos resultados tiene S?",
        options: ["2", "6", "4"],
        answer: 2,
        feedback: "Bien: CC, CS, SC y SS."
      },
      {
        prompt: "Si todos los resultados son equiprobables, \\(P(E)\\) se calcula como:",
        options: ["\\(|S|-|E|\\)", "\\(\\frac{|E|}{|S|}\\)", "\\(|S|+|E|\\)"],
        answer: 1,
        feedback: "Exacto: casos favorables sobre casos posibles."
      }
    ]
  },
  {
    id: "binomial",
    number: 5,
    title: "Variables aleatorias y distribucion binomial",
    slidePath: "COSAS%20DEL%20AULA/Variables%20Aleatorias%20y%20Distribuci%C3%B3n%20Binomial.pdf",
    summary:
      "Variables aleatorias discretas, parametros binomiales, ensayos, probabilidad de exito y calculo de probabilidades.",
    outcomes: [
      "Interpretar una variable aleatoria como funcion que asigna numeros a resultados.",
      "Reconocer los parametros \\(n\\), \\(p\\) y \\(k\\) en una situacion binomial.",
      "Calcular \\(P(X=k)\\) con combinatoria y potencias."
    ],
    example:
      "Si \\(X\\) cuenta exitos en \\(n\\) ensayos independientes y cada ensayo tiene probabilidad \\(p\\) de exito, entonces " +
      displayMath("P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}"),
    quiz: [
      {
        prompt: "En una binomial, \\(n\\) representa:",
        options: ["Probabilidad de exito.", "Numero de ensayos.", "Numero de fracasos obligatorios."],
        answer: 1,
        feedback: "Correcto: n es la cantidad de intentos o repeticiones."
      },
      {
        prompt: "Para que un modelo sea binomial se requiere:",
        options: [
          "Ensayos independientes con dos resultados posibles.",
          "Resultados infinitos y continuos.",
          "Que p cambie en cada ensayo."
        ],
        answer: 0,
        feedback: "Bien: exito/fracaso, independencia y p constante."
      },
      {
        prompt: "Si \\(p=0.7\\), entonces la probabilidad de fracaso es:",
        options: ["\\(0.7\\)", "\\(1.7\\)", "\\(0.3\\)"],
        answer: 2,
        feedback: "Exacto: 1 - p = 0.3."
      }
    ]
  },
  {
    id: "graphs",
    number: 6,
    title: "Grafos",
    slidePath: "COSAS%20DEL%20AULA/grafos.pdf",
    summary:
      "Vertices, aristas, grados, recorridos eulerianos, ciclos hamiltonianos, listas y matrices de adyacencia.",
    outcomes: [
      "Reconocer vertices \\(V\\), aristas \\(E\\), grados \\(d(v)\\) y tipos basicos de grafos.",
      "Leer listas y matrices de adyacencia.",
      "Distinguir recorridos eulerianos y hamiltonianos en ejemplos pequenos."
    ],
    example:
      "Un recorrido euleriano usa cada arista \\(e \\in E\\) exactamente una vez. Un ciclo hamiltoniano visita cada vertice \\(v \\in V\\) exactamente una vez y regresa al inicio.",
    quiz: [
      {
        prompt: "En un grafo, los vertices tambien se llaman:",
        options: ["Nodos.", "Pesos.", "Matrices."],
        answer: 0,
        feedback: "Correcto: vertice y nodo se usan comunmente como sinonimos."
      },
      {
        prompt: "El grado de un vertice cuenta:",
        options: ["Cuantas filas tiene una tabla.", "Cuantas aristas existen.", "Cuantas aristas inciden en el."],
        answer: 2,
        feedback: "Bien: el grado mide conexiones incidentes."
      },
      {
        prompt: "Una matriz de adyacencia indica:",
        options: [
          "La probabilidad de cada evento.",
          "Que pares de vertices estan conectados.",
          "La longitud de una cadena."
        ],
        answer: 1,
        feedback: "Exacto: la matriz codifica conexiones entre vertices."
      }
    ]
  }
];

// Contenido ampliado que aparece en la pestana "Teoria y Guia".
const moduleDeepDives = {
  logic: {
    focus: "La logica proposicional permite transformar frases en estructuras formales que un computador puede evaluar.",
    keyIdeas: [
      "Una proposicion no es una pregunta ni una orden: debe poder evaluarse como verdadera o falsa.",
      "Las tablas de verdad ayudan a revisar todos los escenarios posibles de una expresion.",
      "Las equivalencias logicas permiten simplificar condiciones en algoritmos, consultas y circuitos."
    ],
    systemUse:
      "En programacion aparece en condicionales, validaciones, reglas de negocio, filtros de busqueda y pruebas unitarias."
  },
  sets: {
    focus: "Los conjuntos sirven para organizar colecciones y comparar elementos sin repetirlos.",
    keyIdeas: [
      "La union reune elementos; la interseccion conserva solo lo comun.",
      "El complemento siempre depende del conjunto universal definido.",
      "La diferencia simetrica es util cuando se necesita detectar elementos exclusivos de dos grupos."
    ],
    systemUse:
      "Se usa en bases de datos, permisos de usuarios, filtros, busquedas, analisis de datos y estructuras tipo set."
  },
  strings: {
    focus: "Las cadenas y lenguajes formales permiten describir reglas para validar informacion.",
    keyIdeas: [
      "Un alfabeto define los simbolos permitidos.",
      "Una cadena es una secuencia finita de simbolos de un alfabeto.",
      "Un lenguaje es un conjunto de cadenas que cumplen una regla."
    ],
    systemUse:
      "Aparece en expresiones regulares, compiladores, validacion de contrasenas, codigos de producto y procesamiento de texto."
  },
  probability: {
    focus: "La probabilidad discreta modela experimentos con resultados contables.",
    keyIdeas: [
      "El espacio muestral contiene todos los resultados posibles del experimento.",
      "Un evento es una seleccion de resultados dentro del espacio muestral.",
      "Si los resultados son equiprobables, la probabilidad se calcula contando casos favorables y posibles."
    ],
    systemUse:
      "Se usa en simulaciones, analisis de riesgo, pruebas A/B, sistemas aleatorios y toma de decisiones con incertidumbre."
  },
  binomial: {
    focus: "La distribucion binomial calcula probabilidades cuando hay ensayos repetidos de exito o fracaso.",
    keyIdeas: [
      "Debe haber un numero fijo de ensayos independientes.",
      "Cada ensayo tiene dos resultados: exito o fracaso.",
      "La probabilidad de exito debe permanecer constante en todos los ensayos."
    ],
    systemUse:
      "Sirve para modelar fallos de componentes, conversiones, respuestas correctas, aprobaciones y eventos repetidos."
  },
  graphs: {
    focus: "Los grafos permiten representar relaciones entre objetos mediante vertices y aristas.",
    keyIdeas: [
      "El grado de un vertice cuenta cuantas aristas inciden en el.",
      "Una lista de adyacencia guarda los vecinos de cada vertice.",
      "Los recorridos eulerianos se enfocan en aristas; los hamiltonianos se enfocan en vertices."
    ],
    systemUse:
      "Aparece en redes, rutas, mapas, relaciones sociales, dependencias de software, arboles y estructuras de datos."
  }
};

// Bloques que conectan cada tema con usos reales de Ingenieria de Sistemas.
const moduleSystemsFocus = {
  logic: {
    title: "Lógica Proposicional en Sistemas",
    desc: "La lógica es el fundamento matemático de toda la computación. Se utiliza en el diseño de compuertas lógicas (hardware) y circuitos integrados. En desarrollo de software, define las estructuras de control (`if-else`, `switch`) y la evaluación de cortocircuito. Además, es clave para formular consultas en bases de datos y verificar la validez de algoritmos complejos mediante métodos formales.",
    examples: [
      { area: "Circuitos Digitales", app: "Diseño de compuertas AND, OR, NOT y XOR en procesadores." },
      { area: "Validación de Código", app: "Estructuras condicionales complejas y lógica de control booleana." },
      { area: "Bases de Datos", app: "Operadores lógicos en cláusulas WHERE de consultas SQL avanzadas." }
    ]
  },
  sets: {
    title: "Teoría de Conjuntos en Sistemas",
    desc: "En ingeniería de sistemas, los conjuntos se aplican directamente en el almacenamiento y gestión de la información. La base de datos relacional se basa en el álgebra relacional, la cual es pura teoría de conjuntos. Operaciones como uniones (`UNION`), intersecciones (`INTERSECT`) y diferencias (`EXCEPT`) en SQL provienen de aquí. También se emplea en la teoría de tipos de programación y la gestión de permisos basados en roles (RBAC).",
    examples: [
      { area: "Bases de Datos Relacionales", app: "Consultas de combinación (JOIN) basadas en intersección de conjuntos." },
      { area: "Control de Acceso (Seguridad)", app: "Gestión de permisos definiendo conjuntos de usuarios y privilegios." },
      { area: "Estructuras de Datos", app: "Implementación del tipo de dato Set para omitir duplicados de forma eficiente." }
    ]
  },
  strings: {
    title: "Alfabetos, Cadenas y Autómatas en Sistemas",
    desc: "Las cadenas de texto son la forma principal en que los humanos y computadores intercambian datos. La teoría de alfabetos y lenguajes formales es el pilar para construir compiladores e intérpretes que traducen código fuente a lenguaje de máquina. También sustenta las expresiones regulares (Regex) para validación de datos, los analizadores sintácticos (parsers) como JSON/XML, y el procesamiento de lenguajes naturales.",
    examples: [
      { area: "Compiladores e Intérpretes", app: "Análisis léxico y sintáctico para interpretar lenguajes como C++, Java o JavaScript." },
      { area: "Validaciones y Expresiones Regulares", app: "Búsqueda y validación de formatos complejos (emails, contraseñas, códigos)." },
      { area: "Seguridad de Datos", app: "Validación y saneamiento de entradas para evitar ataques de inyección SQL o XSS." }
    ]
  },
  probability: {
    title: "Probabilidad Discreta en Sistemas",
    desc: "La probabilidad discreta permite diseñar y evaluar sistemas en condiciones de incertidumbre. Es clave en la teoría de colas para simular la congestión en servidores web y dimensionar el hardware necesario. También se utiliza en telecomunicaciones para medir la pérdida de paquetes y la tasa de bits erróneos, así como en la inteligencia artificial, el aprendizaje automático (Machine Learning) y el desarrollo de videojuegos aleatorios.",
    examples: [
      { area: "Rendimiento y Redes", app: "Cálculo de probabilidad de colisión y pérdida de paquetes en enrutamiento IP." },
      { area: "Simulaciones y Modelado", app: "Planificación de capacidad simulando solicitudes concurrentes de usuarios en servidores." },
      { area: "Machine Learning e IA", app: "Algoritmos clasificadores probabilísticos como Naive Bayes para detectar Spam." }
    ]
  },
  binomial: {
    title: "Distribución Binomial en Sistemas",
    desc: "La distribución binomial modela procesos donde ocurren múltiples ensayos independientes de éxito o fracaso, lo que la hace idónea para la fiabilidad de sistemas informáticos (Reliability Engineering). Se emplea para calcular la probabilidad de que un conjunto de servidores redundantes falle al mismo tiempo, el éxito de campañas de marketing digital mediante pruebas A/B, o la tasa de fallos esperada en la transferencia masiva de archivos concurrentes.",
    examples: [
      { area: "Tolerancia a Fallos", app: "Cálculo de disponibilidad de un clúster de servidores redundantes (RAID, servidores espejo)." },
      { area: "Control de Calidad (QA)", app: "Cálculo de la probabilidad de encontrar defectos en un lote de software en pruebas." },
      { area: "Estadísticas A/B Testing", app: "Evaluación de si una mejora en la interfaz aumentó significativamente el registro de usuarios." }
    ]
  },
  graphs: {
    title: "Teoría de Grafos en Sistemas",
    desc: "Los grafos son la estructura de datos más potente y versátil en informática para representar conexiones entre entidades. Se utilizan en el enrutamiento de paquetes en Internet (algoritmo de Dijkstra), el cálculo de rutas óptimas en mapas (GPS), el análisis de redes sociales (sugerencias de amistad), las dependencias de paquetes de software, y las bases de datos de grafos modernas (como Neo4j) optimizadas para relaciones de alta complejidad.",
    examples: [
      { area: "Enrutamiento en Internet", app: "Algoritmos OSPF e IP para enviar paquetes de datos por el camino más rápido." },
      { area: "Redes Sociales", app: "Modelado de relaciones y recomendación de contenido basado en conexiones de nodos." },
      { area: "Gestores de Dependencias", app: "Resolución de dependencias y orden de compilación de bibliotecas en npm, pip o Maven." }
    ]
  }
};

// Instrucciones del reto que acompana a cada laboratorio interactivo.
const moduleLabChallenges = {
  logic: {
    instructions: "Interactúa con el simulador cambiando los valores de verdad de las proposiciones simples <strong>p</strong> y <strong>q</strong> y seleccionando diferentes conectivos lógicos en el menú desplegable.",
    challenge: "Configura el conectivo <strong>Condicional (p -> q)</strong>. Encuentra cuál es la única combinación de valores de verdad para p y q que hace que el resultado final sea <strong>Falso (F)</strong>. Observa cómo cambia la fila correspondiente en la tabla de verdad interactiva."
  },
  sets: {
    instructions: "Selecciona diferentes operaciones de conjuntos del menú desplegable y observa cómo cambian de color las fichas en el Diagrama de Venn de arriba.",
    challenge: "Selecciona la operación <strong>Diferencia simétrica (A Δ B)</strong>. Observa qué fichas se iluminan en verde (activas). Explica por qué los elementos 2 y 5 (en la intersección central) no están iluminados en verde en este caso especial."
  },
  strings: {
    instructions: "Escribe una palabra de prueba en la caja de texto, ajusta la potencia 'n' y selecciona la regla de lenguaje formal que deseas comprobar.",
    challenge: "Configura la regla en <strong>UNI-AAAA-NNN</strong>. Escribe una cadena en la caja que cumpla exactamente con el formato (por ejemplo: <code>UNI-CUCU-123</code>). Comprueba que el recuadro de validación cambie a verde indicando <strong>'Cadena válida'</strong>."
  },
  probability: {
    instructions: "Elige un experimento aleatorio del menú desplegable y luego selecciona el evento de interés que deseas estudiar.",
    challenge: "Elige el experimento <strong>Lanzar dos monedas</strong> y selecciona el evento <strong>Resultados iguales</strong>. Cuenta cuántos resultados de la lista espacial coinciden (resaltados en verde) y verifica matemáticamente que la probabilidad calculada sea exactamente P(E) = 0.500."
  },
  binomial: {
    instructions: "Ajusta los parámetros usando las cajas numéricas: la cantidad total de ensayos independientes <strong>n</strong>, la probabilidad de éxito de cada ensayo <strong>p</strong> y la cantidad de éxitos esperada <strong>k</strong>.",
    challenge: "Establece n = 10 y p = 0.5 (simulación de lanzar 10 veces una moneda equilibrada). Modifica el valor de k de 0 a 10 y observa en el gráfico de barras cuál es el valor de k que alcanza la altura máxima (probabilidad más alta)."
  },
  graphs: {
    instructions: "Elige una estructura de grafo en el menú desplegable y observa la representación visual interactiva de nodos y aristas a la derecha, junto con su matriz de adyacencia.",
    challenge: "Selecciona el grafo <strong>Ciclo C4</strong>. Revisa sus grados y la clasificación al pie del menú. Explica por qué este grafo admite tanto caminos eulerianos (recorre todas las aristas) como hamiltonianos (visita todos los vértices)."
  }
};

// Mini juegos de clasificacion. Cada tarjeta tiene una respuesta y una pista.
const moduleGames = {
  logic: {
    title: "Clasifica expresiones logicas",
    instruction: "Decide si cada expresion es tautologia, contradiccion o contingencia.",
    categories: ["Tautologia", "Contradiccion", "Contingencia"],
    items: [
      { text: "\\(p \\lor \\neg p\\)", answer: "Tautologia", hint: "Siempre queda verdadera." },
      { text: "\\(p \\land \\neg p\\)", answer: "Contradiccion", hint: "No puede ser verdadera al mismo tiempo." },
      { text: "\\(p \\to q\\)", answer: "Contingencia", hint: "Depende de los valores de \\(p\\) y \\(q\\)." },
      { text: "\\((p \\land q) \\to p\\)", answer: "Tautologia", hint: "Si ocurre \\(p\\land q\\), entonces ocurre \\(p\\)." }
    ]
  },
  sets: {
    title: "Detective de operaciones",
    instruction: "Relaciona cada descripcion con la operacion de conjuntos correcta.",
    categories: ["Union", "Interseccion", "Diferencia", "Complemento"],
    items: [
      { text: "Elementos que estan en \\(A\\), en \\(B\\) o en ambos.", answer: "Union", hint: "Se escribe \\(A\\cup B\\)." },
      { text: "Elementos compartidos por \\(A\\) y \\(B\\).", answer: "Interseccion", hint: "Se escribe \\(A\\cap B\\)." },
      { text: "Elementos que estan en \\(A\\), pero no en \\(B\\).", answer: "Diferencia", hint: "Se escribe \\(A-B\\)." },
      { text: "Elementos del universo que no pertenecen a \\(A\\).", answer: "Complemento", hint: "Depende de \\(U\\)." }
    ]
  },
  strings: {
    title: "Cazador de cadenas",
    instruction: "Para \\(w=\\texttt{algoritmo}\\), clasifica cada fragmento.",
    categories: ["Prefijo", "Sufijo", "Subcadena", "No pertenece"],
    items: [
      { text: "\\(\\texttt{algo}\\)", answer: "Prefijo", hint: "Empieza desde el primer simbolo." },
      { text: "\\(\\texttt{ritmo}\\)", answer: "Sufijo", hint: "Termina con los ultimos simbolos." },
      { text: "\\(\\texttt{gori}\\)", answer: "Subcadena", hint: "Aparece en medio y de forma consecutiva." },
      { text: "\\(\\texttt{tgo}\\)", answer: "No pertenece", hint: "No aparece de forma consecutiva." }
    ]
  },
  probability: {
    title: "Laboratorio de eventos",
    instruction: "Clasifica cada frase segun el lenguaje de probabilidad discreta.",
    categories: ["Espacio muestral", "Evento", "Seguro", "Imposible"],
    items: [
      { text: "\\(S=\\{1,2,3,4,5,6\\}\\) al lanzar un dado.", answer: "Espacio muestral", hint: "Incluye todos los resultados." },
      { text: "\\(E=\\{2,4,6\\}\\) al pedir numero par.", answer: "Evento", hint: "Es un subconjunto de \\(S\\)." },
      { text: "Obtener un numero menor que 7 en un dado normal.", answer: "Seguro", hint: "Todos los resultados lo cumplen." },
      { text: "Obtener 9 en un dado de 6 caras.", answer: "Imposible", hint: "No pertenece al espacio muestral." }
    ]
  },
  binomial: {
    title: "Arma la binomial",
    instruction: "Identifica el papel de cada dato en un modelo binomial.",
    categories: ["n", "p", "k", "q"],
    items: [
      { text: "Numero total de intentos.", answer: "n", hint: "Cantidad de ensayos." },
      { text: "Probabilidad de exito en cada ensayo.", answer: "p", hint: "Debe ser constante." },
      { text: "Cantidad de exitos que se quieren calcular.", answer: "k", hint: "Aparece en \\(P(X=k)\\)." },
      { text: "Probabilidad de fracaso.", answer: "q", hint: "Se calcula como \\(1-p\\)." }
    ]
  },
  graphs: {
    title: "Ruta de grafos",
    instruction: "Relaciona cada idea con el concepto de teoria de grafos.",
    categories: ["Euleriano", "Hamiltoniano", "Grado", "Adyacencia"],
    items: [
      { text: "Usa cada arista exactamente una vez.", answer: "Euleriano", hint: "Se concentra en aristas." },
      { text: "Visita cada vertice exactamente una vez.", answer: "Hamiltoniano", hint: "Se concentra en vertices." },
      { text: "Cuenta cuantas aristas llegan a un vertice.", answer: "Grado", hint: "Se denota como \\(d(v)\\)." },
      { text: "Indica que vertices estan conectados.", answer: "Adyacencia", hint: "Puede verse como lista o matriz." }
    ]
  }
};

// Actividades interactivas extra del OVA final. Comparten un mismo motor de
// renderizado, pero cada modulo define su tipo: clasificacion, selector,
// validador de cadenas o decision guiada.
const interactiveActivities = {
  logic: {
    format: "Pregunta guiada de verdadero/falso",
    interaction: "Evaluar conectivos y completar filas de tablas de verdad.",
    reuse: "Esta actividad refuerza el caso clave del condicional.",
    activity: {
      type: "classify",
      title: "Completa la fila critica del condicional",
      prompt: "Para \\(p \\to q\\), asigna el valor correcto a cada parte cuando \\(p\\) es verdadera y \\(q\\) es falsa.",
      categories: ["V", "F"],
      items: [
        { text: "\\(p\\)", answer: "V", hint: "\\(p\\) se declara verdadera en esta fila." },
        { text: "\\(q\\)", answer: "F", hint: "\\(q\\) se declara falsa en esta fila." },
        { text: "\\(p \\to q\\)", answer: "F", hint: "El condicional solo es falso en la fila \\(V \\to F\\)." }
      ],
      success: "Correcto: encontraste la unica fila que vuelve falso el condicional.",
      partial: "Revisa la regla: una promesa \\(p \\to q\\) falla cuando ocurre \\(p\\) y no ocurre \\(q\\)."
    }
  },
  sets: {
    format: "Clasificacion interactiva de simbolos",
    interaction: "Clasificar simbolos y reconocer regiones en diagramas de Venn.",
    reuse: "Esta actividad refuerza el uso correcto de simbolos y operaciones de conjuntos.",
    activity: {
      type: "classify",
      title: "Clasifica simbolos de conjuntos",
      prompt: "Ubica cada ficha en su categoria para comprobar que reconoces simbolos, relaciones y operaciones.",
      categories: ["Pertenencia", "Subconjunto", "Operacion", "Conjunto especial"],
      items: [
        { text: "\\(\\in\\)", answer: "Pertenencia", hint: "Relaciona un elemento con un conjunto." },
        { text: "\\(\\notin\\)", answer: "Pertenencia", hint: "Indica que el elemento no pertenece al conjunto." },
        { text: "\\(\\subseteq\\)", answer: "Subconjunto", hint: "Compara un conjunto contenido en otro." },
        { text: "\\(A\\cup B\\)", answer: "Operacion", hint: "Union entre dos conjuntos." },
        { text: "\\(A\\cap B\\)", answer: "Operacion", hint: "Interseccion entre dos conjuntos." },
        { text: "\\(A-B\\)", answer: "Operacion", hint: "Diferencia entre conjuntos." },
        { text: "\\(\\varnothing\\)", answer: "Conjunto especial", hint: "Es el conjunto vacio." },
        { text: "\\(\\mathcal{P}(A)\\)", answer: "Conjunto especial", hint: "Es el conjunto potencia." }
      ],
      success: "Excelente: todos los simbolos quedaron en su categoria.",
      partial: "Algunas fichas necesitan ajuste. Usa las pistas de cada tarjeta."
    }
  },
  strings: {
    format: "Validador de cadenas",
    interaction: "Validar cadenas contra una regla formal.",
    reuse: "Esta actividad conecta alfabetos, cadenas y reglas de validacion.",
    activity: {
      type: "validator",
      title: "Validador de lenguaje formal",
      prompt: "Regla: tres letras mayusculas, guion, tres letras mayusculas, guion, tres digitos. Formato: \\(AAA-BBB-999\\).",
      pattern: "^[A-Z]{3}-[A-Z]{3}-[0-9]{3}$",
      initial: "USB-SIS-989",
      samples: ["USB-SIS-989", "cat-AAA-999", "MAT-DIS-101", "AB-SIS-123"],
      success: "Cadena valida: pertenece al lenguaje definido.",
      partial: "Cadena invalida: revisa mayusculas, guiones y tres digitos finales."
    }
  },
  probability: {
    format: "Selector de resultados",
    interaction: "Seleccionar eventos dentro del espacio muestral.",
    reuse: "Esta actividad refuerza la relacion entre espacio muestral y evento.",
    activity: {
      type: "sample",
      title: "Selector de evento con dado",
      prompt: "Experimento: lanzar un dado. Selecciona el evento \\(E\\): obtener un numero divisible por 3.",
      sampleSpace: ["1", "2", "3", "4", "5", "6"],
      expected: ["3", "6"],
      formula: "P(E)=\\frac{|E|}{|S|}=\\frac{2}{6}=\\frac{1}{3}",
      success: "Correcto: el evento es \\(E=\\{3,6\\}\\).",
      partial: "Revisa los resultados divisibles por 3 dentro de \\(S=\\{1,2,3,4,5,6\\}\\)."
    }
  },
  binomial: {
    format: "Reto de parametros",
    interaction: "Identificar \\(n\\), \\(p\\), \\(k\\) y resolver probabilidades.",
    reuse: "Esta actividad refuerza la identificacion de parametros binomiales.",
    activity: {
      type: "classify",
      title: "Mini reto de parametros binomiales",
      prompt: "Sistema de sensores: hay 5 sensores independientes; cada sensor se activa con probabilidad 0.5. El sistema responde si se activan al menos 3 sensores.",
      categories: ["n", "p", "k", "q"],
      items: [
        { text: "5 sensores", answer: "n", hint: "\\(n\\) es el numero total de ensayos." },
        { text: "0.5 de activacion", answer: "p", hint: "\\(p\\) es la probabilidad de exito." },
        { text: "al menos 3 activados", answer: "k", hint: "\\(k\\) es la cantidad de exitos buscada." },
        { text: "0.5 de no activacion", answer: "q", hint: "\\(q=1-p\\) es la probabilidad de fracaso." }
      ],
      success: "Bien: identificaste los parametros del modelo binomial.",
      partial: "Recuerda: \\(n\\) cuenta ensayos, \\(p\\) exito, \\(k\\) exitos buscados y \\(q=1-p\\)."
    }
  },
  graphs: {
    format: "Decision guiada",
    interaction: "Distinguir vertices, aristas, grados y recorridos.",
    reuse: "Esta actividad refuerza el criterio de caminos eulerianos.",
    activity: {
      type: "euler",
      title: "Juez euleriano",
      prompt: "Observa el grafo camino \\(A-B-C-D\\). Decide si existe un camino euleriano.",
      expected: "yes",
      degrees: [
        ["A", 1],
        ["B", 2],
        ["C", 2],
        ["D", 1]
      ],
      success: "Correcto: hay exactamente dos vertices de grado impar, por eso existe camino euleriano.",
      partial: "No exactamente. Un camino euleriano existe si hay 0 o 2 vertices de grado impar."
    }
  }
};

// Guias de estudio: definiciones, procedimiento, ejemplo resuelto y practica.
const moduleStudyGuides = {
  logic: {
    definitions: [
      ["Proposicion", "Enunciado declarativo con valor de verdad: verdadero o falso."],
      ["Conectivo logico", "Operador que une o modifica proposiciones, como \\(\\neg\\), \\(\\land\\), \\(\\lor\\), \\(\\to\\)."],
      ["Tautologia", "Formula que resulta verdadera en todas las filas de su tabla de verdad."],
      ["Contradiccion", "Formula que resulta falsa en todas las filas de su tabla de verdad."],
      ["Contingencia", "Formula que puede ser verdadera o falsa segun los valores de sus proposiciones."]
    ],
    procedure: [
      "Identifica las proposiciones simples y asigna letras: \\(p\\), \\(q\\), \\(r\\).",
      "Traduce conectivos del lenguaje natural: \"y\" como \\(\\land\\), \"o\" como \\(\\lor\\), \"si... entonces\" como \\(\\to\\).",
      "Construye todas las combinaciones de valores de verdad.",
      "Evalua primero negaciones, luego conjunciones/disyunciones y finalmente condicionales.",
      "Clasifica la formula revisando la ultima columna."
    ],
    worked:
      "Para \\((p\\land q)\\to p\\), si \\(p\\land q\\) es verdadero, entonces \\(p\\) necesariamente es verdadero. En los demas casos el antecedente es falso y el condicional queda verdadero. Por eso es una tautologia.",
    practice: [
      ["Clasifica \\(p\\lor q\\).", "Es contingencia: es falsa solo cuando \\(p=F\\) y \\(q=F\\), pero verdadera en las otras filas."],
      ["Traduce: \"si el usuario inicia sesion, entonces puede acceder\".", "\\(p\\to q\\), donde \\(p\\): el usuario inicia sesion y \\(q\\): puede acceder."],
      ["Determina si \\(p\\land \\neg p\\) puede ser verdadera.", "No. Una proposicion no puede ser verdadera y falsa al mismo tiempo; es contradiccion."]
    ]
  },
  sets: {
    definitions: [
      ["Conjunto", "Coleccion de elementos bien definidos."],
      ["Pertenencia", "Relacion que indica que un elemento esta dentro de un conjunto: \\(x\\in A\\)."],
      ["Subconjunto", "\\(A\\subseteq B\\) cuando todo elemento de \\(A\\) tambien pertenece a \\(B\\)."],
      ["Conjunto potencia", "\\(\\mathcal{P}(A)\\), conjunto formado por todos los subconjuntos de \\(A\\)."],
      ["Complemento", "Elementos del universo que no pertenecen al conjunto dado."]
    ],
    procedure: [
      "Define primero el universo \\(U\\).",
      "Escribe los conjuntos por extension cuando el numero de elementos sea pequeno.",
      "Para union, junta elementos sin repetir.",
      "Para interseccion, conserva solo los elementos repetidos en ambos conjuntos.",
      "Para complemento, mira todo lo que esta en \\(U\\) pero no en el conjunto."
    ],
    worked:
      "Si \\(U=\\{1,2,3,4,5,6\\}\\), \\(A=\\{1,2,4\\}\\) y \\(B=\\{2,4,6\\}\\), entonces \\(A\\cup B=\\{1,2,4,6\\}\\), \\(A\\cap B=\\{2,4\\}\\) y \\(A^c=\\{3,5,6\\}\\).",
    practice: [
      ["Con \\(A=\\{a,b,c\\}\\), calcula \\(\\mathcal{P}(A)\\) en cantidad.", "Tiene \\(2^3=8\\) subconjuntos."],
      ["Si \\(A=\\{1,3,5\\}\\) y \\(B=\\{2,3,4\\}\\), calcula \\(A-B\\).", "\\(A-B=\\{1,5\\}\\)."],
      ["Si \\(U=\\{0,1,2,3\\}\\) y \\(A=\\{1,3\\}\\), calcula \\(A^c\\).", "\\(A^c=\\{0,2\\}\\)."]
    ]
  },
  strings: {
    definitions: [
      ["Alfabeto", "Conjunto finito de simbolos permitidos, normalmente denotado \\(\\Sigma\\)."],
      ["Cadena", "Secuencia finita de simbolos de un alfabeto."],
      ["Cadena vacia", "Cadena sin simbolos, denotada \\(\\lambda\\) o \\(\\epsilon\\)."],
      ["Lenguaje", "Conjunto de cadenas sobre un alfabeto."],
      ["Reversa", "Cadena escrita en orden contrario: \\(w^R\\)."]
    ],
    procedure: [
      "Identifica el alfabeto permitido.",
      "Cuenta simbolos para hallar \\(|w|\\).",
      "Concatena manteniendo el orden: \\(\\alpha\\beta\\) no siempre es igual a \\(\\beta\\alpha\\).",
      "Para prefijos, toma simbolos desde el inicio.",
      "Para sufijos, toma simbolos hasta el final."
    ],
    worked:
      "Sea \\(w=\\texttt{sistema}\\). Entonces \\(|w|=7\\), \\(w^R=\\texttt{ametsis}\\), un prefijo propio es \\(\\texttt{sis}\\), un sufijo propio es \\(\\texttt{tema}\\) y una subcadena es \\(\\texttt{stem}\\).",
    practice: [
      ["Si \\(\\alpha=\\texttt{red}\\), calcula \\(\\alpha^3\\).", "\\(\\alpha^3=\\texttt{redredred}\\)."],
      ["Para \\(w=\\texttt{datos}\\), escribe dos prefijos propios.", "\\(\\texttt{d}\\), \\(\\texttt{da}\\), \\(\\texttt{dat}\\) o \\(\\texttt{dato}\\)."],
      ["Define el lenguaje de codigos con formato \\(\\texttt{UNI-AAAA-NNN}\\).", "Cadenas que empiezan con UNI, siguen con 4 letras mayusculas y terminan con 3 digitos."]
    ]
  },
  probability: {
    definitions: [
      ["Experimento aleatorio", "Proceso cuyo resultado no se conoce con certeza antes de realizarlo."],
      ["Espacio muestral", "Conjunto de todos los resultados posibles, denotado \\(S\\)."],
      ["Evento", "Subconjunto de \\(S\\) que representa resultados de interes."],
      ["Evento seguro", "Evento que coincide con todo el espacio muestral."],
      ["Evento imposible", "Evento que no contiene resultados: \\(\\varnothing\\)."]
    ],
    procedure: [
      "Describe claramente el experimento.",
      "Enumera todos los resultados posibles para formar \\(S\\).",
      "Identifica los resultados favorables del evento \\(E\\).",
      "Si todos los resultados son equiprobables, aplica \\(P(E)=\\frac{|E|}{|S|}\\).",
      "Simplifica la fraccion o conviertela a decimal si se necesita."
    ],
    worked:
      "Al lanzar dos monedas, \\(S=\\{CC,CS,SC,SS\\}\\). El evento obtener al menos una cara es \\(E=\\{CC,CS,SC\\}\\). Entonces \\(P(E)=\\frac{3}{4}=0.75\\).",
    practice: [
      ["Al lanzar un dado, calcula la probabilidad de obtener numero mayor que 4.", "\\(E=\\{5,6\\}\\), entonces \\(P(E)=\\frac{2}{6}=\\frac{1}{3}\\)."],
      ["Al lanzar una moneda, cual es la probabilidad de obtener cara?", "\\(P=\\frac{1}{2}=0.5\\)."],
      ["En dos monedas, cual es el evento de obtener resultados iguales?", "\\(E=\\{CC,SS\\}\\)."]
    ]
  },
  binomial: {
    definitions: [
      ["Variable aleatoria", "Funcion que asigna un numero a cada resultado de un experimento."],
      ["Ensayo de Bernoulli", "Ensayo con dos resultados: exito o fracaso."],
      ["Parametro \\(n\\)", "Numero total de ensayos."],
      ["Parametro \\(p\\)", "Probabilidad de exito en cada ensayo."],
      ["Parametro \\(k\\)", "Numero de exitos que se desea calcular."]
    ],
    procedure: [
      "Verifica que el problema tenga ensayos independientes.",
      "Confirma que solo existan dos resultados por ensayo.",
      "Identifica \\(n\\), \\(p\\), \\(q=1-p\\) y \\(k\\).",
      "Aplica \\(P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}\\).",
      "Interpreta el resultado como probabilidad o porcentaje."
    ],
    worked:
      "Si se responden 5 preguntas de verdadero/falso al azar, \\(n=5\\), \\(p=0.5\\). La probabilidad de acertar exactamente 3 es \\(P(X=3)=\\binom{5}{3}(0.5)^3(0.5)^2=0.3125\\).",
    practice: [
      ["Identifica \\(n\\), \\(p\\) y \\(k\\): 10 intentos, probabilidad de exito 0.2, exactamente 4 exitos.", "\\(n=10\\), \\(p=0.2\\), \\(k=4\\)."],
      ["Si \\(p=0.8\\), cuanto vale \\(q\\)?", "\\(q=1-p=0.2\\)."],
      ["Cuando no conviene usar binomial?", "Cuando los ensayos no son independientes, hay mas de dos resultados o \\(p\\) cambia entre ensayos."]
    ]
  },
  graphs: {
    definitions: [
      ["Grafo", "Estructura formada por vertices y aristas."],
      ["Vertice", "Nodo u objeto representado dentro del grafo."],
      ["Arista", "Conexion entre dos vertices."],
      ["Grado", "Numero de aristas incidentes en un vertice."],
      ["Adyacencia", "Relacion entre vertices conectados por una arista."]
    ],
    procedure: [
      "Lista primero los vertices del grafo.",
      "Identifica todas las aristas.",
      "Calcula grados contando conexiones por vertice.",
      "Construye la lista de adyacencia escribiendo vecinos de cada vertice.",
      "Para matriz de adyacencia, marca 1 si hay conexion y 0 si no la hay."
    ],
    worked:
      "Si \\(V=\\{A,B,C\\}\\) y \\(E=\\{AB,BC\\}\\), entonces la lista de adyacencia es \\(A\\to\\{B\\}\\), \\(B\\to\\{A,C\\}\\), \\(C\\to\\{B\\}\\). Los grados son \\(d(A)=1\\), \\(d(B)=2\\), \\(d(C)=1\\).",
    practice: [
      ["Un grafo tiene aristas \\(AB\\), \\(AC\\), \\(BC\\). Cual es el grado de \\(A\\)?", "\\(d(A)=2\\), porque conecta con \\(B\\) y \\(C\\)."],
      ["Que diferencia hay entre camino euleriano y hamiltoniano?", "Euleriano usa aristas; hamiltoniano visita vertices."],
      ["Para que sirve una matriz de adyacencia?", "Para representar conexiones entre pares de vertices en forma de tabla."]
    ]
  }
};

// Banco de preguntas de cierre. La evaluacion final toma estas preguntas y
// guarda respuestas/calificacion en localStorage.
const finalQuestions = [
  ["\\(p \\lor q\\) es falsa cuando:", ["\\(p\\) es verdadera", "\\(p\\) y \\(q\\) son falsas", "\\(q\\) es verdadera"], 1],
  ["Una tautologia es una proposicion compuesta que:", ["Siempre es verdadera", "Siempre es falsa", "No tiene tabla"], 0],
  ["Si \\(U=\\{1,2,3,4\\}\\), \\(A=\\{1,2\\}\\) y \\(B=\\{2,3\\}\\), \\(A \\cap B\\) es:", ["\\(\\{1,2,3\\}\\)", "\\(\\{4\\}\\)", "\\(\\{2\\}\\)"], 2],
  ["El complemento de \\(A\\) toma elementos que:", ["Estan en \\(U\\) y no en \\(A\\)", "Estan solo en \\(A\\)", "No pertenecen a \\(U\\)"], 0],
  ["Si \\(\\alpha=\\texttt{red}\\), \\(\\alpha^3\\) es:", ["\\(\\texttt{red3}\\)", "\\(\\texttt{redredred}\\)", "\\(\\texttt{derderder}\\)"], 1],
  ["\\(\\Sigma^*\\) representa:", ["Solo cadenas de longitud \\(1\\)", "El conjunto vacio \\(\\varnothing\\)", "Todas las cadenas finitas sobre \\(\\Sigma\\)"], 2],
  ["Al lanzar un dado, el evento obtener numero par es:", ["\\(\\{2,4,6\\}\\)", "\\(\\{1,3,5\\}\\)", "\\(\\{6\\}\\)"], 0],
  ["\\(P(E)=0\\) significa que el evento es:", ["Seguro", "Imposible", "Complementario"], 1],
  ["Una variable aleatoria discreta toma valores:", ["Siempre negativos", "No numericos", "Contables"], 2],
  ["En \\(P(X=k)\\), \\(k\\) representa:", ["Cantidad de exitos observada", "Total de ensayos", "Probabilidad de fracaso"], 0],
  ["Un camino euleriano usa:", ["Cada vertice sin importar aristas", "Cada arista una sola vez", "Solo vertices aislados"], 1],
  ["Una lista de adyacencia muestra:", ["Resultados de una moneda", "Prefijos de una cadena", "Vecinos de cada vertice"], 2]
].map(([prompt, options, answer], index) => ({
  id: `final-${index}`,
  prompt,
  options,
  answer,
  feedback: "Respuesta esperada."
}));

function defaultState() {
  return {
    completed: {},
    quizAnswers: {},
    finalAnswers: {},
    extraActivities: {},
    finalScore: null,
    soundOn: true
  };
}

const ovaVisuals = {
  sets: "venn.svg",
  probability: "probabilidad.svg",
  graphs: "grafo.svg"
};

// Devuelve la ilustracion de cada modulo. Algunos temas usan SVG externos
// en assets/ova y el resto se dibuja inline para no depender de imagenes extra.
function moduleVisual(moduleId, mode = "card") {
  // En modo hero (cabecera del módulo), inyectamos SVGs transparentes y brillantes
  // que combinan a la perfección con el degradado verde y evitan el colapso.
  if (mode === "hero") {
    const heroVisuals = {
      logic: `
        <svg viewBox="0 0 240 150" role="img" aria-label="Lógica interactiva">
          <style>
            @keyframes pulse-gate { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
            @keyframes dash-line { to { stroke-dashoffset: -20; } }
            .glow-path { stroke: #ffd166; stroke-width: 3.5; stroke-linecap: round; fill: none; filter: drop-shadow(0 0 5px rgba(255,209,102,0.4)); }
            .node-pulsing { animation: pulse-gate 2s infinite ease-in-out; transform-origin: center; }
            .anim-line { stroke: #ffffff; stroke-width: 2.5; stroke-dasharray: 6 4; fill: none; animation: dash-line 1.2s infinite linear; }
            .glow-txt { fill: #ffffff; font-family: system-ui, -apple-system, sans-serif; font-size: 15px; font-weight: 800; }
            .glow-txt-gold { fill: #ffd166; font-family: system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 900; }
          </style>
          <!-- Contorno de compuerta lógica translúcida -->
          <rect x="35" y="30" width="170" height="90" rx="14" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <path d="M70 75 h40 m50 0 h40 M100 55 v40 m40 -40 v40" class="anim-line"/>
          <path d="M 110 50 A 25 25 0 0 1 110 100 Z" class="glow-path node-pulsing"/>
          <circle cx="70" cy="75" r="8" fill="#ffd166" class="node-pulsing"/>
          <circle cx="170" cy="75" r="8" fill="#ffffff"/>
          <text x="50" y="50" class="glow-txt">p</text>
          <text x="50" y="105" class="glow-txt">q</text>
          <text x="110" y="24" class="glow-txt-gold">p ∧ q → r</text>
        </svg>`,
      sets: `
        <svg viewBox="0 0 240 150" role="img" aria-label="Diagrama de Venn brillante">
          <style>
            @keyframes breathe-sets { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.03); opacity: 1; } }
            .set-circle { fill: none; stroke-width: 4; transform-origin: center; animation: breathe-sets 3s infinite ease-in-out; }
            .set-a { stroke: #ffffff; filter: drop-shadow(0 0 4px rgba(255,255,255,0.3)); }
            .set-b { stroke: #ffd166; filter: drop-shadow(0 0 4px rgba(255,209,102,0.3)); animation-delay: 1.5s; }
            .set-intersect { fill: rgba(255, 209, 102, 0.25); filter: blur(2px); }
            .set-label { fill: #ffffff; font-family: system-ui, -apple-system, sans-serif; font-weight: 900; font-size: 18px; }
            .set-label-gold { fill: #ffd166; font-family: system-ui, -apple-system, sans-serif; font-weight: 900; font-size: 18px; }
          </style>
          <!-- Intersección coloreada de fondo -->
          <path d="M 120 40 A 42 42 0 0 1 146 110 A 42 42 0 0 1 120 40 Z" class="set-intersect"/>
          <!-- Círculos de conjuntos -->
          <circle cx="106" cy="75" r="42" class="set-circle set-a"/>
          <circle cx="146" cy="75" r="42" class="set-circle set-b"/>
          <text x="80" y="78" class="set-label">A</text>
          <text x="162" y="78" class="set-label-gold">B</text>
          <text x="110" y="132" class="set-label-gold" font-size="14" letter-spacing="1">A ∩ B</text>
        </svg>`,
      strings: `
        <svg viewBox="0 0 240 150" role="img" aria-label="Automata de lenguajes formal">
          <style>
            @keyframes pulse-node { 0%, 100% { r: 14; fill: rgba(255,209,102,0.1); } 50% { r: 16; fill: rgba(255,209,102,0.35); } }
            @keyframes arrow-flow { to { stroke-dashoffset: -16; } }
            .aut-node { fill: rgba(255,255,255,0.08); stroke: #ffffff; stroke-width: 3; }
            .aut-node-gold { fill: rgba(255,209,102,0.08); stroke: #ffd166; stroke-width: 3.5; }
            .aut-arrow { stroke: #ffffff; stroke-width: 2.5; stroke-dasharray: 6 3; fill: none; animation: arrow-flow 1.5s infinite linear; }
            .aut-label { fill: #ffffff; font-family: monospace; font-size: 15px; font-weight: bold; }
            .aut-active { animation: pulse-node 2s infinite ease-in-out; transform-origin: center; }
          </style>
          <!-- Nodos de estados -->
          <circle cx="70" cy="75" r="15" class="aut-node-gold"/>
          <circle cx="70" cy="75" r="22" class="aut-active"/>
          <circle cx="160" cy="75" r="16" class="aut-node"/>
          <circle cx="160" cy="75" r="12" fill="none" stroke="#ffffff" stroke-width="1.5"/> <!-- Estado de aceptación -->
          
          <!-- Flechas de transición -->
          <path d="M 86 75 H 142" class="aut-arrow"/>
          <path d="M 60 58 C 50 35, 90 35, 80 58" fill="none" stroke="#ffd166" stroke-width="2" stroke-linecap="round"/> <!-- Autolazo -->
          
          <text x="64" y="80" class="aut-label" fill="#ffd166">q0</text>
          <text x="154" y="80" class="aut-label">q1</text>
          <text x="108" y="65" class="aut-label" font-size="12">1</text>
          <text x="66" y="24" class="aut-label" fill="#ffd166">Σ = {0,1}</text>
          <text x="126" y="125" class="aut-label" font-size="13">w = 10101</text>
        </svg>`,
      probability: `
        <svg viewBox="0 0 240 150" role="img" aria-label="Espacios muestrales discretos">
          <style>
            @keyframes dice-rot { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-5px) rotate(3deg); } }
            @keyframes shine { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
            .dice-container { transform-origin: center; animation: dice-rot 4s infinite ease-in-out; }
            .dice-face { fill: rgba(255, 255, 255, 0.05); stroke: #ffffff; stroke-width: 3.5; stroke-linejoin: round; }
            .coin-face { fill: rgba(255, 209, 102, 0.08); stroke: #ffd166; stroke-width: 4; filter: drop-shadow(0 0 5px rgba(255,209,102,0.4)); }
            .dice-dot { fill: #ffffff; }
            .shine-star { fill: #ffd166; animation: shine 2s infinite ease-in-out; }
            .prob-lbl { fill: #ffffff; font-family: system-ui, -apple-system, sans-serif; font-size: 15px; font-weight: 800; }
          </style>
          <!-- Dado en isometrico flotante -->
          <g class="dice-container" transform="translate(45, 30)">
            <!-- Caras del Dado -->
            <polygon points="35,15 70,30 35,45 0,30" class="dice-face"/>
            <polygon points="0,30 35,45 35,85 0,70" class="dice-face"/>
            <polygon points="35,45 70,30 70,70 35,85" class="dice-face"/>
            <!-- Puntos -->
            <circle cx="35" cy="30" r="4" class="dice-dot"/>
            <circle cx="18" cy="50" r="3" class="dice-dot"/>
            <circle cx="28" cy="62" r="3" class="dice-dot"/>
            <circle cx="52" cy="50" r="3" class="dice-dot"/>
            <circle cx="62" cy="62" r="3" class="dice-dot"/>
          </g>
          <!-- Moneda flotante -->
          <circle cx="156" cy="80" r="32" class="coin-face"/>
          <text x="148" y="88" fill="#ffd166" font-family="Georgia, serif" font-weight="900" font-size="24">P</text>
          <!-- Destellos dorados -->
          <path d="M 115 50 L 120 40 L 125 50 L 120 60 Z" class="shine-star"/>
          <path d="M 180 110 L 183 102 L 186 110 L 183 118 Z" class="shine-star"/>
          <text x="100" y="25" class="prob-lbl">S = {1, 2, 3, 4, 5, 6}</text>
        </svg>`,
      binomial: `
        <svg viewBox="0 0 240 150" role="img" aria-label="Distribución binomial interactiva">
          <style>
            @keyframes bar-grow { 0%, 100% { transform: scaleY(0.9); } 50% { transform: scaleY(1.05); } }
            .curve-line { fill: none; stroke: #ffd166; stroke-width: 4; stroke-linecap: round; filter: drop-shadow(0 0 6px rgba(255,209,102,0.4)); }
            .binomial-bar { fill: rgba(255, 255, 255, 0.22); stroke: #ffffff; stroke-width: 1.5; transform-origin: bottom; animation: bar-grow 2.5s infinite ease-in-out; }
            .bbar-1 { animation-delay: 0s; }
            .bbar-2 { animation-delay: 0.3s; fill: rgba(255, 209, 102, 0.35); stroke: #ffd166; }
            .bbar-3 { animation-delay: 0.6s; }
            .axis-line { stroke: rgba(255,255,255,0.3); stroke-width: 2.5; stroke-linecap: round; }
            .bin-lbl { fill: #ffffff; font-family: monospace; font-size: 14px; font-weight: bold; }
          </style>
          <!-- Eje horizontal -->
          <line x1="30" y1="120" x2="210" y2="120" class="axis-line"/>
          <!-- Barras de Probabilidad -->
          <rect x="52" y="90" width="16" height="30" rx="3" class="binomial-bar bbar-1"/>
          <rect x="78" y="70" width="16" height="50" rx="3" class="binomial-bar bbar-3"/>
          <rect x="104" y="45" width="16" height="75" rx="3" class="binomial-bar bbar-2"/> <!-- Pico -->
          <rect x="130" y="60" width="16" height="60" rx="3" class="binomial-bar bbar-3"/>
          <rect x="156" y="80" width="16" height="40" rx="3" class="binomial-bar bbar-1"/>
          <rect x="182" y="100" width="16" height="20" rx="3" class="binomial-bar bbar-3"/>
          
          <!-- Curva Binomial/Gaussiana -->
          <path d="M 40 108 C 80 50, 112 30, 112 30 C 112 30, 144 50, 195 106" class="curve-line"/>
          <text x="140" y="24" class="bin-lbl" fill="#ffd166">B(n, p)</text>
        </svg>`,
      graphs: `
        <svg viewBox="0 0 240 150" role="img" aria-label="Teoría de grafos brillante">
          <style>
            @keyframes pulse-vertex { 0%, 100% { r: 11; opacity: 0.9; } 50% { r: 13; opacity: 1; filter: drop-shadow(0 0 5px rgba(255,209,102,0.6)); } }
            .v-edge { stroke: #ffffff; stroke-width: 4; stroke-linecap: round; opacity: 0.75; }
            .v-edge-gold { stroke: #ffd166; stroke-width: 4.5; stroke-linecap: round; filter: drop-shadow(0 0 4px rgba(255,209,102,0.3)); }
            .v-node-outer { fill: rgba(7, 59, 46, 0.9); stroke: #ffffff; stroke-width: 3.5; }
            .v-node-gold { fill: rgba(7, 59, 46, 0.9); stroke: #ffd166; stroke-width: 4; animation: pulse-vertex 2.5s infinite ease-in-out; transform-origin: center; }
            .v-lbl { fill: #ffffff; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: bold; }
          </style>
          <!-- Aristas -->
          <line x1="60" y1="45" x2="160" y2="45" class="v-edge-gold"/>
          <line x1="60" y1="45" x2="90" y2="110" class="v-edge"/>
          <line x1="160" y1="45" x2="180" y2="105" class="v-edge"/>
          <line x1="90" y1="110" x2="180" y2="105" class="v-edge-gold"/>
          <line x1="160" y1="45" x2="90" y2="110" class="v-edge"/>
          
          <!-- Vértices -->
          <circle cx="60" cy="45" r="12" class="v-node-gold"/>
          <circle cx="160" cy="45" r="12" class="v-node-outer"/>
          <circle cx="90" cy="110" r="12" class="v-node-outer"/>
          <circle cx="180" cy="105" r="12" class="v-node-gold"/>
          <circle cx="130" cy="85" r="12" class="v-node-outer"/> <!-- Nodo central libre -->
          
          <!-- Enlaces al central -->
          <line x1="130" y1="85" x2="160" y2="45" class="v-edge" stroke-dasharray="4 2" stroke-width="2.5"/>
          <line x1="130" y1="85" x2="90" y2="110" class="v-edge" stroke-dasharray="4 2" stroke-width="2.5"/>
          
          <text x="100" y="24" class="v-lbl" fill="#ffd166">G = (V, E)</text>
        </svg>`
    };
    return `<div class="module-art ${mode}" aria-hidden="true">${heroVisuals[moduleId]}</div>`;
  }

  if (ovaVisuals[moduleId]) {
    return `<div class="module-art ${mode}" aria-hidden="true"><img src="./assets/ova/${ovaVisuals[moduleId]}" alt="" loading="lazy"></div>`;
  }

  const visuals = {
    logic: `
      <svg viewBox="0 0 240 150" role="img" aria-label="Circuito de logica proposicional">
        <rect x="32" y="30" width="176" height="92" rx="14" fill="#e5f5ef" stroke="#0f766e" stroke-width="4"/>
        <path d="M62 76h34m48 0h34M96 54v44m48-44v44" stroke="#0f766e" stroke-width="5" stroke-linecap="round"/>
        <circle cx="62" cy="76" r="11" fill="#d97706"/>
        <circle cx="120" cy="52" r="11" fill="#ffffff" stroke="#0f766e" stroke-width="4"/>
        <circle cx="120" cy="100" r="11" fill="#ffffff" stroke="#0f766e" stroke-width="4"/>
        <circle cx="178" cy="76" r="11" fill="#d97706"/>
        <text x="72" y="24" fill="#0b5f59" font-size="20" font-weight="800">p -> q</text>
      </svg>`,
    sets: `
      <svg viewBox="0 0 240 150" role="img" aria-label="Diagrama de Venn de conjuntos">
        <rect x="22" y="22" width="196" height="106" rx="14" fill="#f8fbf9" stroke="#d7e0d9" stroke-width="3"/>
        <circle cx="98" cy="75" r="48" fill="#0f766e" fill-opacity=".18" stroke="#0f766e" stroke-width="5"/>
        <circle cx="142" cy="75" r="48" fill="#d97706" fill-opacity=".18" stroke="#d97706" stroke-width="5"/>
        <text x="68" y="78" fill="#0b5f59" font-size="19" font-weight="800">A</text>
        <text x="160" y="78" fill="#9a4d02" font-size="19" font-weight="800">B</text>
        <text x="106" y="82" fill="#17211b" font-size="18" font-weight="800">&#8745;</text>
      </svg>`,
    strings: `
      <svg viewBox="0 0 240 150" role="img" aria-label="Automata y cadenas">
        <rect x="28" y="34" width="184" height="82" rx="12" fill="#101c15"/>
        <text x="48" y="68" fill="#b7f7d9" font-size="18" font-family="monospace">&#931; = {0,1}</text>
        <text x="48" y="96" fill="#fff1d6" font-size="18" font-family="monospace">w = 10110</text>
        <circle cx="168" cy="96" r="9" fill="#d97706">
          <animate attributeName="opacity" values="1;.25;1" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      </svg>`,
    probability: `
      <svg viewBox="0 0 240 150" role="img" aria-label="Dado y moneda para probabilidad">
        <rect x="46" y="42" width="68" height="68" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="5"/>
        <circle cx="65" cy="61" r="5" fill="#0f766e"/><circle cx="95" cy="61" r="5" fill="#0f766e"/>
        <circle cx="80" cy="76" r="5" fill="#0f766e"/><circle cx="65" cy="91" r="5" fill="#0f766e"/><circle cx="95" cy="91" r="5" fill="#0f766e"/>
        <circle cx="155" cy="76" r="36" fill="#fff1d6" stroke="#d97706" stroke-width="5"/>
        <text x="143" y="84" fill="#9a4d02" font-size="24" font-weight="900">P</text>
        <path d="M42 122h156" stroke="#d7e0d9" stroke-width="5" stroke-linecap="round"/>
      </svg>`,
    binomial: `
      <svg viewBox="0 0 240 150" role="img" aria-label="Distribucion binomial en barras">
        <path d="M34 118h172" stroke="#d7e0d9" stroke-width="5" stroke-linecap="round"/>
        <rect x="48" y="94" width="18" height="24" rx="4" fill="#0f766e"/>
        <rect x="76" y="70" width="18" height="48" rx="4" fill="#0f766e"/>
        <rect x="104" y="42" width="18" height="76" rx="4" fill="#d97706"/>
        <rect x="132" y="58" width="18" height="60" rx="4" fill="#0f766e"/>
        <rect x="160" y="88" width="18" height="30" rx="4" fill="#0f766e"/>
        <path d="M48 98 C78 56, 112 34, 146 62 S190 102, 202 112" fill="none" stroke="#17211b" stroke-width="4" stroke-linecap="round"/>
      </svg>`,
    graphs: `
      <svg viewBox="0 0 240 150" role="img" aria-label="Grafo con vertices y aristas">
        <line x1="74" y1="45" x2="162" y2="48" stroke="#0f766e" stroke-width="6" stroke-linecap="round"/>
        <line x1="74" y1="45" x2="98" y2="112" stroke="#0f766e" stroke-width="6" stroke-linecap="round"/>
        <line x1="162" y1="48" x2="188" y2="112" stroke="#0f766e" stroke-width="6" stroke-linecap="round"/>
        <line x1="98" y1="112" x2="188" y2="112" stroke="#0f766e" stroke-width="6" stroke-linecap="round"/>
        <circle cx="74" cy="45" r="18" fill="#fff" stroke="#d97706" stroke-width="5"/>
        <circle cx="162" cy="48" r="18" fill="#fff" stroke="#d97706" stroke-width="5"/>
        <circle cx="98" cy="112" r="18" fill="#fff" stroke="#d97706" stroke-width="5"/>
        <circle cx="188" cy="112" r="18" fill="#fff" stroke="#d97706" stroke-width="5"/>
      </svg>`
  };
  return `<div class="module-art ${mode}" aria-hidden="true">${visuals[moduleId]}</div>`;
}

let audioContext;
const soundPresets = {
  nav: [[420, 0], [560, 0.06]],
  correct: [[520, 0], [720, 0.07], [920, 0.14]],
  wrong: [[260, 0], [190, 0.09]],
  complete: [[520, 0], [660, 0.08], [880, 0.16], [1040, 0.24]]
};
const soundDataCache = {};

// Sincroniza el texto/estado accesible del interruptor de sonido.
function syncSoundButton() {
  const button = document.querySelector("#soundToggleButton");
  if (!button) return;
  button.textContent = state.soundOn ? "Sonido activado" : "Sonido apagado";
  button.setAttribute("aria-pressed", String(state.soundOn));
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  saveState();
  syncSoundButton();
  if (state.soundOn) {
    playSound("correct");
  } else {
    stopSpeaking();
  }
}

function getAudioContext() {
  if (!state.soundOn) return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  audioContext ||= new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playSound(kind) {
  const context = getAudioContext();
  if (!context) {
    playFallbackSound(kind);
    return;
  }
  (soundPresets[kind] || soundPresets.nav).forEach(([frequency, delay]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = kind === "wrong" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(kind === "wrong" ? 0.035 : 0.045, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.18);
  });
}

function playFallbackSound(kind) {
  if (!state.soundOn) return;
  soundDataCache[kind] ||= createWavDataUri(soundPresets[kind] || soundPresets.nav, kind === "wrong" ? "rough" : "soft");
  const audio = document.createElement("audio");
  audio.src = soundDataCache[kind];
  audio.volume = kind === "wrong" ? 0.18 : 0.24;
  audio.play().catch(() => {});
}

// Genera efectos WAV pequenos en memoria para tener audio sin archivos externos.
function createWavDataUri(notes, texture) {
  const sampleRate = 22050;
  const duration = Math.max(...notes.map(([, delay]) => delay)) + 0.22;
  const totalSamples = Math.ceil(sampleRate * duration);
  const samples = new Int16Array(totalSamples);
  notes.forEach(([frequency, delay]) => {
    const start = Math.floor(delay * sampleRate);
    const length = Math.floor(0.18 * sampleRate);
    for (let i = 0; i < length && start + i < samples.length; i += 1) {
      const t = i / sampleRate;
      const envelope = Math.sin(Math.PI * (i / length));
      const wave = Math.sin(2 * Math.PI * frequency * t);
      const rough = texture === "rough" ? Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.28 : 0;
      samples[start + i] += Math.floor((wave + rough) * envelope * 5000);
    }
  });
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  writeAscii(bytes, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(bytes, 8, "WAVE");
  writeAscii(bytes, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(bytes, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => view.setInt16(44 + index * 2, Math.max(-32768, Math.min(32767, sample)), true));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeAscii(bytes, offset, text) {
  for (let i = 0; i < text.length; i += 1) bytes[offset + i] = text.charCodeAt(i);
}

// Muestra una celebracion temporal cuando se completa un reto o actividad.
function celebrate(message = "Buen trabajo") {
  document.querySelector(".celebration")?.remove();
  const burst = document.createElement("div");
  burst.className = "celebration";
  burst.innerHTML = `
    <strong>${message}</strong>
    ${Array.from({ length: 18 }, (_, index) => `<span style="--i:${index}"></span>`).join("")}
  `;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1700);
}

let state = loadState();
let currentView = "overview";
let currentModuleId = modules[0].id;

const appView = document.querySelector("#appView");
const moduleNav = document.querySelector("#moduleNav");
const overviewButton = document.querySelector("#overviewButton");
const playgroundButton = document.querySelector("#playgroundButton");
const resetProgressButton = document.querySelector("#resetProgressButton");
const soundToggleButton = document.querySelector("#soundToggleButton");

// Selectores para barra lateral colapsable responsiva
const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.querySelector("#sidebarToggle");
const sidebarOverlay = document.querySelector("#sidebarOverlay");

// Actualiza el título del botón hamburguesa para accesibilidad y tooltip nativo
function updateSidebarToggleTitle() {
  if (!sidebarToggle) return;
  if (sidebarToggle.classList.contains("active")) {
    sidebarToggle.setAttribute("title", "Cerrar menú");
  } else {
    sidebarToggle.setAttribute("title", "Abrir menú");
  }
}

// Alterna la visualización de la barra lateral en móviles/tabletas
// Alterna la visualización de la barra lateral en móviles (drawer) y PC (colapsable)
function toggleSidebar(forceClose = false) {
  if (!sidebar || !sidebarToggle || !sidebarOverlay) return;

  // Comportamiento para PC (Escritorio > 1080px)
  if (window.innerWidth > 1080) {
    const appShell = document.querySelector(".app-shell");
    if (appShell) {
      const isCollapsed = appShell.classList.contains("sidebar-collapsed");
      if (forceClose) {
        // Colapsar
        appShell.classList.add("sidebar-collapsed");
        sidebarToggle.classList.remove("active");
        sidebarToggle.setAttribute("aria-expanded", "false");
      } else {
        if (isCollapsed) {
          // Expandir
          appShell.classList.remove("sidebar-collapsed");
          sidebarToggle.classList.add("active");
          sidebarToggle.setAttribute("aria-expanded", "true");
        } else {
          // Colapsar
          appShell.classList.add("sidebar-collapsed");
          sidebarToggle.classList.remove("active");
          sidebarToggle.setAttribute("aria-expanded", "false");
        }
      }
    }
  } else {
    // Comportamiento para Móvil y Tablet (<= 1080px)
    const isOpen = sidebar.classList.contains("open");
    if (isOpen || forceClose) {
      sidebar.classList.remove("open");
      sidebarToggle.classList.remove("active");
      sidebarOverlay.classList.remove("active");
      sidebarToggle.setAttribute("aria-expanded", "false");
    } else {
      sidebar.classList.add("open");
      sidebarToggle.classList.add("active");
      sidebarOverlay.classList.add("active");
      sidebarToggle.setAttribute("aria-expanded", "true");
    }
  }
  updateSidebarToggleTitle();
}

// El progreso vive solo en el navegador del estudiante. defaultState permite
// recuperar datos aunque se agreguen nuevos campos en futuras versiones.
function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState(), ...(parsed || {}) };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderProgress();
  renderNav();
}

// Actualiza la barra principal y la barra lateral con modulos completados.
function renderProgress() {
  const completedCount = modules.filter((module) => state.completed[module.id]).length;
  const percent = Math.round((completedCount / modules.length) * 100);
  const doneText = `${completedCount}/${modules.length} modulos`;
  document.querySelector("#overallProgress").textContent = `${percent}%`;
  document.querySelector("#overallMeter").style.width = `${percent}%`;
  document.querySelector("#sidebarProgress").textContent = `${percent}%`;
  document.querySelector("#sidebarMeter").style.width = `${percent}%`;
  document.querySelector("#sidebarDoneText").textContent = doneText;
}

// La navegacion lateral se reconstruye desde modules para evitar duplicar
// nombres, orden o estado de completado en el HTML.
function renderNav() {
  moduleNav.innerHTML = "";
  modules.forEach((module) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-button ${currentView === "module" && currentModuleId === module.id ? "active" : ""}`;
    button.innerHTML = `
      <span class="nav-index">${module.number}</span>
      <span class="nav-title">${module.title}</span>
      <span class="nav-check ${state.completed[module.id] ? "done" : ""}" aria-label="${state.completed[module.id] ? "Completado" : "Pendiente"}"></span>
    `;
    button.addEventListener("click", () => {
      playSound("nav");
      openModule(module.id);
    });
    moduleNav.appendChild(button);
  });
}

// Vista de inicio: tarjetas de modulo y acceso a evaluacion final.
function renderOverview() {
  if (window.innerWidth > 1080) {
    const appShell = document.querySelector(".app-shell");
    if (appShell) {
      appShell.classList.remove("sidebar-collapsed");
      sidebarToggle.classList.add("active");
      sidebarToggle.setAttribute("aria-expanded", "true");
      updateSidebarToggleTitle();
    }
  } else {
    toggleSidebar(true);
  }
  
  setHeroVisibility(true);
  currentView = "overview";
  
  const allCompleted = modules.every((m) => state.completed[m.id]);
  
  appView.innerHTML = `
    <div class="section-heading">
      <h3>Ruta de aprendizaje</h3>
      ${allCompleted 
        ? `<button type="button" class="primary-button" id="finalButton">Evaluación final</button>`
        : `<button type="button" class="primary-button" id="finalButton" style="opacity: 0.65; cursor: not-allowed; display: inline-flex; align-items: center; gap: 8px;">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
             Evaluación final (Bloqueada)
           </button>`
      }
    </div>
    <div class="overview-grid" id="overviewGrid"></div>
  `;
  const grid = document.querySelector("#overviewGrid");
  const template = document.querySelector("#moduleCardTemplate");
  modules.forEach((module) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".module-number").textContent = `Modulo ${module.number}`;
    node.querySelector(".module-status").textContent = state.completed[module.id] ? "Completado" : "Pendiente";
    node.querySelector("h3").textContent = module.title;
    node.querySelector("p").textContent = module.summary;
    node.querySelector("h3").insertAdjacentHTML("beforebegin", moduleVisual(module.id, "card"));
    node.querySelector("button").addEventListener("click", () => {
      playSound("nav");
      openModule(module.id);
    });
    grid.appendChild(node);
  });
  document.querySelector("#finalButton").addEventListener("click", () => {
    playSound("nav");
    if (!allCompleted) {
      playSound("wrong");
      showCustomAlert("Debes completar el 100% de los módulos teóricos y sus autoevaluaciones antes de poder realizar la Evaluación Final.");
      return;
    }
    renderFinalEvaluation();
  });
  renderNav();
  renderMath(appView);
}

// Renderiza un modulo completo con pestanas: teoria, laboratorio,
// evaluacion/juego y playground contextual.
function openModule(moduleId) {
  toggleSidebar(true);
  setHeroVisibility(false);
  currentView = "module";
  currentModuleId = moduleId;
  const module = modules.find((item) => item.id === moduleId);
  
  const currentIndex = modules.findIndex((item) => item.id === moduleId);
  const prevModule = modules[currentIndex - 1];
  const nextModule = modules[currentIndex + 1];

  appView.innerHTML = `
    <article class="module-layout">
      <header class="module-header">
        <div class="module-title-area">
          <span class="pill">Modulo ${module.number}</span>
          <h2>${module.title}</h2>
          <p>${module.summary}</p>
        </div>
        ${moduleVisual(module.id, "hero")}
        <div class="module-actions">
          <button type="button" class="secondary-button" id="backToOverview">Inicio</button>
          <a href="./${module.slidePath}" target="_blank" class="secondary-button" id="viewMaterial" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Material de apoyo
          </a>
          ${prevModule ? `
            <button type="button" class="secondary-button" id="prevModuleBtn" style="display: inline-flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Módulo Anterior
            </button>
          ` : ""}
          ${nextModule ? `
            <button type="button" class="primary-button" id="nextModuleBtn" style="display: inline-flex; align-items: center; gap: 8px;">
              Siguiente Módulo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          ` : `
            <button type="button" class="primary-button" id="nextModuleBtn" style="display: inline-flex; align-items: center; gap: 8px; background: var(--accent); border-color: var(--accent); color: #083e35;">
              Evaluación Final
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </button>
          `}
        </div>
      </header>

      <nav class="module-tabs" aria-label="Navegacion del modulo">
        <button type="button" class="tab-button active" data-tab="theory">Teoria y Guia</button>
        <button type="button" class="tab-button" data-tab="lab">Laboratorio Practico</button>
        <button type="button" class="tab-button" data-tab="activities">Evaluacion y Juego</button>
        <button type="button" class="tab-button" data-tab="playground">Pruebas Libres</button>
      </nav>

      <!-- Pestaña 1: Teoria y Guia -->
      <div class="tab-content active" id="tab-theory">
        <div class="theory-grid">
          <section class="panel">
            <div class="section-heading">
              <h3>Conceptos clave</h3>
              <button type="button" class="tts-button" data-tts="concepts" aria-label="Escuchar conceptos"></button>
            </div>
            <ul class="concept-list">
              ${module.outcomes.map((item) => `<li>${item}</li>`).join("")}
            </ul>
            <div class="example-box">
              <div class="section-heading compact">
                <strong>Ejemplo guiado</strong>
                <button type="button" class="tts-button text-only" data-tts="example" aria-label="Escuchar ejemplo"></button>
              </div>
              <p>${module.example}</p>
            </div>
            ${renderDeepDive(module.id)}
            ${renderSystemsFocusCard(module.id)}
          </section>
          ${renderStudyGuide(module.id)}
        </div>
      </div>

      <!-- Pestaña 2: Laboratorio Practico -->
      <div class="tab-content" id="tab-lab">
        <div class="lab-layout">
          <section class="lab-panel">
            <div class="section-heading">
              <h3>Laboratorio interactivo</h3>
              <span class="pill">practica</span>
            </div>
            <div id="labRoot"></div>
          </section>
          ${renderLabChallenge(module.id)}
        </div>
      </div>

      <!-- Pestaña 3: Evaluacion y Juego -->
      <div class="tab-content" id="tab-activities">
        <div class="activities-grid">
          <section class="game-panel">
            <div class="section-heading">
              <h3>Mini juego del modulo</h3>
              <span class="pill" id="gameScorePill">0/0</span>
            </div>
            <div id="gameRoot"></div>
          </section>

          <section class="quiz-panel">
            <div class="section-heading">
              <h3>Autoevaluacion del modulo</h3>
              <span class="pill" id="quizScorePill">0/${module.quiz.length}</span>
            </div>
            <div id="quizRoot"></div>
          </section>

          ${renderExtraActivityPanel(module.id)}
        </div>
      </div>

      <!-- Pestaña 4: Pruebas Libres (Playground) -->
      <div class="tab-content" id="tab-playground">
        <div id="modulePlaygroundRoot"></div>
      </div>
    </article>
  `;

  document.querySelector("#backToOverview").addEventListener("click", () => {
    stopSpeaking();
    playSound("nav");
    renderOverview();
  });

  if (prevModule) {
    document.querySelector("#prevModuleBtn").addEventListener("click", () => {
      stopSpeaking();
      playSound("nav");
      openModule(prevModule.id);
    });
  }

  document.querySelector("#nextModuleBtn").addEventListener("click", () => {
    stopSpeaking();
    playSound("nav");
    if (nextModule) {
      openModule(nextModule.id);
    } else {
      const allCompleted = modules.every((m) => state.completed[m.id]);
      if (!allCompleted) {
        playSound("wrong");
        showCustomAlert("Debes completar el 100% de los módulos teóricos y sus autoevaluaciones antes de poder realizar la Evaluación Final.");
      } else {
        renderFinalEvaluation();
      }
    }
  });


  initModuleTabs(appView);
  bindTTS(appView);
  renderLab(module.id);
  renderGame(module.id);
  renderQuiz(module);
  renderExtraActivity(module.id);
  renderModulePlayground(module.id, appView.querySelector("#modulePlaygroundRoot"));
  bindStudyGuide();
  renderNav();
  renderMath(appView);
}

function renderQuiz(module) {
  const root = document.querySelector("#quizRoot");
  root.innerHTML = "";
  module.quiz.forEach((question, index) => {
    const key = `${module.id}-${index}`;
    root.appendChild(createQuestionCard(question, key, () => {
      updateQuizScore(module);
    }));
  });
  updateQuizScore(module);
}

function updateQuizScore(module) {
  const score = module.quiz.reduce((total, question, index) => {
    const key = `${module.id}-${index}`;
    return total + (state.quizAnswers[key] === question.answer ? 1 : 0);
  }, 0);
  const pill = document.querySelector("#quizScorePill");
  if (pill) pill.textContent = `${score}/${module.quiz.length}`;
  checkAndAutoCompleteModule(module);
}

function checkAndAutoCompleteModule(module) {
  if (state.completed[module.id]) return;
  
  const allCorrect = module.quiz.every((question, index) => {
    const key = `${module.id}-${index}`;
    return state.quizAnswers[key] === question.answer;
  });
  
  if (allCorrect) {
    state.completed[module.id] = true;
    saveState();
    playSound("complete");
    celebrate("¡Módulo completado con éxito!");
    renderNav();
    renderProgress();
    
    const courseFinished = modules.every((m) => state.completed[m.id]);
    
    // Esperar a que comience la animación de celebración y luego abrir el modal
    setTimeout(() => {
      showModuleCompletionModal(courseFinished);
    }, 850);
  }
}

// Despliega opciones al completar un módulo de forma autónoma
function showModuleCompletionModal(isLastCourseModule) {
  const overlay = document.createElement("div");
  overlay.className = "ova-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  
  if (isLastCourseModule) {
    overlay.innerHTML = `
      <div class="ova-modal-card" style="width: min(92%, 460px); border-color: var(--accent); border-width: 2px;">
        <div class="ova-modal-header">
          <h4 style="color: var(--accent-strong); font-size: 1.4rem;">🏆 ¡Felicidades! Curso Finalizado</h4>
        </div>
        <div class="ova-modal-body">
          <p style="font-size: 1rem; line-height: 1.55;">
            Has completado satisfactoriamente las explicaciones y cuestionarios de los <strong>6 módulos teóricos</strong> de Matemáticas Discretas. 
            <br/><br/>
            Has desbloqueado el acceso a la <strong>Evaluación Final</strong>. ¿Qué deseas hacer ahora?
          </p>
        </div>
        <div class="ova-modal-footer" style="flex-direction: column; gap: 8px; width: 100%; align-items: stretch; margin-top: 12px;">
          <button type="button" class="primary-button" id="modalGoToFinal" style="width: 100%; min-height: 42px;">Realizar Evaluación Final</button>
          <button type="button" class="secondary-button" id="modalGoToOverview" style="width: 100%; min-height: 42px;">Volver al Inicio</button>
        </div>
      </div>
    `;
  } else {
    overlay.innerHTML = `
      <div class="ova-modal-card" style="width: min(92%, 420px);">
        <div class="ova-modal-header">
          <h4 style="color: var(--primary);">🎉 ¡Módulo Completado!</h4>
        </div>
        <div class="ova-modal-body">
          <p style="line-height: 1.5;">
            Has completado con éxito todas las preguntas de la autoevaluación de este módulo. 
            Continúa con tu ruta de aprendizaje para desbloquear la prueba final.
          </p>
        </div>
        <div class="ova-modal-footer" style="gap: 12px; justify-content: flex-end; width: 100%; margin-top: 12px;">
          <button type="button" class="secondary-button" id="modalKeepExploring" style="min-height: 40px;">Seguir en el Módulo</button>
          <button type="button" class="primary-button" id="modalGoToOverviewSimple" style="min-height: 40px; background: var(--primary); border-color: var(--primary);">Ir al Inicio</button>
        </div>
      </div>
    `;
  }
  
  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.classList.add("active");
  
  function close() {
    overlay.classList.remove("active");
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
    });
  }
  
  if (isLastCourseModule) {
    overlay.querySelector("#modalGoToFinal").addEventListener("click", () => {
      playSound("nav");
      close();
      renderFinalEvaluation();
    });
    overlay.querySelector("#modalGoToOverview").addEventListener("click", () => {
      playSound("nav");
      close();
      renderOverview();
    });
  } else {
    overlay.querySelector("#modalKeepExploring").addEventListener("click", () => {
      playSound("nav");
      close();
    });
    overlay.querySelector("#modalGoToOverviewSimple").addEventListener("click", () => {
      playSound("nav");
      close();
      renderOverview();
    });
  }
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      playSound("nav");
      close();
    }
  });
}

// Panel contenedor de la actividad extra; el detalle se decide por type.
function renderExtraActivityPanel(moduleId) {
  const challenge = interactiveActivities[moduleId];
  if (!challenge) return "";
  return `
    <section class="panel ova-extra-challenge-panel">
      <div class="section-heading">
        <h3>Actividad interactiva del modulo</h3>
        <span class="pill">practica extra</span>
      </div>
      <p>${challenge.reuse}</p>
      <div class="ova-extra-note-grid">
        <div class="ova-extra-note"><strong>Formato de practica</strong>${challenge.format}</div>
        <div class="ova-extra-note"><strong>Interaccion</strong>${challenge.interaction}</div>
      </div>
      <div id="extraActivityRoot"></div>
    </section>
  `;
}

// Despachador de actividades extra. Mantiene una sola entrada desde openModule
// aunque cada tipo tenga UI y validacion diferentes.
function renderExtraActivity(moduleId) {
  const challenge = interactiveActivities[moduleId];
  const root = document.querySelector("#extraActivityRoot");
  if (!challenge || !root) return;
  root.innerHTML = "";
  const activity = challenge.activity;
  if (!activity) return;
  if (activity.type === "classify") renderExtraClassifyActivity(moduleId, activity, root);
  if (activity.type === "sample") renderExtraSampleActivity(moduleId, activity, root);
  if (activity.type === "validator") renderExtraValidatorActivity(moduleId, activity, root);
  if (activity.type === "euler") renderExtraEulerActivity(moduleId, activity, root);
  renderMath(root);
}

// Actividad tipo clasificacion: seleccion por categorias y validacion grupal.
function renderExtraClassifyActivity(moduleId, activity, root) {
  root.innerHTML = `
    <div class="ova-extra-activity" data-ova-extra-activity="${moduleId}">
      <div class="ova-extra-activity-head">
        <strong>${activity.title}</strong>
        <p>${activity.prompt}</p>
      </div>
      <div class="ova-extra-classify-grid">
        ${activity.items.map((item, index) => `
          <article class="ova-extra-card" data-ova-extra-item="${index}" data-answer="${escapeHtml(item.answer)}">
            <div class="ova-extra-token">${item.text}</div>
            <label>
              <span>Categoria</span>
              <select data-ova-extra-select="${index}">
                <option value="">Elegir...</option>
                ${activity.categories.map((category) => `<option value="${escapeHtml(category)}">${category}</option>`).join("")}
              </select>
            </label>
            <p class="ova-extra-hint">${item.hint}</p>
          </article>
        `).join("")}
      </div>
      ${renderExtraActivityActions(moduleId)}
    </div>
  `;
  root.querySelector("[data-ova-extra-check]").addEventListener("click", () => checkExtraClassifyActivity(moduleId, activity, root));
  root.querySelector("[data-ova-extra-reset]").addEventListener("click", () => renderExtraActivity(moduleId));
}

function checkExtraClassifyActivity(moduleId, activity, root) {
  const cards = [...root.querySelectorAll(".ova-extra-card")];
  let score = 0;
  cards.forEach((card, index) => {
    const select = card.querySelector("select");
    const correct = select.value === activity.items[index].answer;
    card.classList.toggle("correct", correct);
    card.classList.toggle("wrong", Boolean(select.value) && !correct);
    if (correct) score += 1;
  });
  setExtraActivityFeedback(moduleId, root, score === activity.items.length, `${score}/${activity.items.length}`, activity.success, activity.partial);
}

// Actividad de espacio muestral: el estudiante activa elementos del evento.
function renderExtraSampleActivity(moduleId, activity, root) {
  root.innerHTML = `
    <div class="ova-extra-activity" data-ova-extra-activity="${moduleId}">
      <div class="ova-extra-activity-head">
        <strong>${activity.title}</strong>
        <p>${activity.prompt}</p>
      </div>
      <div class="ova-extra-sample-row">
        ${activity.sampleSpace.map((value) => `<button type="button" class="ova-extra-sample" data-sample="${value}">${value}</button>`).join("")}
      </div>
      <div class="ova-extra-formula">${inlineMath(activity.formula)}</div>
      ${renderExtraActivityActions(moduleId)}
    </div>
  `;
  root.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("selected");
      playSound("nav");
    });
  });
  root.querySelector("[data-ova-extra-check]").addEventListener("click", () => checkExtraSampleActivity(moduleId, activity, root));
  root.querySelector("[data-ova-extra-reset]").addEventListener("click", () => renderExtraActivity(moduleId));
}

function checkExtraSampleActivity(moduleId, activity, root) {
  const selected = [...root.querySelectorAll(".ova-extra-sample.selected")].map((button) => button.dataset.sample).sort();
  const expected = [...activity.expected].sort();
  const isCorrect = selected.length === expected.length && selected.every((value, index) => value === expected[index]);
  setExtraActivityFeedback(moduleId, root, isCorrect, `${selected.length}/${expected.length}`, activity.success, activity.partial);
}

// Validador de lenguaje formal con RegExp controlada desde los datos.
function renderExtraValidatorActivity(moduleId, activity, root) {
  root.innerHTML = `
    <div class="ova-extra-activity" data-ova-extra-activity="${moduleId}">
      <div class="ova-extra-activity-head">
        <strong>${activity.title}</strong>
        <p>${activity.prompt}</p>
      </div>
      <div class="ova-extra-validator">
        <input id="extraValidatorInput" type="text" value="${escapeHtml(activity.initial)}" spellcheck="false" />
        <button type="button" class="primary-button" data-ova-extra-check>Validar cadena</button>
      </div>
      <div class="ova-extra-sample-row compact">
        ${activity.samples.map((sample) => `<button type="button" class="ova-extra-chip" data-sample-fill="${escapeHtml(sample)}">${sample}</button>`).join("")}
      </div>
      <div class="ova-extra-actions">
        <button type="button" class="secondary-button" data-ova-extra-reset>Reiniciar</button>
      </div>
      <div class="ova-extra-feedback" aria-live="polite"></div>
    </div>
  `;
  root.querySelectorAll("[data-sample-fill]").forEach((button) => {
    button.addEventListener("click", () => {
      root.querySelector("#extraValidatorInput").value = button.dataset.sampleFill;
      playSound("nav");
    });
  });
  root.querySelector("[data-ova-extra-check]").addEventListener("click", () => checkExtraValidatorActivity(moduleId, activity, root));
  root.querySelector("[data-ova-extra-reset]").addEventListener("click", () => renderExtraActivity(moduleId));
}

function checkExtraValidatorActivity(moduleId, activity, root) {
  const value = root.querySelector("#extraValidatorInput").value.trim();
  const isCorrect = new RegExp(activity.pattern).test(value);
  setExtraActivityFeedback(moduleId, root, isCorrect, value || "vacio", activity.success, activity.partial);
}

// Decision guiada para grafos: muestra grados y valida el criterio euleriano.
function renderExtraEulerActivity(moduleId, activity, root) {
  root.innerHTML = `
    <div class="ova-extra-activity" data-ova-extra-activity="${moduleId}">
      <div class="ova-extra-activity-head">
        <strong>${activity.title}</strong>
        <p>${activity.prompt}</p>
      </div>
      <div class="ova-extra-euler-grid">
        <svg class="ova-extra-graph" viewBox="0 0 420 170" role="img" aria-label="Grafo camino A-B-C-D">
          <line x1="70" y1="85" x2="165" y2="85"></line>
          <line x1="165" y1="85" x2="260" y2="85"></line>
          <line x1="260" y1="85" x2="350" y2="85"></line>
          ${["A", "B", "C", "D"].map((node, index) => {
            const x = [70, 165, 260, 350][index];
            return `<g><circle cx="${x}" cy="85" r="26"></circle><text x="${x}" y="92" text-anchor="middle">${node}</text></g>`;
          }).join("")}
        </svg>
        <div class="ova-extra-degree-list">
          ${activity.degrees.map(([node, degree]) => `<span>${inlineMath(`d(${node})=${degree}`)}</span>`).join("")}
        </div>
      </div>
      <div class="ova-extra-choice-row">
        <button type="button" class="primary-button" data-euler-answer="yes">Tiene camino euleriano</button>
        <button type="button" class="secondary-button" data-euler-answer="no">No tiene camino euleriano</button>
      </div>
      <div class="ova-extra-feedback" aria-live="polite"></div>
    </div>
  `;
  root.querySelectorAll("[data-euler-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const isCorrect = button.dataset.eulerAnswer === activity.expected;
      root.querySelectorAll("[data-euler-answer]").forEach((btn) => btn.classList.toggle("selected", btn === button));
      setExtraActivityFeedback(moduleId, root, isCorrect, button.textContent, activity.success, activity.partial);
    });
  });
}

function renderExtraActivityActions(moduleId) {
  return `
    <div class="ova-extra-actions">
      <button type="button" class="primary-button" data-ova-extra-check>Comprobar actividad</button>
      <button type="button" class="secondary-button" data-ova-extra-reset>Reiniciar</button>
    </div>
    <div class="ova-extra-feedback" aria-live="polite">${state.extraActivities[moduleId] ? "Actividad ya superada." : ""}</div>
  `;
}

// Feedback comun para todas las actividades extra, incluyendo sonido,
// celebracion y persistencia del logro.
function setExtraActivityFeedback(moduleId, root, isCorrect, scoreText, successText, partialText) {
  const feedback = root.querySelector(".ova-extra-feedback");
  if (!feedback) return;
  feedback.className = `ova-extra-feedback ${isCorrect ? "good" : "bad"}`;
  feedback.innerHTML = `<strong>${isCorrect ? "Resultado correcto" : "Sigue practicando"} · ${scoreText}</strong><p>${isCorrect ? successText : partialText}</p>`;
  playSound(isCorrect ? "complete" : "wrong");
  if (isCorrect) {
    state.extraActivities[moduleId] = true;
    saveState();
    celebrate("Actividad superada");
  }
  renderMath(root);
}

function renderDeepDive(moduleId) {
  const detail = moduleDeepDives[moduleId];
  if (!detail) return "";
  return `
    <div class="deep-dive">
      <div class="section-heading compact">
        <h3>Contenido ampliado</h3>
        <button type="button" class="tts-button text-only" data-tts="deepdive" aria-label="Escuchar contenido ampliado"></button>
      </div>
      <p>${detail.focus}</p>
      <ul class="detail-list">
        ${detail.keyIdeas.map((idea) => `<li>${idea}</li>`).join("")}
      </ul>
      <div class="system-use"><strong>Aplicacion en sistemas:</strong> ${detail.systemUse}</div>
    </div>
  `;
}

function renderSystemsFocusCard(moduleId) {
  const focus = moduleSystemsFocus[moduleId];
  if (!focus) return "";
  return `
    <article class="panel systems-focus-card">
      <div class="section-heading">
        <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--primary);"><rect x="2" y="2" width="20" height="8" rx="2.5"></rect><rect x="2" y="14" width="20" height="8" rx="2.5"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg> ${focus.title}</h3>
        <button type="button" class="tts-button text-only" data-tts="systems-focus" aria-label="Escuchar enfoque de sistemas"></button>
      </div>
      <p class="systems-desc">${focus.desc}</p>
      <div class="systems-examples">
        <strong>Ejemplos Prácticos de Aplicación:</strong>
        <ul class="systems-examples-list">
          ${focus.examples.map(ex => `<li><strong>${ex.area}:</strong> ${ex.app}</li>`).join("")}
        </ul>
      </div>
    </article>
  `;
}

function renderLabChallenge(moduleId) {
  const challenge = moduleLabChallenges[moduleId];
  if (!challenge) return "";
  return `
    <article class="panel lab-challenge-panel">
      <div class="section-heading">
        <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--accent);"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Hazlo tú mismo (Reto Práctico)</h3>
        <button type="button" class="tts-button text-only" data-tts="lab-challenge" aria-label="Escuchar reto práctico"></button>
      </div>
      <div class="challenge-body">
        <div class="challenge-step">
          <strong>⚙️ Instrucciones de uso:</strong>
          <p>${challenge.instructions}</p>
        </div>
        <div class="challenge-mission">
          <strong>🎯 Misión / Desafío:</strong>
          <p>${challenge.challenge}</p>
        </div>
      </div>
    </article>
  `;
}

function renderGame(moduleId) {
  const game = moduleGames[moduleId];
  const root = document.querySelector("#gameRoot");
  if (!game || !root) return;
  
  root.innerHTML = `
    <div class="game-intro">
      <div>
        <strong>${game.title}</strong>
        <p>${game.instruction}</p>
      </div>
      <button type="button" class="secondary-button" id="checkGameButton">Revisar juego</button>
    </div>
    <div class="game-grid">
      ${game.items.map((item, index) => `
        <article class="game-card" data-answer="${escapeHtml(item.answer)}">
          <p>${item.text}</p>
          <label>
            <span>Tu clasificación</span>
            <select data-game-select="${index}">
              <option value="">Elegir...</option>
              ${game.categories.map((category) => `<option value="${escapeHtml(category)}">${category}</option>`).join("")}
            </select>
          </label>
          <div class="game-feedback" aria-live="polite">${item.hint}</div>
        </article>
      `).join("")}
    </div>
  `;
  
  const checkBtn = document.querySelector("#checkGameButton");
  if (checkBtn) {
    checkBtn.addEventListener("click", () => checkGame(moduleId));
  }
  
  const selects = root.querySelectorAll("[data-game-select]");
  selects.forEach((select, index) => {
    select.addEventListener("change", () => {
      const selected = select.value;
      if (!selected) {
        const card = select.closest(".game-card");
        if (card) {
          card.classList.remove("correct", "wrong", "pulse-good", "pulse-bad");
          const feedback = card.querySelector(".game-feedback");
          if (feedback) feedback.textContent = game.items[index].hint;
        }
        return;
      }
      
      const item = game.items[index];
      const correct = selected === item.answer;
      const card = select.closest(".game-card");
      
      if (card) {
        card.classList.toggle("correct", correct);
        card.classList.toggle("wrong", !correct);
        card.classList.remove("pulse-good", "pulse-bad");
        void card.offsetWidth;
        card.classList.add(correct ? "pulse-good" : "pulse-bad");
        
        const feedback = card.querySelector(".game-feedback");
        if (feedback) {
          feedback.innerHTML = correct
            ? `¡Correcto! Es ${item.answer}.`
            : `Casi. Pista: ${item.hint}`;
        }
      }
      
      playSound(correct ? "correct" : "wrong");
      if (correct) {
        speakText(`Excelente. Clasificación correcta. Es ${item.answer}`, null);
      } else {
        speakText("Incorrecto. Intenta de nuevo.", null);
      }
      
      let currentScore = 0;
      selects.forEach((s, idx) => {
        if (s.value === game.items[idx].answer) currentScore += 1;
      });
      const pill = document.querySelector("#gameScorePill");
      if (pill) pill.textContent = `${currentScore}/${game.items.length}`;
      
      if (currentScore === game.items.length) {
        playSound("complete");
        celebrate("¡Mini juego superado con éxito!");
      }
    });
  });
  
  const pill = document.querySelector("#gameScorePill");
  if (pill) pill.textContent = `0/${game.items.length}`;
  renderMath(root);
}

// Guia teorica complementaria: secciones pensadas para lectura rapida y repaso.
function renderStudyGuide(moduleId) {
  const guide = moduleStudyGuides[moduleId];
  if (!guide) return "";
  return `
    <section class="study-panel">
      <div class="section-heading">
        <h3>Guia de estudio completa</h3>
        <span class="pill">mas contenido</span>
      </div>
      <div class="study-grid">
        <article class="study-card">
          <div class="section-heading compact">
            <h4>Definiciones esenciales</h4>
            <button type="button" class="tts-button text-only" data-tts="guide-def" aria-label="Escuchar definiciones"></button>
          </div>
          <dl class="definition-list">
            ${guide.definitions.map(([term, definition]) => `<div><dt>${term}</dt><dd>${definition}</dd></div>`).join("")}
          </dl>
        </article>
        <article class="study-card">
          <div class="section-heading compact">
            <h4>Procedimiento recomendado</h4>
            <button type="button" class="tts-button text-only" data-tts="guide-proc" aria-label="Escuchar procedimiento"></button>
          </div>
          <ol class="step-list">
            ${guide.procedure.map((step) => `<li>${step}</li>`).join("")}
          </ol>
        </article>
        <article class="study-card worked">
          <div class="section-heading compact">
            <h4>Ejemplo resuelto</h4>
            <button type="button" class="tts-button text-only" data-tts="guide-worked" aria-label="Escuchar ejemplo resuelto"></button>
          </div>
          <p>${guide.worked}</p>
        </article>
      </div>
      <div class="practice-bank">
        <div class="section-heading compact">
          <h3>Ejercicios extra</h3>
          <span class="pill">${guide.practice.length} retos</span>
        </div>
        <div class="practice-grid">
          ${guide.practice.map(([prompt, solution], index) => `
            <article class="practice-card">
              <p>${prompt}</p>
              <button type="button" class="secondary-button practice-toggle" data-practice="${moduleId}-${index}">Ver solucion</button>
              <div class="practice-solution hidden" id="practice-${moduleId}-${index}">${solution}</div>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

// Activa los botones "Ver solucion" de ejercicios extra.
function bindStudyGuide() {
  document.querySelectorAll(".practice-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(`#practice-${button.dataset.practice}`);
      if (!target) return;
      const hidden = target.classList.toggle("hidden");
      button.textContent = hidden ? "Ver solucion" : "Ocultar solucion";
      playSound("nav");
      renderMath(target);
    });
  });
}

// Valida los mini juegos de clasificacion del modulo.
function checkGame(moduleId) {
  const game = moduleGames[moduleId];
  const cards = [...document.querySelectorAll(".game-card")];
  let score = 0;
  cards.forEach((card, index) => {
    const select = card.querySelector("select");
    const selected = select.value;
    const correct = selected === game.items[index].answer;
    if (correct) score += 1;
    card.classList.toggle("correct", correct);
    card.classList.toggle("wrong", Boolean(selected) && !correct);
    const feedback = card.querySelector(".game-feedback");
    feedback.innerHTML = correct
      ? `Correcto: ${game.items[index].answer}.`
      : selected
        ? `Casi. Pista: ${game.items[index].hint}`
        : `Elige una opcion. Pista: ${game.items[index].hint}`;
  });
  const pill = document.querySelector("#gameScorePill");
  if (pill) pill.textContent = `${score}/${game.items.length}`;
  playSound(score === game.items.length ? "complete" : "wrong");
  if (score === game.items.length) celebrate("Mini juego superado");
  renderMath(document.querySelector("#gameRoot"));
}

// Componente reutilizable para autoevaluaciones y evaluacion final.
// Guarda respuesta, permite reintentar y puede mostrar solucion explicada.
function createQuestionCard(question, key, onAnswer) {
  const card = document.createElement("article");
  card.className = "question-card ova-question-style";
  
  const savedAnswer = key.startsWith("final-") ? state.finalAnswers[key] : state.quizAnswers[key];
  let selectedIndex = savedAnswer;
  let isChecked = savedAnswer !== undefined;

  card.innerHTML = `
    <div class="ova-question-header">
      <span class="ova-question-type">${key.startsWith("final-") ? "Evaluación final" : "Autoevaluación"}</span>
    </div>
    <div class="ova-question-body">
      <p class="ova-question-prompt"><strong>${question.prompt}</strong></p>
      <div class="answers ova-question-options"></div>
      <div class="feedback ova-question-feedback hidden" aria-live="polite"></div>
    </div>
    <div class="ova-question-footer">
      <button type="button" class="primary-button ova-question-check-btn" disabled>Comprobar</button>
      <div class="ova-question-retry-actions hidden">
        <button type="button" class="secondary-button ova-question-retry-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Reintentar
        </button>
        <button type="button" class="secondary-button ova-question-solution-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          Mostrar solución
        </button>
      </div>
    </div>
  `;

  const answers = card.querySelector(".answers");
  const checkBtn = card.querySelector(".ova-question-check-btn");
  const retryActions = card.querySelector(".ova-question-retry-actions");
  const retryBtn = card.querySelector(".ova-question-retry-btn");
  const solutionBtn = card.querySelector(".ova-question-solution-btn");
  const feedback = card.querySelector(".feedback");

  function renderOptions() {
    answers.innerHTML = "";
    question.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.innerHTML = `<span class="ova-question-radio-circle"></span><span class="ova-question-option-text">${option}</span>`;
      
      if (isChecked) {
        button.disabled = true;
        if (optionIndex === question.answer) {
          button.classList.add("correct");
        } else if (optionIndex === selectedIndex) {
          button.classList.add("wrong");
        }
      } else {
        button.disabled = false;
        if (optionIndex === selectedIndex) {
          button.classList.add("selected");
        }
      }

      button.addEventListener("click", () => {
        if (isChecked) return;
        selectedIndex = optionIndex;
        const optionButtons = [...answers.querySelectorAll(".answer-button")];
        optionButtons.forEach((btn, idx) => {
          btn.classList.toggle("selected", idx === selectedIndex);
        });
        checkBtn.disabled = false;
        playSound("nav");
      });

      answers.appendChild(button);
    });
  }

  function applyGrading(withSoundEffects = false) {
    isChecked = true;
    renderOptions();

    const isCorrect = selectedIndex === question.answer;

    feedback.className = `feedback ova-question-feedback ${isCorrect ? "good" : "bad"}`;
    feedback.innerHTML = isCorrect
      ? `<div class="ova-question-feedback-header"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin: 0;"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>¡Excelente! Respuesta correcta.</strong></div><p>${question.feedback}</p>`
      : `<div class="ova-question-feedback-header"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin: 0;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <strong>Incorrecto.</strong></div><p>Revisa el concepto y vuelve a intentarlo.</p>`;
    feedback.classList.remove("hidden");

    checkBtn.classList.add("hidden");
    checkBtn.disabled = true;

    if (isCorrect) {
      retryActions.classList.add("hidden");
    } else {
      retryActions.classList.remove("hidden");
      solutionBtn.classList.remove("hidden");
    }

    if (withSoundEffects) {
      playSound(isCorrect ? "correct" : "wrong");
      if (isCorrect) {
        speakText(`Excelente. Respuesta correcta. ${question.feedback}`, null);
      } else {
        speakText("Incorrecto. Revisa el concepto y vuelve a intentarlo.", null);
      }
      
      card.classList.remove("pulse-good", "pulse-bad");
      void card.offsetWidth;
      card.classList.add(isCorrect ? "pulse-good" : "pulse-bad");
    }

    renderMath(card);
  }

  checkBtn.addEventListener("click", () => {
    if (selectedIndex === undefined) return;
    
    if (key.startsWith("final-")) {
      state.finalAnswers[key] = selectedIndex;
    } else {
      state.quizAnswers[key] = selectedIndex;
    }
    saveState();
    
    applyGrading(true);
    if (onAnswer) onAnswer();
  });

  retryBtn.addEventListener("click", () => {
    stopSpeaking();
    playSound("nav");
    isChecked = false;
    selectedIndex = undefined;
    
    if (key.startsWith("final-")) {
      delete state.finalAnswers[key];
    } else {
      delete state.quizAnswers[key];
    }
    saveState();

    feedback.classList.add("hidden");
    retryActions.classList.add("hidden");
    checkBtn.classList.remove("hidden");
    checkBtn.disabled = true;
    
    renderOptions();
    renderMath(card);
    if (onAnswer) onAnswer();
  });

  solutionBtn.addEventListener("click", () => {
    stopSpeaking();
    playSound("nav");
    
    const optionButtons = [...answers.querySelectorAll(".answer-button")];
    optionButtons.forEach((btn, idx) => {
      btn.classList.toggle("correct", idx === question.answer);
      btn.disabled = true;
    });

    feedback.className = `feedback ova-question-feedback good`;
    feedback.innerHTML = `<div class="ova-question-feedback-header"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> <strong>Solución correcta:</strong></div><p>${question.feedback}</p>`;
    feedback.classList.remove("hidden");

    solutionBtn.classList.add("hidden");
    renderMath(card);
  });

  renderOptions();

  if (savedAnswer !== undefined) {
    applyGrading(false);
  }

  return card;
}

function paintQuestionState(card, question, selectedIndex, withSound = false) {
  // Obsoleto en la version actual, mantenido por retrocompatibilidad de firma si fuera necesario.
}

// Despachador de laboratorios. Cada tema tiene su propio simulador.
function renderLab(moduleId) {
  const labRoot = document.querySelector("#labRoot");
  if (!labRoot) return;
  const labs = {
    logic: renderLogicLab,
    sets: renderSetsLab,
    strings: renderStringsLab,
    probability: renderProbabilityLab,
    binomial: renderBinomialLab,
    graphs: renderGraphLab
  };
  if (labs[moduleId]) {
    labs[moduleId](labRoot);
  }
}

function renderLogicLab(root) {
  root.innerHTML = `
    <div class="lab-controls">
      <div class="field">
        <label for="logicP">Valor de p</label>
        <select id="logicP"><option value="true">Verdadero</option><option value="false">Falso</option></select>
      </div>
      <div class="field">
        <label for="logicQ">Valor de q</label>
        <select id="logicQ"><option value="true">Verdadero</option><option value="false">Falso</option></select>
      </div>
      <div class="field">
        <label for="logicOp">Conectivo</label>
        <select id="logicOp">
          <option value="and">p ^ q</option>
          <option value="or">p v q</option>
          <option value="implies">p -> q</option>
          <option value="iff">p <-> q</option>
        </select>
      </div>
    </div>
    <div class="output-grid">
      <div class="output-box"><strong>Resultado</strong><div id="logicResult" class="math-line"></div></div>
      <div class="output-box"><strong>Lectura</strong><div id="logicReading"></div></div>
    </div>
    <table class="truth-table" id="truthTable" aria-label="Tabla de verdad"></table>
  `;
  
  ["logicP", "logicQ", "logicOp"].forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.addEventListener("change", updateLogicLab);
  });
  updateLogicLab();
}

function updateLogicLab() {
  const elP = document.querySelector("#logicP");
  const elQ = document.querySelector("#logicQ");
  const elOp = document.querySelector("#logicOp");
  if (!elP || !elQ || !elOp) return;

  const p = elP.value === "true";
  const q = elQ.value === "true";
  const op = elOp.value;
  const result = evalLogic(p, q, op);
  const readings = {
    and: "La conjunción solo funciona si ambas proposiciones son verdaderas.",
    or: "La disyunción inclusiva funciona si al menos una proposición es verdadera.",
    implies: "El condicional solo falla cuando p es verdadera y q es falsa.",
    iff: "El bicondicional es verdadero cuando p y q tienen el mismo valor."
  };
  setMathHtml("#logicResult", inlineMath(`${boolTex(p)} ${logicSymbolLatex(op)} ${boolTex(q)} = ${boolTex(result)}`));
  
  const readingEl = document.querySelector("#logicReading");
  if (readingEl) readingEl.textContent = readings[op];
  
  const rows = [true, false].flatMap((pv) => [true, false].map((qv) => [pv, qv, evalLogic(pv, qv, op)]));
  const tableEl = document.querySelector("#truthTable");
  if (tableEl) {
    tableEl.innerHTML = `
      <thead><tr><th>${inlineMath("p")}</th><th>${inlineMath("q")}</th><th>${inlineMath(logicSymbolLatex(op))}</th></tr></thead>
      <tbody>${rows.map((row) => `<tr><td>${inlineMath(boolTex(row[0]))}</td><td>${inlineMath(boolTex(row[1]))}</td><td>${inlineMath(boolTex(row[2]))}</td></tr>`).join("")}</tbody>
    `;
    renderMath(tableEl);
  }
}

function evalLogic(p, q, op) {
  if (op === "and") return p && q;
  if (op === "or") return p || q;
  if (op === "implies") return !p || q;
  return p === q;
}

function logicSymbol(op) {
  return { and: "^", or: "v", implies: "->", iff: "<->" }[op];
}

function boolText(value) {
  return value ? "V" : "F";
}

function logicSymbolLatex(op) {
  return { and: "\\land", or: "\\lor", implies: "\\to", iff: "\\leftrightarrow" }[op];
}

function boolTex(value) {
  return value ? "\\mathrm{V}" : "\\mathrm{F}";
}

function renderSetsLab(root) {
  root.innerHTML = `
    <div class="lab-controls">
      <div class="field">
        <label for="setOperation">Operacion</label>
        <select id="setOperation">
          <option value="union">A union B</option>
          <option value="intersection">A interseccion B</option>
          <option value="difference">A - B</option>
          <option value="complement">Complemento de A</option>
          <option value="symmetric">Diferencia simetrica</option>
        </select>
      </div>
      <div class="output-box"><strong>A</strong><div class="math-line">${inlineMath("A=\\{1,2,3,5\\}")}</div></div>
      <div class="output-box"><strong>B</strong><div class="math-line">${inlineMath("B=\\{2,4,5,6\\}")}</div></div>
    </div>
    <div class="venn" aria-label="Diagrama de Venn">
      <span class="venn-label a">A</span>
      <span class="venn-label b">B</span>
      <span class="venn-circle a"></span>
      <span class="venn-circle b"></span>
      <div class="venn-items" id="vennItems"></div>
    </div>
    <div class="output-grid">
      <div class="output-box"><strong>Resultado</strong><div id="setResult" class="math-line"></div></div>
      <div class="output-box"><strong>Idea</strong><div id="setIdea"></div></div>
    </div>
  `;
  const el = document.querySelector("#setOperation");
  if (el) el.addEventListener("change", updateSetsLab);
  updateSetsLab();
  renderMath(root);
}

function updateSetsLab() {
  const elOp = document.querySelector("#setOperation");
  if (!elOp) return;

  const U = [1, 2, 3, 4, 5, 6, 7, 8];
  const A = [1, 2, 3, 5];
  const B = [2, 4, 5, 6];
  const op = elOp.value;
  const resultMap = {
    union: U.filter((x) => A.includes(x) || B.includes(x)),
    intersection: U.filter((x) => A.includes(x) && B.includes(x)),
    difference: U.filter((x) => A.includes(x) && !B.includes(x)),
    complement: U.filter((x) => !A.includes(x)),
    symmetric: U.filter((x) => A.includes(x) !== B.includes(x))
  };
  const ideas = {
    union: "Todo lo que está en A, en B o en ambos.",
    intersection: "Solo lo que comparten A y B.",
    difference: "Lo que pertenece a A pero no a B.",
    complement: "Lo que está en el universo U pero no en A.",
    symmetric: "Lo que pertenece a uno de los dos conjuntos, pero no a ambos."
  };
  const result = resultMap[op];
  const labels = {
    union: "A\\cup B",
    intersection: "A\\cap B",
    difference: "A-B",
    complement: "A^{c}",
    symmetric: "A\\triangle B"
  };
  setMathHtml("#setResult", inlineMath(`${labels[op]}=\\{${result.join(",")}\\}`));
  
  const ideaEl = document.querySelector("#setIdea");
  if (ideaEl) ideaEl.textContent = ideas[op];
  
  const vennItemsEl = document.querySelector("#vennItems");
  if (vennItemsEl) {
    const positions = {
      1: { left: "95px", top: "105px" },
      3: { left: "135px", top: "140px" },
      2: { left: "195px", top: "85px" },
      5: { left: "195px", top: "135px" },
      4: { left: "255px", top: "105px" },
      6: { left: "295px", top: "140px" },
      7: { left: "375px", top: "85px" },
      8: { left: "375px", top: "140px" }
    };
    vennItemsEl.innerHTML = U.map((item) => {
      const pos = positions[item];
      const style = pos ? `position: absolute; left: ${pos.left}; top: ${pos.top}; transform: translate(-50%, -50%); margin: 0; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; font-weight: bold;` : "";
      return `<span class="set-token ${result.includes(item) ? "active" : ""}" style="${style}">${item}</span>`;
    }).join("");
  }
}

function renderStringsLab(root) {
  root.innerHTML = `
    <div class="lab-controls">
      <div class="field">
        <label for="stringInput">Cadena</label>
        <input id="stringInput" value="sistema" />
      </div>
      <div class="field">
        <label for="languageRule">Lenguaje a validar</label>
        <select id="languageRule">
          <option value="binaryTwoOnes">Binaria con exactamente dos 1</option>
          <option value="studentCode">UNI-AAAA-NNN</option>
          <option value="productCode">CAT-AAA-999</option>
        </select>
      </div>
      <div class="field">
        <label for="powerInput">Potencia n</label>
        <input id="powerInput" type="number" min="1" max="5" value="2" />
      </div>
    </div>
    <div class="string-preview">
      <div class="output-box"><strong>Longitud</strong><div id="stringLength" class="math-line"></div></div>
      <div class="output-box"><strong>Reversa</strong><div id="stringReverse" class="math-line"></div></div>
      <div class="output-box"><strong>Potencia</strong><div id="stringPower" class="math-line"></div></div>
    </div>
    <div class="output-grid">
      <div class="output-box"><strong>Prefijos propios</strong><div id="prefixes" class="math-line"></div></div>
      <div class="output-box"><strong>Validacion</strong><div id="languageValidation"></div></div>
    </div>
  `;
  ["stringInput", "languageRule", "powerInput"].forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.addEventListener("input", updateStringsLab);
  });
  updateStringsLab();
  renderMath(root);
}

function updateStringsLab() {
  const elInput = document.querySelector("#stringInput");
  const elRule = document.querySelector("#languageRule");
  const elPower = document.querySelector("#powerInput");
  if (!elInput || !elRule || !elPower) return;

  const value = elInput.value.trim();
  const power = Math.max(1, Math.min(5, Number(elPower.value) || 1));
  const rule = elRule.value;
  const prefixes = Array.from({ length: Math.max(0, value.length - 1) }, (_, i) => value.slice(0, i + 1));
  setMathHtml("#stringLength", inlineMath(`|w|=${value.length}`));
  
  const revEl = document.querySelector("#stringReverse");
  if (revEl) {
    revEl.innerHTML = `${inlineMath("w^R=")} <code>${escapeHtml(value.split("").reverse().join("") || "lambda")}</code>`;
  }
  
  const powEl = document.querySelector("#stringPower");
  if (powEl) {
    powEl.innerHTML = `${inlineMath(`w^{${power}}=`)} <code>${escapeHtml(value.repeat(power) || "lambda")}</code>`;
  }
  
  const prefEl = document.querySelector("#prefixes");
  if (prefEl) {
    prefEl.innerHTML = prefixes.length
      ? prefixes.map((prefix) => `<code>${escapeHtml(prefix)}</code>`).join(", ")
      : inlineMath("\\lambda");
  }
  
  const validators = {
    binaryTwoOnes: {
      test: /^[01]*$/.test(value) && (value.match(/1/g) || []).length === 2,
      label: `Debe usar solo ${inlineMath("0/1")} y contener exactamente dos ${inlineMath("1")}.`
    },
    studentCode: {
      test: /^UNI-[A-Z]{4}-[0-9]{3}$/.test(value),
      label: `Formato esperado: <code>UNI-AAAA-NNN</code>.`
    },
    productCode: {
      test: /^CAT-[A-Z]{3}-[0-9]{3}$/.test(value),
      label: `Formato esperado: <code>CAT-AAA-999</code>.`
    }
  };
  const selected = validators[rule];
  
  const valEl = document.querySelector("#languageValidation");
  if (valEl) {
    valEl.innerHTML = `<span class="pill">${selected.test ? "Cadena válida" : "Cadena inválida"}</span><p>${selected.label}</p>`;
  }
  
  const labRoot = document.querySelector("#labRoot");
  if (labRoot) renderMath(labRoot);
}

function renderProbabilityLab(root) {
  root.innerHTML = `
    <div class="lab-controls">
      <div class="field">
        <label for="experimentSelect">Experimento</label>
        <select id="experimentSelect">
          <option value="die">Lanzar un dado</option>
          <option value="coin">Lanzar una moneda</option>
          <option value="twoCoins">Lanzar dos monedas</option>
        </select>
      </div>
      <div class="field">
        <label for="eventSelect">Evento</label>
        <select id="eventSelect"></select>
      </div>
      <div class="output-box"><strong>Probabilidad</strong><div id="probabilityResult" class="math-line"></div></div>
    </div>
    <div class="output-grid">
      <div class="output-box"><strong>Espacio muestral S</strong><div id="sampleSpace" class="token-row"></div></div>
      <div class="output-box"><strong>Evento E</strong><div id="eventSpace" class="token-row"></div></div>
    </div>
  `;
  
  const expEl = document.querySelector("#experimentSelect");
  if (expEl) {
    expEl.addEventListener("change", () => {
      populateEvents();
      updateProbabilityLab();
    });
  }
  
  const evtEl = document.querySelector("#eventSelect");
  if (evtEl) {
    evtEl.addEventListener("change", updateProbabilityLab);
  }
  
  populateEvents();
  updateProbabilityLab();
  renderMath(root);
}

function getExperiments() {
  return {
    die: {
      S: ["1", "2", "3", "4", "5", "6"],
      events: {
        five: ["Obtener 5", ["5"]],
        greaterThree: ["Numero mayor que 3", ["4", "5", "6"]],
        divisibleThree: ["Divisible por 3", ["3", "6"]]
      }
    },
    coin: {
      S: ["Cara", "Sello"],
      events: {
        heads: ["Obtener cara", ["Cara"]],
        tails: ["Obtener sello", ["Sello"]]
      }
    },
    twoCoins: {
      S: ["CC", "CS", "SC", "SS"],
      events: {
        oneHead: ["Al menos una cara", ["CC", "CS", "SC"]],
        same: ["Resultados iguales", ["CC", "SS"]],
        oneTail: ["Exactamente un sello", ["CS", "SC"]]
      }
    }
  };
}

function populateEvents() {
  const experimentSelect = document.querySelector("#experimentSelect");
  const eventSelect = document.querySelector("#eventSelect");
  if (!experimentSelect || !eventSelect) return;
  
  const experimentKey = experimentSelect.value;
  const experiment = getExperiments()[experimentKey];
  if (!experiment) return;
  
  eventSelect.innerHTML = Object.entries(experiment.events)
    .map(([key, [label]]) => `<option value="${key}">${label}</option>`)
    .join("");
}

function updateProbabilityLab() {
  const experimentSelect = document.querySelector("#experimentSelect");
  const eventSelect = document.querySelector("#eventSelect");
  if (!experimentSelect || !eventSelect) return;
  
  const experimentKey = experimentSelect.value;
  const eventKey = eventSelect.value;
  if (!experimentKey || !eventKey) return;
  
  const experiment = getExperiments()[experimentKey];
  if (!experiment || !experiment.events[eventKey]) return;
  
  const event = experiment.events[eventKey][1];
  const sampleSpaceEl = document.querySelector("#sampleSpace");
  const eventSpaceEl = document.querySelector("#eventSpace");
  
  if (sampleSpaceEl) {
    sampleSpaceEl.innerHTML = experiment.S.map((item) => `<span class="sample-token ${event.includes(item) ? "active" : ""}">${item}</span>`).join("");
  }
  if (eventSpaceEl) {
    eventSpaceEl.innerHTML = event.map((item) => `<span class="sample-token active">${item}</span>`).join("");
  }
  setMathHtml(
    "#probabilityResult",
    inlineMath(`P(E)=\\frac{${event.length}}{${experiment.S.length}}=${(event.length / experiment.S.length).toFixed(3)}`)
  );
}

function renderBinomialLab(root) {
  root.innerHTML = `
    <div class="lab-controls">
      <div class="field">
        <label for="binomialN">Ensayos n</label>
        <input id="binomialN" type="number" min="1" max="20" value="6" />
      </div>
      <div class="field">
        <label for="binomialP">Exito p</label>
        <input id="binomialP" type="number" min="0" max="1" step="0.01" value="0.5" />
      </div>
      <div class="field">
        <label for="binomialK">Exitos k</label>
        <input id="binomialK" type="number" min="0" max="20" value="3" />
      </div>
    </div>
    <div class="output-grid">
      <div class="output-box"><strong>Formula aplicada</strong><div id="binomialFormula" class="math-line"></div></div>
      <div class="output-box"><strong>Resultado</strong><div id="binomialResult" class="math-line"></div></div>
    </div>
    <div id="binomialBars" class="bar-chart" aria-label="Distribucion binomial"></div>
  `;
  
  ["binomialN", "binomialP", "binomialK"].forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.addEventListener("input", updateBinomialLab);
  });
  updateBinomialLab();
  renderMath(root);
}

function updateBinomialLab() {
  const elN = document.querySelector("#binomialN");
  const elP = document.querySelector("#binomialP");
  const elK = document.querySelector("#binomialK");
  if (!elN || !elP || !elK) return;
  
  const n = clamp(Number(elN.value) || 1, 1, 20);
  const p = clamp(Number(elP.value) || 0, 0, 1);
  const k = clamp(Number(elK.value) || 0, 0, n);
  elK.max = String(n);
  const probability = binomial(n, k, p);
  const q = (1 - p).toFixed(2);
  setMathHtml("#binomialFormula", inlineMath(`\\binom{${n}}{${k}}(${p})^{${k}}(${q})^{${n - k}}`));
  setMathHtml("#binomialResult", inlineMath(`P(X=${k})=${probability.toFixed(5)}\\approx ${(probability * 100).toFixed(2)}\\%`));
  
  const values = Array.from({ length: n + 1 }, (_, i) => binomial(n, i, p));
  const max = Math.max(...values);
  
  const barsEl = document.querySelector("#binomialBars");
  if (barsEl) {
    barsEl.innerHTML = values
      .map((value, i) => `<div class="bar"><span style="height:${Math.max(4, (value / max) * 120)}px; ${i === k ? "background: var(--accent);" : ""}"></span><span>${i}</span></div>`)
      .join("");
  }
}

function binomial(n, k, p) {
  return combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function combination(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
  return result;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function renderGraphLab(root) {
  root.innerHTML = `
    <div class="lab-controls">
      <div class="field">
        <label for="graphSelect">Grafo</label>
        <select id="graphSelect">
          <option value="cycle">Ciclo C4</option>
          <option value="path">Camino P4</option>
          <option value="star">Estrella K1,4</option>
        </select>
      </div>
      <div class="output-box"><strong>Clasificacion</strong><div id="graphClassification"></div></div>
      <div class="output-box"><strong>Grados</strong><div id="graphDegrees" class="math-line"></div></div>
    </div>
    <div class="graph-wrap">
      <svg id="graphCanvas" class="graph-canvas" viewBox="0 0 420 280" role="img" aria-label="Grafo interactivo"></svg>
      <div class="graph-facts">
        <div class="output-box"><strong>Lista de adyacencia</strong><div id="adjacencyList" class="math-line"></div></div>
        <div class="output-box"><strong>Matriz</strong><div id="adjacencyMatrix"></div></div>
      </div>
    </div>
  `;
  const el = document.querySelector("#graphSelect");
  if (el) el.addEventListener("change", updateGraphLab);
  updateGraphLab();
  renderMath(root);
}

function getGraphs() {
  return {
    cycle: {
      nodes: ["A", "B", "C", "D"],
      positions: { A: [90, 70], B: [320, 70], C: [320, 210], D: [90, 210] },
      edges: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]],
      classification: "Todos los vertices tienen grado 2: tiene ciclo euleriano y ciclo hamiltoniano."
    },
    path: {
      nodes: ["A", "B", "C", "D"],
      positions: { A: [60, 140], B: [170, 80], C: [280, 200], D: [370, 120] },
      edges: [["A", "B"], ["B", "C"], ["C", "D"]],
      classification: "Tiene exactamente dos vertices de grado impar: posee camino euleriano, no ciclo euleriano."
    },
    star: {
      nodes: ["A", "B", "C", "D", "E"],
      positions: { A: [210, 140], B: [210, 42], C: [340, 140], D: [210, 238], E: [80, 140] },
      edges: [["A", "B"], ["A", "C"], ["A", "D"], ["A", "E"]],
      classification: "El centro tiene grado 4 y las hojas grado 1: no tiene camino euleriano."
    }
  };
}

function updateGraphLab() {
  const elSelect = document.querySelector("#graphSelect");
  if (!elSelect) return;
  
  const graph = getGraphs()[elSelect.value];
  if (!graph) return;
  
  const adjacency = Object.fromEntries(graph.nodes.map((node) => [node, []]));
  graph.edges.forEach(([a, b]) => {
    adjacency[a].push(b);
    adjacency[b].push(a);
  });
  
  const classEl = document.querySelector("#graphClassification");
  if (classEl) classEl.textContent = graph.classification;
  
  setMathHtml("#graphDegrees", graph.nodes.map((node) => inlineMath(`d(${node})=${adjacency[node].length}`)).join(" "));
  
  const adjListEl = document.querySelector("#adjacencyList");
  if (adjListEl) {
    adjListEl.innerHTML = graph.nodes
      .map((node) => `${inlineMath(`${node}\\to\\{${adjacency[node].join(",") || "\\varnothing"}\\}`)}`)
      .join("<br>");
  }
  
  const adjMatrixEl = document.querySelector("#adjacencyMatrix");
  if (adjMatrixEl) adjMatrixEl.innerHTML = renderMatrix(graph.nodes, adjacency);
  
  const svg = document.querySelector("#graphCanvas");
  if (svg) {
    svg.innerHTML = `
      ${graph.edges.map(([a, b]) => {
        const [x1, y1] = graph.positions[a];
        const [x2, y2] = graph.positions[b];
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f766e" stroke-width="5" stroke-linecap="round" />`;
      }).join("")}
      ${graph.nodes.map((node) => {
        const [x, y] = graph.positions[node];
        return `<g><circle cx="${x}" cy="${y}" r="23" fill="#fff" stroke="#d97706" stroke-width="5"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="18" font-weight="800" fill="#17211b">${node}</text></g>`;
      }).join("")}
    `;
  }
  
  const labRoot = document.querySelector("#labRoot");
  if (labRoot) renderMath(labRoot);
}

function renderMatrix(nodes, adjacency) {
  const rows = nodes
    .map((rowNode) => `<tr><th>${inlineMath(rowNode)}</th>${nodes.map((colNode) => `<td>${adjacency[rowNode].includes(colNode) ? 1 : 0}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="matrix-table"><thead><tr><th></th>${nodes.map((node) => `<th>${inlineMath(node)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}

// Evaluacion final integradora. Reutiliza createQuestionCard y calcula
// porcentaje con base en las respuestas persistidas.
function renderFinalEvaluation() {
  toggleSidebar(true);
  setHeroVisibility(false);
  currentView = "final";
  appView.innerHTML = `
    <div class="final-grid">
      <section class="final-panel">
        <div class="section-heading">
          <h3>Evaluacion final</h3>
          <button type="button" class="secondary-button" id="backFromFinal">Volver</button>
        </div>
        <div id="finalQuestions"></div>
      </section>
      <aside class="score-box">
        <span class="pill">resultado</span>
        <span class="score-number" id="finalScore">${state.finalScore ?? 0}%</span>
        <button type="button" class="primary-button" id="gradeFinal">Calificar</button>
        
        <div id="certificateArea"></div>
        
        <ul class="summary-list">
          ${modules.map((module) => `<li><span>${module.title}</span><strong>${state.completed[module.id] ? "OK" : "Pendiente"}</strong></li>`).join("")}
        </ul>
      </aside>
    </div>
  `;
  const root = document.querySelector("#finalQuestions");
  finalQuestions.forEach((question) => root.appendChild(createQuestionCard(question, question.id, updateFinalScorePreview)));
  document.querySelector("#backFromFinal").addEventListener("click", () => {
    playSound("nav");
    renderOverview();
  });
  document.querySelector("#gradeFinal").addEventListener("click", gradeFinal);
  
  const passed = state.finalScore !== null && state.finalScore >= 80;
  if (passed) {
    showCertificateForm();
  }
  
  renderNav();
  renderMath(appView);
}

function updateFinalScorePreview() {
  const answered = finalQuestions.filter((question) => state.finalAnswers[question.id] !== undefined).length;
  document.querySelector("#finalScore").textContent = `${answered}/${finalQuestions.length}`;
}

function gradeFinal() {
  const correct = finalQuestions.reduce((total, question) => total + (state.finalAnswers[question.id] === question.answer ? 1 : 0), 0);
  state.finalScore = Math.round((correct / finalQuestions.length) * 100);
  saveState();
  document.querySelector("#finalScore").textContent = `${state.finalScore}%`;
  if (state.finalScore >= 80) {
    playSound("complete");
    celebrate("Evaluacion superada");
    showCertificateForm();
  } else {
    playSound("wrong");
    const area = document.querySelector("#certificateArea");
    if (area) area.innerHTML = "";
  }
}

// Muestra el formulario para ingresar nombre y apellido del estudiante
function showCertificateForm() {
  const area = document.querySelector("#certificateArea");
  if (!area) return;
  
  area.innerHTML = `
    <div class="certificate-form" style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--line); display: flex; flex-direction: column; gap: 10px;">
      <span class="pill" style="background: var(--good); color: #fff; width: fit-content; padding: 2px 10px; font-size: 0.78rem;">¡Felicidades!</span>
      <p style="margin: 0; font-size: 0.88rem; color: var(--muted); line-height: 1.45;">Has aprobado la evaluación con <strong>${state.finalScore}%</strong>. Registra tus datos para ver tu certificado:</p>
      <div class="field" style="gap: 4px;">
        <label for="certStudentName" style="font-size: 0.78rem; font-weight: 800;">Nombre y Apellido</label>
        <input type="text" id="certStudentName" placeholder="Ej. Gabriel Gómez" style="min-height: 38px; border-radius: var(--radius); padding: 6px 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink);" />
      </div>
      <button type="button" class="primary-button" id="generateCertBtn" style="width: 100%; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Ver Certificado
      </button>
    </div>
  `;
  
  const input = area.querySelector("#certStudentName");
  const btn = area.querySelector("#generateCertBtn");
  
  const savedName = localStorage.getItem("ova-student-name") || "";
  if (savedName) input.value = savedName;
  
  btn.addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) {
      playSound("wrong");
      showCustomAlert("Por favor, ingresa tu nombre y apellido para generar el certificado.");
      return;
    }
    
    localStorage.setItem("ova-student-name", name);
    playSound("complete");
    showCertificateModal(name);
  });
}

// Despliega el certificado digital interactivo e imprimible en un modal
function showCertificateModal(name) {
  const overlay = document.createElement("div");
  overlay.className = "ova-cert-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('es-ES', options);
  
  overlay.innerHTML = `
    <div class="ova-cert-card">
      <img src="./resoucers/logo_institucional.png" alt="Universidad Simón Bolívar" class="ova-cert-logo" />
      <span class="ova-cert-eyebrow">Certificado de Aprobación</span>
      <h2 class="ova-cert-title">Certificado de Finalización</h2>
      <p class="ova-cert-subtitle">Otorgado con orgullo por la excelencia académica</p>
      
      <p style="margin: 0 0 4px; font-size: 0.94rem; color: #556c64; text-transform: uppercase; letter-spacing: 0.08em;">Este documento certifica que:</p>
      <div class="ova-cert-name">${escapeHtml(name)}</div>
      
      <p class="ova-cert-body">
        Ha completado y aprobado satisfactoriamente todos los módulos interactivos del 
        <strong>Objeto Virtual de Aprendizaje (OVA) de Matemáticas Discretas para Ingeniería de Sistemas</strong> 
        desarrollado para la <strong>Universidad Simón Bolívar</strong>, habiendo superado con éxito las evaluaciones y la prueba integradora final con un puntaje de <strong>${state.finalScore}%</strong>.
      </p>
      
      <div class="ova-cert-footer-row">
        <div class="ova-cert-signature">
          <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 1.1rem; color: #006b3f; margin-bottom: 2px;">Simón Bolívar</div>
          <div class="ova-cert-signature-line"></div>
          <span class="ova-cert-signature-name">Área Pedagógica</span>
          <span class="ova-cert-signature-role">OVA Matemáticas Discretas</span>
        </div>
        
        <div class="ova-cert-badge">
          <span>USB</span>
        </div>
        
        <div class="ova-cert-signature">
          <div style="font-size: 0.82rem; color: #073b2e; margin-bottom: 8px; font-weight: bold;">${formattedDate}</div>
          <div class="ova-cert-signature-line"></div>
          <span class="ova-cert-signature-name">Fecha de Emisión</span>
          <span class="ova-cert-signature-role">Validez Digital</span>
        </div>
      </div>
      
      <div class="ova-cert-actions">
        <button type="button" class="secondary-button" id="closeCertBtn">Cerrar</button>
        <button type="button" class="primary-button" id="printCertBtn" style="background: var(--primary); border-color: var(--primary); color: #fff;">Imprimir / Guardar PDF</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.classList.add("active");
  
  const closeBtn = overlay.querySelector("#closeCertBtn");
  const printBtn = overlay.querySelector("#printCertBtn");
  
  function close() {
    overlay.classList.remove("active");
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
    });
  }
  
  closeBtn.addEventListener("click", () => {
    playSound("nav");
    close();
  });
  
  printBtn.addEventListener("click", () => {
    playSound("complete");
    window.print();
  });
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      playSound("nav");
      close();
    }
  });
}

// ==========================================================================
// Preferencias de interfaz: modo oscuro, pestañas y audiolibro TTS.
// Estas funciones viven al final porque conectan controles globales del DOM.
// ==========================================================================

const themeToggleButton = document.querySelector("#themeToggleButton");

// Tema visual persistente por navegador.
function initTheme() {
  const savedTheme = localStorage.getItem("ova-discretas-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (themeToggleButton) {
    themeToggleButton.textContent = savedTheme === "dark" ? "Modo claro" : "Modo oscuro";
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("ova-discretas-theme", newTheme);
  if (themeToggleButton) {
    themeToggleButton.textContent = newTheme === "dark" ? "Modo claro" : "Modo oscuro";
  }
  playSound("nav");
}

if (themeToggleButton) {
  themeToggleButton.addEventListener("click", toggleTheme);
}

// ==========================================================================
// Controlador de pestañas del módulo.
// Alterna paneles, detiene la voz activa y refresca laboratorios, juegos o
// playgrounds para evitar DOM obsoleto cuando el estudiante cambia de pestaña.
// ==========================================================================
function initModuleTabs(root) {
  // Selecciona todos los botones de pestañas y contenedores de contenido dentro del nodo raíz
  const tabs = root.querySelectorAll(".tab-button");
  const contents = root.querySelectorAll(".tab-content");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab; // Identifica a qué pestaña se hizo clic (theory, lab, activities, playground)
      
      // Detener cualquier lectura activa del sintetizador de voz (TTS) al cambiar de pestaña
      stopSpeaking();
      
      // Alterna las clases 'active' para que solo el botón y el panel seleccionado sean visibles
      tabs.forEach(t => t.classList.toggle("active", t === tab));
      contents.forEach(c => c.classList.toggle("active", c.id === `tab-${targetTab}`));
      
      // Sonido de navegación táctil
      playSound("nav");
      
      // REFRESCADO DENTRO DE PESTAÑAS ACTIVAS:
      // Esto previene que simuladores o minijuegos se queden con estados obsoletos
      if (targetTab === "lab") {
        renderLab(currentModuleId); // Recarga el simulador interactivo correspondiente
      } else if (targetTab === "activities") {
        renderGame(currentModuleId); // Recarga el minijuego del módulo
        const module = modules.find(m => m.id === currentModuleId);
        if (module) renderQuiz(module); // Recarga la autoevaluacion interactiva.
      } else if (targetTab === "playground") {
        // Inicializa y dibuja de inmediato el playground específico de esta sección
        renderModulePlayground(currentModuleId, root.querySelector("#modulePlaygroundRoot"));
      }
      
      // RE-RENDERIZADO DE FÓRMULAS LATEX:
      // Fuerza a MathJax a procesar de forma asíncrona cualquier ecuación matemática visible
      const activeContent = root.querySelector(`#tab-${targetTab}`);
      if (activeContent) {
        renderMath(activeContent);
      }
    });
  });
}

// Lógica de Voz (Text-to-Speech nativo)
let currentUtterance = null;
let currentTtsButton = null;

function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentTtsButton) {
    currentTtsButton.classList.remove("playing");
    currentTtsButton.setAttribute("aria-label", "Escuchar sección");
    currentTtsButton = null;
  }
  currentUtterance = null;
}

function speakText(text, button) {
  if (!state.soundOn) return;

  if (!window.speechSynthesis) {
    showCustomAlert("La síntesis de voz no es compatible con este navegador.");
    return;
  }

  if (button && currentTtsButton === button) {
    stopSpeaking();
    return;
  }

  stopSpeaking();

  const cleanText = text
    .replace(/\\\(|\\\)/g, "")
    .replace(/\\land/g, " y ")
    .replace(/\\lor/g, " o ")
    .replace(/\\to/g, " implica ")
    .replace(/\\leftrightarrow/g, " si y solo si ")
    .replace(/\\neg/g, " no ")
    .replace(/\\varnothing/g, " conjunto vacio ")
    .replace(/\\cap/g, " interseccion ")
    .replace(/\\cup/g, " union ")
    .replace(/\\subseteq/g, " subconjunto de ")
    .replace(/\\in/g, " pertenece a ")
    .replace(/<[^>]*>/g, "");

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "es-ES";

  utterance.onend = () => {
    stopSpeaking();
  };
  utterance.onerror = () => {
    stopSpeaking();
  };

  currentUtterance = utterance;
  if (button) {
    currentTtsButton = button;
    button.classList.add("playing");
    button.setAttribute("aria-label", "Detener lectura");
  }

  window.speechSynthesis.speak(utterance);
}

// Conecta los botones de narracion a fragmentos del modulo actual.
function bindTTS(root) {
  root.querySelectorAll("[data-tts]").forEach((button) => {
    button.addEventListener("click", () => {
      let textToRead = "";
      const type = button.dataset.tts;
      const section = button.closest("section, article, .example-box, .deep-dive, .study-card, .panel");
      if (!section) return;

      if (type === "concepts") {
        const title = section.querySelector("h3")?.textContent || "";
        const list = [...section.querySelectorAll(".concept-list li")].map(li => li.textContent).join(". ");
        textToRead = `${title}. ${list}`;
      } else if (type === "example") {
        textToRead = section.querySelector("p")?.textContent || section.textContent || "";
      } else if (type === "deepdive") {
        const title = section.querySelector("h3")?.textContent || "";
        const intro = section.querySelector("p")?.textContent || "";
        const list = [...section.querySelectorAll(".detail-list li")].map(li => li.textContent).join(". ");
        const app = section.querySelector(".system-use")?.textContent || "";
        textToRead = `${title}. ${intro}. ${list}. ${app}`;
      } else if (type === "systems-focus") {
        const title = section.querySelector("h3")?.textContent || "";
        const desc = section.querySelector(".systems-desc")?.textContent || "";
        const list = [...section.querySelectorAll(".systems-examples-list li")].map(li => li.textContent).join(". ");
        textToRead = `${title}. ${desc}. ${list}`;
      } else if (type === "lab-challenge") {
        const title = section.querySelector("h3")?.textContent || "";
        const body = [...section.querySelectorAll(".challenge-body p")].map(p => p.textContent).join(". ");
        textToRead = `${title}. ${body}`;
      } else if (type === "guide-def") {
        const title = section.querySelector("h4")?.textContent || "";
        const list = [...section.querySelectorAll(".definition-list div")].map(div => {
          const dt = div.querySelector("dt")?.textContent || "";
          const dd = div.querySelector("dd")?.textContent || "";
          return `${dt}: ${dd}`;
        }).join(". ");
        textToRead = `${title}. ${list}`;
      } else if (type === "guide-proc") {
        const title = section.querySelector("h4")?.textContent || "";
        const list = [...section.querySelectorAll(".step-list li")].map(li => li.textContent).join(". ");
        textToRead = `${title}. ${list}`;
      } else if (type === "guide-worked") {
        textToRead = section.querySelector("p")?.textContent || section.textContent || "";
      }

      speakText(textToRead, button);
    });
  });
}

function getLogicPlaygroundHtml() {
  return `
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="section-heading">
          <h3>Validador de Proposiciones</h3>
          <span class="pill">Lógica</span>
        </div>
        
        <div class="playground-input-area">
          <label for="playgroundLogicInput">Escribe tu proposición:</label>
          <div class="playground-input-row" style="display: flex; gap: 8px; margin-top: 6px;">
            <input type="text" id="playgroundLogicInput" value="(p & ~q) | (q & ~p)" placeholder="Ej: (p & ~q) | r" style="width: 100%; font-family: monospace; font-size: 1.1rem; padding: 10px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
            <button type="button" class="primary-button" id="playgroundLogicEvaluateBtn">Evaluar</button>
          </div>
          
          <div class="playground-keyboard" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">
            <button type="button" class="secondary-button chip-button" data-symbol="p">p</button>
            <button type="button" class="secondary-button chip-button" data-symbol="q">q</button>
            <button type="button" class="secondary-button chip-button" data-symbol="r">r</button>
            <button type="button" class="secondary-button chip-button" data-symbol=" & ">&and; (Y)</button>
            <button type="button" class="secondary-button chip-button" data-symbol=" | ">&or; (O)</button>
            <button type="button" class="secondary-button chip-button" data-symbol=" ~ ">&not; (NO)</button>
            <button type="button" class="secondary-button chip-button" data-symbol=" -> ">&rarr; (Implica)</button>
            <button type="button" class="secondary-button chip-button" data-symbol=" <-> ">&harr; (Equivale)</button>
            <button type="button" class="secondary-button chip-button" data-symbol="(">(</button>
            <button type="button" class="secondary-button chip-button" data-symbol=")">)</button>
            <button type="button" class="secondary-button chip-button" id="playgroundLogicClear" style="border-color: var(--bad); color: var(--bad); background: transparent;">Limpiar</button>
          </div>
        </div>

        <div id="playgroundLogicError" class="playground-error hidden" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid var(--bad); color: var(--bad); padding: 12px; border-radius: 6px; margin-top: 14px; font-weight: bold;"></div>

        <div class="output-grid" style="margin-top: 20px;">
          <div class="output-box"><strong>Fórmula en LaTeX</strong><div id="playgroundLogicLatex" class="math-line"></div></div>
          <div class="output-box"><strong>Clasificación</strong><div id="playgroundLogicClass" style="font-weight: bold; font-size: 1.1rem; color: var(--primary);"></div></div>
        </div>

        <div class="table-container" style="overflow-x: auto; margin-top: 18px;">
          <table class="truth-table" id="playgroundLogicTable" aria-label="Tabla de verdad generada" style="width: 100%;"></table>
        </div>
      </section>

      <article class="panel lab-challenge-panel">
        <div class="section-heading">
          <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--accent);"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> ¿Cómo usar el Validador?</h3>
        </div>
        <div class="challenge-body">
          <div class="challenge-step">
            <strong>💡 Instrucciones de Uso:</strong>
            <p>1. Usa las letras <strong>p</strong>, <strong>q</strong>, y <strong>r</strong> como tus proposiciones lógicas simples.</p>
            <p>2. Agrega conectores usando los botones del teclado interactivo en pantalla o escribe directamente:</p>
            <ul style="margin: 4px 0 0; padding-left: 20px; font-size: 0.88rem; color: var(--muted);">
              <li>Negación: <code>~</code> (ej: <code>~p</code>)</li>
              <li>Conjunción (Y): <code>&</code> (ej: <code>p & q</code>)</li>
              <li>Disyunción (O): <code>|</code> (ej: <code>p | q</code>)</li>
              <li>Condicional (implica): <code>-></code> (ej: <code>p -> q</code>)</li>
              <li>Bicondicional (equivale): <code>&lt;-&gt;</code> (ej: <code>p &lt;-&gt; q</code>)</li>
            </ul>
          </div>
          <div class="challenge-step" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>⚠️ Limitaciones Técnicas:</strong>
            <p>Soporta un máximo de <strong>3 variables proposicionales</strong> (\\(p, q, r\\)), lo que genera tablas de hasta \\(2^3 = 8\\) filas de combinaciones de verdad. Expresiones mal formadas o con paréntesis impares dispararán una alerta de error controlada.</p>
          </div>
          <div class="challenge-mission" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>🎯 Pruebas Sugeridas:</strong>
            <p>• Tautología clásica: <code>(p &amp; (p -&gt; q)) -&gt; q</code></p>
            <p>• Ley de De Morgan: <code>~(p &amp; q) &lt;-&gt; (~p | ~q)</code></p>
            <p>• Contradicción clásica: <code>p &amp; ~p</code></p>
          </div>
        </div>
      </article>
    </div>
  `;
}

function getSetsPlaygroundHtml() {
  return `
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="section-heading">
          <h3>Validador de Conjuntos</h3>
          <span class="pill">Conjuntos</span>
        </div>

        <div class="playground-input-area" style="display: grid; gap: 12px;">
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundSetsUInput" style="font-weight: 700; font-size: 0.9rem;">Conjunto Universal U (separado por comas):</label>
            <input type="text" id="playgroundSetsUInput" value="1, 2, 3, 4, 5, 6, 7, 8" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundSetsAInput" style="font-weight: 700; font-size: 0.9rem;">Conjunto A (separado por comas):</label>
            <input type="text" id="playgroundSetsAInput" value="1, 2, 3, 5" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundSetsBInput" style="font-weight: 700; font-size: 0.9rem;">Conjunto B (separado por comas):</label>
            <input type="text" id="playgroundSetsBInput" value="2, 4, 5, 6" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundSetsOp" style="font-weight: 700; font-size: 0.9rem;">Operación Relacional:</label>
            <select id="playgroundSetsOp" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);">
              <option value="union">Unión (A ∪ B)</option>
              <option value="intersection">Intersección (A ∩ B)</option>
              <option value="difference">Diferencia (A - B)</option>
              <option value="complement">Complemento (A^c)</option>
              <option value="symmetric">Diferencia Simétrica (A Δ B)</option>
            </select>
          </div>
          <button type="button" class="primary-button" id="playgroundSetsEvaluateBtn" style="margin-top: 6px;">Evaluar Operación</button>
        </div>

        <div id="playgroundSetsError" class="playground-error hidden" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid var(--bad); color: var(--bad); padding: 12px; border-radius: 6px; margin-top: 14px; font-weight: bold;"></div>

        <div class="venn" aria-label="Diagrama de Venn Dinámico" style="margin-top: 20px;">
          <span class="venn-label a">A</span>
          <span class="venn-label b">B</span>
          <span class="venn-circle a"></span>
          <span class="venn-circle b"></span>
          <div class="venn-items" id="playgroundSetsVennRoot"></div>
        </div>

        <div class="output-grid" style="margin-top: 20px;">
          <div class="output-box"><strong>Resultado</strong><div id="playgroundSetsResult" class="math-line"></div></div>
          <div class="output-box"><strong>Idea</strong><div id="playgroundSetsIdea"></div></div>
        </div>
      </section>

      <article class="panel lab-challenge-panel">
        <div class="section-heading">
          <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--accent);"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Conjuntos Libres</h3>
        </div>
        <div class="challenge-body">
          <div class="challenge-step">
            <strong>💡 Instrucciones de Uso:</strong>
            <p>1. Ingresa los elementos del Universo (\\(U\\)), conjunto \\(A\\) y conjunto \\(B\\) separados por comas.</p>
            <p>2. Selecciona la operación que desees evaluar en la lista desplegable y haz clic en "Evaluar Operación".</p>
          </div>
          <div class="challenge-step" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>⚠️ Limitaciones Técnicas:</strong>
            <p>Cualquier elemento ingresado en \\(A\\) o \\(B\\) que no esté en \\(U\\) será agregado automáticamente al Universo. Para evitar solapamiento visual de tokens en el Diagrama de Venn SVG, se recomienda un límite máximo sugerido de <strong>12 elementos</strong> en \\(U\\).</p>
          </div>
          <div class="challenge-mission" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>🎯 Pruebas Sugeridas:</strong>
            <p>• Números tradicionales: \\(U=\\{1,2,3,4,5,6,7,8\\}\\), \\(A=\\{1,2,3,5\\}\\), \\(B=\\{2,4,5,6\\}\\) con intersección.</p>
            <p>• Letras y caracteres: \\(U=\\{a,b,c,d,e\\}\\), \\(A=\\{a,b,c\\}\\), \\(B=\\{c,d\\}\\) con diferencia simétrica.</p>
          </div>
        </div>
      </article>
    </div>
  `;
}

function getStringsPlaygroundHtml() {
  return `
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="section-heading">
          <h3>Validador de Cadenas</h3>
          <span class="pill">Cadenas</span>
        </div>

        <div class="playground-input-area" style="display: grid; gap: 12px;">
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundStringInput" style="font-weight: 700; font-size: 0.9rem;">Ingresa una cadena de texto (w):</label>
            <input type="text" id="playgroundStringInput" value="sistemas" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundStringPowerInput" style="font-weight: 700; font-size: 0.9rem;">Potencia (n):</label>
            <input type="number" id="playgroundStringPowerInput" min="1" max="5" value="3" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <button type="button" class="primary-button" id="playgroundStringEvaluateBtn" style="margin-top: 6px;">Evaluar Cadena</button>
        </div>

        <div class="string-preview" style="margin-top: 20px;">
          <div class="output-box"><strong>Longitud |w|</strong><div id="playgroundStringLength" class="math-line"></div></div>
          <div class="output-box"><strong>Reversa w^R</strong><div id="playgroundStringReverse" class="math-line"></div></div>
          <div class="output-box"><strong>Potencia w^n</strong><div id="playgroundStringPower" class="math-line"></div></div>
        </div>

        <div class="output-grid" style="margin-top: 16px;">
          <div class="output-box"><strong>Prefijos propios</strong><div id="playgroundStringPrefixes" class="math-line" style="line-height: 1.5;"></div></div>
          <div class="output-box"><strong>Sufijos propios</strong><div id="playgroundStringSuffixes" class="math-line" style="line-height: 1.5;"></div></div>
        </div>
        <div class="output-box" style="margin-top: 14px;"><strong>Subcadenas únicas detectadas</strong><div id="playgroundStringSubstrings" class="math-line" style="line-height: 1.7; font-size: 0.9rem;"></div></div>
      </section>

      <article class="panel lab-challenge-panel">
        <div class="section-heading">
          <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--accent);"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Cadenas y Lenguajes</h3>
        </div>
        <div class="challenge-body">
          <div class="challenge-step">
            <strong>💡 Instrucciones de Uso:</strong>
            <p>1. Ingresa la cadena de caracteres \\(w\\) que deseas estudiar.</p>
            <p>2. Define la potencia entera \\(n\\) (exponente de repetición) y haz clic en "Evaluar Cadena".</p>
          </div>
          <div class="challenge-step" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>⚠️ Limitaciones Técnicas:</strong>
            <p>Si dejas la entrada en blanco, el sistema la interpretará automáticamente como la cadena vacía formal <strong>\\(\\lambda\\) (lambda)</strong>, cuya longitud es 0. El exponente de potencia está limitado a un rango de <strong>1 a 5</strong> por razones de rendimiento del navegador.</p>
          </div>
          <div class="challenge-mission" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>🎯 Pruebas Sugeridas:</strong>
            <p>• Palabra capicúa (Palíndromo): Escribe <code>reconocer</code> o <code>radar</code> y evalúa.</p>
            <p>• Potencia de texto: Escribe <code>abc</code> con potencia <code>3</code>.</p>
            <p>• Cadena vacía: Limpia todo el campo de entrada y presiona evaluar.</p>
          </div>
        </div>
      </article>
    </div>
  `;
}

function getProbabilityPlaygroundHtml() {
  return `
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="section-heading">
          <h3>Validador de Probabilidad</h3>
          <span class="pill">Probabilidad</span>
        </div>

        <div class="playground-input-area" style="display: grid; gap: 12px;">
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundProbSInput" style="font-weight: 700; font-size: 0.9rem;">Espacio Muestral S (separado por comas):</label>
            <input type="text" id="playgroundProbSInput" value="1, 2, 3, 4, 5, 6" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundProbEInput" style="font-weight: 700; font-size: 0.9rem;">Evento Favorables E (separado por comas, deben estar en S):</label>
            <input type="text" id="playgroundProbEInput" value="2, 4, 6" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <button type="button" class="primary-button" id="playgroundProbEvaluateBtn" style="margin-top: 6px;">Calcular Probabilidad</button>
        </div>

        <div id="playgroundProbError" class="playground-error hidden" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid var(--bad); color: var(--bad); padding: 12px; border-radius: 6px; margin-top: 14px; font-weight: bold;"></div>

        <div class="output-grid" style="margin-top: 20px;">
          <div class="output-box"><strong>Espacio Muestral S</strong><div id="playgroundProbSampleSpace" class="token-row"></div></div>
          <div class="output-box"><strong>Evento E</strong><div id="playgroundProbEventSpace" class="token-row"></div></div>
        </div>

        <div class="output-box" style="margin-top: 14px;"><strong>Probabilidad de E: P(E)</strong><div id="playgroundProbResult" class="math-line" style="font-size: 1.2rem; color: var(--primary);"></div></div>
      </section>

      <article class="panel lab-challenge-panel">
        <div class="section-heading">
          <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--accent);"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Probabilidad Discreta</h3>
        </div>
        <div class="challenge-body">
          <div class="challenge-step">
            <strong>💡 Instrucciones de Uso:</strong>
            <p>1. Ingresa los resultados posibles del Espacio Muestral (\\(S\\)) separados por comas.</p>
            <p>2. Ingresa los elementos que representan el evento favorable (\\(E\\)) de interés.</p>
            <p>3. Haz clic en "Calcular Probabilidad" para evaluar según la definición clásica de Laplace.</p>
          </div>
          <div class="challenge-step" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>⚠️ Limitaciones Técnicas:</strong>
            <p>Todos los elementos declarados en el evento favorable \\(E\\) deben pertenecer estrictamente al espacio muestral \\(S\\). Si ingresas un elemento ajeno a \\(S\\), el sistema mostrará un error visual de validación controlado y reproducirá una campana de advertencia.</p>
          </div>
          <div class="challenge-mission" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>🎯 Pruebas Sugeridas:</strong>
            <p>• Moneda clásica: \\(S=\\{\\text{cara}, \\text{sello}\\}\\), \\(E=\\{\\text{cara}\\}\\) yielding \\(0.50\\) (\\(50.0\%\\)).</p>
            <p>• Lanzamiento de dado (números pares): \\(S=\\{1,2,3,4,5,6\\}\\), \\(E=\\{2,4,6\\}\\) yielding \\(0.50\\) (\\(50.0\%\\)).</p>
          </div>
        </div>
      </article>
    </div>
  `;
}

function getBinomialPlaygroundHtml() {
  return `
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="section-heading">
          <h3>Validador de Binomial</h3>
          <span class="pill">Binomial</span>
        </div>

        <div class="playground-input-area" style="display: grid; gap: 12px;">
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundBinomialNInput" style="font-weight: 700; font-size: 0.9rem;">Cantidad total de ensayos (n, máx. 30):</label>
            <input type="number" id="playgroundBinomialNInput" min="1" max="30" value="8" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundBinomialPInput" style="font-weight: 700; font-size: 0.9rem;">Probabilidad de éxito (p, 0 a 1):</label>
            <input type="number" id="playgroundBinomialPInput" min="0" max="1" step="0.01" value="0.5" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundBinomialKInput" style="font-weight: 700; font-size: 0.9rem;">Éxitos deseados (k, 0 a n):</label>
            <input type="number" id="playgroundBinomialKInput" min="0" max="30" value="4" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <button type="button" class="primary-button" id="playgroundBinomialEvaluateBtn" style="margin-top: 6px;">Calcular Binomial</button>
        </div>

        <div class="output-grid" style="margin-top: 20px;">
          <div class="output-box"><strong>Fórmula combinada</strong><div id="playgroundBinomialFormula" class="math-line"></div></div>
          <div class="output-box"><strong>Resultado exacto P(X = k)</strong><div id="playgroundBinomialResult" class="math-line" style="font-size: 1.1rem; color: var(--primary);"></div></div>
        </div>

        <div class="output-box" style="margin-top: 14px;"><strong>Probabilidades Acumuladas</strong><div id="playgroundBinomialCumulative" style="font-size: 0.95rem; line-height: 1.6;"></div></div>

        <div id="playgroundBinomialBars" class="bar-chart" aria-label="Gráfico de distribución binomial" style="margin-top: 20px;"></div>
      </section>

      <article class="panel lab-challenge-panel">
        <div class="section-heading">
          <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--accent);"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Distribución Binomial</h3>
        </div>
        <div class="challenge-body">
          <div class="challenge-step">
            <strong>💡 Instrucciones de Uso:</strong>
            <p>1. Ingresa los ensayos totales (\\(n\\)), la probabilidad de éxito (\\(p\\)) y los éxitos específicos deseados (\\(k\\)).</p>
            <p>2. Presiona "Calcular Binomial" para renderizar la ecuación combinatoria, las probabilidades acumuladas y el histograma interactivo.</p>
          </div>
          <div class="challenge-step" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>⚠️ Limitaciones Técnicas:</strong>
            <p>El total de ensayos \\(n\\) está estrictamente acotado a un rango entre <strong>1 y 30</strong> para evitar el desbordamiento de enteros (integer overflow) al computar factoriales combinatorios en JavaScript. El valor de \\(k\\) debe ser menor o igual que \\(n\\), y la probabilidad \\(p\\) debe estar en el intervalo \\([0, 1]\\).</p>
          </div>
          <div class="challenge-mission" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>🎯 Pruebas Sugeridas:</strong>
            <p>• Monedas equilibradas: \\(n=8\\) flips, \\(p=0.5\\), éxitos \\(k=4\\) exactos.</p>
            <p>• Servidores de TI redundantes: \\(n=5\\) servidores, disponibilidad individual \\(p=0.95\\). ¿Cuál es la probabilidad de que todos funcionen (\\(k=5\\))? Da más del \\(77.3\%\\).</p>
          </div>
        </div>
      </article>
    </div>
  `;
}

function getGraphPlaygroundHtml() {
  return `
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="section-heading">
          <h3>Grafos Personalizados</h3>
          <span class="pill">Grafos</span>
        </div>

        <div class="playground-input-area" style="display: grid; gap: 12px;">
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundGraphNodesInput" style="font-weight: 700; font-size: 0.9rem;">Vértices (separados por comas):</label>
            <input type="text" id="playgroundGraphNodesInput" value="A, B, C, D, E" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <div class="field" style="display: flex; flex-direction: column; gap: 4px;">
            <label for="playgroundGraphEdgesInput" style="font-weight: 700; font-size: 0.9rem;">Aristas (separadas por comas, Ej: A-B, B-C):</label>
            <input type="text" id="playgroundGraphEdgesInput" value="A-B, B-C, C-D, D-E, E-A, A-C" style="width: 100%; font-family: monospace; font-size: 1rem; padding: 8px; border-radius: 6px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink);" />
          </div>
          <button type="button" class="primary-button" id="playgroundGraphValidateBtn" style="margin-top: 6px;">Validar y Dibujar Grafo</button>
        </div>

        <div id="playgroundGraphError" class="playground-error hidden" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid var(--bad); color: var(--bad); padding: 12px; border-radius: 6px; margin-top: 14px; font-weight: bold;"></div>

        <div class="graph-wrap" style="margin-top: 20px;">
          <svg id="playgroundGraphCanvas" class="graph-canvas" viewBox="0 0 420 280" role="img" aria-label="Grafo personalizado generado"></svg>
          <div class="graph-facts">
            <div class="output-box"><strong>Lista de adyacencia</strong><div id="playgroundAdjacencyList" class="math-line"></div></div>
            <div class="output-box"><strong>Matriz de adyacencia</strong><div id="playgroundAdjacencyMatrix"></div></div>
          </div>
        </div>
        <div class="output-box" style="margin-top: 14px;"><strong>Grados</strong><div id="playgroundGraphDegrees" class="math-line"></div></div>
      </section>

      <article class="panel lab-challenge-panel">
        <div class="section-heading">
          <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin: 0; color: var(--accent);"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Teoría de Grafos</h3>
        </div>
        <div class="challenge-body">
          <div class="challenge-step">
            <strong>💡 Instrucciones de Uso:</strong>
            <p>1. Ingresa los identificadores de tus nodos/vértices separados por comas (por ejemplo: <code>A, B, C, D</code>).</p>
            <p>2. Define las conexiones/aristas separándolas con un guion (por ejemplo: <code>A-B</code> es una arista entre A y B) y cada par separado por comas.</p>
            <p>3. Haz clic en "Validar y Dibujar Grafo" para renderizar la distribución circular SVG en tiempo real.</p>
          </div>
          <div class="challenge-step" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>⚠️ Limitaciones Técnicas:</strong>
            <p>Soporta grafos simples no dirigidos (aristas bilaterales). No admite múltiples aristas en paralelo entre el mismo par de nodos, ni bucles sobre un solo vértice. Se recomienda un máximo de <strong>10 vértices</strong> para evitar saturación visual en el canvas circular SVG.</p>
          </div>
          <div class="challenge-mission" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px;">
            <strong>🎯 Pruebas Sugeridas:</strong>
            <p>• Ciclo uniforme \\(C_3\\): Vértices <code>A, B, C</code> y aristas <code>A-B, B-C, C-A</code> (todos los grados dan 2).</p>
            <p>• Camino lineal \\(P_4\\): Vértices <code>A, B, C, D</code> y aristas <code>A-B, B-C, C-D</code>.</p>
            <p>• Componentes inconexas: Vértices <code>A, B, C, D</code> y aristas <code>A-B, C-D</code>.</p>
          </div>
        </div>
      </article>
    </div>
  `;
}

// ==========================================================================
// ENLAZADORES DE EVENTOS DE PLAYGROUNDS (MÓDULOS DE SIMULACIÓN LIBRE)
// ==========================================================================

// Enlace de Eventos para el Validador de Lógica Proposicional
function bindLogicPlaygroundEvents(root) {
  const logicInput = root.querySelector("#playgroundLogicInput");
  if (!logicInput) return;

  // Escucha los clics del teclado virtual en pantalla e inserta los caracteres en el input
  root.querySelectorAll(".playground-keyboard button[data-symbol]").forEach(btn => {
    btn.addEventListener("click", () => {
      const symbol = btn.dataset.symbol;
      logicInput.value += symbol;
      logicInput.focus();
      playSound("nav");
    });
  });

  // Botón Limpiar: borra todo el contenido de la proposición
  const clearBtn = root.querySelector("#playgroundLogicClear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      logicInput.value = "";
      logicInput.focus();
      playSound("nav");
    });
  }

  // Botón Evaluar: ejecuta la generación de la tabla de verdad y clasificación
  const evalBtn = root.querySelector("#playgroundLogicEvaluateBtn");
  if (evalBtn) {
    evalBtn.addEventListener("click", updatePlaygroundLogic);
  }

  // Ejecuta una evaluación por defecto al iniciar
  updatePlaygroundLogic();
}

// Enlace de Eventos para el Validador de Teoría de Conjuntos
function bindSetsPlaygroundEvents(root) {
  const evalBtn = root.querySelector("#playgroundSetsEvaluateBtn");
  if (evalBtn) {
    // Escucha el clic para computar relaciones y ubicar elementos en el diagrama de Venn SVG
    evalBtn.addEventListener("click", updatePlaygroundSets);
  }
  // Ejecuta una evaluación por defecto al iniciar
  updatePlaygroundSets();
}

// Enlace de Eventos para el Validador de Cadenas, Prefijos y Sufijos
function bindStringsPlaygroundEvents(root) {
  const evalBtn = root.querySelector("#playgroundStringEvaluateBtn");
  if (evalBtn) {
    // Al hacer clic, calcula longitud, reversa, potencia y subcadenas
    evalBtn.addEventListener("click", updatePlaygroundStrings);
  }
  // Ejecuta una evaluación por defecto al iniciar
  updatePlaygroundStrings();
}

// Enlace de Eventos para el Validador de Probabilidad Clásica (Laplace)
function bindProbabilityPlaygroundEvents(root) {
  const evalBtn = root.querySelector("#playgroundProbEvaluateBtn");
  if (evalBtn) {
    // Valida que el evento sea subconjunto del espacio muestral y calcula la fracción
    evalBtn.addEventListener("click", updatePlaygroundProb);
  }
  // Ejecuta una evaluación por defecto al iniciar
  updatePlaygroundProb();
}

// Enlace de Eventos para el Calculador de Distribución Binomial
function bindBinomialPlaygroundEvents(root) {
  const evalBtn = root.querySelector("#playgroundBinomialEvaluateBtn");
  if (evalBtn) {
    // Calcula combinatorias exactas e histograma interactivo de barras
    evalBtn.addEventListener("click", updatePlaygroundBinomial);
  }
  
  // Modifica de forma dinámica el valor máximo de éxitos deseados (k) según los ensayos (n)
  const nInput = root.querySelector("#playgroundBinomialNInput");
  const kInput = root.querySelector("#playgroundBinomialKInput");
  if (nInput && kInput) {
    nInput.addEventListener("input", () => {
      const n = Math.max(1, Math.min(30, Number(nInput.value) || 1));
      kInput.max = String(n);
    });
  }
  // Ejecuta una evaluación por defecto al iniciar
  updatePlaygroundBinomial();
}

// Enlace de Eventos para el Validador de Teoría de Grafos
function bindGraphPlaygroundEvents(root) {
  const validateBtn = root.querySelector("#playgroundGraphValidateBtn");
  if (validateBtn) {
    // Dibuja los nodos circularmente en SVG y calcula adyacencias e incidencia
    validateBtn.addEventListener("click", updatePlaygroundGraph);
  }
  // Ejecuta una evaluación por defecto al iniciar
  updatePlaygroundGraph();
}

// ==========================================================================
// RENDERIZADOR DEL PLAYGROUND DE MÓDULO (INLINE)
// ==========================================================================
// Esta función monta dinámicamente el validador interactivo contextualizado
// al tema de estudio activo del estudiante, enlazando sus respectivos eventos.
// Playground contextual de cada modulo. Es distinto del playground global:
// aparece dentro de la pestana "Pruebas Libres" de un modulo concreto.
function renderModulePlayground(moduleId, container) {
  if (!container) return;
  
  // Condicional de selección de sandbox de acuerdo al ID del módulo
  if (moduleId === "logic") {
    container.innerHTML = getLogicPlaygroundHtml(); // Carga el HTML del Validador de Proposiciones
    bindLogicPlaygroundEvents(container);          // Enlaza el teclado virtual y evaluación
  } else if (moduleId === "sets") {
    container.innerHTML = getSetsPlaygroundHtml();  // Carga el HTML del Validador de Conjuntos
    bindSetsPlaygroundEvents(container);           // Enlaza la evaluación y el Venn interactivo SVG
  } else if (moduleId === "strings") {
    container.innerHTML = getStringsPlaygroundHtml(); // Carga el HTML del Validador de Cadenas
    bindStringsPlaygroundEvents(container);          // Enlaza el cálculo de reversas, prefijos y sufijos
  } else if (moduleId === "probability") {
    container.innerHTML = getProbabilityPlaygroundHtml(); // Carga el HTML del Validador de Laplace
    bindProbabilityPlaygroundEvents(container);           // Enlaza el cálculo clásico y visualización de tokens
  } else if (moduleId === "binomial") {
    container.innerHTML = getBinomialPlaygroundHtml(); // Carga el HTML del Validador Binomial
    bindBinomialPlaygroundEvents(container);          // Enlaza el cálculo combinatorio e histograma SVG
  } else if (moduleId === "graph") {
    container.innerHTML = getGraphPlaygroundHtml();
    bindGraphPlaygroundEvents(container);
  }
}

function renderPlayground() {
  toggleSidebar(true);
  setHeroVisibility(false);
  currentView = "playground";
  appView.innerHTML = `
    <article class="module-layout">
      <header class="module-header">
        <div class="module-title-area">
          <span class="pill">Zona de Juego</span>
          <h2>Laboratorio de Pruebas Libres (Playground)</h2>
          <p>Crea, valida y visualiza tus propias proposiciones, conjuntos, cadenas, probabilidades, binomiales y grafos personalizados.</p>
        </div>
        <div class="module-actions">
          <button type="button" class="secondary-button" id="playgroundBackToOverview">Inicio</button>
        </div>
      </header>

      <nav class="module-tabs" aria-label="Navegación del Playground">
        <button type="button" class="tab-button active" data-tab="playground-logic">1. Lógica</button>
        <button type="button" class="tab-button" data-tab="playground-sets">2. Conjuntos</button>
        <button type="button" class="tab-button" data-tab="playground-strings">3. Cadenas</button>
        <button type="button" class="tab-button" data-tab="playground-probability">4. Probabilidad</button>
        <button type="button" class="tab-button" data-tab="playground-binomial">5. Binomial</button>
        <button type="button" class="tab-button" data-tab="playground-graph">6. Grafos</button>
      </nav>

      <!-- Pestaña 1: Lógica Proposicional Libre -->
      <div class="tab-content active" id="tab-playground-logic">
        ${getLogicPlaygroundHtml()}
      </div>

      <!-- Pestaña 2: Teoría de Conjuntos Libre -->
      <div class="tab-content" id="tab-playground-sets">
        ${getSetsPlaygroundHtml()}
      </div>

      <!-- Pestaña 3: Cadenas y Alfabetos Libre -->
      <div class="tab-content" id="tab-playground-strings">
        ${getStringsPlaygroundHtml()}
      </div>

      <!-- Pestaña 4: Probabilidad Discreta Libre -->
      <div class="tab-content" id="tab-playground-probability">
        ${getProbabilityPlaygroundHtml()}
      </div>

      <!-- Pestaña 5: Distribución Binomial Libre -->
      <div class="tab-content" id="tab-playground-binomial">
        ${getBinomialPlaygroundHtml()}
      </div>

      <!-- Pestaña 6: Teoría de Grafos Libre -->
      <div class="tab-content" id="tab-playground-graph">
        ${getGraphPlaygroundHtml()}
      </div>
    </article>
  `;

  // Bind back button
  document.querySelector("#playgroundBackToOverview").addEventListener("click", () => {
    stopSpeaking();
    playSound("nav");
    renderOverview();
  });

  // Init tabs switching
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;
      stopSpeaking();
      tabs.forEach(t => t.classList.toggle("active", t === tab));
      contents.forEach(c => c.classList.toggle("active", c.id === "tab-" + targetTab));
      playSound("nav");
      
      const activeContent = document.querySelector("#tab-" + targetTab);
      if (activeContent) {
        renderMath(activeContent);
      }
    });
  });

  // Bind all event listeners using the new modular binders
  bindLogicPlaygroundEvents(document.querySelector("#tab-playground-logic"));
  bindSetsPlaygroundEvents(document.querySelector("#tab-playground-sets"));
  bindStringsPlaygroundEvents(document.querySelector("#tab-playground-strings"));
  bindProbabilityPlaygroundEvents(document.querySelector("#tab-playground-probability"));
  bindBinomialPlaygroundEvents(document.querySelector("#tab-playground-binomial"));
  bindGraphPlaygroundEvents(document.querySelector("#tab-playground-graph"));
  
  // Renderiza LaTeX inicial en el primer tab activo
  renderMath(document.querySelector("#tab-playground-logic"));
}

function evaluateBooleanExpression(expr, variables) {
  let safeExpr = expr.toLowerCase();
  safeExpr = safeExpr.replace(/<->/g, "===");
  safeExpr = safeExpr.replace(/->/g, "<=");
  safeExpr = safeExpr.replace(/&|∧|\\land/g, "&&");
  safeExpr = safeExpr.replace(/v|\||∨|\\lor/g, "||");
  safeExpr = safeExpr.replace(/~|!|¬|\\neg/g, "!");
  
  for (const [name, val] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${name}\\b`, "g");
    safeExpr = safeExpr.replace(regex, String(val));
  }
  
  try {
    return Function(`return (${safeExpr});`)();
  } catch (e) {
    throw new Error("Expresión inválida");
  }
}

function updatePlaygroundLogic() {
  const inputEl = document.querySelector("#playgroundLogicInput");
  const errorEl = document.querySelector("#playgroundLogicError");
  const latexEl = document.querySelector("#playgroundLogicLatex");
  const classEl = document.querySelector("#playgroundLogicClass");
  const tableEl = document.querySelector("#playgroundLogicTable");
  if (!inputEl || !errorEl || !latexEl || !classEl || !tableEl) return;

  const rawExpr = inputEl.value.trim();
  if (!rawExpr) {
    errorEl.textContent = "Por favor ingresa una expresión.";
    errorEl.classList.remove("hidden");
    return;
  }

  const variables = [];
  if (rawExpr.match(/\bp\b/i)) variables.push("p");
  if (rawExpr.match(/\bq\b/i)) variables.push("q");
  if (rawExpr.match(/\br\b/i)) variables.push("r");
  if (variables.length === 0) {
    if (rawExpr.match(/[a-z]/i)) {
      errorEl.textContent = "Error: Solo se permiten las proposiciones p, q y r.";
      errorEl.classList.remove("hidden");
      return;
    }
    variables.push("p");
  }

  errorEl.classList.add("hidden");

  let latexExpr = rawExpr
    .replace(/&/g, " \\land ")
    .replace(/\|/g, " \\lor ")
    .replace(/~/g, " \\neg ")
    .replace(/->/g, " \\to ")
    .replace(/<->/g, " \\leftrightarrow ");
  
  setMathHtml("#playgroundLogicLatex", inlineMath(latexExpr));

  const n = variables.length;
  const combinations = [];
  for (let i = 0; i < (1 << n); i += 1) {
    const combo = {};
    for (let j = 0; j < n; j += 1) {
      const bit = (i >> (n - 1 - j)) & 1;
      combo[variables[j]] = bit === 0;
    }
    combinations.push(combo);
  }

  let tautology = true;
  let contradiction = true;
  const rowsData = [];

  try {
    for (const combo of combinations) {
      const res = evaluateBooleanExpression(rawExpr, combo);
      rowsData.push({ combo, res });
      if (res === true) contradiction = false;
      if (res === false) tautology = false;
    }
  } catch (err) {
    errorEl.textContent = "Error de sintaxis: Verifica que los paréntesis y operadores estén balanceados.";
    errorEl.classList.remove("hidden");
    return;
  }

  const classification = tautology
    ? "Tautología"
    : contradiction
      ? "Contradicción"
      : "Contingencia";
  
  classEl.textContent = classification;
  if (classification === "Tautología") {
    classEl.style.color = "var(--good)";
    playSound("correct");
  } else if (classification === "Contradicción") {
    classEl.style.color = "var(--bad)";
    playSound("wrong");
  } else {
    classEl.style.color = "var(--primary)";
    playSound("correct");
  }

  const headers = [...variables, rawExpr];
  tableEl.innerHTML = `
    <thead>
      <tr>
        ${headers.map(h => `<th>${inlineMath(h === rawExpr ? latexExpr : h)}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${rowsData.map(row => `
        <tr>
          ${variables.map(v => `<td>${inlineMath(row.combo[v] ? "\\mathrm{V}" : "\\mathrm{F}")}</td>`).join("")}
          <td style="font-weight: bold; background: ${row.res ? "rgba(22,197,94,0.04)" : "rgba(239,68,68,0.04)"}; color: ${row.res ? "var(--good)" : "var(--bad)"};">
            ${inlineMath(row.res ? "\\mathrm{V}" : "\\mathrm{F}")}
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;
  renderMath(tableEl);
}

function updatePlaygroundSets() {
  const inputU = document.querySelector("#playgroundSetsUInput");
  const inputA = document.querySelector("#playgroundSetsAInput");
  const inputB = document.querySelector("#playgroundSetsBInput");
  const selectOp = document.querySelector("#playgroundSetsOp");
  const errorEl = document.querySelector("#playgroundSetsError");
  const vennRoot = document.querySelector("#playgroundSetsVennRoot");
  const resultEl = document.querySelector("#playgroundSetsResult");
  const ideaEl = document.querySelector("#playgroundSetsIdea");

  if (!inputU || !inputA || !inputB || !selectOp || !errorEl || !vennRoot || !resultEl || !ideaEl) return;

  const rawU = inputU.value.trim();
  const rawA = inputA.value.trim();
  const rawB = inputB.value.trim();
  const op = selectOp.value;

  if (!rawU) {
    errorEl.textContent = "Por favor define el conjunto Universal U.";
    errorEl.classList.remove("hidden");
    return;
  }

  errorEl.classList.add("hidden");

  // Parse sets
  const U = rawU.split(",").map(x => x.trim()).filter(x => x.length > 0);
  const A = rawA.split(",").map(x => x.trim()).filter(x => x.length > 0);
  const B = rawB.split(",").map(x => x.trim()).filter(x => x.length > 0);

  // Safeguard: make sure U contains all elements of A and B
  A.forEach(x => { if (!U.includes(x)) U.push(x); });
  B.forEach(x => { if (!U.includes(x)) U.push(x); });
  inputU.value = U.join(", "); // Keep input synced

  const resultMap = {
    union: U.filter(x => A.includes(x) || B.includes(x)),
    intersection: U.filter(x => A.includes(x) && B.includes(x)),
    difference: U.filter(x => A.includes(x) && !B.includes(x)),
    complement: U.filter(x => !A.includes(x)),
    symmetric: U.filter(x => A.includes(x) !== B.includes(x))
  };
  const ideas = {
    union: "Todo lo que está en A, en B o en ambos.",
    intersection: "Solo lo que comparten A y B.",
    difference: "Lo que pertenece a A pero no a B.",
    complement: "Lo que está en el universo U pero no en A.",
    symmetric: "Lo que pertenece a uno de los dos conjuntos, pero no a ambos."
  };
  const result = resultMap[op];
  const labels = {
    union: "A\\cup B",
    intersection: "A\\cap B",
    difference: "A-B",
    complement: "A^{c}",
    symmetric: "A\\triangle B"
  };

  setMathHtml("#playgroundSetsResult", inlineMath(`${labels[op]}=\\{${result.join(",")}\\}`));
  ideaEl.textContent = ideas[op];

  // Group elements into regions for Venn Placement
  const A_only = U.filter(x => A.includes(x) && !B.includes(x));
  const B_only = U.filter(x => B.includes(x) && !A.includes(x));
  const AB_intersect = U.filter(x => A.includes(x) && B.includes(x));
  const U_only = U.filter(x => !A.includes(x) && !B.includes(x));

  let tokensHtml = "";

  function getRegionCoords(regionName, index, total) {
    const centers = {
      A_only: [105, 110],
      B_only: [275, 110],
      AB_intersect: [195, 110],
      U_only: [375, 110]
    };
    const [cx, cy] = centers[regionName];
    if (total === 1) return [cx, cy];
    
    const angle = (index * 2 * Math.PI) / total;
    const r = total > 4 ? 34 : 22;
    return [Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))];
  }

  const renderRegion = (list, name) => {
    list.forEach((item, idx) => {
      const [x, y] = getRegionCoords(name, idx, list.length);
      const isActive = result.includes(item);
      const style = `position: absolute; left: ${x}px; top: ${y}px; transform: translate(-50%, -50%); margin: 0; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; font-weight: bold;`;
      tokensHtml += `<span class="set-token ${isActive ? "active" : ""}" style="${style}">${item}</span>`;
    });
  };

  renderRegion(A_only, "A_only");
  renderRegion(B_only, "B_only");
  renderRegion(AB_intersect, "AB_intersect");
  renderRegion(U_only, "U_only");

  vennRoot.innerHTML = tokensHtml;
  playSound("correct");
  renderMath(document.querySelector("#tab-playground-sets"));
}

function updatePlaygroundStrings() {
  const inputEl = document.querySelector("#playgroundStringInput");
  const powerEl = document.querySelector("#playgroundStringPowerInput");
  const lenEl = document.querySelector("#playgroundStringLength");
  const revEl = document.querySelector("#playgroundStringReverse");
  const powEl = document.querySelector("#playgroundStringPower");
  const prefEl = document.querySelector("#playgroundStringPrefixes");
  const sufEl = document.querySelector("#playgroundStringSuffixes");
  const subEl = document.querySelector("#playgroundStringSubstrings");

  if (!inputEl || !powerEl || !lenEl || !revEl || !powEl || !prefEl || !sufEl || !subEl) return;

  const value = inputEl.value.trim();
  const power = Math.max(1, Math.min(5, Number(powerEl.value) || 1));

  // Empty string checks
  if (value.length === 0) {
    setMathHtml("#playgroundStringLength", inlineMath("|w|=0"));
    revEl.innerHTML = `${inlineMath("w^R=")} <code>\\lambda</code>`;
    powEl.innerHTML = `${inlineMath(`w^{${power}}=`)} <code>\\lambda</code>`;
    prefEl.innerHTML = inlineMath("\\lambda");
    sufEl.innerHTML = inlineMath("\\lambda");
    subEl.innerHTML = inlineMath("\\lambda");
    playSound("correct");
    renderMath(document.querySelector("#tab-playground-strings"));
    return;
  }

  setMathHtml("#playgroundStringLength", inlineMath(`|w|=${value.length}`));
  
  const reverseStr = value.split("").reverse().join("");
  revEl.innerHTML = `${inlineMath("w^R=")} <code>${escapeHtml(reverseStr)}</code>`;
  
  const powerStr = value.repeat(power);
  powEl.innerHTML = `${inlineMath(`w^{${power}}=`)} <code>${escapeHtml(powerStr)}</code>`;

  // Prefixes own list
  const prefixes = Array.from({ length: value.length }, (_, i) => value.slice(0, i + 1));
  prefEl.innerHTML = `<code>lambda</code>, ` + prefixes.map(p => `<code>${escapeHtml(p)}</code>`).join(", ");

  // Suffixes own list
  const suffixes = Array.from({ length: value.length }, (_, i) => value.slice(i));
  sufEl.innerHTML = suffixes.map(s => `<code>${escapeHtml(s)}</code>`).join(", ") + `, <code>lambda</code>`;

  // Substrings unique list
  const substrings = new Set(["lambda"]);
  for (let len = 1; len <= value.length; len += 1) {
    for (let i = 0; i <= value.length - len; i += 1) {
      substrings.add(value.slice(i, i + len));
    }
  }
  subEl.innerHTML = [...substrings].map(s => `<code>${escapeHtml(s)}</code>`).join(", ");

  playSound("correct");
  renderMath(document.querySelector("#tab-playground-strings"));
}

function updatePlaygroundProb() {
  const inputS = document.querySelector("#playgroundProbSInput");
  const inputE = document.querySelector("#playgroundProbEInput");
  const errorEl = document.querySelector("#playgroundProbError");
  const sRoot = document.querySelector("#playgroundProbSampleSpace");
  const eRoot = document.querySelector("#playgroundProbEventSpace");
  const resultEl = document.querySelector("#playgroundProbResult");

  if (!inputS || !inputE || !errorEl || !sRoot || !eRoot || !resultEl) return;

  const rawS = inputS.value.trim();
  const rawE = inputE.value.trim();

  if (!rawS) {
    errorEl.textContent = "Por favor ingresa el espacio muestral S.";
    errorEl.classList.remove("hidden");
    return;
  }

  errorEl.classList.add("hidden");

  // Parse
  const S = rawS.split(",").map(x => x.trim()).filter(x => x.length > 0);
  const E = rawE.split(",").map(x => x.trim()).filter(x => x.length > 0);

  // Validate E is subset of S
  for (const item of E) {
    if (!S.includes(item)) {
      errorEl.textContent = `Error: El evento E debe ser un subconjunto de S. Elemento "${item}" no encontrado en el espacio muestral.`;
      errorEl.classList.remove("hidden");
      playSound("wrong");
      return;
    }
  }

  // Display Tokens
  sRoot.innerHTML = S.map(item => `<span class="sample-token ${E.includes(item) ? "active" : ""}">${item}</span>`).join("");
  eRoot.innerHTML = E.length 
    ? E.map(item => `<span class="sample-token active">${item}</span>`).join("")
    : `<i>Conjunto vacío</i>`;

  // Calculate
  const prob = S.length > 0 ? (E.length / S.length) : 0;
  setMathHtml(
    "#playgroundProbResult",
    inlineMath(`P(E)=\\frac{|E|}{|S|}=\\frac{${E.length}}{${S.length}}=${prob.toFixed(3)}\\approx ${(prob * 100).toFixed(1)}\\%`)
  );

  playSound("correct");
  renderMath(document.querySelector("#tab-playground-probability"));
}

function updatePlaygroundBinomial() {
  const inputN = document.querySelector("#playgroundBinomialNInput");
  const inputP = document.querySelector("#playgroundBinomialPInput");
  const inputK = document.querySelector("#playgroundBinomialKInput");
  const formulaEl = document.querySelector("#playgroundBinomialFormula");
  const resultEl = document.querySelector("#playgroundBinomialResult");
  const cumulativeEl = document.querySelector("#playgroundBinomialCumulative");
  const barsEl = document.querySelector("#playgroundBinomialBars");

  if (!inputN || !inputP || !inputK || !formulaEl || !resultEl || !cumulativeEl || !barsEl) return;

  const n = clamp(Number(inputN.value) || 1, 1, 30);
  const p = clamp(Number(inputP.value) || 0, 0, 1);
  const k = clamp(Number(inputK.value) || 0, 0, n);

  // Correct bounds dynamically
  inputN.value = String(n);
  inputP.value = String(p);
  inputK.value = String(k);

  const prob = binomial(n, k, p);
  const q = (1 - p).toFixed(2);

  // Detailed combination rendering
  setMathHtml(
    "#playgroundBinomialFormula",
    inlineMath(`P(X=${k})=\\binom{${n}}{${k}}(${p})^{${k}}(${q})^{${n - k}}`)
  );

  setMathHtml(
    "#playgroundBinomialResult",
    inlineMath(`P(X=${k})=${prob.toFixed(5)}\\approx ${(prob * 100).toFixed(3)}\\%`)
  );

  // Cumulative probabilities
  let cumLess = 0;
  for (let i = 0; i <= k; i += 1) cumLess += binomial(n, i, p);
  
  let cumGreater = 0;
  for (let i = k; i <= n; i += 1) cumGreater += binomial(n, i, p);

  cumulativeEl.innerHTML = `
    <strong>Probabilidad acumulada por la izquierda:</strong> <br/>
    ${inlineMath(`P(X\\le ${k})=${cumLess.toFixed(5)}\\approx ${(cumLess * 100).toFixed(3)}\\%`)} <br/>
    <strong style="display:inline-block; margin-top:6px;">Probabilidad acumulada por la derecha:</strong> <br/>
    ${inlineMath(`P(X\\ge ${k})=${cumGreater.toFixed(5)}\\approx ${(cumGreater * 100).toFixed(3)}\\%`)}
  `;

  // Plot bars
  const values = Array.from({ length: n + 1 }, (_, i) => binomial(n, i, p));
  const max = Math.max(...values);
  
  barsEl.innerHTML = values
    .map((val, i) => {
      const height = Math.max(4, (val / max) * 110);
      const isChosen = i === k;
      const barStyle = `height: ${height}px; ${isChosen ? "background: var(--accent);" : ""}`;
      return `<div class="bar"><span style="${barStyle}"></span><span>${i}</span></div>`;
    })
    .join("");

  playSound("correct");
  renderMath(document.querySelector("#tab-playground-binomial"));
}

function updatePlaygroundGraph() {
  const nodesInputEl = document.querySelector("#playgroundGraphNodesInput");
  const edgesInputEl = document.querySelector("#playgroundGraphEdgesInput");
  const errorEl = document.querySelector("#playgroundGraphError");
  const svgEl = document.querySelector("#playgroundGraphCanvas");
  const degreesEl = document.querySelector("#playgroundGraphDegrees");
  const adjListEl = document.querySelector("#playgroundAdjacencyList");
  const adjMatrixEl = document.querySelector("#playgroundAdjacencyMatrix");
  
  if (!nodesInputEl || !edgesInputEl || !errorEl || !svgEl || !degreesEl || !adjListEl || !adjMatrixEl) return;

  const rawNodes = nodesInputEl.value.trim();
  const rawEdges = edgesInputEl.value.trim();

  if (!rawNodes) {
    errorEl.textContent = "Por favor ingresa vértices.";
    errorEl.classList.remove("hidden");
    return;
  }

  errorEl.classList.add("hidden");

  const nodes = rawNodes
    .split(",")
    .map(n => n.trim().toUpperCase())
    .filter(n => n.length > 0);
  
  const uniqueNodes = [...new Set(nodes)];
  if (uniqueNodes.length !== nodes.length) {
    errorEl.textContent = "Error: Hay vértices duplicados en la entrada.";
    errorEl.classList.remove("hidden");
    return;
  }

  const edges = [];
  if (rawEdges) {
    const rawEdgeItems = rawEdges.split(",").map(e => e.trim());
    for (const item of rawEdgeItems) {
      if (item.length === 0) continue;
      const parts = item.split("-").map(p => p.trim().toUpperCase());
      if (parts.length !== 2) {
        errorEl.textContent = `Error en arista "${item}": Debe usar formato Nodo1-Nodo2 (Ej: A-B).`;
        errorEl.classList.remove("hidden");
        return;
      }
      if (!nodes.includes(parts[0]) || !nodes.includes(parts[1])) {
        errorEl.textContent = `Error en arista "${item}": El vértice "${!nodes.includes(parts[0]) ? parts[0] : parts[1]}" no está listado en los Nodos.`;
        errorEl.classList.remove("hidden");
        return;
      }
      edges.push([parts[0], parts[1]]);
    }
  }

  const N = nodes.length;
  const positions = {};
  const X = 210, Y = 140, R = 90;
  
  nodes.forEach((node, index) => {
    const angle = (index * 2 * Math.PI) / N - Math.PI / 2;
    positions[node] = [Math.round(X + R * Math.cos(angle)), Math.round(Y + R * Math.sin(angle))];
  });

  const adjacency = Object.fromEntries(nodes.map(n => [n, []]));
  edges.forEach(([a, b]) => {
    adjacency[a].push(b);
    adjacency[b].push(a);
  });

  setMathHtml("#playgroundGraphDegrees", nodes.map(n => inlineMath(`d(${n})=${adjacency[n].length}`)).join(" "));

  adjListEl.innerHTML = nodes
    .map(n => `${inlineMath(`${n}\\to\\{${adjacency[n].join(",") || "\\varnothing"}\\}`)}`)
    .join("<br>");

  adjMatrixEl.innerHTML = renderMatrix(nodes, adjacency);

  svgEl.innerHTML = `
    ${edges.map(([a, b]) => {
      const [x1, y1] = positions[a];
      const [x2, y2] = positions[b];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f766e" stroke-width="5" stroke-linecap="round" />`;
    }).join("")}
    ${nodes.map(node => {
      const [x, y] = positions[node];
      return `<g><circle cx="${x}" cy="${y}" r="22" fill="#fff" stroke="#d97706" stroke-width="4.5"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="16" font-weight="800" fill="#17211b">${node}</text></g>`;
    }).join("")}
  `;

  playSound("correct");
  renderMath(document.querySelector("#tab-playground-graph"));
}

overviewButton.addEventListener("click", () => {
  stopSpeaking();
  playSound("nav");
  renderOverview();
});
if (playgroundButton) {
  playgroundButton.addEventListener("click", () => {
    stopSpeaking();
    playSound("nav");
    renderPlayground();
  });
}
soundToggleButton.addEventListener("click", toggleSound);
resetProgressButton.addEventListener("click", () => {
  stopSpeaking();
  showCustomConfirm("¿Quieres borrar todo el progreso guardado en este navegador de forma definitiva?", () => {
    const soundOn = state.soundOn;
    state = { ...defaultState(), soundOn };
    saveState();
    renderOverview();
  });
});

// Listeners para el botón y overlay de la barra lateral colapsable
if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => toggleSidebar());
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", () => toggleSidebar(true));
}

// En PC (escritorio), marcar el botón de alternancia como activo ("X") por defecto
if (window.innerWidth > 1080 && sidebarToggle) {
  sidebarToggle.classList.add("active");
  sidebarToggle.setAttribute("aria-expanded", "true");
  updateSidebarToggleTitle();
} else {
  updateSidebarToggleTitle();
}

renderProgress();
syncSoundButton();
initTheme();
renderOverview();
