# Despliegue en Dokploy y proxy por Cosmos

## Dokploy

1. Sube este repositorio a GitHub, GitLab o al proveedor que uses con Dokploy.
2. Crea una aplicacion nueva en Dokploy.
3. Selecciona despliegue por `Dockerfile` desde el repositorio.
4. Usa el puerto interno `8080`.
5. Verifica que el healthcheck responda en `/health`.

Tambien puedes usar `compose.yml` si prefieres crear el servicio como Compose.

## Variables de entorno

No requiere variables de entorno. Es una app estatica servida por Nginx.

## Proxy inverso por Cosmos

Configura un proxy hacia el servicio de Dokploy:

- Dominio: el subdominio que quieras usar para el OVA.
- Protocolo upstream: `http`.
- Host/IP upstream: IP o nombre interno del servidor donde corre Dokploy.
- Puerto upstream: `8080` si expones el puerto directo, o el puerto/red interna que Dokploy asigne.
- Ruta: `/`.
- TLS: activalo en Cosmos si vas a servirlo por HTTPS.

La app no usa WebSockets ni rutas API. Con `try_files` de Nginx cualquier ruta del frontend vuelve a `index.html`.

## Comprobacion rapida

```bash
curl http://localhost:8080/health
```

Debe responder:

```text
ok
```
