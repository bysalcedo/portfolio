---
title: github.com did not exist for Alpine pods
description: With the home domain in the search list and DNSSEC on the zone, musl gave up on any external name. glibc never noticed.
date: 2026-10-23
draft: false
format: postmortem
stack: [Kubernetes, DNS, DNSSEC, musl, RKE2, Ansible]
---

## Symptom

Some pods could not resolve perfectly ordinary external names like `github.com`. Not all of them:
only Alpine-based ones. Even a network troubleshooting image failed if the name had no trailing
dot.

## Cause

Three pieces, each correct on its own:

1. The nodes have the home domain in `search`, and kubelet copies that list into every pod's
   `resolv.conf`. So `github.com` is tried first as `github.com.<home-domain>`.
2. The zone has DNSSEC, and Cloudflare uses *compact denial*: for a name that does not exist it
   does not answer NXDOMAIN but NOERROR with no data (NODATA).
3. glibc, on NODATA, moves on to the next candidate and ends up trying `github.com.`. **musl stops
   searching as soon as a search domain returns NODATA**, and returns an error.

In a Debian pod everything worked; in an Alpine pod, `github.com` died on the first attempt.

## Fix

A dedicated `resolv.conf` for kubelet, without `search`, using RKE2's native option
(`resolv-conf`) managed from Ansible. The nodes do not change: only what the pods receive.

Before applying it I checked that no manifest relied on short names from the home domain. The
change was rolled out node by node without draining, because restarting the agent does not kill
pods and only new pods are affected; existing ones are fixed on their next restart.

## Lessons

- "It works in my image" does not hold for DNS: glibc and musl read the same answer differently.
  Test with both.
- NODATA and NXDOMAIN are not the same thing, and DNSSEC can change which one you get without you
  touching anything.
- Pods do not need the host's search list. The less a pod inherits from the node, the fewer
  surprises.
