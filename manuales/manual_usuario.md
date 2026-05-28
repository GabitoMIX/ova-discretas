# Objeto Virtual de Aprendizaje (OVA): Matemáticas Discretas
## Manual De Usuario

Este manual explica cómo usar el OVA final de Matemáticas Discretas. El recurso funciona como un sitio web estático: puede abrirse desde `index.html` o publicarse en GitHub Pages.

## 1. Acceso Al OVA

El estudiante puede acceder de dos formas:

* **Local:** abrir `index.html` en el navegador.
* **Web:** entrar al enlace publicado en GitHub Pages.

No se requiere iniciar sesión, instalar programas ni conectar una base de datos.

## 2. Pantalla Principal

La pantalla inicial muestra la ruta de aprendizaje con seis módulos:

1. **Lógica proposicional.**
2. **Conjuntos y diagramas de Venn.**
3. **Alfabetos, cadenas y lenguajes.**
4. **Espacios muestrales y eventos.**
5. **Variables aleatorias y distribución binomial.**
6. **Grafos.**

Cada tarjeta permite entrar al módulo correspondiente. La barra lateral muestra progreso, accesos principales, sonido, tema visual y reinicio.

## 3. Barra Lateral

La barra lateral incluye:

* **Inicio:** regresa a la ruta principal.
* **Pruebas libres:** abre el playground global.
* **Modo claro / oscuro:** cambia la apariencia visual.
* **Sonido:** activa o desactiva sonidos y narración.
* **Reiniciar progreso:** borra el avance guardado en el navegador actual.

En pantallas pequeñas funciona como menú desplegable.

## 4. Módulos

Cada módulo tiene cuatro pestañas:

### 4.1 Teoría Y Guía

Incluye conceptos clave, ejemplo guiado, contenido ampliado, enfoque profesional y guía de estudio.

### 4.2 Laboratorio

Permite experimentar con simuladores matemáticos interactivos.

### 4.3 Evaluación Y Juego

Incluye minijuegos y autoevaluaciones con retroalimentación inmediata.

### 4.4 Pruebas Libres

Permite probar entradas propias dentro del tema actual.

## 5. Evaluación Final Y Certificado

El progreso se guarda automáticamente en `localStorage`. Cuando el estudiante completa la ruta, puede presentar la evaluación final.

Si obtiene 80% o más, el sistema permite generar un certificado digital imprimible desde el navegador.

## 6. LaTeX, Audio Y Accesibilidad

Las fórmulas se renderizan con MathJax. Si MathJax no carga, el OVA usa un fallback local para mantener las expresiones legibles.

Los botones de audio usan `speechSynthesis` para leer contenido teórico en voz alta. La lectura se detiene al cambiar de vista o pestaña.

## 7. Material De Apoyo

Cada módulo enlaza PDFs del aula ubicados en `COSAS DEL AULA/`.

También se incluyen manuales en `manuales/`:

* `manual_usuario.pdf`
* `manual_implementacion.pdf`
* `manual_codigo_arquitectura.pdf`

## 8. Versión H5P / Lumi

Además de la app web completa, el proyecto incluye:

```text
dist/OVA_Matematicas_Discretas_Lumi_Importable.h5p
```

Este archivo se abre desde Lumi Desktop en **Editor de H5P > Abrir archivo H5P**. La versión H5P contiene módulos, conceptos clave, actividades sugeridas y preguntas de autoevaluación. La versión web estática conserva la experiencia completa con laboratorios, playgrounds, progreso, sonidos y certificado.
