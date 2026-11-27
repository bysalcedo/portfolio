---
title: DNS interno que fallaba dos de cada tres veces
description: Un forward de CoreDNS con política aleatoria entre un resolver local y dos públicos. El síntoma apareció en la edición de documentos, lejos de la causa.
date: 2026-09-15
draft: false
stack: [CoreDNS, Kubernetes, external-dns, Nextcloud, Collabora, Ansible]
---

## Síntoma

La edición de documentos en el navegador fallaba de forma intermitente con un error de
autorización del host WOPI. A veces abría, a veces no, sin cambios entre intentos.

## Causa

CoreDNS reenviaba todas las consultas externas a tres resolvers con `policy random`: el router
de casa y dos resolvers públicos. **Solo el router tiene los registros internos** que publica
external-dns. Cuando la consulta caía en un resolver público, el nombre se resolvía a la IP
pública (o no se resolvía), y la llamada entre el servidor de ficheros y el de documentos
salía por internet y volvía por el túnel, donde la autorización no cuadraba.

Con tres upstreams y uno solo correcto, fallaba aproximadamente dos de cada tres veces.

## Arreglo

Un bloque propio para la zona interna, con orden secuencial:

```text
mi-dominio.:53 {
    forward . <resolver-local> <resolver-publico> {
        policy sequential
    }
}
```

El cambio va en la plantilla de Ansible que genera la configuración de CoreDNS de RKE2, no a
mano en el ConfigMap: un reinstall lo habría borrado. Verificado con 12 de 12 resoluciones
correctas desde los pods afectados.

## El efecto secundario

Al resolver los nombres públicos a la IP interna, una aplicación con protección **SSRF**
empezó a rechazar su propio login OIDC: el proveedor de identidad ahora estaba en una IP
privada y la aplicación lo trató como un intento de acceso a la red local. Hubo que permitirlo
explícitamente en esa aplicación.

## Lecciones

- `policy random` entre upstreams que **no** son equivalentes es un fallo intermitente
  garantizado. Los upstreams de un mismo forward tienen que dar la misma respuesta.
- Después de tocar la resolución de nombres, probar el login de cada aplicación con SSO: las
  protecciones SSRF reaccionan a la IP, no al nombre.
