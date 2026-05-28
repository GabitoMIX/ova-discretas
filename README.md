# Landing de presentación del OVA

Esta rama contiene una página estática para presentar el proyecto **OVA Matemáticas Discretas** con un estilo visual tipo landing.

## Qué contiene

- `index.html`: página principal de presentación.
- `showcase.css`: estilos visuales de la landing.
- `showcase.js`: menú responsive y botón para copiar la configuración sugerida.
- `assets/ova-showcase-logo.svg`: logo de la landing.
- `assets/ova/`: visuales del OVA reutilizados en la presentación.
- `manuales/`: manuales descargables.
- `dist/`: paquete H5P/Lumi.

## Publicación sugerida en Dokploy

Configurar como sitio estático:

```text
Rama: ova-showcase-dokploy
Tipo: sitio estático
Directorio raíz: /
Build command: sin comando
Publish directory: /
Entrada: index.html
```

No requiere backend, base de datos ni proceso de build.

## Validación local

Abrir directamente:

```text
index.html
```

También se puede revisar sintaxis del JS:

```bash
node --check showcase.js
```
