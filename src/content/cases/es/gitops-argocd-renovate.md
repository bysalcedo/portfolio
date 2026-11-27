---
title: GitOps de punta a punta con ArgoCD
description: Todo el cluster declarado en git, actualizaciones automáticas agrupadas y una validación que impide subir un manifiesto roto.
date: 2026-09-11
draft: false
kind: GitOps
order: 2
stack: [ArgoCD, Renovate, GitHub Actions, Actions Runner Controller, Helm, kubeconform]
result: Decenas de charts e imágenes actualizados cada semana con PRs revisables, sin cambios manuales en el cluster y con rollback igual a revert.
---

## Contexto

Un cluster con más de treinta aplicaciones se degrada si las actualizaciones dependen de
acordarse. Quería que el estado deseado viviera en git, que el cluster convergiera solo y que
actualizar fuera revisar y fusionar una PR.

## Diseño

- **App of apps en ArgoCD** en tres capas: `infrastructure` (red, certificados, DNS, ingress),
  `platform` (identidad, observabilidad, backups) y `workloads` (las aplicaciones). Cada capa se
  sincroniza con su orden y sus *sync waves*.
- **Renovate a diario**, agrupado por directorio: una PR por aplicación con todos sus charts e
  imágenes, en vez de veinte PRs sueltas. Imágenes fijadas por digest.
- **Validación antes del push**: un hook de git ejecuta lint de YAML y validación de esquemas
  con kubeconform. Lo mismo corre en CI. Un manifiesto que no valida no llega a `main`.
- **Imágenes propias construidas en CI** sobre runners autoalojados (Actions Runner Controller
  dentro del propio cluster). Probé buildah y buildkit sin privilegios; ninguno funcionaba en
  este entorno, así que las builds van a un único scale set con Docker-in-Docker aislado.
- **CI no toca el tag desplegado.** Que CI haga commit en el repo que ArgoCD sincroniza crea un
  bucle; el bump de versión es una PR más, revisable como cualquier otra.

## Un incidente que cambió las reglas

Un sync forzado de ArgoCD borró dos `PersistentVolumeClaim` sin que nadie lo pidiera. Lo cuento
en detalle en el blog; la consecuencia fue una regla nueva: todo PVC declarado en git lleva su
`volumeName` en cuanto se enlaza, y el sync forzado no se usa en aplicaciones con estado sin
comprobarlo antes.

## Lo que aprendí

- Agrupar las PRs de Renovate por aplicación cambió la carga de revisión de "imposible" a
  "diez minutos".
- La automatización que repara sola necesita límites explícitos: la acción que más daño hizo
  fue una que estaba pensada para arreglar.
