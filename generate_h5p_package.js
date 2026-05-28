/*
 * Genera un paquete .h5p importable en Lumi para la entrega final.
 *
 * La app web del repositorio conserva la experiencia completa del OVA. Este
 * archivo crea una versión H5P editable con los mismos seis ejes temáticos,
 * preguntas y retroalimentación, usando la librería local compatible con Lumi.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, "dist");
const BUILD_DIR = path.join(DIST_DIR, "h5p-build");
const LIBRARY_NAME = "H5P.OvaMatematicasDiscretas";
const LIBRARY_DIR = `${LIBRARY_NAME}-1.0`;
const OUTPUT_H5P = path.join(DIST_DIR, "OVA_Matematicas_Discretas_Lumi_Importable.h5p");
const OUTPUT_README = path.join(DIST_DIR, "README_H5P_ENTREGA.md");

const modules = [
  {
    title: "Lógica proposicional",
    shortTitle: "Lógica",
    objective: "Reconocer proposiciones, conectivos lógicos y tablas de verdad.",
    theory:
      "La lógica proposicional representa enunciados que pueden ser verdaderos o falsos. Con conectivos como negación, conjunción, disyunción, condicional y bicondicional se construyen expresiones más complejas.",
    example:
      "Si p significa 'el algoritmo termina' y q significa 'la salida es correcta', la expresión p -> q solo es falsa cuando p es verdadera y q es falsa.",
    activity:
      "Construye una tabla de verdad y clasifica la expresión como tautología, contradicción o contingencia.",
    question: {
      text: "¿Cuándo es falsa la proposición p -> q?",
      options: [
        "Cuando p es verdadera y q es falsa.",
        "Cuando p es falsa y q es verdadera.",
        "Cuando p y q son verdaderas."
      ],
      answer: 0,
      feedback: "El condicional falla únicamente cuando ocurre el antecedente y no ocurre el consecuente."
    }
  },
  {
    title: "Conjuntos y diagramas de Venn",
    shortTitle: "Conjuntos",
    objective: "Aplicar pertenencia, subconjuntos y operaciones entre conjuntos.",
    theory:
      "Los conjuntos organizan elementos sin repetirlos. Las operaciones más usadas son unión, intersección, diferencia, complemento y diferencia simétrica.",
    example:
      "Si A={1,2,3,5} y B={2,4,5,6}, entonces A intersección B={2,5} porque esos elementos aparecen en ambos conjuntos.",
    activity:
      "Relaciona símbolos de pertenencia, subconjunto, unión, intersección y conjunto potencia con su significado.",
    question: {
      text: "¿Qué operación reúne los elementos que están en A, en B o en ambos?",
      options: ["Intersección", "Unión", "Diferencia"],
      answer: 1,
      feedback: "La unión A unión B reúne todos los elementos de ambos conjuntos sin repetirlos."
    }
  },
  {
    title: "Alfabetos, cadenas y lenguajes",
    shortTitle: "Cadenas",
    objective: "Diferenciar alfabeto, cadena, lenguaje, longitud, potencia y reversa.",
    theory:
      "Un alfabeto es un conjunto finito de símbolos; una cadena es una secuencia finita de símbolos; un lenguaje formal es un conjunto de cadenas que cumplen una regla.",
    example:
      "Si alfa='red', entonces alfa^3='redredred'. La reversa de 'datos' es 'sotad'.",
    activity:
      "Valida cadenas contra reglas de formato, prefijos, sufijos y subcadenas.",
    question: {
      text: "Para Sigma={0,1}, ¿cuántas cadenas de longitud 3 existen?",
      options: ["3", "6", "8"],
      answer: 2,
      feedback: "Hay 2^3=8 cadenas posibles porque cada posición tiene dos opciones."
    }
  },
  {
    title: "Espacios muestrales y eventos",
    shortTitle: "Probabilidad",
    objective: "Construir espacios muestrales, eventos y probabilidades por conteo.",
    theory:
      "El espacio muestral contiene todos los resultados posibles de un experimento. Un evento es un subconjunto del espacio muestral.",
    example:
      "Al lanzar un dado, S={1,2,3,4,5,6}. El evento obtener un número divisible por 3 es E={3,6}, por tanto P(E)=2/6=1/3.",
    activity:
      "Selecciona eventos en dados, monedas y escenarios equiprobables para calcular probabilidades simples.",
    question: {
      text: "Si todos los resultados son equiprobables, ¿cómo se calcula P(E)?",
      options: ["|E| / |S|", "|S| - |E|", "|S| + |E|"],
      answer: 0,
      feedback: "En conteo clásico, la probabilidad es casos favorables sobre casos posibles."
    }
  },
  {
    title: "Variables aleatorias y distribución binomial",
    shortTitle: "Binomial",
    objective: "Interpretar variables aleatorias discretas y calcular probabilidades binomiales.",
    theory:
      "Una variable aleatoria asigna un valor numérico a cada resultado de un experimento. En la distribución binomial se repiten n ensayos independientes con probabilidad de éxito p.",
    example:
      "Si X cuenta aciertos en 5 preguntas de verdadero/falso al azar, entonces n=5 y p=0.5. La probabilidad de exactamente 3 aciertos usa C(5,3)(0.5)^3(0.5)^2.",
    activity:
      "Identifica n, p, q y k antes de aplicar la fórmula binomial.",
    question: {
      text: "En una distribución binomial, ¿qué representa n?",
      options: ["La probabilidad de éxito", "El número total de ensayos", "El número de fracasos obligatorios"],
      answer: 1,
      feedback: "n es la cantidad fija de ensayos o intentos del experimento."
    }
  },
  {
    title: "Grafos",
    shortTitle: "Grafos",
    objective: "Reconocer vértices, aristas, grados, listas, matrices y recorridos.",
    theory:
      "Un grafo representa relaciones entre objetos mediante vértices y aristas. Puede analizarse con grados, listas de adyacencia y matrices de adyacencia.",
    example:
      "Un camino euleriano usa cada arista exactamente una vez; un camino hamiltoniano visita cada vértice exactamente una vez.",
    activity:
      "Clasifica conceptos de grafos y decide si existe camino euleriano según los grados.",
    question: {
      text: "¿Qué usa exactamente una vez un camino euleriano?",
      options: ["Cada arista", "Cada tabla de verdad", "Cada símbolo del alfabeto"],
      answer: 0,
      feedback: "Los recorridos eulerianos se enfocan en usar cada arista exactamente una vez."
    }
  }
];

const finalQuestions = [
  {
    text: "¿Cuál es el propósito principal del OVA?",
    options: ["Reemplazar la clase presencial", "Apoyar el repaso y la práctica autónoma", "Eliminar la evaluación"],
    answer: 1,
    feedback: "El OVA está pensado como apoyo interactivo para estudiar, practicar y repasar."
  },
  {
    text: "¿Qué tema conecta directamente con validación de cadenas y expresiones regulares?",
    options: ["Lenguajes formales", "Distribución binomial", "Grafos ponderados"],
    answer: 0,
    feedback: "Los lenguajes formales trabajan alfabetos, cadenas, reglas y validación."
  },
  {
    text: "¿Qué estructura se usa para representar relaciones entre nodos?",
    options: ["Grafo", "Evento", "Conjunto vacío"],
    answer: 0,
    feedback: "Los grafos modelan relaciones usando vertices y aristas."
  }
];

function ensureEmptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function walkFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath, base);
    return [{
      fullPath,
      relativePath: path.relative(base, fullPath).replace(/\\/g, "/")
    }];
  });
}

function writeZip(sourceDir, outputFile) {
  // H5P es un archivo ZIP. Implementamos un empaquetador pequeño para no
  // depender de librerías externas y mantener la entrega reproducible.
  const files = walkFiles(sourceDir);
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of files) {
    const raw = fs.readFileSync(file.fullPath);
    const compressed = zlib.deflateRawSync(raw);
    const name = Buffer.from(file.relativePath, "utf8");
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralStart = offset;
  const centralBuffer = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  fs.writeFileSync(outputFile, Buffer.concat([...localParts, centralBuffer, end]));
}

function buildPackage() {
  // Construye la estructura mínima que Lumi espera: metadatos H5P, contenido
  // editable y una librería local con semantics, JS y CSS.
  ensureEmptyDir(BUILD_DIR);
  fs.mkdirSync(DIST_DIR, { recursive: true });

  writeJson(path.join(BUILD_DIR, "h5p.json"), {
    title: "OVA Matemáticas Discretas - Versión importable",
    language: "es",
    mainLibrary: LIBRARY_NAME,
    embedTypes: ["iframe"],
    license: "U",
    defaultLanguage: "es",
    preloadedDependencies: [
      {
        machineName: LIBRARY_NAME,
        majorVersion: 1,
        minorVersion: 0
      }
    ]
  });

  writeJson(path.join(BUILD_DIR, "content", "content.json"), {
    title: "OVA: Matemáticas Discretas",
    subtitle: "Objeto Virtual de Aprendizaje interactivo",
    students: "Gabriel Argenis Medina Carrero y Joel Pineda",
    institution: "Universidad Simón Bolívar - Sede Cúcuta",
    course: "Matemáticas Discretas",
    intro:
      "<p>Este recurso es una versión importable y editable del OVA de Matemáticas Discretas. Organiza seis módulos con explicación breve, conceptos clave, actividad sugerida, preguntas de práctica y retroalimentación automática.</p><p>La experiencia web complementaria del repositorio puede publicarse como sitio estático en GitHub Pages e incluye laboratorios avanzados, playgrounds, sonidos, progreso local y certificado.</p>",
    modules: modules.map((module) => ({
      title: module.title,
      objective: module.objective,
      concepts: [
        module.theory,
        module.example,
        module.activity
      ],
      activity: `<p><strong>Actividad sugerida:</strong> ${module.activity}</p><p><strong>Ejemplo guiado:</strong> ${module.example}</p>`
    })),
    questions: modules.map((module) => ({
      questionText: `<p>${module.question.text}</p>`,
      options: module.question.options.map((option, index) => ({
        text: option,
        correct: index === module.question.answer
      })),
      feedback: `<p>${module.question.feedback}</p>`
    })).concat(finalQuestions.map((question) => ({
      questionText: `<p>${question.text}</p>`,
      options: question.options.map((option, index) => ({
        text: option,
        correct: index === question.answer
      })),
      feedback: `<p>${question.feedback}</p>`
    }))),
    closing:
      "<p>Este archivo permite editar títulos, módulos, conceptos, actividades y preguntas. Para la entrega final se recomienda acompañarlo con la app web del repositorio, que contiene la experiencia completa del OVA.</p>"
  });

  const libraryPath = path.join(BUILD_DIR, LIBRARY_DIR);
  writeJson(path.join(libraryPath, "library.json"), {
    title: "OVA Matemáticas Discretas",
    machineName: LIBRARY_NAME,
    description: "Plantilla autocontenida para un OVA de Matemáticas Discretas editable como recurso H5P.",
    contentType: "instructional",
    license: "MIT",
    author: "Gabriel Argenis Medina Carrero y Joel Pineda",
    majorVersion: 1,
    minorVersion: 0,
    patchVersion: 0,
    runnable: 1,
    fullscreen: 0,
    embedTypes: ["iframe"],
    coreApi: {
      majorVersion: 1,
      minorVersion: 24
    },
    preloadedJs: [{ path: "scripts/ova.js" }],
    preloadedCss: [{ path: "styles/ova.css" }]
  });

  writeJson(path.join(libraryPath, "semantics.json"), buildCompatibleSemantics());
  writeText(path.join(libraryPath, "scripts", "ova.js"), libraryScript());
  writeText(path.join(libraryPath, "styles", "ova.css"), libraryStyles());
  writeZip(BUILD_DIR, OUTPUT_H5P);

  writeText(OUTPUT_README, `# Entrega H5P - OVA Matemáticas Discretas

Archivo generado:

- \`OVA_Matematicas_Discretas_Lumi_Importable.h5p\`

Uso recomendado:

1. Abrir Lumi Desktop.
2. Seleccionar **Abrir archivo H5P** o **Importar H5P**.
3. Elegir este archivo \`.h5p\`.
4. Presentarlo como la versión H5P importable y editable solicitada en la propuesta.
5. Acompañarlo con el sitio web estático del repositorio, que contiene la experiencia completa y puede publicarse en GitHub Pages.

Nota para entrega:

Este H5P funciona como versión importable y reutilizable del OVA. La versión web del repositorio es la implementación completa, con laboratorios avanzados, playgrounds, sonidos, certificado, progreso local y publicación estática en GitHub Pages.
`);

  fs.rmSync(BUILD_DIR, { recursive: true, force: true });

  console.log(`H5P generado: ${OUTPUT_H5P}`);
  console.log(`Nota generada: ${OUTPUT_README}`);
}

function htmlField(name, label, importance) {
  // Campo HTML reutilizable para que Lumi permita editar textos enriquecidos.
  return {
    name,
    type: "text",
    widget: "html",
    label,
    importance,
    enterMode: "p",
    tags: [
      "strong",
      "em",
      "del",
      "a",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "hr",
      "pre",
      "code",
      "p",
      "br",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th"
    ],
    font: {
      size: true,
      color: true,
      background: true
    }
  };
}

function buildCompatibleSemantics() {
  // El semantics.json describe el formulario editable que Lumi muestra al abrir
  // el contenido. Los nombres deben coincidir con content/content.json.
  return [
    {
      name: "title",
      type: "text",
      label: "Título principal",
      importance: "high",
      default: "OVA: Matemáticas Discretas"
    },
    {
      name: "subtitle",
      type: "text",
      label: "Subtítulo",
      importance: "medium",
      default: "Objeto Virtual de Aprendizaje interactivo"
    },
    {
      name: "students",
      type: "text",
      label: "Integrantes",
      importance: "high"
    },
    {
      name: "institution",
      type: "text",
      label: "Institución",
      importance: "medium"
    },
    {
      name: "course",
      type: "text",
      label: "Asignatura",
      importance: "medium"
    },
    htmlField("intro", "Introducción", "high"),
    {
      name: "modules",
      type: "list",
      label: "Módulos del OVA",
      importance: "high",
      min: 1,
      entity: "módulo",
      field: {
        name: "module",
        type: "group",
        label: "Módulo",
        fields: [
          {
            name: "title",
            type: "text",
            label: "Título del módulo",
            importance: "high"
          },
          {
            name: "objective",
            type: "text",
            label: "Objetivo del módulo",
            importance: "high"
          },
          {
            name: "concepts",
            type: "list",
            label: "Conceptos clave",
            importance: "medium",
            entity: "concepto",
            field: {
              name: "concept",
              type: "text",
              label: "Concepto"
            }
          },
          htmlField("activity", "Actividad sugerida", "medium")
        ]
      }
    },
    {
      name: "questions",
      type: "list",
      label: "Preguntas de autoevaluación",
      importance: "high",
      min: 1,
      entity: "pregunta",
      field: {
        name: "question",
        type: "group",
        label: "Pregunta",
        fields: [
          htmlField("questionText", "Enunciado", "high"),
          {
            name: "options",
            type: "list",
            label: "Opciones de respuesta",
            importance: "high",
            min: 2,
            entity: "opción",
            field: {
              name: "option",
              type: "group",
              label: "Opción",
              fields: [
                {
                  name: "text",
                  type: "text",
                  label: "Texto de la opción",
                  importance: "high"
                },
                {
                  name: "correct",
                  type: "boolean",
                  label: "¿Es correcta?",
                  importance: "high",
                  default: false
                }
              ]
            }
          },
          htmlField("feedback", "Retroalimentación", "medium")
        ]
      }
    },
    htmlField("closing", "Cierre", "medium")
  ];
}

function libraryScript() {
  // Runtime de visualización del contenido H5P. Es autocontenido y usa la API
  // clásica de H5P con jQuery y EventDispatcher, compatible con Lumi Desktop.
  return `H5P.OvaMatematicasDiscretas = (function ($, EventDispatcher) {
  function OvaMatematicasDiscretas(params, id) {
    var self = this;
    EventDispatcher.call(self);
    params = params || {};

    function escapeHtml(text) {
      return String(text || '').replace(/[&<>"']/g, function (m) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m];
      });
    }

    function renderConcepts(concepts) {
      if (!concepts || !concepts.length) { return ''; }
      var html = '<ul class="ova-concepts">';
      for (var i = 0; i < concepts.length; i++) {
        html += '<li>' + escapeHtml(concepts[i]) + '</li>';
      }
      html += '</ul>';
      return html;
    }

    function renderModules(modules) {
      var html = '<section class="ova-section"><h2>Ruta de aprendizaje</h2><div class="ova-modules">';
      modules = modules || [];
      for (var i = 0; i < modules.length; i++) {
        var m = modules[i] || {};
        html += '<details class="ova-module" ' + (i === 0 ? 'open' : '') + '>';
        html += '<summary><span class="ova-module-number">' + (i + 1) + '</span>' + escapeHtml(m.title || ('Módulo ' + (i + 1))) + '</summary>';
        html += '<div class="ova-module-body">';
        html += '<p><strong>Objetivo:</strong> ' + escapeHtml(m.objective || '') + '</p>';
        html += '<h3>Conceptos clave</h3>' + renderConcepts(m.concepts);
        html += '<h3>Actividad sugerida</h3><div class="ova-rich">' + (m.activity || '') + '</div>';
        html += '</div></details>';
      }
      html += '</div></section>';
      return html;
    }

    function renderQuestions(questions) {
      questions = questions || [];
      var html = '<section class="ova-section"><h2>Autoevaluación</h2><p>Selecciona una respuesta y revisa la retroalimentación.</p><div class="ova-quiz">';
      for (var i = 0; i < questions.length; i++) {
        var q = questions[i] || {};
        html += '<div class="ova-question" data-question="' + i + '">';
        html += '<h3>Pregunta ' + (i + 1) + '</h3>';
        html += '<div class="ova-question-text">' + (q.questionText || '') + '</div>';
        html += '<div class="ova-options">';
        var options = q.options || [];
        for (var j = 0; j < options.length; j++) {
          var o = options[j] || {};
          html += '<button type="button" class="ova-option" data-correct="' + (o.correct ? 'true' : 'false') + '">' + escapeHtml(o.text || '') + '</button>';
        }
        html += '</div><div class="ova-feedback" aria-live="polite"></div>';
        html += '<div class="ova-hidden-feedback">' + (q.feedback || '') + '</div>';
        html += '</div>';
      }
      html += '</div></section>';
      return html;
    }

    self.attach = function ($container) {
      var html = '';
      html += '<div class="ova-discretas h5p-theme">';
      html += '<header class="ova-hero">';
      html += '<div class="ova-badge">OVA interactivo</div>';
      html += '<h1>' + escapeHtml(params.title || 'OVA: Matemáticas Discretas') + '</h1>';
      html += '<p class="ova-subtitle">' + escapeHtml(params.subtitle || '') + '</p>';
      html += '<div class="ova-meta"><span><strong>Integrantes:</strong> ' + escapeHtml(params.students || '') + '</span><span><strong>Institución:</strong> ' + escapeHtml(params.institution || '') + '</span><span><strong>Asignatura:</strong> ' + escapeHtml(params.course || '') + '</span></div>';
      html += '</header>';
      html += '<section class="ova-section"><h2>Presentación</h2><div class="ova-rich">' + (params.intro || '') + '</div></section>';
      html += renderModules(params.modules);
      html += renderQuestions(params.questions);
      html += '<section class="ova-section"><h2>Cierre y edición</h2><div class="ova-rich">' + (params.closing || '') + '</div><p class="ova-note">Puedes editar títulos, módulos, conceptos, actividades y preguntas desde el editor.</p></section>';
      html += '</div>';
      $container.addClass('h5p-ova-matematicas-discretas').html(html);

      $container.find('.ova-option').on('click', function () {
        var $btn = $(this);
        var $question = $btn.closest('.ova-question');
        var correct = $btn.attr('data-correct') === 'true';
        $question.find('.ova-option').removeClass('is-selected is-correct is-wrong');
        $btn.addClass('is-selected').addClass(correct ? 'is-correct' : 'is-wrong');
        var feedback = $question.find('.ova-hidden-feedback').html() || '';
        $question.find('.ova-feedback').html((correct ? '<strong>Correcto.</strong> ' : '<strong>Revisa otra vez.</strong> ') + feedback);
      });

      self.trigger('resize');
    };
  }

  OvaMatematicasDiscretas.prototype = Object.create(EventDispatcher.prototype);
  OvaMatematicasDiscretas.prototype.constructor = OvaMatematicasDiscretas;
  return OvaMatematicasDiscretas;
})(H5P.jQuery, H5P.EventDispatcher);
`;
}

function libraryStyles() {
  // Estilos propios del contenido H5P. No afectan a la app web principal.
  return `.ova-discretas {
  background: #f4f7f6;
  color: #1f2937;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.55;
  padding: 1rem;
}

.ova-hero {
  background: linear-gradient(135deg, #006b4f, #10a37f);
  border-radius: 1.25rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  color: #fff;
  padding: 2rem;
}

.ova-badge {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  display: inline-block;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.35rem 0.75rem;
}

.ova-hero h1 {
  font-size: clamp(2rem, 4vw, 3.3rem);
  margin: 0.75rem 0 0.25rem;
}

.ova-subtitle {
  font-size: 1.15rem;
  margin-top: 0.25rem;
  opacity: 0.95;
}

.ova-meta {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: 1.2rem;
}

.ova-meta span {
  background: rgba(255, 255, 255, 0.13);
  border-radius: 0.9rem;
  padding: 0.7rem 0.85rem;
}

.ova-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1.1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  margin: 1rem 0;
  padding: 1.35rem;
}

.ova-section h2 {
  color: #006b4f;
  margin-top: 0;
}

.ova-module {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  margin: 0.85rem 0;
  overflow: hidden;
}

.ova-module summary {
  background: #ecfdf5;
  color: #0f5132;
  cursor: pointer;
  font-weight: 800;
  list-style: none;
  padding: 1rem;
}

.ova-module summary::-webkit-details-marker {
  display: none;
}

.ova-module-number {
  background: #10a37f;
  border-radius: 999px;
  color: #fff;
  display: inline-grid;
  height: 1.85rem;
  margin-right: 0.6rem;
  place-items: center;
  width: 1.85rem;
}

.ova-module-body {
  padding: 1rem 1.15rem 1.25rem;
}

.ova-concepts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: 0;
}

.ova-concepts li {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  color: #166534;
  list-style: none;
  margin: 0;
  padding: 0.35rem 0.7rem;
}

.ova-question {
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 1rem;
  margin: 1rem 0;
  padding: 1rem;
}

.ova-question h3 {
  color: #1d4ed8;
  margin-top: 0;
}

.ova-options {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.8rem;
}

.ova-option {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 0.8rem;
  cursor: pointer;
  font: inherit;
  padding: 0.75rem 0.9rem;
  text-align: left;
}

.ova-option:hover {
  border-color: #10a37f;
  box-shadow: 0 3px 10px rgba(16, 163, 127, 0.15);
}

.ova-option.is-correct {
  background: #dcfce7;
  border-color: #16a34a;
}

.ova-option.is-wrong {
  background: #fee2e2;
  border-color: #dc2626;
}

.ova-feedback {
  background: #eef2ff;
  border-radius: 0.8rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
}

.ova-hidden-feedback {
  display: none;
}

.ova-note {
  background: #fff7ed;
  border-left: 4px solid #f97316;
  border-radius: 0.7rem;
  padding: 0.8rem;
}

.ova-rich table {
  border-collapse: collapse;
  width: 100%;
}

.ova-rich th,
.ova-rich td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
}
`;
}

buildPackage();
