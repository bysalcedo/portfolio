---
title: The QoS rules that cut the connection to a third
description: One large download slowed down the whole house. The cause was the very rules meant to prioritize important traffic.
date: 2026-10-01
draft: false
format: postmortem
stack: [UniFi, Linux tc, PPPoE, networking]
---

## Symptom

Whenever someone downloaded something large, the whole house slowed down: ping to the internet
went from 30 ms to between 300 and 1000. The odd part was that the router had QoS rules for
exactly this: prioritizing video calls and DNS.

## What I measured

Ten parallel downloads to a laptop on the network, watching the router's CPU per core:

| Configuration | Throughput | Ping |
|---|---|---|
| With the QoS rules | 175-200 Mbps | 300-1000 ms |
| No QoS rules, IPS on | 645-662 Mbps | ~30 ms |

With QoS, one core sat at 96 % handling interrupts and the other three were nearly idle.

## Cause

Any QoS rule, whether a priority or a limit, makes the router set up a hierarchical queue on the
PPPoE interface and redirect **all** inbound traffic to an intermediate interface so it can be
queued. That takes traffic out of the hardware acceleration engine and sends it through software.
With PPPoE, everything inbound lands on a single core.

The rules were not prioritizing anything: they were choking the whole router. "Smart Queues" does
the same (about 130 Mbps).

The router's own speed test did not show it, because it measures from the router and does not go
through forwarding.

## Fix

Disable all four QoS rules, including a bandwidth limit for the IoT device network that lived in
a different part of the configuration. With IPS on and no QoS, the connection runs at 650 Mbps
and ping stays at 30 ms even during a large download.

## Lessons

- A feature meant to improve latency can make it worse if it takes traffic off the fast path.
  Measure with it and without it.
- The router's speed test measures the router, not what goes through it.
- Look at CPU per core, not the average: one saturated core and three idle ones average out to a
  healthy-looking 25 %.
