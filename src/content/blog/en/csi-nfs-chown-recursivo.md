---
title: 45 minutes in ContainerCreating
description: When the NFS volumes moved to the CSI driver, Loki took three quarters of an hour to start. The driver was changing the owner of every file on every mount.
date: 2026-11-23
draft: false
format: postmortem
stack: [Kubernetes, csi-driver-nfs, Loki, TrueNAS]
---

## Symptom

While migrating the NFS volumes from Kubernetes' old in-tree plugin to the CSI driver, the Loki
pod got stuck in `ContainerCreating`. The events said `VolumePermissionChangeInProgress`. It
stayed like that for 45 minutes.

## Cause

The `csi-driver-nfs` chart installs the driver with `fsGroupPolicy: File`. With that policy,
kubelet runs a recursive `chown` and `chmod` of the whole volume to the pod's `fsGroup` **on every
mount**. The old plugin did not, so nobody had noticed until then.

Loki's volume had about 579,000 entries, and each one was a metadata operation over NFS against
the NAS.

Force-deleting the pod does not shorten anything: kubelet finishes the old pod's permission
change before mounting the volume for the new one. In the kubelet log it shows up as a mount
timeout.

## Fix

`fsGroupPolicy: None` on the `CSIDriver`, matching how the old plugin behaved. In Kubernetes 1.37
the field is mutable, so the driver did not have to be recreated. Permissions on the NAS were
already correct: the `chown` added nothing.

## Lessons

- Moving from one plugin to an "equivalent" one changes defaults. Compare behavior, not just
  whether it mounts.
- A pod in `ContainerCreating` with no errors is not hung: it is working. The pod events and the
  node's kubelet log tell you on what.
- The larger the volume, the more expensive any recursive walk. On NFS, every file is a round
  trip over the network.
