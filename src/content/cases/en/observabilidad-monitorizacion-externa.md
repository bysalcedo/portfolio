---
title: Alerts that fire even when everything is down
description: Metrics, logs and traces inside the cluster, plus an external watcher in the cloud that notices when the whole house loses power or connectivity.
date: 2026-10-16
draft: false
kind: Observability
order: 5
stack: [Prometheus, Alertmanager, Grafana, Loki, Alloy, Tempo, Gatus, Oracle Cloud]
result: Telegram alerts split by topic, and an external heartbeat that covers the one failure internal alerts can never report.
---

## Context

All monitoring lived inside the cluster. If the power, the fiber or the router went down, the
system that was supposed to raise the alarm went down with everything else and nobody found out.

## Inside the cluster

- **Metrics**: kube-prometheus-stack, with exporters for the hypervisors, the NAS and the network.
- **Logs**: Loki with Alloy as the agent (migrated from Promtail before its end of support),
  including the network devices' syslog.
- **Traces**: Tempo.
- **Alerts** go to a Telegram supergroup with one topic per domain (on-call, backups, network),
  so a backup alert does not get lost among network ones.
- Dashboards are versioned in git and synced into Grafana, never edited by hand.

## Outside the cluster

An ARM VM on Oracle Cloud's free tier runs **Gatus**:

- Every minute it checks the published services from the internet: status code, response time
  and days until the certificate expires.
- It receives a **heartbeat**: every five minutes Alertmanager sends it the `Watchdog` alert,
  which is always firing. If fifteen minutes pass without a heartbeat, it raises an alert. That
  covers a Prometheus outage, an Alertmanager outage and the home connection going down, all at
  once.
- It publishes no ports: it connects through its own Cloudflare Tunnel, and the dashboard is
  protected with Cloudflare Access. It does not use the home SSO on purpose, because it has to
  work precisely when home is not responding.
- Deployed with Ansible and Docker Compose, secrets injected from the password manager at deploy
  time, and a budget that alerts from the first cent spent.

## What I learned

- The right question is not "what do I monitor" but "who raises the alarm if the monitoring goes
  down".
- An always-firing watchdog is the cheapest way to turn silence into a signal.
