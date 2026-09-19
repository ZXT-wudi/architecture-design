# Architecture Design Skill ｜ 全项目架构设计技能

**中文** ｜ [English](#english)

一句话：让 AI 编码代理从一句想法出发，走完 **需求 → 估算 → 选型 → 架构 → 数据/接口 → 质量/运维 → 决策记录 → 蓝图评审 → 实施计划 → 开发 → 验收 → 收敛** 的完整生命周期，一次开发就达到可用、可维护的成果。

> 适用：任何支持 [Agent Skills](https://agentskills.io) 规范的编码代理（Claude Code / ZCode / Codex CLI 等）。
> 零依赖：全部内容为 Markdown；唯一的可执行脚本（门禁预检）只需 Node.js ≥ 18。

---

## 最新更新 What's New（v1.3.1 ｜ 2026-09）

本轮把"开发执行"环节升级为**写码与审查分离**，并给需求与变更环节加上量化闸门：

- **双代理执行**：标准/完整档每个任务由实现者子代理写码，零上下文评审者子代理按 [`references/code-review.md`](references/code-review.md) 的 10 项清单审查——"验收标准 + 质量门禁 + 评审通过"三项达标才收账，阻塞项回实现者最多修 2 轮；迷你档与存量轻量路径保持单代理 + 自查。
- **计划评审**：Phase 9 产出 plan.md 后，派未参与规划的子代理审核计划忠实性（MUST 覆盖、验收标准可独立验证、依赖图无环无断链、无幽灵任务）；迷你档与轻量路径豁免。
- **模糊度评分闸门**：需求问卷每轮按维度自评（0.05 步进），> 0.20 继续追问不硬写，≤ 0.10 压缩为一轮批量确认。
- **变更冲突检查**：需求变更沿追踪矩阵按五类固定冲突（服务归属/接口签名/实体关系/规则矛盾/增量叠加）列波及清单，逐节 before → after，回退/接受/放弃三选一裁决。
- **失败分级处理**：A 类实现错误修复重试（2 次不过先跳过）、B 类计划/设计错误停下改蓝图或 ADR（不许蒙混过关）、C 类环境问题自动修复或跳过。
- **过期检测**：跨会话恢复时检查规格是否晚于计划被改过，是则先做影响分析再继续执行。

---

## 为什么需要它 Why

项目返工的头号原因是**需求遗漏**和**设计与实现脱节**。直接对 AI 说"帮我做个系统"，通常得到的是"先写代码再说"。本技能把应对手段做成**机制**而不是提醒：

| 机制 | 说明 |
|---|---|
| 十一维度需求问卷 | 业务/用户/功能/**界面与体验**/数据/集成/非功能/合规/运维/约束/优先级，逐维度过一遍，主动替你问出容易忘的需求（权限、导出、备份、并发冲突、SEO、界面状态…） |
| 模糊度评分闸门 | 每轮提问后按维度自评模糊度（0.05 步进），> 0.20 继续追问不硬写，≤ 0.10 压缩为一轮批量确认；推断信息显式标注"假设，待确认" |
| EARS 验收标准 | 每条需求编号（REQ-001）+ "当…系统应…"可测验收标准，设计、任务、验收全部围绕编号追溯 |
| 两道门禁 | 需求未确认不设计、蓝图未确认不开发；支持**预授权**（"按你的推荐走，里程碑再找我"） |
| 规模估算防过度设计 | back-of-envelope 推算 QPS/存储/带宽 → 定架构档次（L1 单机 ~ L4 分布式），三个用户的项目上不了 K8s |
| 机器可校验门禁 | 结构预检脚本：必备章节、MUST 缺 EARS、≥80% 追溯底线、幽灵 REQ 编号、ADR 状态枚举、蓝图缺页面清单 |
| 页面清单（UX） | 前端需求的基本单位：页面 → 路由 → 承载 REQ → 关键组件；可选 HTML 静态视觉稿 |
| ADR 决策记录 | 每个关键选型一篇一页纸的决策记录，系统因此有自己的"编年史" |
| 双代理执行 | 每个任务"实现者写码 → 评审者（零上下文）按 code-review.md 清单审查 → 通过才收账"，阻塞项回实现者最多修 2 轮；波内多任务并行开发 |
| 失败分级处理 | A 类实现错误修复重试（2 次不过先跳过）、B 类计划/设计错误停下改蓝图或 ADR（不许蒙混过关）、C 类环境问题自动修复或跳过 |
| 变更冲突检查 | 需求变更沿追踪矩阵按五类固定冲突（服务归属/接口签名/实体关系/规则矛盾/增量叠加）列波及清单，逐节 before → after，回退/接受/放弃三选一裁决 |
| 跨会话恢复 | 文档即断点：compaction 后重读文档恢复进度；恢复时做过期检测（规格晚于计划被改过，先做影响分析再执行）；派子代理前所需上下文必须已落盘 |
| 三档分诊 | 迷你（单页 mini-blueprint）/ 标准（四份文档）/ 完整（加模块级评审）——改个 bug 不会惊动全流程 |

## 快速开始 Quick Start

### 安装 Install

```bash
# 方式一：skills CLI（自动装到你的编码代理）
npx skills add ZXT-wudi/architecture-design

# 方式二：克隆到用户级技能目录（对所有项目生效）
git clone https://github.com/ZXT-wudi/architecture-design.git ~/.agents/skills/architecture-design

# 方式三：克隆到项目级（仅本项目生效）
git clone https://github.com/ZXT-wudi/architecture-design.git <你的项目>/.agents/skills/architecture-design
```

### 使用 Use

新开会话，正常说人话即可触发。典型输入：

```text
我想做一个电商网站，帮我从零开始规划        # 新项目全流程
给现有的博客系统加个评论功能                # 存量项目轻量路径
帮我设计一个高并发秒杀系统                  # 规模估算 + 质量设计
简化点，做个小工具                          # 迷你档（单页 mini-blueprint）
按你的推荐走，别反复问我，里程碑再找我       # 预授权模式
```

流程中你只需要做两件事：**门禁 1 确认需求清单**、**门禁 2 确认项目蓝图**。其余阶段产出全部落在项目的 `docs/architecture/`：

```text
docs/architecture/
├── requirements.md    # 需求规格（REQ 编号、EARS、MoSCoW、追踪矩阵）
├── blueprint.md       # 项目蓝图（估算、技术栈、架构、页面清单、数据、API、质量、部署）
├── plan.md            # 实施计划（里程碑、任务波次、REQ 追溯、验收标准）
└── decisions/         # ADR-0001、ADR-0002 …（关键决策编年史）
```

### 门禁预检脚本 Gate Linter

门禁的机器裁决层——先跑脚本，exit 0 再进人工评审：

```bash
node scripts/check_traceability.mjs docs/architecture
```

检查项与级别（`[FATAL]` 挡门禁 / `[warn]` 需人工确认）：

- 需求侧：必备章节（概述 / Out of Scope / 非功能）、MUST 缺 EARS 验收标准、缺优先级、技术栈名词混入需求
- 追溯侧：MUST 无覆盖、整体覆盖率 < 80%、幽灵 REQ 编号、任务缺 REQ 标注、编号空洞
- 决策侧：ADR 状态非法（proposed/accepted/rejected/superseded/deprecated）、蓝图缺关键章节（技术栈/架构/规模估算/**页面清单**）

### 回归自测 Selftest

修改脚本后必跑（预期：fail 夹具 exit 1、pass 夹具 exit 0）：

```bash
node scripts/check_traceability.mjs selftest/gate-fail   # 预期 exit 1（6 FATAL）
node scripts/check_traceability.mjs selftest/gate-pass   # 预期 exit 0
```

`evals/` 内含 20 条触发可靠性测试查询（10 应触发 + 10 不应触发），用于调优 description 的触发准确率。

## 目录结构 Structure

```text
architecture-design/
├── SKILL.md                  # 主工作流：12 阶段 + 2 门禁 + 反模式红旗（渐进披露第 2 层）
├── references/               # 按需加载的专题参考（第 3 层）
│   ├── requirements.md       #   十一维度问卷 + EARS + MoSCoW + 变更增量
│   ├── estimation.md         #   back-of-envelope 估算与档次结论表
│   ├── tech-stack.md         #   分场景默认栈与选型决策顺序
│   ├── patterns.md           #   架构风格决策表与演进策略
│   ├── data-and-api.md       #   数据建模 / API 规范 / RBAC
│   ├── quality-attributes.md #   质量属性 / 安全底线 / 失效模式
│   ├── testing-quality.md    #   测试策略与 DoD 门禁
│   ├── code-review.md        #   评审者操作手册：检查清单 / 输出格式 / 修复回路
│   ├── deployment.md         #   环境 / CI/CD / 监控备份 / 上线清单
│   ├── project-structure.md  #   标准目录结构与 12-Factor 要点
│   ├── adr.md                #   ADR 写法与生命周期
│   └── diagram.md            #   C4 + Mermaid 图表规范
├── assets/templates/         # 需求规格 / 项目蓝图 / ADR / 实施计划 / 迷你蓝图 / CHK 质量清单
├── assets/examples/          # 博客平台全流程示例（四份文档长什么样）
├── scripts/check_traceability.mjs   # 门禁预检脚本
├── selftest/                 # 脚本回归夹具（fail / pass）
└── evals/                    # 触发可靠性评测集（20 条）
```

## 设计理念与致谢 Credits

本技能吸收了 2026 年 spec 驱动开发社区的公开智慧，向这些项目致谢：

- [github/spec-kit](https://github.com/github/spec-kit) —— SDD 流程原语、converge 收敛反查、≥80% 追溯底线
- [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) —— 需求增量（ADDED/MODIFIED/REMOVED）与变更归档
- [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) —— 阶段门禁、right-sizing 分诊
- [AWS Kiro](https://kiro.dev/) —— EARS 验收语法、任务波次并行
- [obra/superpowers](https://github.com/obra/superpowers) —— 零上下文两阶段评审、需求访谈方法
- [buildermethods/agent-os](https://github.com/buildermethods/agent-os) —— 工程标准自动发现与注入
- VibeCoding 实践套件（prd-to-spec / spec-to-plan / execute-plan）—— 模糊度评分闸门、变更冲突检测、实现者+评审者双代理与失败分级

在架构深度上（规模估算、选型论证、C4 建模、质量/运维设计、ADR、可脚本校验的追溯矩阵）亦有独立设计。

## License

[MIT](LICENSE)

---

<a id="english"></a>
# Architecture Design Skill (English)

One line: takes an AI coding agent from a one-sentence idea through the **full lifecycle** — requirements → estimation → stack selection → architecture → data/API → quality/ops → decision records → blueprint review → implementation plan → build → acceptance → convergence — so one pass of development lands something usable and maintainable.

> Works with any coding agent that supports the [Agent Skills](https://agentskills.io) spec (Claude Code / ZCode / Codex CLI, etc.).
> Zero dependencies: everything is Markdown; the only executable (the gate linter) needs Node.js ≥ 18.

## What's New

**v1.3.1 (2026-09)** — code generation now separates writing from reviewing:

- **Dual-agent execution**: in Standard/Full tiers every task is written by an implementer subagent and audited by a zero-context reviewer against the 10-item checklist in [`references/code-review.md`](references/code-review.md). A task is done only when acceptance criteria + quality gate + review all pass; blocking findings loop back to the implementer, max 2 rounds. Mini tier and the brownfield light path stay single-agent with self-check.
- **Plan review**: after Phase 9 produces plan.md, a fresh subagent audits plan fidelity (MUST coverage, independently verifiable acceptance criteria, acyclic dependency graph, no ghost tasks). Mini tier and the light path are exempt.
- **Ambiguity scoring gate** in the requirements interview (above 0.20 keep asking instead of guessing; at or below 0.10, one batch confirmation).
- **Change conflict checks**: five fixed conflict classes, per-section before → after, and a revert / accept / drop ruling.
- **A/B/C failure triage** during execution, and **staleness detection** on cross-session resume.

## Why

The top causes of rework are **missed requirements** and **design/implementation drift**. This skill turns the countermeasures into *mechanics* rather than reminders:

| Mechanic | What it does |
|---|---|
| 11-dimension requirements interview | Business / users / features / **UI & UX** / data / integrations / NFRs / compliance / ops / constraints / priorities — proactively asks what you'd forget (permissions, exports, backups, concurrency, SEO, UI states…) |
| Ambiguity scoring gate | After each interview round, score each dimension (0.05 steps); above 0.20 keep asking instead of guessing, at or below 0.10 collapse into one batch confirmation; inferred facts are labeled "assumption, to confirm" |
| EARS acceptance criteria | Every requirement numbered (REQ-001) with testable "WHEN … THE SYSTEM SHALL …" criteria; design, tasks and acceptance all trace to the number |
| Two gates | No design before requirements are confirmed; no code before the blueprint is approved. Supports **pre-authorization** ("go with your recommendations, check in at milestones") |
| Estimation against over-engineering | Back-of-envelope QPS/storage/bandwidth → architecture tier (L1 single box ~ L4 distributed). A 3-user project never gets Kubernetes |
| Machine-checkable gates | A structural linter: required sections, MUST without EARS, ≥80% traceability floor, ghost REQ ids, ADR status enum, missing page inventory |
| Page inventory (UX) | The basic unit of frontend requirements: page → route → REQ → key components; optional static HTML mockups |
| ADRs | One-page decision records; the system gets its own chronicle |
| Dual-agent execution | Every task: implementer writes code → zero-context reviewer audits against a checklist (code-review.md) → task is checked off only when the review passes; blocking findings go back to the implementer, max 2 rounds; tasks within a wave run in parallel |
| Failure triage | Class A implementation errors: fix and retry (skip after 2 failed rounds); Class B plan/design errors: stop and revise the blueprint — no muddling through; Class C environment issues: auto-fix or skip |
| Change conflict check | Requirement changes fan out through the traceability matrix across five fixed conflict classes (ownership / API signature / entity relations / rule contradictions / overlapping changes); each affected section gets a before → after and a revert / accept / drop ruling |
| Cross-session resume | Documents are the checkpoint: after context compaction, re-read docs and run staleness detection (if the spec changed after the plan was generated, do impact analysis first); everything a subagent needs must be on disk before it is spawned |
| Triage | Mini (one-page mini-blueprint) / Standard (four documents) / Full — a bug fix never triggers the full ceremony |

## Install

```bash
# Option 1: skills CLI (installs into your coding agent)
npx skills add ZXT-wudi/architecture-design

# Option 2: user-level skill directory (all projects)
git clone https://github.com/ZXT-wudi/architecture-design.git ~/.agents/skills/architecture-design

# Option 3: project-level
git clone https://github.com/ZXT-wudi/architecture-design.git <project>/.agents/skills/architecture-design
```

## Use

Open a fresh session and speak naturally:

```text
I want to build an e-commerce site, help me plan it from scratch   # full flow
Add a comment feature to my existing blog                          # brownfield, light path
Design a high-concurrency flash-sale system                        # estimation + quality focus
Keep it simple, it's just a small tool                             # mini tier
Go with your recommendations, check in at milestones               # pre-authorized mode
```

You only decide twice: **Gate 1 — confirm the requirement list**, **Gate 2 — approve the project blueprint**. Everything lands in `docs/architecture/` (requirements.md / blueprint.md / plan.md / decisions/ADR-*.md).

## Gate linter

```bash
node scripts/check_traceability.mjs docs/architecture
```

`[FATAL]` blocks the gate (exit 1); `[warn]` needs human confirmation. Covers required sections, MUST-without-EARS, the ≥80% traceability floor, ghost REQ ids, tasks without REQ tags, ADR status enum, and blueprint sections (tech stack / architecture / estimation / **page inventory**).

## Selftest

```bash
node scripts/check_traceability.mjs selftest/gate-fail   # expect exit 1
node scripts/check_traceability.mjs selftest/gate-pass   # expect exit 0
```

`evals/` ships 20 trigger-reliability prompts (10 should-trigger, 10 should-not) for tuning the skill description.

## Credits

Standing on the shoulders of the 2026 spec-driven-development community:

[github/spec-kit](https://github.com/github/spec-kit) · [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) · [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) · [AWS Kiro](https://kiro.dev/) · [obra/superpowers](https://github.com/obra/superpowers) · [buildermethods/agent-os](https://github.com/buildermethods/agent-os) · VibeCoding practice suite (prd-to-spec / spec-to-plan / execute-plan)

Architecture depth (capacity estimation, selection argumentation, C4 modeling, quality/ops design, ADRs, script-checkable traceability) is this skill's own design.

## License

[MIT](LICENSE)
