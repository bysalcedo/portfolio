---
title: 45 minutos en ContainerCreating
description: Al migrar los volúmenes NFS al driver CSI, Loki tardó tres cuartos de hora en arrancar. El driver cambiaba el dueño de cada fichero en cada montaje.
date: 2026-11-23
draft: false
format: postmortem
stack: [Kubernetes, csi-driver-nfs, Loki, TrueNAS]
---

## Síntoma

Durante la migración de los volúmenes NFS del plugin antiguo de Kubernetes al driver CSI, el
pod de Loki se quedó en `ContainerCreating`. Los eventos decían
`VolumePermissionChangeInProgress`. Así estuvo 45 minutos.

## Causa

El chart de `csi-driver-nfs` instala el driver con `fsGroupPolicy: File`. Con esa política,
kubelet hace un `chown` y `chmod` recursivo de todo el volumen al `fsGroup` del pod **en cada
montaje**. El plugin antiguo no lo hacía, así que nadie lo había notado hasta entonces.

El volumen de Loki tenía unas 579.000 entradas, y cada una era una operación de metadatos por
NFS contra el NAS.

Forzar el borrado del pod no acorta nada: kubelet termina el cambio de permisos del pod viejo
antes de montar el volumen al nuevo. En el log de kubelet se ve como un timeout de montaje.

## Arreglo

`fsGroupPolicy: None` en el `CSIDriver`, igual que se comportaba el plugin antiguo. En
Kubernetes 1.37 el campo es mutable, así que no hizo falta recrear el driver. Los permisos ya
eran correctos en el NAS: el `chown` no aportaba nada.

## Lecciones

- Migrar de un plugin a otro "equivalente" cambia valores por defecto. Hay que comparar el
  comportamiento, no solo que monte.
- Un pod en `ContainerCreating` sin errores no está colgado: está trabajando. Los eventos del
  pod y el log de kubelet del nodo dicen en qué.
- Cuanto más grande el volumen, más caro cualquier recorrido recursivo. En NFS, cada fichero es
  un viaje por la red.
