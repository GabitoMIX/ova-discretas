const STORAGE_KEY = "ova-discretas-progress-v1";

function renderMath(root = document.body) {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetClear?.([root]);
    window.MathJax.typesetPromise([root]).catch((error) => {
      console.warn("MathJax no pudo renderizar una formula.", error);
    });
    return;
  }
  renderLocalLatex(root);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderLocalLatex(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue.includes("\\") || parent.closest("script, style, textarea, select, .latex-inline, .latex-display")) {
        return NodeFilter.FILTER_REJECT;
      }
      return /\\\(|\\\[/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(replaceLatexTextNode);
}

function replaceLatexTextNode(node) {
  const pattern = /\\\((.+?)\\\)|\\\[(.+?)\\\]/gs;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(node.nodeValue)) !== null) {
    if (match.index > lastIndex) {
      fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex, match.index)));
    }
    const element = document.createElement(match[2] ? "div" : "span");
    element.className = match[2] ? "latex-display" : "latex-inline";
    element.innerHTML = latexToHtml(match[1] || match[2]);
    fragment.append(element);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < node.nodeValue.length) {
    fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex)));
  }
  node.replaceWith(fragment);
}

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
    Sigma: "&Sigma;",
    lambda: "&lambda;"
  };
  html = html.replace(/\\(alpha|beta|Sigma|lambda)\^\{([^{}]+)\}/g, (_, symbol, exp) => {
    return `${namedSymbolHtml[symbol]}<sup>${latexToHtml(exp)}</sup>`;
  });
  html = html.replace(/\\(alpha|beta|Sigma|lambda)\^([A-Za-z0-9*]+)/g, (_, symbol, exp) => {
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
    "\\cap": "&cap;",
    "\\cup": "&cup;",
    "\\subseteq": "&sube;",
    "\\in": "&in;",
    "\\varnothing": "&empty;",
    "\\lambda": "&lambda;",
    "\\alpha": "&alpha;",
    "\\beta": "&beta;",
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

const modules = [
  {
    id: "logic",
    number: 1,
    title: "Logica proposicional",
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
          "Un enunciado que puede ser verdadero o falso.",
          "Una pregunta abierta.",
          "Una orden sin valor de verdad."
        ],
        answer: 0,
        feedback:
          "Correcto: en logica proposicional se trabaja con enunciados que tienen valor de verdad."
      },
      {
        prompt: "La conjuncion \\(p \\land q\\) es verdadera cuando:",
        options: ["p y q son verdaderas.", "al menos una es verdadera.", "ambas son falsas."],
        answer: 0,
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
    summary:
      "Pertenencia, subconjuntos, conjunto universal, union, interseccion, diferencia, complemento y diferencia simetrica.",
    outcomes: [
      "Representar conjuntos por extension y por comprension.",
      "Identificar pertenencia \\((\\in)\\), subconjunto \\((\\subseteq)\\), conjunto vacio \\((\\varnothing)\\) y conjunto potencia \\((\\mathcal{P}(A))\\).",
      "Resolver operaciones entre conjuntos apoyandose en diagramas de Venn."
    ],
    example:
      "Con \\(A=\\{1,2,3,5\\}\\), \\(B=\\{2,4,5,6\\}\\) y \\(U=\\{1,2,3,4,5,6,7,8\\}\\), la interseccion \\(A \\cap B\\) contiene los elementos que aparecen en ambos conjuntos: \\(\\{2,5\\}\\).",
    quiz: [
      {
        prompt: "Si \\(A=\\{1,2,3\\}\\) y \\(B=\\{3,4\\}\\), entonces \\(A \\cup B\\) es:",
        options: ["\\(\\{1,2,3,4\\}\\)", "\\(\\{3\\}\\)", "\\(\\{1,2\\}\\)"],
        answer: 0,
        feedback: "Correcto: la union toma todos los elementos sin repetirlos."
      },
      {
        prompt: "El simbolo \"2 pertenece a \\(A\\)\" se escribe:",
        options: ["\\(2 \\in A\\)", "\\(2 \\subseteq A\\)", "\\(A \\in 2\\)"],
        answer: 0,
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
    summary:
      "Alfabetos, longitud, concatenacion, potencia, reversa, prefijos, sufijos, subcadenas y lenguajes formales.",
    outcomes: [
      "Diferenciar alfabeto, cadena y lenguaje.",
      "Calcular longitud \\((|w|)\\), concatenacion \\((\\alpha\\beta)\\), potencia \\((\\alpha^n)\\) y reversa \\((\\alpha^R)\\) de una cadena.",
      "Validar cadenas contra reglas formales usadas en programacion."
    ],
    example:
      "Si \\(\\alpha=\\texttt{data}\\) y \\(\\beta=\\texttt{base}\\), entonces \\(\\alpha\\beta=\\texttt{database}\\) y \\(\\beta\\alpha=\\texttt{basedata}\\). La concatenacion no siempre es conmutativa.",
    quiz: [
      {
        prompt: "Si \\(\\beta=\\texttt{programacion}\\), entonces \\(|\\beta|\\) es:",
        options: ["12", "11", "10"],
        answer: 0,
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
          "Un conjunto de cadenas sobre un alfabeto.",
          "Un unico simbolo.",
          "Una operacion entre numeros reales."
        ],
        answer: 0,
        feedback: "Exacto: un lenguaje define que cadenas son validas."
      }
    ]
  },
  {
    id: "probability",
    number: 4,
    title: "Espacios muestrales y eventos",
    summary:
      "Espacio muestral, eventos, experimentos aleatorios, conteo de resultados y probabilidad condicional basica.",
    outcomes: [
      "Describir el espacio muestral de experimentos sencillos.",
      "Definir eventos \\((E)\\) como subconjuntos del espacio muestral \\((E \\subseteq S)\\).",
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
        options: ["4", "2", "6"],
        answer: 0,
        feedback: "Bien: CC, CS, SC y SS."
      },
      {
        prompt: "Si todos los resultados son equiprobables, \\(P(E)\\) se calcula como:",
        options: ["\\(\\frac{|E|}{|S|}\\)", "\\(|S|-|E|\\)", "\\(|S|+|E|\\)"],
        answer: 0,
        feedback: "Exacto: casos favorables sobre casos posibles."
      }
    ]
  },
  {
    id: "binomial",
    number: 5,
    title: "Variables aleatorias y distribucion binomial",
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
        options: ["Numero de ensayos.", "Probabilidad de exito.", "Numero de fracasos obligatorios."],
        answer: 0,
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
        options: ["\\(0.3\\)", "\\(0.7\\)", "\\(1.7\\)"],
        answer: 0,
        feedback: "Exacto: 1 - p = 0.3."
      }
    ]
  },
  {
    id: "graphs",
    number: 6,
    title: "Grafos",
    summary:
      "Vertices, aristas, grados, recorridos eulerianos, ciclos hamiltonianos, listas y matrices de adyacencia.",
    outcomes: [
      "Reconocer vertices \\((V)\\), aristas \\((E)\\), grados \\((d(v))\\) y tipos basicos de grafos.",
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
        options: ["Cuantas aristas inciden en el.", "Cuantos grafos existen.", "Cuantas filas tiene una tabla."],
        answer: 0,
        feedback: "Bien: el grado mide conexiones incidentes."
      },
      {
        prompt: "Una matriz de adyacencia indica:",
        options: [
          "Que pares de vertices estan conectados.",
          "La probabilidad de cada evento.",
          "La longitud de una cadena."
        ],
        answer: 0,
        feedback: "Exacto: la matriz codifica conexiones entre vertices."
      }
    ]
  }
];

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

