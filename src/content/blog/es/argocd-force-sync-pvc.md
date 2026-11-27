---
title: El sync forzado que borraba volúmenes
description: Dos PersistentVolumeClaim desaparecieron dos días seguidos sin que nadie los borrara. El culpable era una automatización pensada para arreglar desincronizaciones.
date: 2026-09-11
draft: false
stack: [ArgoCD, Kubernetes, n8n, PersistentVolumes]
---

## Qué pasó

Dos PVC de una aplicación de medios aparecieron en estado `Terminating`, primero una tarde y
otra vez al día siguiente. Nadie los había borrado a mano.

## Impacto

- Sin pérdida de datos: los volúmenes tienen política `Retain`.
- Un CronJob de backup estuvo tres horas sin poder programarse.
- El siguiente reinicio del pod habría montado un volumen **nuevo y vacío**: la aplicación
  habría arrancado sin su configuración, sin error visible.

## Causa

Un flujo de automatización vigilaba las aplicaciones de ArgoCD desincronizadas y, como
remedio, lanzaba un sync con `syncStrategy.apply.force`. Un sync forzado no parchea: cuando un
parche falla por un campo inmutable, **borra el objeto y lo recrea**.

En un PVC, `spec.volumeName` lo rellena el binder al enlazar el volumen y casi ningún
manifiesto lo declara. El manifiesto en git no lo tenía, el objeto vivo sí, el parche intentaba
"quitarlo", fallaba por inmutable, y el sync forzado resolvía el conflicto borrando el PVC.

## Arreglo

- La automatización dejó de enviar `syncStrategy`: un sync normal falla y avisa en vez de
  borrar.
- Regla nueva para todo el repositorio: cada PVC declara su `volumeName` en git en cuanto se
  enlaza.
- Procedimiento documentado para recuperar un PVC en este estado: quitar el finalizer, liberar
  el `claimRef` del PV y dejar que ArgoCD recree el PVC sobre el mismo volumen.

## Lecciones

- **Las automatizaciones de remedio necesitan el mismo rigor que las de despliegue.** La acción
  que hizo el daño era la que estaba pensada para arreglar.
- Un campo que rellena el sistema y que git no declara es una mina para cualquier
  herramienta que fuerce el estado de git.
