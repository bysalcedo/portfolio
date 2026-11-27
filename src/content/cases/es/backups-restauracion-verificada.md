---
title: Backups que se restauran de verdad
description: Cuatro capas de copia con pruebas de restauración automáticas cada semana. La primera prueba encontró copias corruptas desde hacía meses.
date: 2026-09-23
draft: false
kind: Backups
order: 3
stack: [Velero, Kopia, pg_dump, SeaweedFS (S3), TrueNAS, Prometheus Pushgateway]
result: Restauración automática semanal de 14 namespaces en 24 minutos, con alerta por aplicación si falla.
---

## Contexto

Tenía backups diarios, retención y una copia fuera de casa. Lo que no tenía era una sola
restauración probada. Un backup sin restaurar es una hipótesis.

## Diseño de las copias

| Capa | Qué protege | Cómo |
|---|---|---|
| Volúmenes | Datos de las aplicaciones | Velero con fs-backup (Kopia) a un S3 propio, diario 7 días y semanal 30 días |
| Bases de datos | Postgres y MariaDB | Dumps lógicos por CronJob, independientes de Velero |
| Configuración | Recursos de Kubernetes | Schedule propio de 30 días, sin volúmenes |
| Fuera de casa | Todo lo anterior | Sincronización cifrada a almacenamiento en la nube |

La copia de configuración existe por una razón concreta: las claves privadas de
SealedSecrets. Sin ellas, ningún secreto del repositorio se puede descifrar y reconstruir el
cluster desde git deja todas las aplicaciones sin credenciales. Hasta entonces no estaban en
ningún backup.

## Pruebas de restauración

Las monté en cuatro fases, cada una un CronJob con su propio RBAC mínimo:

1. **Dumps de bases de datos**: se restauran en una instancia temporal y se comprueban tablas
   y filas.
2. **Claves de SealedSecrets**: se restauran y se descifran todos los secretos del repo
   (62 de 62).
3. **Volúmenes de Velero**: restauración real de 14 namespaces en un namespace aislado,
   24 minutos.
4. **La biblioteca de fotos** (224 GB) no se restaura entera cada mes: se verifica que cada
   fichero original está en el snapshot y se valida un 5 % aleatorio de los bloques. Doce
   minutos en vez de hora y media. Una vez al año, simulacro completo a mano.

Cada prueba publica su resultado en Prometheus y hay una alerta por aplicación, con su propia
ruta de aviso.

## Lo que encontró

**La primera ejecución destapó que los dumps de una base de datos estaban truncados desde
hacía tres meses.** El CronJob terminaba bien y el fichero existía; simplemente no estaba
entero. Ninguna alerta lo habría detectado, porque nada fallaba.

## Lo que aprendí

- La métrica útil no es "el backup terminó", es "la restauración funcionó".
- Verificar por muestreo es una decisión de ingeniería legítima cuando la restauración completa
  cuesta demasiado, siempre que se diga qué cubre y qué no.
