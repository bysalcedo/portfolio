---
title: etcd with 8-second writes
description: A control plane whose etcd took seconds to write. Three stacked causes, a disk move and an NVMe power setting nobody would have looked for.
date: 2026-09-17
draft: false
stack: [etcd, Proxmox VE, ZFS, iSCSI, TrueNAS, fio, Prometheus]
---

## Summary

For two weeks, one of the cluster's three control planes had episodes where etcd took more than
a second to commit a write to disk (`wal_fsync`). The worst reached a p99 of **8.19 s**. With
three members etcd tolerates one being slow, so the cluster stayed up, but every episode meant a
leader election warning and real risk if it coincided with another failure.

## Impact

- 24 episodes over 1 s in 13 days.
- No loss of service: the other two members kept quorum.
- Repeated etcd latency alerts and unnecessary leader elections.

## Investigation

**First cause: the hypervisor's NVMe.** That control plane lived on a DRAM-less consumer SSD
that stalls to collect garbage under sustained writes. Enabling automatic TRIM on the ZFS pool
reduced the frequency of the episodes from about twelve a day to one or two, but not their size.
The disk still stalled; it just did so less often.

**Decision: move only that disk off the hypervisor.** I moved it to the NAS over iSCSI. I
compared the two options first:

| | Move the control plane | Also move the workers |
|---|---|---|
| etcd spikes | Disappear | Only decrease |
| If the NAS goes down | One etcd member drops, quorum intact | All three root disks drop: the whole cluster |
| Data to move | ~10 GB | ~156 GB |

All the storage (zvol, target, portal, LUN and the Proxmox storage) was declared in Ansible,
idempotently. The cold move kept the node out for less than two minutes.

**Second cause, hiding behind the first.** After the move, an 8-16 ms tail remained on
synchronous writes that made no sense: the disk averaged 0.8 ms and `fio` at a high rate looked
perfect. The problem only appeared with **isolated** writes, which is exactly etcd's pattern: a
small fsync every so often. The NAS NVMe acting as SLOG had **APST** enabled: after 100 ms idle it
dropped into a power state that takes about 9 ms to leave. Every commit that arrived with the
disk idle paid that exit cost.

I disabled it live and persistently with a kernel parameter on the NAS.

## Result

- etcd fsync p99: from ~27 ms after the move to **~4 ms**.
- 72 hours of observation with a verdict script: max p99 of 8.4 ms, zero minutes above 1 s, zero
  restarts.

## Lessons

- **Averages lie with sparse I/O.** A high-rate benchmark keeps the disk awake and never sees the
  cost of waking it up. Measure with the real pattern: `fio` with `--fdatasync=1` and etcd-sized
  blocks.
- **Repeat every measurement three times.** A single run once gave me a good p99 by pure luck and
  led me to a wrong conclusion.
- **Fixing one cause can uncover the next.** The APST tail was always there; the multi-second
  spikes were hiding it.
