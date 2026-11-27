# El sitio se construye en CI (npm run build) antes de esta imagen:
# aqui solo se copia dist/, asi el multi-arch (amd64 para el cluster, arm64 para OCI) no compila nada.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:782bb89768cc87b7f95c18b95baa1af250e5d451f26794f59363540161147c01

# Lo sobreescribe el Deployment con el nombre del nodo (downward API) o el compose de OCI.
ENV NODE_NAME=desconocido

# dist-preview: build con SHOW_DRAFTS=1 para la imagen <sha8>-preview de la instancia de revision.
ARG DIST=dist

COPY --chown=101:101 nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chown=101:101 nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --chown=101:101 ${DIST}/ /usr/share/nginx/html/

EXPOSE 8080
