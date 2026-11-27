---
title: Backups that actually restore
description: Four layers of copies with automated restore tests every week. The first test found backups that had been corrupt for months.
date: 2026-09-23
draft: false
kind: Backups
order: 3
stack: [Velero, Kopia, pg_dump, SeaweedFS (S3), TrueNAS, Prometheus Pushgateway]
result: Weekly automated restore of 14 namespaces in 24 minutes, with a per-application alert if it fails.
---

## Context

I had daily backups, retention and an off-site copy. What I did not have was a single tested
restore. A backup that has never been restored is a hypothesis.

## Backup design

| Layer | What it protects | How |
|---|---|---|
| Volumes | Application data | Velero fs-backup (Kopia) to a self-hosted S3, daily for 7 days and weekly for 30 |
| Databases | Postgres and MariaDB | Logical dumps from CronJobs, independent of Velero |
| Configuration | Kubernetes resources | Its own 30-day schedule, no volumes |
| Off-site | All of the above | Encrypted sync to cloud storage |

The configuration backup exists for one specific reason: the SealedSecrets private keys.
Without them no secret in the repository can be decrypted, and rebuilding the cluster from git
leaves every application without credentials. Until then they were in no backup at all.

## Restore tests

I built them in four phases, each one a CronJob with its own minimal RBAC:

1. **Database dumps**: restored into a temporary instance, then tables and rows are checked.
2. **SealedSecrets keys**: restored, then every secret in the repo is decrypted (62 of 62).
3. **Velero volumes**: a real restore of 14 namespaces into an isolated namespace, 24 minutes.
4. **The photo library** (224 GB) is not fully restored every month: the test checks that every
   original file is in the snapshot and validates a random 5 % of the blocks. Twelve minutes
   instead of an hour and a half. Once a year, a full drill by hand.

Every test publishes its result to Prometheus, and there is one alert per application, with its
own notification route.

## What it found

**The very first run revealed that one database's dumps had been truncated for three months.**
The CronJob finished fine and the file existed; it just was not complete. No alert would have
caught it, because nothing failed.

## What I learned

- The useful metric is not "the backup finished", it is "the restore worked".
- Verifying by sampling is a legitimate engineering decision when a full restore costs too much,
  as long as you state what it covers and what it does not.
