---
title: NetworkPolicy en 40 namespaces sin cortar el DNS
description: Cerrar la red entre aplicaciones de un cluster que ya está en uso, sin tumbar lo único que no se puede tumbar. El orden importó más que las reglas.
date: 2026-11-17
draft: false
format: articulo
stack: [Kubernetes, NetworkPolicy, Canal, CoreDNS, AdGuard Home]
---

## Punto de partida

En Kubernetes, sin NetworkPolicy, cualquier pod habla con cualquier otro. En Ebro eso
significaba que, por ejemplo, la consola de administración del DNS de casa era alcanzable desde
cualquier pod del cluster sin pasar por el login. Era un hallazgo abierto de la auditoría de
seguridad y lo cerré en varias tandas, namespace a namespace.

## El patrón

- **Cada componente lleva su `networkpolicy.yaml` en su carpeta**, con una cabecera que explica
  qué necesita cada pod y por qué. Quien añade un servicio ve en el mismo sitio qué tiene que
  abrir.
- **Default-deny por namespace** y reglas explícitas de entrada y salida: Traefik hacia la
  aplicación, la aplicación hacia su base de datos, Prometheus hacia el puerto de métricas.
- Si un servicio necesita hablar con otro namespace que también está cerrado, se abren **los
  dos lados**: la salida en el origen y la entrada en el destino.

## Las excepciones, a propósito

- **`kube-system` no tiene default-deny de namespace**, sino una política por cada componente.
  Un pod nuevo que traiga un upgrade de RKE2 nace abierto, y así un upgrade no rompe nada por una
  regla que todavía no existe.
- **CoreDNS solo tiene reglas de entrada.** Si se cortara su salida por error, ArgoCD no podría
  resolver github.com y no podría ni aplicar el revert. Lo dejé como riesgo aceptado y escrito.
- **El DNS de casa** solo acepta consultas desde redes privadas.

## El orden

Lo peor que puede pasar con una NetworkPolicy es cortar el DNS: de la casa o del cluster. Por eso
el DNS fue lo último y en pasos separados: primero el resolver secundario, comprobar, después el
primario y por último CoreDNS, solo.

Para probar, nunca un pod en `default` (que ya tenía default-deny), sino un namespace temporal sin
políticas, que se borra al terminar.

## Detalles que costaron

- Las sondas de kubelet no necesitan regla: llegan desde el propio nodo.
- Lo que entra desde el API server (webhooks, APIService) llega desde la IP del nodo o de la red
  overlay del control plane, así que se abre por puerto, no por origen.
- Un servicio que vuelca sus logs cada mil líneas puede pasar horas sin escribir. Eso no es la
  política bloqueando: hay que probar la conexión, no esperar al log.

## Resultado

Los 40 namespaces tienen política, cada una explicada en su fichero, y el DNS no se cortó ni un
minuto durante el despliegue.
