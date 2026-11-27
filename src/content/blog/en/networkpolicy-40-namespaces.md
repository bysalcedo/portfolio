---
title: NetworkPolicy across 40 namespaces without cutting DNS
description: Locking down the network between applications on a cluster that is already in use, without breaking the one thing that cannot break. The order mattered more than the rules.
date: 2026-11-17
draft: false
format: articulo
stack: [Kubernetes, NetworkPolicy, Canal, CoreDNS, AdGuard Home]
---

## Starting point

In Kubernetes, without NetworkPolicy, any pod can talk to any other. On Ebro that meant, for
example, that the admin console of the home DNS was reachable from any pod in the cluster without
going through the login. It was an open finding from the security audit, and I closed it in
several batches, namespace by namespace.

## The pattern

- **Every component has its own `networkpolicy.yaml` in its folder**, with a header explaining
  what each pod needs and why. Whoever adds a service sees what to open in the same place.
- **Default-deny per namespace** and explicit ingress and egress rules: Traefik to the
  application, the application to its database, Prometheus to the metrics port.
- If a service needs to talk to another namespace that is also locked down, **both sides** are
  opened: egress at the source and ingress at the destination.

## The exceptions, on purpose

- **`kube-system` has no namespace-wide default-deny**, but one policy per component. A new pod
  introduced by an RKE2 upgrade starts out open, so an upgrade never breaks because of a rule that
  does not exist yet.
- **CoreDNS only has ingress rules.** If its egress were cut by mistake, ArgoCD could not resolve
  github.com and could not even apply the revert. I left it as an accepted, written-down risk.
- **The home DNS** only accepts queries from private networks.

## The order

The worst thing a NetworkPolicy can do is cut DNS, whether the house's or the cluster's. That is
why DNS came last and in separate steps: first the secondary resolver, check, then the primary,
and finally CoreDNS, on its own.

For testing, never a pod in `default` (which already had default-deny), but a temporary namespace
with no policies, deleted when done.

## Details that took effort

- Kubelet probes need no rule: they come from the node itself.
- Traffic from the API server (webhooks, APIService) comes from the node's IP or from the control
  plane's overlay network, so it is opened by port, not by source.
- A service that flushes its logs every thousand lines can go hours without writing. That is not
  the policy blocking it: test the connection, do not wait for the log.

## Result

All 40 namespaces have a policy, each one explained in its file, and DNS was not cut for a single
minute during the rollout.
