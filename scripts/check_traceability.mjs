#!/usr/bin/env node
/**
 * 架构门禁预检（Gate Linter）——门禁的机器裁决层：先跑本脚本，exit 0 再进人工评审。
 *
 * 用法：node check_traceability.mjs [docs/architecture 目录，默认 ./docs/architecture]
 * 退出码：0 = 通过（可含 warn）；1 = 存在 FATAL，门禁不通过。
 * 门禁 1 阶段（尚无蓝图/计划）只跑需求侧检查，属正常。
 *
 * 检查项（[FATAL]=挡门禁  [warn]=需人工确认）：
 *   需求侧 requirements.md
 *     [FATAL] 缺必备章节：项目概述/一句话、Out of Scope（明确不做）、非功能需求
 *     [FATAL] MUST 需求段内没有 EARS 验收标准（"系统应…"/"shall"）
 *     [warn]  需求缺优先级标注 [MUST/SHOULD/COULD/W]
 *     [warn]  需求文本出现技术栈名词（疑似实现细节混入；若在约束/Out of Scope 章节属合法记录）
 *   追溯侧 需求 × 蓝图 × 计划
 *     [FATAL] MUST 需求未被蓝图或计划引用；整体覆盖率 < 80%（spec-kit 追溯底线）
 *     [FATAL] 蓝图/计划引用了 requirements.md 未定义的 REQ 编号（幽灵编号）
 *     [FATAL] plan.md 的任务块未标注实现的 REQ
 *     [warn]  SHOULD/COULD 未被引用（确认是有意移期）；REQ 编号空洞；MUST 未进计划
 *   决策与蓝图侧
 *     [FATAL] ADR 状态非法（合法值：proposed/accepted/rejected/superseded/deprecated）
 *     [warn]  ADR 缺状态行；blueprint 引用 ADR 但 decisions/ 不存在；blueprint 缺关键章节
 *             （技术栈/架构/规模估算/页面清单）
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] ?? "docs/architecture";
const read = (f) => {
  const p = join(base, f);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
};

const reqsMd = read("requirements.md");
const blueprintMd = read("blueprint.md");
const planMd = read("plan.md");

if (!reqsMd) {
  console.error(`[error] 未找到 ${join(base, "requirements.md")}`);
  process.exit(1);
}

const REQ = /REQ-\d{3,}/;
const REQG = /REQ-\d{3,}/g;
const PRIO = /\[(MUST|SHOULD|COULD|W)\]/i;
const EARS = /系统应|系统 shall|shall /i;
const TECH =
  /\b(React|Vue|Next\.?js|Nuxt|Node\.?js|TypeScript|Redis|PostgreSQL|MySQL|MongoDB|SQLite|Docker|Kubernetes|K8s|Prisma|FastAPI|Spring|Django|Tailwind|shadcn)\b/gi;

const fatal = [];
const warn = [];

// ---------- A. 需求侧：必备章节 ----------
for (const [name, re] of [
  ["项目概述/一句话", /项目概述|一句话/],
  ["Out of Scope（明确不做）", /Out of Scope|明确不做/],
  ["非功能需求", /非功能/],
]) {
  if (!re.test(reqsMd)) fatal.push(`requirements.md 缺必备章节：${name}`);
}

// ---------- A. 需求侧：逐条 REQ 检查 EARS 与优先级 ----------
const headers = [...reqsMd.matchAll(/^#{2,4}.*REQ-\d{3,}.*$/gm)];
const defined = new Map(); // id -> prio（null = 未标注）
if (headers.length === 0) {
  fatal.push("requirements.md 未发现任何 REQ 条目（条目格式应为 '### REQ-001 标题 [MUST]'）");
}
for (let i = 0; i < headers.length; i++) {
  const start = headers[i].index;
  const end = i + 1 < headers.length ? headers[i + 1].index : reqsMd.length;
  const block = reqsMd.slice(start, end);
  const id = block.match(REQ)[0];
  const prio = PRIO.exec(block)?.[1]?.toUpperCase() ?? null;
  defined.set(id, prio);
  if (!prio) warn.push(`${id} 缺优先级标注 [MUST/SHOULD/COULD/W]`);
  if (prio === "MUST" && !EARS.test(block)) {
    fatal.push(`${id} [MUST] 段内没有 EARS 验收标准（"系统应…"/"shall"）`);
  }
}

// ---------- A. 需求侧：技术栈名词混入 ----------
const techHits = new Set();
for (const m of reqsMd.matchAll(TECH)) techHits.add(m[0]);
if (techHits.size) {
  warn.push(
    `需求文本出现技术栈名词（确认是实现细节混入，还是约束/Out of Scope 章节的合法记录）：${[...techHits].join("、")}`
  );
}

// ---------- B. 追溯侧 ----------
let coverageText = "";
if (blueprintMd || planMd) {
  // 幽灵编号：蓝图/计划引用了未定义的 REQ
  const refs = new Set();
  for (const m of (blueprintMd + "\n" + planMd).matchAll(REQG)) refs.add(m[0]);
  const ghosts = [...refs].filter((id) => !defined.has(id)).sort();
  if (ghosts.length) fatal.push(`蓝图/计划引用了未定义的 REQ 编号：${ghosts.join("、")}`);

  // 逐条覆盖 + 整体底线
  let covered = 0;
  for (const [id, prio] of defined) {
    const inBp = blueprintMd.includes(id);
    const inPlan = planMd.includes(id);
    if (inBp || inPlan) covered++;
    if (prio === "MUST") {
      if (!inBp && !inPlan) fatal.push(`${id} [MUST] 未被蓝图或实施计划引用`);
      else if (!inBp) fatal.push(`${id} [MUST] 缺少蓝图覆盖（仅出现在计划中）`);
      else if (!inPlan) warn.push(`${id} [MUST] 未出现在实施计划`);
    } else if (inBp || inPlan) {
      if (!inPlan) warn.push(`${id} [${prio ?? "?"}] 未出现在实施计划`);
    } else if (prio) {
      warn.push(`${id} [${prio}] 未被蓝图或计划引用——确认是有意移期/不做`);
    }
    // prio 为 null 且未被引用时，缺优先级警告已覆盖，不重复报警
  }
  if (defined.size > 0) {
    const pct = Math.round((covered / defined.size) * 100);
    coverageText = `需求覆盖率：${pct}%（${covered}/${defined.size}）`;
    if (pct < 80) {
      fatal.push(`需求覆盖率 ${pct}% 低于 80% 底线——回补设计再过门禁`);
    }
  }
}

// plan.md 任务块必须标注 REQ
const taskHeads = [...planMd.matchAll(/^#{2,4}\s*(T-\d+).*$/gm)];
for (let i = 0; i < taskHeads.length; i++) {
  const start = taskHeads[i].index;
  const end = i + 1 < taskHeads.length ? taskHeads[i + 1].index : planMd.length;
  if (!REQ.test(planMd.slice(start, end))) {
    fatal.push(`任务 ${taskHeads[i][1]} 未标注实现的 REQ 编号`);
  }
}

// 编号空洞
const nums = [...defined.keys()].map((id) => parseInt(id.slice(4), 10)).sort((a, b) => a - b);
if (nums.length) {
  const missing = [];
  for (let n = 1; n <= nums[nums.length - 1]; n++) {
    if (!nums.includes(n)) missing.push(`REQ-${String(n).padStart(3, "0")}`);
  }
  if (missing.length) {
    warn.push(`编号空洞（若为已移除需求请确认已标注 removed）: ${missing.join(", ")}`);
  }
}

// ---------- C. 决策与蓝图侧 ----------
const decDir = join(base, "decisions");
if (existsSync(decDir)) {
  for (const f of readdirSync(decDir).filter((x) => x.endsWith(".md")).sort()) {
    const text = readFileSync(join(decDir, f), "utf8");
    const statusLine = text.match(/^\s*[-*]?\s*\**状态\**\s*[:：]\s*(.+)$/m);
    if (!statusLine) {
      warn.push(`${f} 缺状态行（- 状态: proposed|accepted|...）`);
      continue;
    }
    const s = statusLine[1].toLowerCase();
    const ok = ["proposed", "accepted", "rejected", "superseded", "deprecated"].some((k) =>
      s.includes(k)
    );
    if (!ok) {
      fatal.push(
        `${f} 状态非法："${statusLine[1].trim()}"（合法：proposed/accepted/rejected/superseded/deprecated）`
      );
    }
  }
} else if (blueprintMd && /ADR-\d{3,}/.test(blueprintMd)) {
  warn.push("blueprint 引用了 ADR，但 decisions/ 目录不存在");
}

if (blueprintMd) {
  for (const [name, re] of [
    ["技术栈", /技术栈/],
    ["架构设计", /架构/],
    ["规模估算", /规模估算/],
    ["前端设计/页面清单", /页面清单|前端设计/],
  ]) {
    if (!re.test(blueprintMd)) warn.push(`blueprint.md 缺章节：${name}`);
  }
}

// ---------- 输出 ----------
const mustCount = [...defined.values()].filter((p) => p === "MUST").length;
if (coverageText) console.log(coverageText);
console.log(`需求 ${defined.size} 条（MUST ${mustCount} 条）`);
for (const w of warn) console.log(`[warn] ${w}`);
for (const f of fatal) console.log(`[FATAL] ${f}`);
if (fatal.length) {
  console.log(`\n结果：不通过 —— ${fatal.length} 个致命问题，修复后再过门禁`);
  process.exit(1);
}
console.log("\n结果：通过（结构检查；语义合理性交人工评审）");
