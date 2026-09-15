# 项目结构与工程约定

模块划分（patterns.md）定的是逻辑边界，本文件把它落到物理目录。目录结构即架构的可执行表达——新人看目录就该看懂模块边界。

## 一、标准目录结构（前后端分离 + 模块化单体）

```
project/
├── apps/
│   ├── web/                  # 前端（Vite SPA / Next.js）
│   └── server/               # 后端
│       ├── src/
│       │   ├── modules/      # 按业务域划分（= 蓝图里的模块划分）
│       │   │   ├── article/
│       │   │   │   ├── routes.ts      # 路由/控制器（薄）
│       │   │   │   ├── service.ts     # 业务逻辑（厚）
│       │   │   │   ├── repo.ts        # 数据访问（只有这一层碰 ORM）
│       │   │   │   ├── schema.ts      # 输入校验
│       │   │   │   └── article.test.ts
│       │   │   ├── comment/
│       │   │   └── auth/
│       │   ├── shared/       # 跨模块通用（要克制，防垃圾场化）
│       │   │   ├── db.ts              # 连接/事务
│       │   │   ├── middleware/        # 鉴权、错误处理、request id
│       │   │   └── config.ts          # 环境变量读取（唯一入口）
│       │   └── app.ts                 # 组装：注册路由与中间件
│       ├── migrations/       # 数据库迁移脚本
│       └── tests/            # 跨模块集成测试
├── packages/                 # 共享包（同构类型/工具，monorepo 时用）
├── docs/architecture/        # 本技能的四份文档 + decisions/
├── docker-compose.yml        # 本地依赖（数据库/redis）
├── .github/workflows/ci.yml  # CI 流水线
├── .env.example              # 环境变量清单（无真实值）
├── .gitignore                # .env、node_modules、构建产物
└── README.md                 # 如何跑起来（见下）
```

单模块小项目（L1 纯工具）：允许简化为 `src/` 下直接分层（routes/services/repos），但 `shared/config.ts 唯一入口`、`migrations/`、`.env.example`、CI 四样不许省。

## 二、模块边界规则（对应 patterns.md 的物理化）

1. 模块 A 不 import 模块 B 的 `repo.ts`/内部函数——只 import B 的 `service.ts` 公开方法或走 HTTP。
2. ORM 模型只属于一个模块；跨模块读数据走对方 service，不 join 别的模块的表。
3. `shared/` 只放真正无业务的通用件；发现 shared 里有业务逻辑 = 边界错了。
4. 迁移脚本编号递增、只增不改（改历史迁移 = 破坏所有已部署环境）。

## 三、配置与 12-Factor 要点

- **环境变量是唯一配置入口**：`shared/config.ts` 启动时读取并校验（缺了直接 fail-fast 报错），任何模块不许直接 `process.env`。
- `.env.example` 永远与实际配置同步——部署核对清单（deployment.md）靠它逐项过。
- 日志输出到 stdout（收集交给部署层），不自己写日志文件。
- 应用无状态：不落本地文件（对象存储）、session 外置（Redis/数据库）、不依赖本机内存缓存做多实例共享。

## 四、命名与风格

- 文件名与语言生态惯例一致（TS：kebabCase 或 camelCase 一致即可；Python：snake_case），**一个仓库内一个风格**，用 lint 强制。
- 数据库：表名复数 snake_case（`articles`），字段 snake_case，索引命名 `idx_<表>_<字段>`。
- Git：main 分支保护，feature 分支 + PR（哪怕单人开发——CI 门禁在 PR 上跑），conventional commits（feat/fix/docs/chore）。

## 五、README 必答清单（项目骨架时生成）

```markdown
# 项目名
一句话：这个项目是什么
## 快速开始
前置依赖（Node 22 / PostgreSQL 16 …具体版本）
cp .env.example .env   # 填什么
docker compose up -d   # 起依赖
npm install && npm run migrate && npm run dev
## 常用命令
dev / test / lint / migrate / deploy
## 架构文档
docs/architecture/（blueprint.md 是入口）
```

验收标准：**新同事只看 README 能在 30 分钟内跑起来项目**。跑不起来就改 README，而不是口头解释。
