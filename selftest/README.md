# selftest：门禁 lint 脚本的回归测试

修改 `scripts/check_traceability.mjs` 后必跑。两个夹具目录：

| 目录 | 预期 | 覆盖的检查项 |
|---|---|---|
| `gate-fail/` | exit 1，含 6 个 FATAL | MUST 缺 EARS、缺 Out of Scope、缺非功能需求、幽灵编号 REQ-099、覆盖率 < 80%、ADR 状态非法（approved） |
| `gate-fail/` 的 warn | 不挡门禁但应出现 | REQ-003 缺优先级、REQ-002 未被引用（移期确认）、blueprint 缺"页面清单"章节 |
| `gate-pass/` | exit 0，零 FATAL 零 warn | 全部检查项通过的最小合规集 |

```bash
# 失败夹具：应 exit 1
node scripts/check_traceability.mjs selftest/gate-fail
# 通过夹具：应 exit 0
node scripts/check_traceability.mjs selftest/gate-pass
```

夹具取材与 references/requirements.md 的规则一一对应；改规则时两处同步。