const finalQuestions = [
  ["\\(p \\lor q\\) es falsa cuando:", ["\\(p\\) y \\(q\\) son falsas", "\\(p\\) es verdadera", "\\(q\\) es verdadera"], 0],
  ["Una tautologia es una proposicion compuesta que:", ["Siempre es verdadera", "Siempre es falsa", "No tiene tabla"], 0],
  ["Si \\(U=\\{1,2,3,4\\}\\), \\(A=\\{1,2\\}\\) y \\(B=\\{2,3\\}\\), \\(A \\cap B\\) es:", ["\\(\\{2\\}\\)", "\\(\\{1,2,3\\}\\)", "\\(\\{4\\}\\)"], 0],
  ["El complemento de \\(A\\) toma elementos que:", ["Estan en \\(U\\) y no en \\(A\\)", "Estan solo en \\(A\\)", "No pertenecen a \\(U\\)"], 0],
  ["Si \\(\\alpha=\\texttt{red}\\), \\(\\alpha^3\\) es:", ["\\(\\texttt{redredred}\\)", "\\(\\texttt{red3}\\)", "\\(\\texttt{derderder}\\)"], 0],
  ["\\(\\Sigma^*\\) representa:", ["Todas las cadenas finitas sobre \\(\\Sigma\\)", "Solo cadenas de longitud \\(1\\)", "El conjunto vacio \\(\\varnothing\\)"], 0],
  ["Al lanzar un dado, el evento obtener numero par es:", ["\\(\\{2,4,6\\}\\)", "\\(\\{1,3,5\\}\\)", "\\(\\{6\\}\\)"], 0],
  ["\\(P(E)=0\\) significa que el evento es:", ["Imposible", "Seguro", "Complementario"], 0],
  ["Una variable aleatoria discreta toma valores:", ["Contables", "Siempre negativos", "No numericos"], 0],
  ["En \\(P(X=k)\\), \\(k\\) representa:", ["Cantidad de exitos observada", "Total de ensayos", "Probabilidad de fracaso"], 0],
  ["Un camino euleriano usa:", ["Cada arista una sola vez", "Cada vertice sin importar aristas", "Solo vertices aislados"], 0],
  ["Una lista de adyacencia muestra:", ["Vecinos de cada vertice", "Resultados de una moneda", "Prefijos de una cadena"], 0]
].map(([prompt, options, answer], index) => ({
  id: `final-${index}`,
  prompt,
  options,
  answer,
  feedback: answer === 0 ? "Respuesta esperada." : ""
}));

