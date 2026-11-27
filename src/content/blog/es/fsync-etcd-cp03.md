---
title: etcd con escrituras de 8 segundos
description: Un control plane cuyo etcd tardaba segundos en escribir. Tres causas apiladas, una mudanza de disco y un ajuste de energía del NVMe que nadie habría buscado.
date: 2026-09-17
draft: false
stack: [etcd, Proxmox VE, ZFS, iSCSI, TrueNAS, fio, Prometheus]
---

## Resumen

Durante dos semanas, uno de los tres control planes del cluster tuvo episodios en los que etcd
tardaba más de un segundo en confirmar una escritura en disco (`wal_fsync`). El peor llegó a
**8,19 s** de p99. Con tres miembros, etcd tolera que uno vaya lento, así que el cluster no se
cayó, pero cada episodio era un aviso de elección de líder y un riesgo real si coincidía con otro
fallo.

## Impacto

- 24 episodios de más de 1 s en 13 días.
- Sin pérdida de servicio: los otros dos miembros mantuvieron el quórum.
- Alertas de latencia de etcd repetidas y elecciones de líder innecesarias.

## Investigación

**Primera causa: el NVMe del hipervisor.** Ese control plane vivía en un SSD de consumo sin
DRAM que, con escrituras sostenidas, se para a recolectar basura. Activar el TRIM automático en el
pool ZFS bajó la frecuencia de los episodios de unos doce al día a uno o dos, pero no su
magnitud. El disco seguía parándose; solo lo hacía menos.

**Decisión: sacar solo ese disco del hipervisor.** Lo moví al NAS por iSCSI. Comparé las dos
opciones antes de hacerlo:

| | Mover el control plane | Mover también los workers |
|---|---|---|
| Picos de etcd | Desaparecen | Solo bajan |
| Si cae el NAS | Cae un miembro de etcd, quórum intacto | Caen los tres discos raíz: todo el cluster |
| Datos a mover | ~10 GB | ~156 GB |

Todo el almacenamiento (zvol, target, portal, LUN y el storage en Proxmox) se declaró en
Ansible, de forma idempotente. El movimiento en frío dejó el nodo fuera menos de dos minutos.

**Segunda causa, escondida detrás de la primera.** Tras la mudanza quedaba una cola de
8-16 ms en escrituras síncronas que no tenía sentido: las medias del disco eran de 0,8 ms y
`fio` a ritmo alto salía perfecto. El problema solo aparecía con escrituras **sueltas**, que es
justo el patrón de etcd: un fsync pequeño cada poco. El NVMe del NAS que hace de SLOG tenía
**APST** activado: tras 100 ms sin actividad bajaba a un estado de energía cuya salida cuesta
unos 9 ms. Cada commit que llegaba con el disco en reposo pagaba esa salida.

Lo desactivé en caliente y de forma persistente con un parámetro del kernel del NAS.

## Resultado

- p99 de fsync de etcd: de ~27 ms tras la mudanza a **~4 ms**.
- 72 horas de observación con un script de veredicto: p99 máximo 8,4 ms, cero minutos por
  encima de 1 s, cero reinicios.

## Lecciones

- **Las medias mienten con la E/S dispersa.** Un benchmark a ritmo alto mantiene el disco
  despierto y nunca ve el coste de despertarlo. Hay que medir con el patrón real: `fio` con
  `--fdatasync=1` y bloques del tamaño de los de etcd.
- **Repetir cada medición tres veces.** Una sola tanda me dio una vez un p99 bueno por pura
  suerte y me llevó a una conclusión falsa.
- **Arreglar una causa puede destapar la siguiente.** La cola de APST siempre estuvo ahí; los
  picos de segundos la tapaban.
