# Objeto Virtual de Aprendizaje (OVA): Matemáticas Discretas
## Manual De Implementación

Este manual describe cómo preparar, validar y publicar el OVA final como sitio estático en GitHub Pages.

---

## 1. Requisitos

Para usar el OVA no se requiere instalación. Basta con un navegador moderno.

Para regenerar artefactos de entrega se recomienda tener:

* Node.js.
* Git.
* Lumi Desktop, solo si se desea abrir o revisar el archivo `.h5p`.

---

## 2. Archivos Principales

```text
index.html
styles.css
app.js
README.md
package.json
package-lock.json
generate_pdfs.js
generate_h5p_package.js
manuales/
dist/
assets/
resoucers/
COSAS DEL AULA/
```

La carpeta `resoucers/` conserva ese nombre porque la aplicación ya referencia esa ruta.

---

## 3. Preparación Antes De Subir A GitHub

Desde la raíz del repositorio:

```bash
npm install
npm run check:js
node --check generate_h5p_package.js
node --check generate_pdfs.js
npm run manuales
npm run h5p
```

Estos comandos validan JavaScript, regeneran manuales PDF y reconstruyen el paquete H5P final.

---

## 4. Ejecución Local

Abrir directamente:

```text
index.html
```

No hay paso de build. Los scripts de `npm` son herramientas auxiliares, no son necesarios para ejecutar el OVA.

---

## 5. Publicación En GitHub Pages

1. Subir el repositorio a GitHub.
2. Entrar a **Settings > Pages**.
3. En **Build and deployment**, seleccionar **Deploy from a branch**.
4. Elegir la rama principal, normalmente `main`.
5. Seleccionar la carpeta raíz `/ (root)`.
6. Guardar.

La aplicación quedará disponible en:

```text
https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/
```

Como `index.html` está en la raíz, GitHub Pages lo sirve automáticamente.

---

## 6. Generación De Manuales

Los manuales Markdown se encuentran en `manuales/`. Los PDF se generan con PDFKit:

```bash
npm run manuales
```

El script `generate_pdfs.js` produce:

* `manuales/manual_usuario.pdf`
* `manuales/manual_implementacion.pdf`
* `manuales/manual_codigo_arquitectura.pdf`

---

## 7. Generación Del Paquete H5P

El archivo H5P se reconstruye con:

```bash
npm run h5p
```

El script `generate_h5p_package.js` genera:

* `dist/OVA_Matematicas_Discretas_Lumi_Importable.h5p`
* `dist/README_H5P_ENTREGA.md`

El H5P usa la librería `H5P.OvaMatematicasDiscretas` y sirve como versión editable/importable en Lumi.

---

## 8. Validaciones Recomendadas

Antes de entregar:

```bash
node --check app.js
node --check generate_h5p_package.js
node --check generate_pdfs.js
npm run manuales
npm run h5p
```

También se recomienda abrir `index.html` en el navegador y revisar:

* carga de portada,
* navegación entre módulos,
* renderizado de fórmulas,
* apertura de PDFs,
* evaluación final,
* certificado.

---

## 9. Notas De Operación

* El progreso se guarda en el navegador con `localStorage`.
* MathJax se carga desde CDN y tiene fallback local.
* Los sonidos se generan con Web Audio API.
* La narración usa `speechSynthesis`.
* El certificado final se imprime desde el navegador.
* El sitio no requiere backend ni proceso de compilación.