function defaultState() {
  return {
    completed: {},
    quizAnswers: {},
    finalAnswers: {},
    finalScore: null,
    soundOn: true
  };
}

function moduleVisual(moduleId, mode = "card") {
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
  if (state.soundOn) playSound("correct");
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
const resetProgressButton = document.querySelector("#resetProgressButton");
const soundToggleButton = document.querySelector("#soundToggleButton");

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

function renderProgress() {
  const completedCount = modules.filter((module) => state.completed[module.id]).length;
  const percent = Math.round((completedCount / modules.length) * 100);
  document.querySelector("#overallProgress").textContent = `${percent}%`;
  document.querySelector("#overallMeter").style.width = `${percent}%`;
}

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

function renderOverview() {
  currentView = "overview";
  appView.innerHTML = `
    <div class="section-heading">
      <h3>Ruta de aprendizaje</h3>
      <button type="button" class="primary-button" id="finalButton">Evaluacion final</button>
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
    renderFinalEvaluation();
  });
  renderNav();
  renderMath(appView);
}

function openModule(moduleId) {
  currentView = "module";
  currentModuleId = moduleId;
  const module = modules.find((item) => item.id === moduleId);
  appView.innerHTML = `
    <article class="module-layout">
      <header class="module-header">
        <div>
          <span class="pill">Modulo ${module.number}</span>
          <h2>${module.title}</h2>
          <p>${module.summary}</p>
        </div>
        ${moduleVisual(module.id, "hero")}
        <div class="module-actions">
          <button type="button" class="secondary-button" id="backToOverview">Inicio</button>
          <button type="button" class="primary-button" id="markDone">${state.completed[module.id] ? "Completado" : "Marcar como completado"}</button>
        </div>
      </header>

      <div class="content-grid">
        <section class="panel">
          <div class="section-heading">
            <h3>Conceptos clave</h3>
            <span class="pill">repaso</span>
          </div>
          <ul class="concept-list">
            ${module.outcomes.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <div class="example-box"><strong>Ejemplo guiado:</strong> ${module.example}</div>
          ${renderDeepDive(module.id)}
        </section>

        <section class="lab-panel">
          <div class="section-heading">
            <h3>Laboratorio interactivo</h3>
            <span class="pill">practica</span>
          </div>
          <div id="labRoot"></div>
        </section>
      </div>

      ${renderStudyGuide(module.id)}

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
    </article>
  `;

  document.querySelector("#backToOverview").addEventListener("click", () => {
    playSound("nav");
    renderOverview();
  });
  document.querySelector("#markDone").addEventListener("click", () => {
    state.completed[module.id] = true;
    saveState();
    playSound("complete");
    celebrate("Modulo completado");
    openModule(module.id);
  });

  renderLab(module.id);
  renderGame(module.id);
  renderQuiz(module);
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
}

function renderDeepDive(moduleId) {
  const detail = moduleDeepDives[moduleId];
  if (!detail) return "";
  return `
    <div class="deep-dive">
      <div class="section-heading compact">
        <h3>Contenido ampliado</h3>
        <span class="pill">profundiza</span>
      </div>
      <p>${detail.focus}</p>
      <ul class="detail-list">
        ${detail.keyIdeas.map((idea) => `<li>${idea}</li>`).join("")}
      </ul>
      <div class="system-use"><strong>Aplicacion en sistemas:</strong> ${detail.systemUse}</div>
    </div>
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
            <span>Tu clasificacion</span>
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
  document.querySelector("#checkGameButton").addEventListener("click", () => checkGame(moduleId));
  const pill = document.querySelector("#gameScorePill");
  if (pill) pill.textContent = `0/${game.items.length}`;
  renderMath(root);
}

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
          <h4>Definiciones esenciales</h4>
          <dl class="definition-list">
            ${guide.definitions.map(([term, definition]) => `<div><dt>${term}</dt><dd>${definition}</dd></div>`).join("")}
          </dl>
        </article>
        <article class="study-card">
          <h4>Procedimiento recomendado</h4>
          <ol class="step-list">
            ${guide.procedure.map((step) => `<li>${step}</li>`).join("")}
          </ol>
        </article>
        <article class="study-card worked">
          <h4>Ejemplo resuelto</h4>
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

function createQuestionCard(question, key, onAnswer) {
  const card = document.createElement("article");
  card.className = "question-card";
  const savedAnswer = state.quizAnswers[key] ?? state.finalAnswers[key];
  card.innerHTML = `
    <p><strong>${question.prompt}</strong></p>
    <div class="answers"></div>
    <div class="feedback" aria-live="polite"></div>
  `;
  const answers = card.querySelector(".answers");
  const feedback = card.querySelector(".feedback");
  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.innerHTML = option;
    button.addEventListener("click", () => {
      if (key.startsWith("final-")) {
        state.finalAnswers[key] = optionIndex;
      } else {
        state.quizAnswers[key] = optionIndex;
      }
      saveState();
      paintQuestionState(card, question, optionIndex, true);
      if (onAnswer) onAnswer();
    });
    answers.appendChild(button);
  });
  if (savedAnswer !== undefined) {
    paintQuestionState(card, question, savedAnswer);
  }
  return card;
}

