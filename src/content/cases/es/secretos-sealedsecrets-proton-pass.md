---
title: Secretos en git sin secretos en git
description: SealedSecrets para guardar credenciales cifradas en el repositorio, con un gestor de contraseñas como fuente de verdad y un acceso auditado para los agentes de IA.
date: 2026-10-09
draft: false
kind: Seguridad
order: 6
stack: [SealedSecrets, Proton Pass, bash, GitHub Actions]
result: Ningún valor en claro en el repositorio ni en los logs; cada secreto se puede re-sellar desde su origen con un script.
---

## Contexto

GitOps exige que todo esté en git, incluidas las credenciales. Guardarlas en claro no es una
opción, y tenerlas solo en el cluster convierte cada rotación en un acto de memoria.

## Diseño

- **SealedSecrets**: el repositorio contiene secretos cifrados con la clave pública del
  controlador; solo el cluster puede descifrarlos. La clave se renueva cada 30 días y las
  privadas se guardan en el backup de configuración y en una bóveda de emergencia aparte.
- **El gestor de contraseñas es la fuente de verdad.** Cada secreto tiene un elemento con un
  nombre fijo (`<namespace>.<secret>`). Los scripts de sellado leen el valor de ahí y lo pasan
  directamente a `kubeseal` por un pipe: el valor no pasa por disco ni por la terminal.
- **Comprobación sin revelar**: un modo `--check` compara el secreto del cluster con el del
  gestor y dice si coinciden, sin imprimir ningún valor.
- **Acceso separado para los agentes de IA** que me ayudan a operar: tienen su propia identidad,
  auditada y con permisos limitados, distinta del acceso personal. El token personal está
  bloqueado para ellos.
- La bóveda de emergencia no tiene ningún acceso automatizado, a propósito.

## Lo que aprendí

- Un secreto que no se puede regenerar desde su origen acaba copiado a mano en algún sitio.
- Cuando un asistente de IA trabaja contigo en la terminal, todo lo que ve queda en un
  historial. La regla es simple: los valores solo viajan por pipes, nunca por stdout.
