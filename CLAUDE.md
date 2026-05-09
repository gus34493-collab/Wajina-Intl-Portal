<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Wajina-Intl-Portal** (3316 symbols, 4706 relationships, 102 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Wajina-Intl-Portal/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Wajina-Intl-Portal/clusters` | All functional areas |
| `gitnexus://repo/Wajina-Intl-Portal/processes` | All execution flows |
| `gitnexus://repo/Wajina-Intl-Portal/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# Wajina International Schools - Architecture Pivot

## Current Objective: Refactoring & Migration
We are currently executing a major architectural pivot from a legacy Vanilla JS environment to a secure, multi-tenant Next.js and Prisma stack. 

Do not generate new features, write imperative DOM manipulation, or use absolute typography units. 

## The Architectural Mandate
You must strictly follow the step-by-step migration plan, burn list, and design token rules outlined in this master document:

@C:\Users\strad\OneDrive\Documents\Obsidian Vault\Projects\Wajina-Refactoring-Audit.md.md

---

# Installed Skill Libraries

You have **11 skill libraries** installed in `.agents/skills/`. You MUST actively consult the relevant SKILL.md files before performing any task that matches a skill's trigger. Read the SKILL.md, follow its workflow, and apply its patterns.

## Always-Active Behavioral Rules (Karpathy Guidelines)

These rules from `.agents/skills/karpathy-skills/CLAUDE.md` apply to ALL tasks:

1. **Think Before Coding** — State assumptions explicitly. If uncertain, ask. If multiple interpretations exist, present them. Push back when warranted.
2. **Simplicity First** — Minimum code that solves the problem. No speculative features, no abstractions for single-use code, no "flexibility" that wasn't requested. If 200 lines could be 50, rewrite it.
3. **Surgical Changes** — Touch only what you must. Don't "improve" adjacent code. Match existing style. Remove only orphans YOUR changes created.
4. **Goal-Driven Execution** — Transform tasks into verifiable goals with success criteria. State a brief plan with verify steps.

## Skill Activation Table

Before starting ANY task, scan this table. If the task matches a trigger, read the linked SKILL.md FIRST.

### 🔧 Core Development Workflows

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| Any creative work, new features, new components | Brainstorming | `.agents/skills/superpowers/skills/brainstorming/SKILL.md` |
| Writing implementation plans | Writing Plans | `.agents/skills/superpowers/skills/writing-plans/SKILL.md` |
| Executing an approved plan | Executing Plans | `.agents/skills/superpowers/skills/executing-plans/SKILL.md` |
| 2+ independent tasks to parallelize | Dispatching Parallel Agents | `.agents/skills/superpowers/skills/dispatching-parallel-agents/SKILL.md` |
| Starting any feature branch | Using Git Worktrees | `.agents/skills/superpowers/skills/using-git-worktrees/SKILL.md` |
| Completing a feature branch | Finishing a Branch | `.agents/skills/superpowers/skills/finishing-a-development-branch/SKILL.md` |

### 🧪 Testing & Quality

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| Writing any new feature or bugfix | Test-Driven Development | `.agents/skills/superpowers/skills/test-driven-development/SKILL.md` |
| Any bug, test failure, or unexpected behavior | Systematic Debugging | `.agents/skills/superpowers/skills/systematic-debugging/SKILL.md` |
| Completing tasks or major features | Requesting Code Review | `.agents/skills/superpowers/skills/requesting-code-review/SKILL.md` |
| After deploying, verifying UI | Browser QA | `.agents/skills/everything-claude-code/skills/browser-qa/SKILL.md` |
| E2E testing with Playwright | E2E Testing | `.agents/skills/everything-claude-code/.agents/skills/e2e-testing/SKILL.md` |
| Verifying all changes before commit | Verification Loop | `.agents/skills/everything-claude-code/.agents/skills/verification-loop/SKILL.md` |

### 🏗️ Architecture & Patterns

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| Frontend React/Next.js work | Frontend Patterns | `.agents/skills/everything-claude-code/.agents/skills/frontend-patterns/SKILL.md` |
| Backend/API work | Backend Patterns | `.agents/skills/everything-claude-code/.agents/skills/backend-patterns/SKILL.md` |
| REST API design | API Design | `.agents/skills/everything-claude-code/.agents/skills/api-design/SKILL.md` |
| Coding standards questions | Coding Standards | `.agents/skills/everything-claude-code/.agents/skills/coding-standards/SKILL.md` |
| Database/Postgres queries or schema | Postgres Patterns | `.agents/skills/everything-claude-code/.kiro/skills/postgres-patterns/SKILL.md` |
| Database migrations | Database Migrations | `.agents/skills/everything-claude-code/.kiro/skills/database-migrations/SKILL.md` |
| NestJS patterns | NestJS Patterns | `.agents/skills/everything-claude-code/skills/nestjs-patterns/SKILL.md` |
| Next.js Turbopack | Next.js Turbopack | `.agents/skills/everything-claude-code/.agents/skills/nextjs-turbopack/SKILL.md` |

### 🔒 Security & Review

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| Auth, user input, secrets, API endpoints, payments | Security Review | `.agents/skills/everything-claude-code/.agents/skills/security-review/SKILL.md` |
| Security scanning or bounty hunting | Security Bounty Hunter | `.agents/skills/everything-claude-code/skills/security-bounty-hunter/SKILL.md` |
| Preventing destructive ops in production | Safety Guard | `.agents/skills/everything-claude-code/skills/safety-guard/SKILL.md` |

### 🎨 Design & UI

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| Design system work, tokens, components | Design System | `.agents/skills/everything-claude-code/skills/design-system/SKILL.md` |
| Accessibility / WCAG compliance | Accessibility | `.agents/skills/everything-claude-code/skills/accessibility/SKILL.md` |
| Brand voice, brand identity | Brand | `.agents/skills/ui-ux-pro-max/.claude/skills/brand/SKILL.md` |
| Presentations / slides | Slides | `.agents/skills/ui-ux-pro-max/.claude/skills/slides/SKILL.md` |
| Interaction design, micro-animations | Interaction Design | `.agents/skills/wshobson-agents/plugins/ui-design/skills/interaction-design/SKILL.md` |

### 📦 DevOps & Infrastructure

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| Git branching, commits, workflow | Git Workflow | `.agents/skills/everything-claude-code/skills/git-workflow/SKILL.md` |
| Docker configuration | Docker Patterns | `.agents/skills/everything-claude-code/.kiro/skills/docker-patterns/SKILL.md` |
| Deployment strategies | Deployment Patterns | `.agents/skills/everything-claude-code/.kiro/skills/deployment-patterns/SKILL.md` |
| CI/CD secrets management | Secrets Management | `.agents/skills/wshobson-agents/plugins/cicd-automation/skills/secrets-management/SKILL.md` |
| Monitoring dashboards | Dashboard Builder | `.agents/skills/everything-claude-code/skills/dashboard-builder/SKILL.md` |

### 📊 Data & Analytics

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| PostgreSQL table/schema design | PostgreSQL Design | `.agents/skills/wshobson-agents/plugins/database-design/skills/postgresql/SKILL.md` |
| Supabase + Postgres optimization | Supabase Best Practices | `.claude/skills/supabase-postgres-best-practices` |
| Data storytelling, reports, presentations | Data Storytelling | `.agents/skills/wshobson-agents/plugins/business-analytics/skills/data-storytelling/SKILL.md` |

### 🤖 Agent & MCP Operations

| Trigger | Skill | SKILL.md Path |
|---------|-------|---------------|
| Building MCP servers | MCP Server Patterns | `.agents/skills/everything-claude-code/.agents/skills/mcp-server-patterns/SKILL.md` |
| Up-to-date library docs | Documentation Lookup (Context7) | `.agents/skills/everything-claude-code/.agents/skills/documentation-lookup/SKILL.md` |
| Performance benchmarks | Benchmark | `.agents/skills/everything-claude-code/skills/benchmark/SKILL.md` |
| Context window budget | Context Budget | `.agents/skills/everything-claude-code/skills/context-budget/SKILL.md` |

### 🌐 Extended Skill Libraries (wshobson/agents — 80 plugins, 153 skills)

For any task not covered above, search `.agents/skills/wshobson-agents/plugins/` for matching skills. Key plugin areas:

| Plugin Area | Path | Contains |
|-------------|------|----------|
| Backend development | `plugins/backend-development/skills/` | CQRS, event store, projections, saga |
| Security scanning | `plugins/security-scanning/skills/` | STRIDE, attack trees, threat mapping |
| Shell scripting | `plugins/shell-scripting/skills/` | Bash patterns, Bats testing, ShellCheck |
| Data engineering | `plugins/data-engineering/skills/` | Airflow DAGs, Spark, data quality |
| Game development | `plugins/game-development/skills/` | Godot, Unity ECS |
| LLM app development | `plugins/llm-application-dev/skills/` | RAG, hybrid search, vector tuning |
| Incident response | `plugins/incident-response/skills/` | Postmortem writing |
| Cloud infrastructure | `plugins/cloud-infrastructure/skills/` | mTLS config |
| Blockchain/Web3 | `plugins/blockchain-web3/skills/` | DeFi templates, Web3 testing |

## Global CLI Tool: Repomix

`repomix` (v1.14.0) is installed globally. Use it to pack a codebase or directory into a single file for LLM context: `repomix --output context.txt`