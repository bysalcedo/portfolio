---
title: The field that lied about the STP tree
description: An audit flagged as high severity that an unknown device was the Spanning Tree root. It was not. How to check on the wire instead of in the API.
date: 2026-09-22
draft: false
stack: [UniFi, STP, tcpdump, network audit]
---

## What happened

During a network audit, the controller API returned a `root_switch` field on two switches with a
MAC address that matched none of my devices and no known client. Taken literally, it meant a
foreign device had become the root of the Spanning Tree: all traffic between switches could be
going through it. I classified it as a **high** severity finding.

## Why it was false

I raised the STP priority of the core switch to 4096 to force it to be the root. The tree
changed: the blocked ports moved. The `root_switch` field **did not change**. If the field
reflected the real root, it would have moved.

## How to really check

The Spanning Tree root is announced in BPDUs, in the `root-id` field. Listening on the wire on
any STP-enabled port is enough:

```bash
tcpdump -i <interface> -nn -e -vv -c 3 "ether dst 01:80:c2:00:00:00"
```

The BPDUs said what was expected: the core switch with priority 4096 as root and the compute
switch with 8192 as backup.

## Lessons

- **An API field is a claim, not a measurement.** Before opening a high severity finding, look
  for the primary source: here, the protocol on the wire.
- **Set priorities explicitly**, instead of letting the root come out of the MAC tiebreak. And
  check that they are still set after a switch is re-adopted or factory reset.
- The false finding cost a maintenance window. Documenting the misleading field keeps it from
  costing two.
