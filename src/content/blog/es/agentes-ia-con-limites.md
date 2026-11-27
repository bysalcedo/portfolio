---
title: Agentes de IA en un cluster de verdad, con límites
description: Cómo opero Ebro con Claude Code y MCP sin darle las llaves de todo. Auditores que solo leen, operadores que solo actúan con alguien delante y cambios que siempre pasan por una pull request.
date: 2026-11-25
draft: false
format: articulo
stack: [Claude Code, MCP, Kubernetes RBAC, GitOps, Proton Pass]
---

## Por qué

Buena parte del trabajo diario en Ebro es diagnóstico: por qué una aplicación sale degradada,
si un backup se ha restaurado bien, qué cambia entre la versión desplegada y la última
publicada. Un agente con acceso a métricas, a ArgoCD y al cluster hace ese trabajo en minutos.
El riesgo es el mismo acceso usado para cambiar algo que nadie ha decidido.

La regla de partida: **el agente propone y verifica; los cambios los decide una persona y
quedan en git.**

## Dos clases de agente

| Clase | Qué hace | Permisos | Cuándo |
|---|---|---|---|
| Auditor | Diagnóstico: salud de ArgoCD, backups, caducidad de credenciales, deriva de versiones, firewall | Solo lectura | También desatendido |
| Operador | Aplicar algo ya decidido: reiniciar, drenar un nodo, mergear un lote de actualizaciones | Administrador | Solo en una sesión conmigo delante |

Los auditores usan un `kubeconfig` con su propia ServiceAccount, ligada al rol `view` de
Kubernetes: sin Secrets, sin `exec` y sin `port-forward`. Si un auditor intenta escribir, lo
para el RBAC, no su buena voluntad. Son los únicos que corren solos, por ejemplo la auditoría
semanal del firewall.

El flujo típico es auditor, decisión en la conversación y operador con la acción concreta.

## Todo cambio es una pull request

El cluster lo sincroniza ArgoCD desde git, así que un cambio "en vivo" se revierte solo. Los
agentes trabajan como cualquiera: rama, commit, `make validate` (lint y validación de esquemas,
que también corre como hook antes de cada push), pull request y checks en verde. El merge es la
decisión, y queda registrada.

## Secretos que el agente no ve

Los valores de los secretos viven en un gestor de contraseñas. El agente puede **sellarlos**
para el cluster (una tubería que lee del gestor y termina en `kubeseal`), pero nunca imprimirlos:
lo que sale por pantalla acaba en el historial de la conversación. Usa además su propia sesión
en el gestor, auditada, y no el token personal.

## Un segundo modelo revisa cada plan

Antes de ejecutar un plan, un hook se lo pasa a otro modelo de otro proveedor para que lo
cuestione. Si encuentra algo de severidad alta, el plan no avanza hasta corregirlo o rebatirlo
con evidencia.

La primera vez que lo usé aprendí algo: el agente aceptó trece hallazgos en cuarenta segundos
sin comprobar ninguno. Ahora la regla es verificar cada hallazgo en el código antes de
aceptarlo. Un revisor que nunca se discute no revisa nada.

## Lo que no está resuelto

La separación no es perfecta y prefiero decirlo. Los auditores tienen una shell y podrían usar
el `kubeconfig` de administrador; la restricción técnica completa solo existe en el agente de
domótica, que únicamente tiene herramientas de lectura. Y el auditor del firewall usa una
herramienta que también puede escribir. Está documentado como riesgo, no escondido.

## Lo que me llevo

- El acceso de un agente se diseña como el de una persona nueva en el equipo: mínimo
  privilegio, cambios revisables y nada de secretos en claro.
- La IA acelera el diagnóstico mucho más que la ejecución. La ejecución es lo que hay que frenar.
- Pedirle a otro modelo que discuta el plan funciona, siempre que alguien discuta también lo que
  dice el revisor.
