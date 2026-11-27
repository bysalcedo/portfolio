# bysalcedo.com

Portfolio de Daniel Salcedo, ingeniero cloud. Astro estatico, bilingue (es por defecto, en en `/en/`),
servido por nginx desde el cluster Ebro (y despues desde una VM de Oracle Cloud) detras de Cloudflare Tunnel.

## Desarrollo

```bash
npm ci
npm run dev                     # los borradores (draft: true) se ven en dev
SHOW_DRAFTS=1 npm run build     # build local con borradores, para revisarlos
npm run sanitize                # IPs, MACs, UUIDs, hostnames internos y SANITIZE_DENYLIST
```

## Contenido

| Que | Donde |
|---|---|
| CV resumido (el completo no se publica) | `src/data/cv.{es,en}.yaml` |
| Casos de estudio | `src/content/cases/{es,en}/*.md` |
| Postmortems | `src/content/blog/{es,en}/*.md` |
| Textos de la interfaz | `src/i18n/ui.ts` |

Una entrada solo se publica con `draft: false`. Si falta la version inglesa, `/en/` sirve la espanola
marcada como `ES`.

Sin fotos: el diseno es solo tipografia (Archivo Black para titulares, monoespaciada para etiquetas)
sobre la paleta de /bySalcedo. `public/og.png` se genera a mano con el mismo estilo que el hero.

## Imagen

CI (`.github/workflows/ci.yml`) construye el sitio, comprueba enlaces y publica
`ghcr.io/bysalcedo/portfolio:<sha8>` para amd64 y arm64 en cada push a `main`. El tag desplegado no
lo toca CI: se sube con un PR en k3s-rancher.

nginx (`nginx/`) pone las cabeceras de seguridad y responde `/served-by.json` con el pod y el nodo
(`NODE_NAME`) que sirven la visita, y `/healthz`.
