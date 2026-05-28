# OVA Matemáticas Discretas

[![App estática](https://img.shields.io/badge/app-HTML%20%2B%20CSS%20%2B%20JS-006b3f)](#)
[![GitHub Pages](https://img.shields.io/badge/hosting-GitHub%20Pages-24292f)](#publicaci%C3%B3n-en-github-pages)
[![H5P](https://img.shields.io/badge/H5P-Lumi%20importable-10a37f)](#entrega-h5p--lumi)
[![Manuales](https://img.shields.io/badge/manuales-PDF%20incluidos-ffd166)](#manuales)

Objeto Virtual de Aprendizaje interactivo para la asignatura **Matemáticas Discretas**, orientado al programa de **Ingeniería de Sistemas**.

El proyecto es una aplicación estática: solo usa **HTML, CSS y JavaScript**. No requiere backend, base de datos, servidor de aplicación ni proceso de compilación para funcionar. Puede abrirse localmente con `index.html` o publicarse directamente en **GitHub Pages**.

## Tabla De Contenido

- [Descripción General](#descripci%C3%B3n-general)
- [Características](#caracter%C3%ADsticas)
- [Módulos Incluidos](#m%C3%B3dulos-incluidos)
- [Entrega H5P / Lumi](#entrega-h5p--lumi)
- [Estructura Del Proyecto](#estructura-del-proyecto)
- [Ejecución Local](#ejecuci%C3%B3n-local)
- [Publicación En GitHub Pages](#publicaci%C3%B3n-en-github-pages)
- [Manuales](#manuales)
- [Scripts NPM](#scripts-npm)
- [Preparación Para GitHub](#preparaci%C3%B3n-para-github)
- [Personalización](#personalizaci%C3%B3n)
- [Validaciones](#validaciones)
- [Autores](#autores)

## Descripción General

El OVA funciona como material complementario para estudiar, practicar y autoevaluar conceptos fundamentales de Matemáticas Discretas. Todo el estado del estudiante se guarda en el navegador mediante `localStorage`.

La experiencia incluye:

- Ruta de aprendizaje por módulos.
- Explicaciones breves, ejemplos guiados y guías de estudio.
- Laboratorios interactivos por tema.
- Playground global con pruebas libres.
- Mini juegos y actividades extra.
- Autoevaluaciones con retroalimentación inmediata.
- Evaluación final integradora y certificado imprimible.
- Renderizado matemático con MathJax y fallback local.
- Audio, efectos de sonido y lectura por voz con `speechSynthesis`.
- Modo claro y oscuro.
- Material PDF de apoyo enlazado desde cada módulo.
- Paquete `.h5p` importable en Lumi como versión formal complementaria.

## Características

| Característica | Descripción |
| --- | --- |
| App estática | Desarrollada con HTML, CSS y JavaScript puro. |
| GitHub Pages ready | Puede publicarse desde la rama principal sin build. |
| LaTeX | Fórmulas renderizadas con MathJax v3 y fallback local. |
| Laboratorios | Simuladores para lógica, conjuntos, cadenas, probabilidad, binomial y grafos. |
| Playground | Zona libre para probar proposiciones, conjuntos, cadenas, eventos, binomial y grafos personalizados. |
| Actividades extra | Clasificación de símbolos, selector de evento, validador de cadenas, juez euleriano y reto binomial. |
| Audio | Efectos sonoros generados en navegador y narración por voz. |
| Progreso | Avance, respuestas y preferencias guardadas en `localStorage`. |
| Responsive | Adaptado para escritorio, tablet y móvil. |
| H5P / Lumi | Incluye `dist/OVA_Matematicas_Discretas_Lumi_Importable.h5p` como paquete importable en Lumi. |

## Módulos Incluidos

| Módulo | Tema | Laboratorio | Material |
| --- | --- | --- | --- |
| 1 | Lógica proposicional | Tabla de verdad dinámica y clasificación de expresiones | `PROPOSICIONES LOGICAS.pdf` |
| 2 | Conjuntos y diagramas de Venn | Operaciones entre conjuntos y visualización de regiones | `MAT DIS CONJUNTOS.pdf` |
| 3 | Alfabetos, cadenas y lenguajes | Longitud, reversa, potencia, prefijos, sufijos y validación formal | `Taller_Cadenas_Lenguajes_.pdf` |
| 4 | Espacios muestrales y eventos | Experimentos con dados, monedas y eventos discretos | `5. espacio muestral y eventos.pdf` |
| 5 | Variables aleatorias y distribución binomial | Calculadora binomial y gráfica de distribución | `Variables Aleatorias y Distribución Binomial.pdf` |
| 6 | Grafos | Visualización, grados, listas y matrices de adyacencia | `grafos.pdf` |

## Entrega H5P / Lumi

Además de la app web completa, el repositorio incluye una versión H5P importable para cubrir el requisito formal de la propuesta:

```text
dist/
|-- OVA_Matematicas_Discretas_Lumi_Importable.h5p
`-- README_H5P_ENTREGA.md
```

Uso en Lumi Desktop:

1. Abrir Lumi.
2. Entrar a **Editor de H5P**.
3. Usar la opción de abrir/importar archivo H5P.
4. Seleccionar `dist/OVA_Matematicas_Discretas_Lumi_Importable.h5p`.
5. Presentarlo junto con el sitio web estático, que contiene la experiencia completa.

Para regenerarlo:

```bash
npm run h5p
```

## Estructura Del Proyecto

```text
ova-discretas/
|-- index.html
|-- styles.css
|-- app.js
|-- README.md
|-- package.json
|-- package-lock.json
|-- generate_pdfs.js
|-- generate_h5p_package.js
|-- propuesta_ova_matematicas_discretas.pdf
|-- dist/
|   |-- OVA_Matematicas_Discretas_Lumi_Importable.h5p
|   `-- README_H5P_ENTREGA.md
|-- assets/
|   `-- ova/
|       |-- portada.svg
|       |-- venn.svg
|       |-- probabilidad.svg
|       `-- grafo.svg
|-- resoucers/
|   |-- logo_institucional.png
|   |-- Logo_de_la_Universidad_Simón_Bolívar.svg.png
|   `-- centrodocumentos_20191115083820_0.pdf
|-- COSAS DEL AULA/
|   |-- PROPOSICIONES LOGICAS.pdf
|   |-- MAT DIS CONJUNTOS.pdf
|   |-- Taller_Cadenas_Lenguajes_.pdf
|   |-- 5. espacio muestral y eventos.pdf
|   |-- Variables Aleatorias y Distribución Binomial.pdf
|   `-- grafos.pdf
`-- manuales/
    |-- manual_usuario.md
    |-- manual_usuario.pdf
    |-- manual_implementacion.md
    |-- manual_implementacion.pdf
    |-- manual_codigo_arquitectura.md
    `-- manual_codigo_arquitectura.pdf
```

> Nota: la carpeta `resoucers/` conserva ese nombre porque la app ya referencia esa ruta. Si se renombra a `resources/`, también deben actualizarse las referencias internas.

## Ejecución Local

Como es una app estática, puede abrirse directamente:

```text
index.html
```

No se necesita instalar dependencias para usar el OVA. `npm` solo se usa si se desean regenerar manuales o el paquete H5P.

## Publicación En GitHub Pages

1. Subir el repositorio a GitHub.
2. Entrar al repositorio en GitHub.
3. Ir a **Settings > Pages**.
4. En **Build and deployment**, seleccionar **Deploy from a branch**.
5. Elegir la rama principal, normalmente `main`.
6. Seleccionar la carpeta raíz `/ (root)`.
7. Guardar.

GitHub Pages publicará el OVA en una URL similar a:

```text
https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/
```

Como `index.html` está en la raíz, no se requiere build ni configuración adicional.

## Manuales

El proyecto incluye manuales en Markdown y PDF:

- Manual de usuario.
- Manual de implementación.
- Manual de código y arquitectura.

Para regenerar los PDF:

```bash
npm install
npm run manuales
```

## Scripts NPM

| Script | Uso |
| --- | --- |
| `npm run check:js` | Valida sintaxis de `app.js`. |
| `npm run manuales` | Regenera los manuales PDF desde Markdown. |
| `npm run h5p` | Regenera el archivo `.h5p` importable en Lumi y su nota de entrega. |

## Preparación Para GitHub

Antes de subir o entregar el repositorio:

```bash
npm install
npm run check:js
node --check generate_h5p_package.js
node --check generate_pdfs.js
npm run manuales
npm run h5p
```

Archivos que deben estar visibles en GitHub:

- `index.html`, `styles.css`, `app.js`.
- `README.md`.
- `manuales/*.md` y `manuales/*.pdf`.
- `dist/OVA_Matematicas_Discretas_Lumi_Importable.h5p`.
- `dist/README_H5P_ENTREGA.md`.
- `assets/`, `resoucers/` y `COSAS DEL AULA/`.

Archivos y carpetas que no deben subirse:

- `node_modules/`.
- `.env`.
- archivos temporales del sistema operativo.

## Personalización

El contenido principal se edita en `app.js`:

| Bloque | Uso |
| --- | --- |
| `modules` | Títulos, objetivos, ejemplos, material y preguntas por módulo. |
| `moduleDeepDives` | Contenido ampliado. |
| `moduleSystemsFocus` | Aplicaciones a Ingeniería de Sistemas. |
| `moduleLabChallenges` | Retos guiados de laboratorio. |
| `moduleGames` | Mini juegos de clasificación. |
| `interactiveActivities` | Actividades extra. |
| `moduleStudyGuides` | Guías de estudio. |
| `finalQuestions` | Evaluación final. |

Los estilos visuales se editan en `styles.css`.

## Validaciones

Validaciones ejecutadas para esta versión:

```bash
node --check app.js
node --check generate_h5p_package.js
node --check generate_pdfs.js
npm run manuales
npm run h5p
```

El paquete H5P generado contiene:

- `h5p.json`
- `content/content.json`
- `library.json`
- `semantics.json`
- `scripts/ova.js`
- `styles/ova.css`

## Autores

- Gabriel Argenis Medina Carrero
- Joel Pineda

Proyecto académico para Matemáticas Discretas, Universidad Simón Bolívar.
