# C4 模型与 Mermaid 图表

## 一、画图的总原则

- **图是给人看 + 给未来改的**：优先能进 git、能用文本 diff 的 Mermaid，不用需要专门软件的图（drawio 导出 PNG 进仓库，改一次丢一次源）。
- **每张图只回答一个问题**，别把所有信息塞一张图里。
- 图随代码漂移就作废——蓝图评审（Phase 8）和里程碑演示时顺带核对图与实现是否一致。

## 二、C4 三级（够用即可，全画四级的场景很少）

| 级别 | 回答的问题 | 里面有什么 | 谁看 |
|---|---|---|---|
| L1 System Context | 系统和谁打交道？ | 本系统（一个盒子）+ 用户角色 + 外部系统 | 所有人，蓝图第一张图 |
| L2 Container | 系统由哪些可部署单元组成？ | SPA / 服务端 / 数据库 / 缓存 / 对象存储 / 第三方 | 技术相关人，**架构设计的核心图** |
| L3 Component | 单个部署单元内部怎么分模块？ | modules 里的模块及其依赖 | 开发者 |

规则：
- L1 必画，L2 必画，L3 在模块 ≥ 4 个或依赖关系复杂时画。
- 外部系统和用户角色必须与需求文档一致（"用户与角色"与"集成"两个维度的产物）。
- 每个盒子标注技术选型（"PostgreSQL 16"而不是"数据库"）。

## 三、Mermaid 语法模板

### L1 System Context

```mermaid
graph LR
    Reader([读者])
    Author([作者])
    subgraph BlogPlatform[博客平台]
        System((博客系统))
    end
    Email((邮件服务))
    Reader -->|浏览/评论| System
    Author -->|写作/发布| System
    System -->|发通知| Email
```

### L2 Container

```mermaid
graph LR
    User([用户])
    subgraph BlogPlatform[博客平台]
        SPA[前端 SPA<br/>React 18]
        API[服务端 API<br/>Node 22 / Fastify]
        DB[(PostgreSQL 16)]
        Cache[(Redis 7)]
        OSS[对象存储 S3]
    end
    OAuth((微信开放平台))
    User -->|HTTPS| SPA
    SPA -->|REST /api/v1| API
    API --> DB
    API --> Cache
    API --> OSS
    API -->|OAuth 登录| OAuth
```

### L3 Component（服务端内部）

```mermaid
graph TD
    subgraph server[server/src]
        Auth[auth 模块]
        Article[article 模块]
        Comment[comment 模块]
        Shared[shared/ 中间件·配置·DB]
    end
    Comment -->|调用公开接口| Article
    Article --> Shared
    Comment --> Shared
    Auth --> Shared
```

注意：L3 图里依赖箭头应与 patterns.md 的"依赖方向单一"一致，出现环即设计问题。

### 其他常用图

- **状态机**（有状态流转的实体必画）：

```mermaid
stateDiagram-v2
    [*] --> draft: 创建
    draft --> published: publish（作者）
    published --> withdrawn: 下架（管理员）
    withdrawn --> draft: 修改后重新编辑
    published --> [*]: 删除（仅无评论时）
```

- **关键流程时序图**（写操作 + 第三方交互必画，如下单支付）：

```mermaid
sequenceDiagram
    participant U as 用户
    participant A as API
    participant P as 支付网关
    U->>A: POST /orders
    A->>P: 创建支付单（超时 8s，重试 3 次）
    P-->>A: 支付 URL
    A-->>U: 返回支付页跳转
    P->>A: 回调 notify（幂等，验签）
    A->>A: 更新订单状态 + 记录事件
```

- **ER 图**（Phase 5 数据建模）：

```mermaid
erDiagram
    USER ||--o{ ARTICLE : writes
    ARTICLE ||--o{ COMMENT : has
    USER {
        uuid id PK
        string nickname
        string password_hash
        datetime created_at
    }
```

## 四、产图检查清单

- [ ] L1/L2 两张图存在且盒子都标注了具体技术
- [ ] 图里的组件与蓝图"技术栈/模块划分"章节一一对应，没有幽灵组件
- [ ] 每张图有标题和一句话说明它回答什么问题
- [ ] 有状态实体的状态机已画
- [ ] 核心写流程（支付/发布等）有时序图，第三方交互标了超时重试