function paintQuestionState(card, question, selectedIndex, withSound = false) {
  const buttons = [...card.querySelectorAll(".answer-button")];
  const feedback = card.querySelector(".feedback");
  buttons.forEach((button, index) => {
    button.classList.toggle("correct", index === question.answer);
    button.classList.toggle("wrong", index === selectedIndex && index !== question.answer);
  });
  const correct = selectedIndex === question.answer;
  if (withSound) playSound(correct ? "correct" : "wrong");
  if (withSound) {
    card.classList.remove("pulse-good", "pulse-bad");
    void card.offsetWidth;
    card.classList.add(correct ? "pulse-good" : "pulse-bad");
  }
  feedback.className = `feedback ${correct ? "good" : "bad"}`;
  feedback.innerHTML = correct ? question.feedback : "Revisa el concepto y vuelve a intentarlo.";
  renderMath(card);
}

function renderLab(moduleId) {
  const labRoot = document.querySelector("#labRoot");
  const labs = {
    logic: renderLogicLab,
    sets: renderSetsLab,
    strings: renderStringsLab,
    probability: renderProbabilityLab,
    binomial: renderBinomialLab,
    graphs: renderGraphLab
  };
  labs[moduleId](labRoot);
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
  ["logicP", "logicQ", "logicOp"].forEach((id) => document.querySelector(`#${id}`).addEventListener("change", updateLogicLab));
  updateLogicLab();
}

