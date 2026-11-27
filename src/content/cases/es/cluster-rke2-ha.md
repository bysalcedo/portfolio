---
title: Kubernetes que aguanta la caída de un host
description: Un cluster RKE2 con tres control planes repartidos en hosts físicos distintos, IP virtual con kube-vip y upgrades rodantes sin corte.
date: 2026-10-04
draft: false
kind: Plataforma
order: 1
stack: [RKE2, kube-vip, etcd, Proxmox VE, Terraform, Ansible]
result: Upgrade de Kubernetes 1.36 a 1.37 en los seis nodos sin perder servicio y con el reparto de carga restaurado al terminar.
---

## Contexto

Quería una plataforma en la que un fallo de hardware no se notara: ni el de un disco ni el de
un host entero. El cluster da servicio a unas treinta aplicaciones (identidad, fotos, ficheros,
domótica, automatización, IA local) y lo usa gente que no sabe ni le importa que existe.

## Diseño

- **Tres control planes, uno por host físico.** etcd necesita mayoría: con un miembro por
  hipervisor, perder un host entero deja dos de tres y el plano de control sigue en pie.
- **IP virtual con kube-vip** delante del API server. Los kubeconfig y los agentes apuntan a la
  VIP, no a un nodo, así que un control plane puede caer o reiniciarse sin tocar clientes.
- **Tres workers** con requests dimensionados a partir de siete días de métricas reales, no de
  estimaciones. Al medir descubrí que faltaba CPU *asignable* y no CPU real: el pico de uso de un
  control plane era medio core sobre cuatro. Reasigné vCPU de los control planes a los workers.
- **Todo como código.** Las VM se declaran en Terraform (provider de Proxmox) y la instalación
  y configuración de RKE2 va en roles de Ansible: CoreDNS, audit log del API server y política
  de auditoría incluidos.

## Operación

Los upgrades de RKE2 van nodo a nodo: cordon, drain, upgrade, verificación, uncordon. Los
`PodDisruptionBudget` hacen que un drain no se lleve a la vez las dos réplicas de un servicio
crítico (el login, el DNS). El único PDB que bloquea a propósito es el de Velero, para que un
drain no corte un backup en curso.

Tras el upgrade a 1.37 apareció un efecto que no se ve en la documentación: el último worker
drenado queda casi vacío, porque Kubernetes no devuelve los pods solos. Uno de los otros
llegó a un 19 % de presión de I/O. Lo reequilibré en tandas pequeñas (cordon de los nodos
cargados y `rollout restart` de cinco o seis Deployments cada vez), porque mover todo de golpe
obliga al nodo destino a descargar decenas de imágenes a la vez y satura su disco. La presión
de I/O bajó al 1,8 % sin un solo pod en Pending ni corte de DNS. El procedimiento quedó en el
runbook de upgrade.

## Lo que aprendí

- Medir antes de redimensionar. La intuición decía "más CPU para los control planes" y los
  datos decían lo contrario.
- Un upgrade no termina cuando el último nodo dice `Ready`: termina cuando el reparto vuelve a
  ser sano.
