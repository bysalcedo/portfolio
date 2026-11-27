---
title: Las reglas de QoS que dejaban la conexión en un tercio
description: Una descarga grande ponía lenta toda la casa. La causa eran las propias reglas pensadas para priorizar el tráfico importante.
date: 2026-10-01
draft: false
format: postmortem
stack: [UniFi, Linux tc, PPPoE, redes]
---

## Síntoma

Cuando alguien descargaba algo grande, la casa entera iba lenta: el ping a internet subía de 30
ms a entre 300 y 1000. Lo raro es que el router tenía reglas de QoS justo para eso: priorizar
las videollamadas y el DNS.

## Lo que medí

Diez descargas en paralelo hacia un portátil de la red, mirando la CPU del router por núcleo:

| Configuración | Caudal | Ping |
|---|---|---|
| Con las reglas de QoS | 175-200 Mbps | 300-1000 ms |
| Sin reglas de QoS, IPS activo | 645-662 Mbps | ~30 ms |

Con QoS, un núcleo estaba al 96 % atendiendo interrupciones y los otros tres casi parados.

## Causa

Cualquier regla de QoS, sea de prioridad o de límite, hace que el router monte una cola
jerárquica en la interfaz PPPoE y redirija **todo** el tráfico de entrada a una interfaz
intermedia para poder encolarlo. Eso saca el tráfico del motor de aceleración por hardware y lo
manda por software. Con PPPoE, todo lo que entra cae en un solo núcleo.

Las reglas no priorizaban nada: estrangulaban el router entero. "Smart Queues" hace lo mismo
(unos 130 Mbps).

El test de velocidad del propio router no lo mostraba, porque mide desde el router y no pasa por
el reenvío.

## Arreglo

Desactivar las cuatro reglas de QoS, incluido un límite de ancho de banda para la red de
dispositivos IoT que vivía en otro sitio de la configuración. Con el IPS activo y sin QoS, la
conexión va a 650 Mbps y el ping se queda en 30 ms aunque haya una descarga grande.

## Lecciones

- Una función pensada para mejorar la latencia puede empeorarla si saca el tráfico del camino
  rápido. Hay que medir con ella y sin ella.
- El test de velocidad del router mide el router, no lo que pasa a través de él.
- Mirar la CPU por núcleo, no la media: un núcleo saturado con tres libres da un 25 % de media
  que parece sano.
