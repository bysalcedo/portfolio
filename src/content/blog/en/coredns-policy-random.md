---
title: Internal DNS that failed two times out of three
description: A CoreDNS forward with a random policy across one local resolver and two public ones. The symptom showed up in document editing, far from the cause.
date: 2026-09-15
draft: false
stack: [CoreDNS, Kubernetes, external-dns, Nextcloud, Collabora, Ansible]
---

## Symptom

Editing documents in the browser failed intermittently with a WOPI host authorization error.
Sometimes it opened, sometimes it did not, with nothing changing between attempts.

## Cause

CoreDNS forwarded every external query to three resolvers with `policy random`: the home router
and two public resolvers. **Only the router has the internal records** that external-dns
publishes. When a query landed on a public resolver, the name resolved to the public IP (or did
not resolve at all), and the call between the file server and the document server went out to
the internet and came back through the tunnel, where the authorization no longer matched.

With three upstreams and only one correct, it failed roughly two times out of three.

## Fix

A dedicated block for the internal zone, with sequential order:

```text
my-domain.:53 {
    forward . <local-resolver> <public-resolver> {
        policy sequential
    }
}
```

The change lives in the Ansible template that generates RKE2's CoreDNS configuration, not by hand
in the ConfigMap: a reinstall would have wiped it. Verified with 12 out of 12 correct resolutions
from the affected pods.

## The side effect

Once public names resolved to the internal IP, an application with **SSRF** protection started
rejecting its own OIDC login: the identity provider was now on a private IP and the application
treated it as an attempt to reach the local network. It had to be explicitly allowed in that
application.

## Lessons

- `policy random` across upstreams that are **not** equivalent is a guaranteed intermittent
  failure. Upstreams in the same forward must give the same answer.
- After touching name resolution, test the login of every application with SSO: SSRF protections
  react to the IP, not to the name.
