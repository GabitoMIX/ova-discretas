# OVA Matematicas Discretas

[![Static App](https://img.shields.io/badge/app-static%20HTML%2FCSS%2FJS-0f766e)](#)
[![Docker](https://img.shields.io/badge/docker-ready-2563a8)](#ejecucion-con-docker)
[![Nginx](https://img.shields.io/badge/server-nginx%20alpine-d97706)](#arquitectura)
[![Deploy](https://img.shields.io/badge/deploy-Dokploy%20%2B%20Cosmos-17211b)](#despliegue)

Objeto Virtual de Aprendizaje interactivo para la asignatura **Matematicas Discretas** del programa de Ingenieria de Sistemas.

Este proyecto convierte la propuesta del OVA en una aplicacion web estatica, lista para abrir localmente, servir con Docker, desplegar en Dokploy y publicar mediante proxy inverso en Cosmos.

## Tabla de contenido

- [Descripcion general](#descripcion-general)
- [Caracteristicas](#caracteristicas)
- [Modulos incluidos](#modulos-incluidos)
- [Tecnologias](#tecnologias)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecucion local sin Docker](#ejecucion-local-sin-docker)
- [Ejecucion con Docker](#ejecucion-con-docker)
- [Pruebas realizadas](#pruebas-realizadas)
- [Despliegue](#despliegue)
- [Proxy inverso con Cosmos](#proxy-inverso-con-cosmos)
- [Personalizacion](#personalizacion)
- [Solucion de problemas](#solucion-de-problemas)
- [Autores](#autores)

## Descripcion general

El OVA esta pensado como recurso de apoyo para repasar, practicar y autoevaluar conceptos fundamentales de Matematicas Discretas. No reemplaza la clase presencial: sirve como material complementario para estudiar antes de parciales, talleres o socializaciones.

La aplicacion incluye:

- Explicaciones breves por modulo.
- Ejemplos guiados.
- Laboratorios interactivos.
- Contenido ampliado con ideas clave y aplicaciones en Ingenieria de Sistemas.
- Guias de estudio completas con definiciones, procedimientos, ejemplos resueltos y ejercicios extra.
- Mini juegos por modulo con puntaje y retroalimentacion.
- Preguntas de practica con retroalimentacion inmediata.
- Evaluacion final.
- Guardado de progreso en el navegador.
- Ilustraciones SVG por tema.
- Animaciones y microinteracciones.
- Sonidos opcionales generados desde el navegador.
- Notacion matematica estilo LaTeX renderizada localmente.

Todo funciona como frontend estatico. No hay base de datos, backend, autenticacion ni servicios externos obligatorios.

## Caracteristicas

| Caracteristica | Descripcion |
| --- | --- |
| App estatica | Construida con HTML, CSS y JavaScript puro. |
| Docker ready | Incluye `Dockerfile`, `compose.yml` y configuracion Nginx. |
| Healthcheck | Expone `/health` para validaciones de contenedor y proxy. |
| Sin dependencias runtime | No necesita `npm install` para ejecutarse. |
| LaTeX local | Renderizador local para simbolos, fracciones, binomiales y notacion matematica usada en el OVA. |
| Multimedia ligera | Ilustraciones SVG, animaciones, sonidos y celebraciones visuales. |
| Guias de estudio | Cada modulo incluye definiciones, procedimiento, ejemplo resuelto y ejercicios extra. |
| Mini juegos | Cada modulo incluye un reto de clasificacion para reforzar conceptos. |
| Progreso persistente | Usa `localStorage` para guardar avance, respuestas y calificacion. |
| Responsive | Interfaz adaptable a escritorio, tablet y movil. |
| Deploy simple | Preparado para Dokploy y proxy inverso por Cosmos. |

## Modulos incluidos

| Modulo | Tema | Practica interactiva |
| --- | --- | --- |
| 1 | Logica proposicional | Tabla de verdad dinamica y juego de clasificacion de expresiones. |
| 2 | Conjuntos y diagramas de Venn | Operaciones entre conjuntos y juego de operaciones. |
| 3 | Alfabetos, cadenas y lenguajes | Longitud, reversa, potencia, prefijos y juego de fragmentos. |
| 4 | Espacios muestrales y eventos | Experimentos con dado, moneda y juego de eventos. |
| 5 | Variables aleatorias y distribucion binomial | Calculadora binomial, grafica de barras y juego de parametros. |
| 6 | Grafos | Visualizacion de grafos, listas, matrices y juego de conceptos. |

Ademas, la evaluacion final recoge preguntas de todos los modulos para revisar comprension general.

## Tecnologias

- **HTML5** para la estructura.
- **CSS3** para layout, responsive, animaciones y estilo visual.
- **JavaScript puro** para interactividad, progreso, quizzes, laboratorios y sonidos.
- **SVG inline** para ilustraciones tematicas sin depender de imagenes externas.
- **Nginx Alpine** como servidor estatico dentro del contenedor.
- **Docker Compose** para ejecucion local y despliegue.

## Estructura del proyecto

```text
ova-discretas/
|-- index.html
|-- styles.css
|-- app.js
|-- Dockerfile
|-- compose.yml
|-- nginx.conf
|-- DEPLOY.md
|-- README.md
|-- .dockerignore
|-- .gitignore
|-- propuesta_ova_h5p_lumi_matematicas_discretas.pdf
`-- COSAS DEL AULA/
```

### Archivos principales

| Archivo | Funcion |
| --- | --- |
| `index.html` | Entrada principal de la aplicacion. |
| `styles.css` | Estilos, responsive, animaciones, tarjetas, graficas y celebraciones. |
| `app.js` | Contenido del OVA, logica interactiva, quizzes, progreso, sonidos y renderizado matematico. |
| `Dockerfile` | Imagen de produccion basada en Nginx Alpine. |
| `compose.yml` | Servicio Docker local para construir y levantar el OVA. |
| `nginx.conf` | Configuracion del servidor estatico y endpoint `/health`. |
| `DEPLOY.md` | Guia corta de despliegue en Dokploy y proxy por Cosmos. |

## Ejecucion local sin Docker

Como la app es estatica, puedes abrir directamente:

```text
index.html
```

En Windows, basta con doble clic sobre el archivo o abrirlo desde el navegador.

Esta forma sirve para revisar rapidamente el contenido, pero para simular el entorno de produccion se recomienda Docker.

## Ejecucion con Docker

### Requisitos

- Docker Desktop instalado.
- Docker daemon iniciado.
- Puerto `8080` disponible en la maquina.

### Levantar el proyecto

Desde la raiz del repositorio:

```bash
docker compose -f compose.yml up --build -d
```

Luego abre:

```text
http://localhost:8080
```

### Verificar healthcheck

```bash
curl http://localhost:8080/health
```

Respuesta esperada:

```text
ok
```

### Ver estado del contenedor

```bash
docker compose -f compose.yml ps
```

El servicio debe aparecer como `Up` y `healthy`.

### Apagar el servicio

```bash
docker compose -f compose.yml down
```

## Pruebas realizadas

Se probo el proyecto con Docker Compose:

```bash
docker compose -f compose.yml up --build -d
```

Resultado validado:

- La imagen se construyo correctamente.
- El contenedor inicio correctamente.
- El puerto `8080` quedo publicado.
- `/health` respondio `200 ok`.
- La pagina principal respondio `200`.
- El navegador cargo el titulo `OVA Matematicas Discretas`.
- Se detectaron los 6 modulos.
- Se detectaron las 6 ilustraciones SVG de tarjetas.
- Se valido contenido ampliado dentro de los modulos.
- Se valido guia de estudio completa con definiciones y ejercicios extra.
- Se valido mini juego con 4 tarjetas y puntaje.
- El boton de sonido cargo como `Sonido activado`.
- La notacion matematica no mostro delimitadores crudos.
- El contenedor quedo en estado `healthy`.

## Despliegue

### Opcion recomendada: Dokploy con Dockerfile

1. Sube el repositorio a GitHub.
2. En Dokploy, crea una nueva aplicacion.
3. Selecciona el repositorio del OVA.
4. Usa despliegue por `Dockerfile`.
5. Configura el puerto interno como:

```text
8080
```

6. Configura healthcheck en:

```text
/health
```

7. Despliega la aplicacion.

### Opcion alternativa: Dokploy con Compose

Tambien puedes usar `compose.yml` si prefieres que Dokploy gestione el servicio por Docker Compose.

El servicio expone:

```text
8080:8080
```

## Proxy inverso con Cosmos

Para publicar el OVA con Cosmos, crea una ruta de proxy hacia la app desplegada.

Configuracion sugerida:

| Campo | Valor |
| --- | --- |
| Protocolo upstream | `http` |
| Host upstream | IP, host interno o nombre del servicio donde corre Dokploy |
| Puerto upstream | `8080` o el puerto que asigne Dokploy |
| Ruta | `/` |
| WebSockets | No requerido |
| TLS/HTTPS | Activar en Cosmos si usaras dominio publico |
| Healthcheck | `/health` |

La app no usa backend ni WebSockets. Nginx esta configurado para servir archivos estaticos y devolver `index.html` cuando corresponda.

## Personalizacion

### Editar contenido de modulos

El contenido principal esta en `app.js`, dentro del arreglo:

```js
const modules = [
  // modulos del OVA
];
```

Alli puedes cambiar:

- Titulos.
- Descripciones.
- Conceptos clave.
- Ejemplos.
- Preguntas.
- Opciones.
- Retroalimentacion.

### Editar contenido ampliado

El contenido extra de cada modulo esta en:

```js
const moduleDeepDives = {
  // contenido ampliado por modulo
};
```

Cada entrada incluye:

- Enfoque del tema.
- Ideas clave.
- Aplicacion en Ingenieria de Sistemas.

### Editar guias de estudio

Las guias completas estan en:

```js
const moduleStudyGuides = {
  // definiciones, procedimiento, ejemplo resuelto y ejercicios extra
};
```

Cada modulo puede incluir:

- Definiciones esenciales.
- Procedimiento recomendado paso a paso.
- Ejemplo resuelto.
- Ejercicios extra con solucion desplegable.

### Editar mini juegos

Los juegos estan en:

```js
const moduleGames = {
  // mini juegos por modulo
};
```

Cada juego permite configurar:

- Titulo.
- Instruccion.
- Categorias.
- Tarjetas.
- Respuesta correcta.
- Pista o retroalimentacion.

### Editar evaluacion final

La evaluacion final esta en:

```js
const finalQuestions = [
  // preguntas finales
];
```

Cada pregunta tiene:

- Enunciado.
- Opciones.
- Indice de respuesta correcta.

### Editar estilos

La apariencia se controla desde:

```text
styles.css
```

Se pueden ajustar colores, espaciados, animaciones, tarjetas, tipografia y responsive.

### Editar despliegue

Los archivos de despliegue son:

```text
Dockerfile
compose.yml
nginx.conf
```

El puerto interno actual es `8080`.

## Datos guardados en el navegador

El OVA usa `localStorage` para guardar:

- Modulos completados.
- Respuestas de quizzes.
- Respuestas de evaluacion final.
- Calificacion final.
- Preferencia de sonido.

El boton **Reiniciar progreso** borra el avance guardado del navegador actual.

## Solucion de problemas

### El puerto 8080 esta ocupado

Cambia el puerto publicado en `compose.yml`:

```yaml
ports:
  - "8081:8080"
```

Luego entra por:

```text
http://localhost:8081
```

### Docker no conecta al daemon

Verifica que Docker Desktop este abierto y que el daemon este corriendo:

```bash
docker info
```

### El contenedor no queda healthy

Revisa logs:

```bash
docker compose -f compose.yml logs
```

Y prueba:

```bash
curl http://localhost:8080/health
```

### No se escuchan sonidos

Los navegadores suelen permitir audio solo despues de una interaccion del usuario. Haz clic en algun boton del OVA y verifica que el boton lateral diga:

```text
Sonido activado
```

### No aparece el progreso esperado

El progreso se guarda por navegador. Si abres otro navegador, perfil o modo incognito, puede aparecer desde cero.

## Estado del proyecto

Estado actual:

- OVA funcional.
- Docker probado.
- Healthcheck configurado.
- Listo para subir a GitHub.
- Listo para desplegar en Dokploy.
- Listo para publicar con proxy inverso por Cosmos.

## Autores

- Gabriel Argenis Medina Carrero.
- Joel Pineda.

Proyecto academico para la asignatura **Matematicas Discretas**.
