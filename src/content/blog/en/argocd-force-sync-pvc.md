---
title: The forced sync that deleted volumes
description: Two PersistentVolumeClaims disappeared two days in a row without anyone deleting them. The culprit was an automation meant to fix out-of-sync applications.
date: 2026-09-11
draft: false
stack: [ArgoCD, Kubernetes, n8n, PersistentVolumes]
---

## What happened

Two PVCs belonging to a media application showed up as `Terminating`, first one afternoon and
again the following day. Nobody had deleted them by hand.

## Impact

- No data loss: the volumes use the `Retain` policy.
- A backup CronJob could not be scheduled for three hours.
- The next pod restart would have mounted a **new, empty** volume: the application would have
  started without its configuration and without any visible error.

## Cause

An automation workflow watched for out-of-sync ArgoCD applications and, as a remedy, triggered a
sync with `syncStrategy.apply.force`. A forced sync does not patch: when a patch fails on an
immutable field, it **deletes the object and recreates it**.

On a PVC, `spec.volumeName` is filled in by the binder when the volume is bound, and almost no
manifest declares it. The manifest in git did not have it, the live object did, the patch tried
to "remove" it, failed because the field is immutable, and the forced sync resolved the conflict
by deleting the PVC.

## Fix

- The automation stopped sending `syncStrategy`: a normal sync fails and alerts instead of
  deleting.
- A new rule for the whole repository: every PVC declares its `volumeName` in git as soon as it
  is bound.
- A documented procedure to recover a PVC in this state: remove the finalizer, release the PV's
  `claimRef` and let ArgoCD recreate the PVC on the same volume.

## Lessons

- **Remediation automations need the same rigor as deployment automations.** The action that did
  the damage was the one designed to fix things.
- A field the system fills in and git does not declare is a landmine for any tool that forces
  the state from git.