function updateLogicLab() {
  const p = document.querySelector("#logicP").value === "true";
  const q = document.querySelector("#logicQ").value === "true";
  const op = document.querySelector("#logicOp").value;
  const result = evalLogic(p, q, op);
  const readings = {
    and: "La conjuncion solo funciona si ambas proposiciones son verdaderas.",
    or: "La disyuncion inclusiva funciona si al menos una proposicion es verdadera.",
    implies: "El condicional solo falla cuando p es verdadera y q es falsa.",
    iff: "El bicondicional es verdadero cuando p y q tienen el mismo valor."
  };
  setMathHtml("#logicResult", inlineMath(`${boolTex(p)} ${logicSymbolLatex(op)} ${boolTex(q)} = ${boolTex(result)}`));
  document.querySelector("#logicReading").textContent = readings[op];
  const rows = [true, false].flatMap((pv) => [true, false].map((qv) => [pv, qv, evalLogic(pv, qv, op)]));
  document.querySelector("#truthTable").innerHTML = `
    <thead><tr><th>${inlineMath("p")}</th><th>${inlineMath("q")}</th><th>${inlineMath(logicSymbolLatex(op))}</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><td>${inlineMath(boolTex(row[0]))}</td><td>${inlineMath(boolTex(row[1]))}</td><td>${inlineMath(boolTex(row[2]))}</td></tr>`).join("")}</tbody>
  `;
  renderMath(document.querySelector("#truthTable"));
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
  document.querySelector("#setOperation").addEventListener("change", updateSetsLab);
  updateSetsLab();
  renderMath(root);
}

function updateSetsLab() {
  const U = [1, 2, 3, 4, 5, 6, 7, 8];
  const A = [1, 2, 3, 5];
  const B = [2, 4, 5, 6];
  const op = document.querySelector("#setOperation").value;
  const resultMap = {
    union: U.filter((x) => A.includes(x) || B.includes(x)),
    intersection: U.filter((x) => A.includes(x) && B.includes(x)),
    difference: U.filter((x) => A.includes(x) && !B.includes(x)),
    complement: U.filter((x) => !A.includes(x)),
    symmetric: U.filter((x) => A.includes(x) !== B.includes(x))
  };
  const ideas = {
    union: "Todo lo que esta en A, en B o en ambos.",
    intersection: "Solo lo que comparten A y B.",
    difference: "Lo que pertenece a A pero no a B.",
    complement: "Lo que esta en el universo U pero no en A.",
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
  document.querySelector("#setIdea").textContent = ideas[op];
  document.querySelector("#vennItems").innerHTML = U.map((item) => `<span class="set-token ${result.includes(item) ? "active" : ""}">${item}</span>`).join("");
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
  ["stringInput", "languageRule", "powerInput"].forEach((id) => document.querySelector(`#${id}`).addEventListener("input", updateStringsLab));
  updateStringsLab();
  renderMath(root);
}

function updateStringsLab() {
  const value = document.querySelector("#stringInput").value.trim();
  const power = Math.max(1, Math.min(5, Number(document.querySelector("#powerInput").value) || 1));
  const rule = document.querySelector("#languageRule").value;
  const prefixes = Array.from({ length: Math.max(0, value.length - 1) }, (_, i) => value.slice(0, i + 1));
  setMathHtml("#stringLength", inlineMath(`|w|=${value.length}`));
  document.querySelector("#stringReverse").innerHTML = `${inlineMath("w^R=")} <code>${escapeHtml(value.split("").reverse().join("") || "lambda")}</code>`;
  document.querySelector("#stringPower").innerHTML = `${inlineMath(`w^{${power}}=`)} <code>${escapeHtml(value.repeat(power) || "lambda")}</code>`;
  document.querySelector("#prefixes").innerHTML = prefixes.length
    ? prefixes.map((prefix) => `<code>${escapeHtml(prefix)}</code>`).join(", ")
    : inlineMath("\\lambda");
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
  document.querySelector("#languageValidation").innerHTML = `<span class="pill">${selected.test ? "Cadena valida" : "Cadena invalida"}</span><p>${selected.label}</p>`;
  renderMath(document.querySelector("#labRoot"));
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
  document.querySelector("#experimentSelect").addEventListener("change", () => {
    populateEvents();
    updateProbabilityLab();
  });
  document.querySelector("#eventSelect").addEventListener("change", updateProbabilityLab);
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
  const experimentKey = document.querySelector("#experimentSelect").value;
  const eventSelect = document.querySelector("#eventSelect");
  const experiment = getExperiments()[experimentKey];
  eventSelect.innerHTML = Object.entries(experiment.events)
    .map(([key, [label]]) => `<option value="${key}">${label}</option>`)
    .join("");
}

