---
title: End-to-end GitOps with ArgoCD
description: The whole cluster declared in git, grouped automatic updates and validation that keeps a broken manifest from being pushed.
date: 2026-09-11
draft: false
kind: GitOps
order: 2
stack: [ArgoCD, Renovate, GitHub Actions, Actions Runner Controller, Helm, kubeconform]
result: Dozens of charts and images updated every week through reviewable PRs, no manual changes to the cluster, and rollback is a revert.
---

## Context

A cluster with more than thirty applications decays if updates depend on someone remembering.
I wanted the desired state to live in git, the cluster to converge on its own, and an update to
mean reviewing and merging a PR.

## Design

- **App of apps in ArgoCD**, in three layers: `infrastructure` (networking, certificates, DNS,
  ingress), `platform` (identity, observability, backups) and `workloads` (the applications).
  Each layer syncs in its own order, with sync waves.
- **Renovate runs daily**, grouped by directory: one PR per application with all its charts and
  images, instead of twenty separate PRs. Images are pinned by digest.
- **Validation before push**: a git hook runs YAML lint and schema validation with kubeconform.
  CI runs the same checks. A manifest that does not validate never reaches `main`.
- **Custom images are built in CI** on self-hosted runners (Actions Runner Controller inside the
  cluster itself). I tried unprivileged buildah and buildkit; neither worked in this environment,
  so builds go to a single scale set with isolated Docker-in-Docker.
- **CI does not touch the deployed tag.** CI committing to the repository that ArgoCD syncs
  creates a loop; a version bump is just another PR, reviewable like any other.

## An incident that changed the rules

A forced ArgoCD sync deleted two `PersistentVolumeClaim`s without anyone asking it to. I cover it
in detail on the blog; the outcome was a new rule: every PVC declared in git carries its
`volumeName` as soon as it is bound, and forced sync is not used on stateful applications without
checking first.

## What I learned

- Grouping Renovate PRs by application turned the review load from "impossible" into "ten
  minutes".
- Self-healing automation needs explicit limits: the action that did the most damage was one
  designed to fix things.
