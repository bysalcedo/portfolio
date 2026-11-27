---
title: One login for thirty services, no open ports
description: Centralized identity with Authentik (OIDC and ForwardAuth) and internet exposure through Cloudflare Tunnel, with a WAF and CrowdSec in front.
date: 2026-09-25
draft: false
kind: Identity and network
order: 4
stack: [Authentik, OIDC, Traefik, Cloudflare Tunnel, Cloudflare WAF, CrowdSec]
result: No open ports on the router; every new application ships with SSO in the same GitOps change that deploys it.
---

## Context

Every application came with its own user system. Thirty passwords, none with a second factor and
no way to remove someone's access in one place.

## Design

- **Authentik as the identity provider.** Order of preference: the application's native OIDC
  and, if it does not support it, ForwardAuth in Traefik. The application's local login is
  disabled wherever possible.
- **Declarative configuration.** Providers, applications, groups and branding are defined in
  blueprints versioned in git. No application is configured by hand in the UI.
- **Platform rule:** a new web application is not done until it has SSO. Exceptions are
  documented with the technical reason, the accepted risk and a review date.
- **Exposure through Cloudflare Tunnel.** The cluster opens an outbound connection; there are no
  open ports and no public IP to protect. Only Authentik's OIDC routes are published: the admin
  panel and the interactive login cannot be reached from outside.
- **Layered defenses in front:** a managed WAF across the zone, per-route rate limiting, bot
  fight mode, TLS 1.3 and DNSSEC; inside, CrowdSec with AppSec as a Traefik plugin.

## Debatable decisions

For a while I put Cloudflare Access in front of some applications, on top of SSO. I removed it:
it forced me to configure headers or service tokens on every client (mobile apps, WebDAV
clients) and duplicated authentication without adding a real guarantee over OIDC with password
login disabled. Fewer moving parts, same level of security.

## What I learned

- The "SSO in the same change as the deployment" rule works because it is cheap to follow: there
  is a template and a checklist.
- A change to internal DNS can break the login of an application with SSRF protection: it
  happened when public names started resolving to the internal IP. After touching name
  resolution, test the login of every app.