function updateProbabilityLab() {
  const experimentKey = document.querySelector("#experimentSelect").value;
  const eventKey = document.querySelector("#eventSelect").value;
  const experiment = getExperiments()[experimentKey];
  const event = experiment.events[eventKey][1];
  document.querySelector("#sampleSpace").innerHTML = experiment.S.map((item) => `<span class="sample-token ${event.includes(item) ? "active" : ""}">${item}</span>`).join("");
  document.querySelector("#eventSpace").innerHTML = event.map((item) => `<span class="sample-token active">${item}</span>`).join("");
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
  ["binomialN", "binomialP", "binomialK"].forEach((id) => document.querySelector(`#${id}`).addEventListener("input", updateBinomialLab));
  updateBinomialLab();
  renderMath(root);
}

function updateBinomialLab() {
  const n = clamp(Number(document.querySelector("#binomialN").value) || 1, 1, 20);
  const p = clamp(Number(document.querySelector("#binomialP").value) || 0, 0, 1);
  const k = clamp(Number(document.querySelector("#binomialK").value) || 0, 0, n);
  document.querySelector("#binomialK").max = String(n);
  const probability = binomial(n, k, p);
  const q = (1 - p).toFixed(2);
  setMathHtml("#binomialFormula", inlineMath(`\\binom{${n}}{${k}}(${p})^{${k}}(${q})^{${n - k}}`));
  setMathHtml("#binomialResult", inlineMath(`P(X=${k})=${probability.toFixed(5)}\\approx ${(probability * 100).toFixed(2)}\\%`));
  const values = Array.from({ length: n + 1 }, (_, i) => binomial(n, i, p));
  const max = Math.max(...values);
  document.querySelector("#binomialBars").innerHTML = values
    .map((value, i) => `<div class="bar"><span style="height:${Math.max(4, (value / max) * 120)}px; ${i === k ? "background: var(--accent);" : ""}"></span><span>${i}</span></div>`)
    .join("");
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
  document.querySelector("#graphSelect").addEventListener("change", updateGraphLab);
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
  const graph = getGraphs()[document.querySelector("#graphSelect").value];
  const adjacency = Object.fromEntries(graph.nodes.map((node) => [node, []]));
  graph.edges.forEach(([a, b]) => {
    adjacency[a].push(b);
    adjacency[b].push(a);
  });
  document.querySelector("#graphClassification").textContent = graph.classification;
  setMathHtml("#graphDegrees", graph.nodes.map((node) => inlineMath(`d(${node})=${adjacency[node].length}`)).join(" "));
  document.querySelector("#adjacencyList").innerHTML = graph.nodes
    .map((node) => `${inlineMath(`${node}\\to\\{${adjacency[node].join(",") || "\\varnothing"}\\}`)}`)
    .join("<br>");
  document.querySelector("#adjacencyMatrix").innerHTML = renderMatrix(graph.nodes, adjacency);
  const svg = document.querySelector("#graphCanvas");
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
  renderMath(document.querySelector("#labRoot"));
}

function renderMatrix(nodes, adjacency) {
  const rows = nodes
    .map((rowNode) => `<tr><th>${inlineMath(rowNode)}</th>${nodes.map((colNode) => `<td>${adjacency[rowNode].includes(colNode) ? 1 : 0}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="matrix-table"><thead><tr><th></th>${nodes.map((node) => `<th>${inlineMath(node)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderFinalEvaluation() {
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
  } else {
    playSound("wrong");
  }
}

overviewButton.addEventListener("click", () => {
  playSound("nav");
  renderOverview();
});
soundToggleButton.addEventListener("click", toggleSound);
resetProgressButton.addEventListener("click", () => {
  if (!confirm("Quieres borrar el progreso guardado de este navegador?")) return;
  const soundOn = state.soundOn;
  state = { ...defaultState(), soundOn };
  saveState();
  renderOverview();
});

renderProgress();
syncSoundButton();
renderOverview();
