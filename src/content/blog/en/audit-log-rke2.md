---
title: The audit log that had been off for four months
description: The API server's audit log stopped being written in May and nobody noticed. Turning it back on properly meant understanding how RKE2 wires it up and writing a policy that would not fill the disk.
date: 2026-10-04
draft: false
format: articulo
stack: [RKE2, Kubernetes, Ansible, etcd]
---

## The finding

A security audit in September asked a simple question: if someone had done something odd on the
cluster, would there be a trace? The API server's last audit file was from May 27. Four months
with no record and not a single alert.

## Why it went off

RKE2 only enables auditing if its `config.yaml` has the `audit-policy-file` key. With it, RKE2 adds
the log path, the rotation and the mounts for the API server's static pod. In May, the Ansible
role that generates that file rewrote it without the key. The policy was still on the nodes'
disks, but outside git and unused.

Enabling it with raw API server arguments also works, but then the paths have to be mounted by
hand. Using the native key means less code, and RKE2 maintains it.

## A policy that does not fill the disk

The May policy recorded metadata for **everything**, reads included: 100 MB every two hours per
control plane, about eight hours of history with rotation, and constant writes to the disk of the
node with the slowest etcd. The new one, where the first matching rule wins:

- **Nothing** for control plane components, nodes, events, leases and reads.
- **Metadata** for any write, for `exec`, `attach` and `port-forward`, and for **any** access to
  Secrets, reads included.

Result: from about 1.2 GB a day per control plane to between 18 and 47 MB, with 30 days of
history.

## Making sure it does not happen again

- The policy and the key now live in the Ansible role, in git.
- The key is on the list watched by the RKE2 configuration drift check.
- Applying it took a reboot of each control plane, one at a time, checking between each one that
  etcd had all three members and that the log was being written. I verified it by writing against
  each control plane and finding the entry in its own log: each API server only records what it
  serves itself.

## What I take away

- A security control that fails silently is worse than one that does not exist, because you
  assume it is there.
- Recording reads looks safer and in practice leaves less history. Better to record what matters,
  and record it well.
