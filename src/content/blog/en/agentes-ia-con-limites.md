---
title: AI agents on a real cluster, with limits
description: How I run Ebro with Claude Code and MCP without handing over every key. Auditors that only read, operators that only act with someone watching, and changes that always go through a pull request.
date: 2026-11-25
draft: false
format: articulo
stack: [Claude Code, MCP, Kubernetes RBAC, GitOps, Proton Pass]
---

## Why

A good part of the day-to-day work on Ebro is diagnosis: why an application shows as degraded,
whether a backup restored correctly, what changed between the deployed version and the latest
release. An agent with access to metrics, to ArgoCD and to the cluster does that work in minutes.
The risk is the same access being used to change something nobody decided on.

The starting rule: **the agent proposes and verifies; a person decides the changes, and they end
up in git.**

## Two kinds of agent

| Kind | What it does | Permissions | When |
|---|---|---|---|
| Auditor | Diagnosis: ArgoCD health, backups, credential expiry, version drift, firewall | Read-only | Also unattended |
| Operator | Applies something already decided: restart, drain a node, merge a batch of updates | Admin | Only in a session with me present |

Auditors use a `kubeconfig` with their own ServiceAccount, bound to Kubernetes' `view` role: no
Secrets, no `exec` and no `port-forward`. If an auditor tries to write, RBAC stops it, not its
good intentions. They are the only ones that run on their own, for example the weekly firewall
audit.

The typical flow is auditor, then a decision in the conversation, then an operator with the
concrete action.

## Every change is a pull request

ArgoCD syncs the cluster from git, so a "live" change reverts itself. Agents work like anyone
else: branch, commit, `make validate` (lint and schema validation, which also runs as a hook
before every push), pull request and green checks. The merge is the decision, and it is on
record.

## Secrets the agent never sees

Secret values live in a password manager. The agent can **seal** them for the cluster (a pipeline
that reads from the password manager and ends in `kubeseal`), but never print them: whatever shows
up on screen ends up in the conversation history. It also uses its own audited session in the
password manager, not my personal token.

## A second model reviews every plan

Before a plan is executed, a hook sends it to another model from another provider to challenge
it. If it finds something of high severity, the plan does not move forward until it is fixed or
rebutted with evidence.

The first time I used it I learned something: the agent accepted thirteen findings in forty
seconds without checking any of them. Now the rule is to verify every finding in the code before
accepting it. A reviewer nobody ever argues with is not reviewing anything.

## What is not solved

The separation is not perfect, and I would rather say so. Auditors have a shell and could use the
admin `kubeconfig`; the full technical restriction only exists for the home automation agent,
which only has read tools. And the firewall auditor uses a tool that can also write. It is
documented as a risk, not hidden.

## What I take away

- An agent's access is designed like a new team member's: least privilege, reviewable changes and
  no plaintext secrets.
- AI speeds up diagnosis far more than execution. Execution is what needs the brakes.
- Asking another model to challenge the plan works, as long as someone also challenges what the
  reviewer says.
