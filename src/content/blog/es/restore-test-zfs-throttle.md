---
title: El test de restauración que tumbaba un control plane
description: Cada domingo, la prueba automática de backups reiniciaba el API server de un nodo. El cuello no era el disco del nodo, sino el pool ZFS que compartía con los datos restaurados.
date: 2026-11-23
draft: false
format: postmortem
stack: [ZFS, TrueNAS, etcd, Velero, iSCSI]
---

## Síntoma

Los backups del cluster se restauran solos cada semana en un namespace aparte, para comprobar
que sirven. Desde hacía unas semanas, mientras corría esa prueba, el API server de uno de los
control planes se reiniciaba por fallar su comprobación de vida: dos veces un domingo, cinco el
día en que lo investigué. Los otros dos control planes, ni un aviso.

## Lo que medí

- En el etcd de ese nodo, escrituras con `fsync` de 3 a 4 segundos. etcd espera milisegundos.
- El disco raíz de ese nodo no es local: es un volumen iSCSI en el NAS, en un pool de dos SSD
  SATA en espejo. Los datos restaurados por la prueba iban a ese mismo pool.
- Durante la restauración (4 GB de fotos, 7 GB de ficheros) el pool acumulaba grupos de
  transacción de 1,3 a 2,1 GB que tardaban de 45 a 85 segundos en escribirse. Ese espejo
  sostiene unos 25 MB/s en escritura continua.

## Causa

ZFS limita la escritura **por pool**: cuando hay demasiados datos pendientes, frena a todo el
que escribe en ese pool. El volumen del control plane estaba en el mismo pool que los GB de la
restauración, así que sus `fsync` esperaban en la misma cola.

## Lo que no funcionó

El primer intento fue un dataset propio con `sync=disabled` dentro del mismo pool. No cambió
nada: el freno es del pool, no del dataset, y el dispositivo de log apenas tenía tráfico. Ni
siquiera era el cuello.

## Arreglo

Mover el destino de la prueba a otro pool del NAS, de discos grandes y sin nada sensible a la
latencia. Resultado: 15 de 15 restauraciones correctas, ningún `fsync` lento en etcd y
transacciones de menos de 400 MB que se escriben en menos de tres segundos.

## Lecciones

- En ZFS, "otro dataset" no aísla del rendimiento. Para aislar, otro pool.
- Una prueba de backups que rompe producción no es gratis. Ahora cuenta el dónde, no solo el qué.
- Mover el trabajo a otro nodo no habría servido: el cuello era el almacenamiento compartido,
  no el nodo.
