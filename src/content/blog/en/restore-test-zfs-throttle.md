---
title: The restore test that took down a control plane
description: Every Sunday the automated backup test restarted one node's API server. The bottleneck was not the node's disk but the ZFS pool it shared with the restored data.
date: 2026-11-23
draft: false
format: postmortem
stack: [ZFS, TrueNAS, etcd, Velero, iSCSI]
---

## Symptom

The cluster's backups restore themselves every week into a separate namespace, to prove they
work. For a few weeks, while that test ran, the API server on one of the control planes restarted
after failing its liveness check: twice one Sunday, five times on the day I investigated. The
other two control planes, not a single warning.

## What I measured

- In that node's etcd, writes with an `fsync` of 3 to 4 seconds. etcd expects milliseconds.
- That node's root disk is not local: it is an iSCSI volume on the NAS, in a pool of two SATA SSDs
  in a mirror. The data restored by the test went to that same pool.
- During the restore (4 GB of photos, 7 GB of files) the pool built up transaction groups of 1.3
  to 2.1 GB that took 45 to 85 seconds to write. That mirror sustains about 25 MB/s of continuous
  writes.

## Cause

ZFS throttles writes **per pool**: when too much data is pending, it slows down everyone writing
to that pool. The control plane's volume was in the same pool as the gigabytes of the restore,
so its `fsync`s waited in the same queue.

## What did not work

The first attempt was a dedicated dataset with `sync=disabled` inside the same pool. It changed
nothing: the throttle belongs to the pool, not to the dataset, and the log device barely had any
traffic. It was not even the bottleneck.

## Fix

Move the test's target to another pool on the NAS, made of large disks with nothing
latency-sensitive on it. Result: 15 out of 15 successful restores, no slow `fsync` in etcd, and
transaction groups under 400 MB written in less than three seconds.

## Lessons

- In ZFS, "another dataset" does not isolate performance. To isolate, use another pool.
- A backup test that breaks production is not free. Where it runs matters, not just what it does.
- Moving the job to another node would not have helped: the bottleneck was the shared storage,
  not the node.
