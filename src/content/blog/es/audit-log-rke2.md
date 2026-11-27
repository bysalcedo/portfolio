---
title: El audit log que llevaba cuatro meses apagado
description: El registro de auditoría del API server dejó de escribirse en mayo y nadie se enteró. Volver a encenderlo bien costó entender cómo lo monta RKE2 y escribir una política que no llenara el disco.
date: 2026-10-04
draft: false
format: articulo
stack: [RKE2, Kubernetes, Ansible, etcd]
---

## El hallazgo

Una auditoría de seguridad de septiembre preguntó algo sencillo: si alguien hubiera hecho algo
raro en el cluster, ¿quedaría rastro? El último fichero de auditoría del API server era del 27 de
mayo. Cuatro meses sin registro y sin una sola alerta.

## Por qué se apagó

RKE2 solo activa la auditoría si su `config.yaml` tiene la clave `audit-policy-file`. Con ella,
RKE2 añade la ruta del log, la rotación y los montajes del pod estático del API server. En mayo,
el rol de Ansible que genera ese fichero lo reescribió sin la clave. La política seguía en el
disco de los nodos, pero fuera de git y sin que nadie la usara.

Activarla con argumentos sueltos del API server también funciona, pero entonces hay que montar
las rutas a mano. Usar la clave nativa es menos código y lo mantiene RKE2.

## Una política que no llene el disco

La política de mayo registraba metadatos de **todo**, lecturas incluidas: 100 MB cada dos horas
por control plane, unas ocho horas de historia con la rotación y escrituras constantes en el
disco del nodo con el etcd más lento. La nueva, donde gana la primera regla que coincide:

- **Nada** para los componentes del plano de control, los nodos, los eventos, los leases y las
  lecturas.
- **Metadatos** para cualquier escritura, para `exec`, `attach` y `port-forward`, y para
  **cualquier** acceso a Secrets, también de lectura.

Resultado: de unos 1,2 GB al día por control plane a entre 18 y 47 MB, con 30 días de historia.

## Que no vuelva a pasar

- La política y la clave están ahora en el rol de Ansible, en git.
- La clave está en la lista de lo que vigila el chequeo de deriva de la configuración de RKE2.
- Para aplicarlo, un reinicio de cada control plane, de uno en uno, comprobando entre uno y otro
  que etcd tiene sus tres miembros y que el log se escribe. Lo verifiqué escribiendo contra cada
  control plane y buscando la entrada en su propio log: cada API server solo registra lo que
  atiende él.

## Lo que me llevo

- Un control de seguridad que falla en silencio es peor que uno que no existe, porque das por
  hecho que está.
- Registrar las lecturas parece más seguro y en la práctica deja menos historia. Mejor registrar
  bien lo que importa.
