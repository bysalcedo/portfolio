---
title: The VLAN that did not come back after the switches rebooted
description: Two switches rebooted on their own, the link between them came back without the server VLAN and etcd lost quorum. The culprit was a port nobody uses.
date: 2026-10-10
draft: false
format: postmortem
stack: [UniFi, VLAN, etcd, RKE2]
---

## Symptom

At midday, with no change in progress, two of the three control planes stopped responding. etcd
lost quorum and the third node's API server went into a restart loop: the whole cluster without a
control plane. The physical hosts were still on and the home network worked.

## What had happened

The router and the two main switches had rebooted within a quarter of an hour of each other.
When they came back, the trunk link between the switches only carried the native VLAN: the
server VLAN, the one the nodes use, did not cross it. The two control planes connected to the
other switch were cut off from the third.

## Cause

That link runs on port 9, an RJ45. The switch also has a port 10 that is the **combo** of port 9:
an SFP that shares the same PHY. Nobody uses it, and it was configured as an access port: native
VLAN and all tagged VLANs blocked.

In normal operation that configuration did no harm. On boot, the switch applied port 10's
configuration to the shared PHY, and port 9's link ended up with it.

## Fix

Configure port 10 exactly like port 9: trunk, all VLANs. As soon as it was applied, the server
VLAN crossed the link again, etcd regained quorum within seconds and the control plane came back
on its own. Same change on the other switch, even though it had not failed there.

The cause of the reboot was never found: there was no power cut (the hosts did not restart) and
the controller logged neither updates nor power events. I documented it as unknown instead of
inventing a cause.

## Lessons

- A port "nobody uses" is not harmless if it shares hardware with one that is in use. A combo
  port must be configured the same as its pair.
- The symptom has its own signature: the nodes on one side of the link fail together and the ones
  on the other side do not. It is now written down in the network documentation so it can be
  recognized in a minute next time.
- Three control planes protect against losing a host, not against losing the network between
  them. Control plane redundancy also depends on how things are cabled.
