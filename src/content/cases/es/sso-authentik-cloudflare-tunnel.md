---
title: Un login para treinta servicios, sin puertos
description: Identidad centralizada con Authentik (OIDC y ForwardAuth) y exposición a internet por Cloudflare Tunnel, con WAF y CrowdSec delante.
date: 2026-09-25
draft: false
kind: Identidad y red
order: 4
stack: [Authentik, OIDC, Traefik, Cloudflare Tunnel, Cloudflare WAF, CrowdSec]
result: Ningún puerto abierto en el router; cada aplicación nueva entra con SSO en el mismo cambio de GitOps que la despliega.
---

## Contexto

Cada aplicación traía su propio sistema de usuarios. Treinta contraseñas, ninguna con segundo
factor y ninguna forma de dar de baja a alguien en un sitio.

## Diseño

- **Authentik como proveedor de identidad.** Orden de preferencia: OIDC nativo de la aplicación
  y, si no lo soporta, ForwardAuth en Traefik. El login local de la aplicación se desactiva
  cuando se puede.
- **Configuración declarativa.** Proveedores, aplicaciones, grupos y branding se definen en
  blueprints versionados en git. Ninguna aplicación se configura a mano en la UI.
- **Regla de plataforma:** una aplicación web nueva no está terminada hasta que tiene SSO. Las
  excepciones se documentan con motivo técnico, riesgo aceptado y fecha de revisión.
- **Exposición con Cloudflare Tunnel.** El cluster abre una conexión saliente; no hay puertos
  abiertos ni IP pública que proteger. De Authentik solo se publican las rutas OIDC: el panel
  de administración y el login interactivo no son alcanzables desde fuera.
- **Defensa en capas delante:** WAF gestionado en toda la zona, rate limiting por ruta,
  bot fight mode, TLS 1.3 y DNSSEC; dentro, CrowdSec con AppSec como plugin de Traefik.

## Decisiones discutibles

Durante un tiempo puse Cloudflare Access delante de algunas aplicaciones, además del SSO. Lo
retiré: obligaba a configurar cabeceras o tokens de servicio en cada cliente (apps móviles,
clientes WebDAV) y duplicaba la autenticación sin añadir una garantía real sobre OIDC con
contraseña desactivada. Menos piezas, mismo nivel de seguridad.

## Lo que aprendí

- La regla de "SSO en el mismo cambio que el despliegue" funciona porque es barata de cumplir:
  hay una plantilla y un checklist.
- Un cambio en DNS interno puede romper el login de una aplicación que tiene protección SSRF:
  pasó al hacer que los nombres públicos resolvieran a la IP interna. Hay que probar el login
  de cada app tras tocar la resolución.
