---
title: Secrets in git without secrets in git
description: SealedSecrets to keep encrypted credentials in the repository, a password manager as the source of truth, and audited access for AI agents.
date: 2026-10-09
draft: false
kind: Security
order: 6
stack: [SealedSecrets, Proton Pass, bash, GitHub Actions]
result: No plaintext value in the repository or in the logs; every secret can be resealed from its source with a script.
---

## Context

GitOps requires everything to be in git, credentials included. Storing them in plaintext is not
an option, and keeping them only in the cluster turns every rotation into an exercise of memory.

## Design

- **SealedSecrets**: the repository holds secrets encrypted with the controller's public key;
  only the cluster can decrypt them. The key is renewed every 30 days, and the private keys are
  kept in the configuration backup and in a separate break-glass vault.
- **The password manager is the source of truth.** Every secret has an item with a fixed name
  (`<namespace>.<secret>`). The sealing scripts read the value from there and pipe it straight
  into `kubeseal`: the value never touches the disk or the terminal.
- **Checking without revealing**: a `--check` mode compares the secret in the cluster with the
  one in the password manager and reports whether they match, without printing any value.
- **Separate access for the AI agents** that help me operate: they have their own identity,
  audited and with limited permissions, distinct from my personal access. My personal token is
  blocked for them.
- The break-glass vault has no automated access at all, on purpose.

## What I learned

- A secret that cannot be regenerated from its source ends up copied by hand somewhere.
- When an AI assistant works with you in the terminal, everything it sees ends up in a history.
  The rule is simple: values only travel through pipes, never through stdout.
