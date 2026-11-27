---
title: Cómo audito un homelab que usa toda la familia
description: Cinco auditorías en ocho meses. Verificar en vivo y no sobre la documentación, herramientas fijadas por versión, agentes que solo leen y ningún hallazgo sin evidencia, dueño ni decisión.
date: 2026-11-27
draft: false
format: articulo
stack: [kube-bench, kubescape, trivy, nmap, Prometheus, Claude Code]
---

## Por qué auditar algo de casa

Ebro sirve las fotos, los documentos, la domótica y las automatizaciones de toda la familia.
Nadie lo mira mientras funciona, y justo por eso puede degradarse sin que nadie se entere: un
log de auditoría que deja de escribirse, un backup que nadie restaura, un puerto que se queda
abierto. Desde marzo he hecho cinco auditorías completas. La última, en dos pasadas, en noviembre.

## Dos ritmos

- **Vigilancia continua.** Alertas de Prometheus, un monitor externo en otra nube que avisa si
  el cluster deja de latir, pruebas de restauración semanales y un agente que revisa solo el
  firewall cada lunes. Avisan de lo que ya sé que puede fallar.
- **Auditoría integral**, cada dos o tres meses. Busca lo que todavía no sé que puede fallar.

## Reglas del método

**Se verifica en vivo, no sobre la documentación.** Cada auditoría declara el commit exacto sobre
el que se hizo y la franja horaria de las comprobaciones. Si la documentación dice una cosa y el
cluster otra, el hallazgo es la diferencia.

**Herramientas fijadas por versión.** kube-bench, kubescape, trivy, checkov, actionlint y zizmor
corren en contenedores fijados por digest. Así, el resultado de una pasada se puede comparar con
el de la siguiente sin preguntarse si cambió el cluster o cambió la herramienta.

**Solo lectura, y lo que no lo es se deshace y se lista.** El acceso al cluster es el de una
ServiceAccount de lectura sin Secrets ni `exec`. Algunas pruebas necesitan escribir (un pod de red,
un benchmark de disco, un namespace temporal), y cada escritura queda listada en el informe junto
con la comprobación de que ya no existe.

**Mirar desde fuera.** Un escaneo de los 65.535 puertos TCP desde una máquina en otra nube,
porque lo que se ve desde dentro de la red no es lo que ve Internet.

**Agentes en paralelo.** Una parte del trabajo la hacen agentes de IA de solo lectura, uno por
área: salud de ArgoCD, backups, credenciales, domótica y deriva de versiones, uno por cada grupo
de aplicaciones. Resumen, no deciden.

## Cómo se escribe un hallazgo

Cada hallazgo tiene un identificador por área (S de seguridad, N de red, B de backups, P de
rendimiento, H de domótica, U de actualizaciones), una severidad y su **evidencia**: el comando,
la métrica o el fichero que lo demuestra. Sin evidencia no es un hallazgo, es una sospecha, y va a
otra lista.

Los identificadores se conservan entre pasadas. Así se ve qué sigue abierto desde hace meses, y
cada auditoría **vuelve a comprobar lo que la anterior dio por resuelto**. En la última volví a
comprobar en vivo 17 arreglos de la semana anterior. Que algo se arreglara una vez no garantiza
que siga arreglado.

## De hallazgo a decisión

Un hallazgo termina de tres maneras, y las tres quedan escritas:

- **Arreglado**, con su pull request y la comprobación posterior.
- **Riesgo aceptado**, con el motivo y la fecha. Por ejemplo, la salida de red de CoreDNS se
  queda abierta: si una política la cortara por error, ArgoCD no podría ni aplicar el revert.
- **Aparcado**, con un motivo. Lo aparcado no se vuelve a proponer en cada sesión.

Lo abierto vive como tareas en un gestor de tareas, no en el informe. El informe es la foto de un
día; las tareas son lo que queda por hacer.

La remediación va por tandas. Para cada cambio en vivo se guarda antes el estado completo, se
aplica uno a uno, se verifica y se revierte si algo falla.

## Qué ha salido de esto

De la pasada de noviembre, algunas cifras:

- kube-bench pasó de 12 fallos a 3 entre las dos pasadas de noviembre, con cinco días de remediación
  en medio.
- 41 de 41 namespaces con NetworkPolicy, 35 de 35 aplicaciones sincronizadas y sanas y 25 de 25
  restauraciones de prueba en verde.
- El escaneo externo no encontró nada abierto. Sí encontró que el único port-forward que quedaba
  llevaba dos meses sin funcionar, bloqueado por una NetworkPolicy, mientras seguía recibiendo
  escaneos de Internet. Lo cerré al día siguiente: una puerta inútil sigue siendo una puerta.
- trivy sobre las 102 imágenes del cluster dio una lista priorizada de qué actualizar o sustituir,
  empezando por un provisionador de volúmenes sin mantenimiento desde 2023.
- La primera pasada de rendimiento con pruebas activas encontró una latencia de escritura
  síncrona en el NAS siete veces peor que en septiembre. Ninguna alerta lo había detectado porque
  todo seguía funcionando.

Varios de los postmortems de este blog empezaron como una línea en una de estas auditorías.

## Lo que me llevo

- Auditar es comparar: con la pasada anterior, con lo que dice la documentación y con lo que se
  ve desde fuera.
- Un riesgo aceptado es una decisión con nombre y fecha, no un hallazgo olvidado.
- El que audita no arregla en la misma pasada. Separar las dos cosas hace que el informe sea fiable
  y que los cambios se puedan revisar.
