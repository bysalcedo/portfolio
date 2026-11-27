---
title: Alertas que avisan aunque caiga todo
description: Métricas, logs y trazas dentro del cluster, y un vigilante externo en la nube que detecta cuando la casa entera se queda sin luz o sin red.
date: 2026-10-16
draft: false
kind: Observabilidad
order: 5
stack: [Prometheus, Alertmanager, Grafana, Loki, Alloy, Tempo, Gatus, Oracle Cloud]
result: Alertas por Telegram separadas por tema, y un latido externo que cubre el único fallo que las alertas internas no pueden contar.
---

## Contexto

Toda la monitorización vivía dentro del cluster. Si se iba la luz, la fibra o el router, el
sistema que debía avisar caía con todo lo demás y nadie se enteraba.

## Dentro del cluster

- **Métricas**: kube-prometheus-stack, con exporters de los hipervisores, el NAS y la red.
- **Logs**: Loki con Alloy como agente (migrado desde Promtail antes de su fin de soporte),
  incluidos los syslog de la red.
- **Trazas**: Tempo.
- **Alertas** a un supergrupo de Telegram con un tema por dominio (guardia, backups, red),
  para que una alerta de backups no se pierda entre las de red.
- Dashboards versionados en git y sincronizados en Grafana, no editados a mano.

## Fuera del cluster

Una VM ARM en el nivel gratuito de Oracle Cloud ejecuta **Gatus**:

- Comprueba cada minuto, desde internet, los servicios publicados: código de estado, tiempo de
  respuesta y días hasta la caducidad del certificado.
- Recibe un **latido**: Alertmanager le envía cada cinco minutos la alerta `Watchdog`, que está
  siempre activa. Si pasan quince minutos sin latido, avisa. Eso cubre a la vez la caída de
  Prometheus, la de Alertmanager y la de la conexión de casa.
- No publica ningún puerto: entra por su propio Cloudflare Tunnel, y el panel está protegido
  con Cloudflare Access. No usa el SSO de casa a propósito, porque tiene que funcionar justo
  cuando casa no responde.
- Despliegue con Ansible y Docker Compose, secretos inyectados desde el gestor de contraseñas
  en el momento del despliegue y presupuesto con aviso desde el primer céntimo de gasto.

## Lo que aprendí

- La pregunta correcta no es "qué monitorizo", sino "quién avisa si cae lo que monitoriza".
- Un watchdog siempre activo es la forma más barata de convertir el silencio en una señal.
