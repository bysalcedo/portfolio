---
title: How I audit a homelab the whole family uses
description: Five audits in eight months. Verify live rather than against the documentation, tools pinned by version, agents that only read, and no finding without evidence, an owner and a decision.
date: 2026-11-27
draft: false
format: articulo
stack: [kube-bench, kubescape, trivy, nmap, Prometheus, Claude Code]
---

## Why audit something at home

Ebro serves the whole family's photos, documents, home automation and workflows. Nobody looks at
it while it works, and that is exactly why it can degrade without anyone noticing: an audit log
that stops being written, a backup nobody restores, a port left open. Since March I have done
five full audits. The latest, in two passes, in November.

## Two rhythms

- **Continuous monitoring.** Prometheus alerts, an external monitor in another cloud that raises
  the alarm if the cluster stops sending its heartbeat, weekly restore tests and an agent that
  reviews the firewall on its own every Monday. They warn about what I already know can fail.
- **A full audit** every two or three months. It looks for what I do not yet know can fail.

## Rules of the method

**Verify live, not against the documentation.** Every audit states the exact commit it was run
against and the time window of the checks. If the documentation says one thing and the cluster
another, the finding is the difference.

**Tools pinned by version.** kube-bench, kubescape, trivy, checkov, actionlint and zizmor run in
containers pinned by digest. That way one pass can be compared with the next without wondering
whether the cluster changed or the tool did.

**Read-only, and whatever is not gets undone and listed.** Cluster access is a read-only
ServiceAccount with no Secrets and no `exec`. Some tests need to write (a network pod, a disk
benchmark, a temporary namespace), and every write is listed in the report along with the check
that it no longer exists.

**Look from the outside.** A scan of all 65,535 TCP ports from a machine in another cloud,
because what you see from inside the network is not what the internet sees.

**Agents in parallel.** Part of the work is done by read-only AI agents, one per area: ArgoCD
health, backups, credentials, home automation and version drift, one per group of applications.
They summarize; they do not decide.

## How a finding is written

Every finding has an ID by area (S for security, N for network, B for backups, P for
performance, H for home automation, U for updates), a severity and its **evidence**: the command,
the metric or the file that proves it. Without evidence it is not a finding, it is a suspicion,
and it goes on a different list.

IDs are kept from one pass to the next. That shows what has been open for months, and every audit
**rechecks what the previous one marked as resolved**. In the latest one I rechecked 17 fixes from
the previous week live. Something being fixed once does not guarantee it stays fixed.

## From finding to decision

A finding ends in one of three ways, and all three are written down:

- **Fixed**, with its pull request and the follow-up check.
- **Accepted risk**, with the reason and the date. For example, CoreDNS egress stays open: if a
  policy cut it by mistake, ArgoCD could not even apply the revert.
- **Parked**, with a reason. Parked items are not proposed again in every session.

Open items live as tasks in a task manager, not in the report. The report is a snapshot of one
day; the tasks are what remains to be done.

Remediation goes in batches. For every live change the full previous state is saved first, changes
are applied one at a time, verified, and reverted if something fails.

## What has come out of it

From the November pass, a few figures:

- kube-bench went from 12 failures to 3 between the two November passes, with five days of
  remediation in between.
- 41 of 41 namespaces with NetworkPolicy, 35 of 35 applications synced and healthy, and 25 of 25
  test restores green.
- The external scan found nothing open. It did find that the only remaining port forward had been
  dead for two months, blocked by a NetworkPolicy, while still being scanned from the internet. I
  closed it the next day: a useless door is still a door.
- trivy across the cluster's 102 images produced a prioritized list of what to update or replace,
  starting with a volume provisioner unmaintained since 2023.
- The first performance pass with active tests found synchronous write latency on the NAS seven
  times worse than in September. No alert had caught it, because everything still worked.

Several of the postmortems on this blog started as a single line in one of these audits.

## What I take away

- Auditing is comparing: with the previous pass, with what the documentation says and with what
  is visible from the outside.
- An accepted risk is a decision with a name and a date, not a forgotten finding.
- Whoever audits does not fix in the same pass. Keeping the two apart makes the report reliable and
  the changes reviewable.
