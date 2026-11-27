---
title: La VLAN que no volvió tras reiniciar los switches
description: Dos switches se reiniciaron solos, el enlace entre ellos volvió sin la VLAN de servidores y etcd perdió el quorum. La culpa era de un puerto que no se usa.
date: 2026-10-10
draft: false
format: postmortem
stack: [UniFi, VLAN, etcd, RKE2]
---

## Síntoma

A mediodía, sin ningún cambio en marcha, dos de los tres control planes dejaron de responder.
etcd se quedó sin quorum y el API server del tercero entró en bucle de reinicios: el cluster
entero sin plano de control. Los hosts físicos seguían encendidos y la red de casa funcionaba.

## Lo que había pasado

El router y los dos switches principales se habían reiniciado con un cuarto de hora de
diferencia. Al volver, el enlace troncal entre los switches solo dejaba pasar la VLAN nativa:
la VLAN de servidores, la que usan los nodos, no cruzaba. Los dos control planes conectados al
otro switch quedaron aislados del tercero.

## Causa

Ese enlace va por el puerto 9, un RJ45. El switch tiene además un puerto 10 que es el **combo**
del 9: un SFP que comparte el mismo PHY. Nadie lo usa, y estaba configurado como puerto de
acceso: VLAN nativa y bloqueo de todas las etiquetadas.

En funcionamiento normal esa configuración no molestaba. Al arrancar, el switch aplicó la del
puerto 10 al PHY compartido, y el enlace del 9 se quedó con ella.

## Arreglo

Poner el puerto 10 igual que el 9: troncal, todas las VLAN. En cuanto se aplicó, la VLAN de
servidores volvió a cruzar, etcd recuperó el quorum en segundos y el plano de control arrancó
solo. Lo mismo en el otro switch, aunque allí no había fallado.

El origen del reinicio no se aclaró: no hubo corte de luz (los hosts no se reiniciaron) y el
controlador no registró ni actualizaciones ni eventos de alimentación. Lo documenté como
desconocido en lugar de inventar una causa.

## Lecciones

- Un puerto "que no se usa" no es inocuo si comparte hardware con uno que sí. La configuración
  de un combo tiene que ser la misma que la de su pareja.
- El síntoma tiene firma propia: los nodos de un lado del enlace caen juntos y los del otro no.
  Quedó escrito en la documentación de la red para reconocerlo en un minuto la próxima vez.
- Tres control planes protegen de perder un host, no de perder la red entre ellos. La
  redundancia del plano de control depende también de cómo están cableados.
