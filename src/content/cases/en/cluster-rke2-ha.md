---
title: Kubernetes that survives losing a host
description: An RKE2 cluster with three control planes on separate physical hosts, a virtual IP with kube-vip and rolling upgrades without downtime.
date: 2026-10-04
draft: false
kind: Platform
order: 1
stack: [RKE2, kube-vip, etcd, Proxmox VE, Terraform, Ansible]
result: Kubernetes upgrade from 1.36 to 1.37 on all six nodes with no loss of service and the load balance restored at the end.
---

## Context

I wanted a platform where a hardware failure would go unnoticed, whether a disk or an entire
host. The cluster serves around thirty applications (identity, photos, files, home automation,
workflows, local AI) and is used by people who neither know nor care that it exists.

## Design

- **Three control planes, one per physical host.** etcd needs a majority: with one member per
  hypervisor, losing a whole host leaves two out of three and the control plane stays up.
- **A virtual IP with kube-vip** in front of the API server. Kubeconfigs and agents point at the
  VIP, not at a node, so a control plane can fail or reboot without touching any client.
- **Three workers** with requests sized from seven days of real metrics, not estimates. Measuring
  showed that what was missing was *allocatable* CPU, not actual CPU: the peak usage of a control
  plane was half a core out of four. I moved vCPUs from the control planes to the workers.
- **Everything as code.** The VMs are declared in Terraform (Proxmox provider), and RKE2
  installation and configuration live in Ansible roles, including CoreDNS, the API server audit
  log and its audit policy.

## Operations

RKE2 upgrades go node by node: cordon, drain, upgrade, verify, uncordon. `PodDisruptionBudget`s
make sure a drain never takes both replicas of a critical service (login, DNS) at once. The only
PDB that blocks on purpose is Velero's, so that a drain cannot cut a running backup.

After the upgrade to 1.37 an effect showed up that the documentation does not mention: the last
worker to be drained ends up almost empty, because Kubernetes does not move pods back on its own.
One of the other workers reached 19 % I/O pressure. I rebalanced in small batches (cordon the
busy nodes and `rollout restart` five or six Deployments at a time), because moving everything at
once forces the target node to pull dozens of images simultaneously and saturates its disk. I/O
pressure dropped to 1.8 % without a single Pending pod or DNS outage. The procedure is now part
of the upgrade runbook.

## What I learned

- Measure before resizing. Intuition said "more CPU for the control planes" and the data said the
  opposite.
- An upgrade is not over when the last node reports `Ready`: it is over when the load is
  balanced again.
