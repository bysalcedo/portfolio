---
title: github.com no existía para los pods Alpine
description: Con el dominio de casa en la lista de búsqueda y DNSSEC en la zona, musl daba por perdido cualquier nombre externo. glibc ni se enteraba.
date: 2026-10-23
draft: false
format: postmortem
stack: [Kubernetes, DNS, DNSSEC, musl, RKE2, Ansible]
---

## Síntoma

Algunos pods no conseguían resolver nombres externos tan normales como `github.com`. No todos:
solo los basados en Alpine. Hasta una imagen de diagnóstico de red fallaba si el nombre iba sin
punto final.

## Causa

Tres piezas que por separado son correctas:

1. Los nodos tienen el dominio de casa en `search`, y kubelet copia esa lista al
   `resolv.conf` de cada pod. Así, `github.com` se prueba primero como
   `github.com.<dominio-de-casa>`.
2. La zona tiene DNSSEC, y Cloudflare usa *compact denial*: a un nombre que no existe no
   responde NXDOMAIN, sino NOERROR sin datos (NODATA).
3. glibc, ante NODATA, sigue con el siguiente candidato y acaba probando `github.com.`. **musl
   corta la búsqueda en cuanto un dominio de la lista da NODATA**, y devuelve error.

En un pod Debian todo funcionaba; en uno Alpine, `github.com` moría en el primer intento.

## Arreglo

Un `resolv.conf` propio para kubelet, sin `search`, con la opción nativa de RKE2
(`resolv-conf`) gestionada desde Ansible. Los nodos no cambian: solo lo que reciben los pods.

Antes de aplicarlo comprobé que ningún manifiesto dependía de nombres cortos del dominio de
casa. El cambio se desplegó nodo a nodo sin drenar, porque reiniciar el agente no mata pods y
solo afecta a los pods nuevos; los existentes se arreglan en su siguiente reinicio.

## Lecciones

- "Funciona en mi imagen" no vale en DNS: glibc y musl interpretan distinto la misma respuesta.
  Probar con las dos.
- NODATA y NXDOMAIN no son lo mismo, y DNSSEC puede cambiar cuál de los dos recibes sin que
  toques nada.
- Los pods no necesitan la lista de búsqueda del host. Cuanto menos herede un pod del nodo,
  menos sorpresas.
