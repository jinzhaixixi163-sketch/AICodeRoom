# AICodeRoom 二开基线

本文件记录 AICodeRoom 基于 Agent Orchestrator 的第一阶段边界，避免后续开发把产品层需求误写进核心执行层。

## 基线事实

- 上游仓库：`https://github.com/Untrivial-ai/agent-orchestrator.git`
- 上游基线：`upstream/main`，提交 `d293ea81f9e3415b18fd9f62353e6335b947c854`
- 二开分支：`aicoderoom/main`
- 上游远程名：`upstream`
- 自有远程：`git@github.com:jinzhaixixi163-sketch/AICodeRoom.git`（`origin`）
- 许可证：根目录 `LICENSE` 保持 Apache License 2.0 原文；分发衍生版本时继续保留上游版权、专利、商标和归属要求
- 用户已有内容：克隆前存在的根目录 `index.html` 原样保留在本机；其中含私人联系邮箱，开源发布时不自动纳入提交

## 当前架构结论

当前 `main` 已不是旧 TypeScript 后端。真实主线是：

```text
Electron + React 桌面端 / CLI / Mobile
                 |
                 v
Go loopback daemon (REST + SSE + WebSocket)
                 |
                 v
service -> session_manager / lifecycle / observe
                 |
                 v
ports -> runtime / workspace / agent / SCM adapters
                 |
                 v
SQLite + change_log CDC
```

桌面端是薄客户端，业务事实和会话执行由 Go daemon 管理。显示状态在 service 层根据持久事实即时推导，不写入数据库。每个会话使用独立 Git worktree，TUI 与 Chat 是同一会话的两种互斥控制器模式。

## 模块处理策略

| 分类 | 模块 | 第一阶段决定 | 原因 |
| --- | --- | --- | --- |
| 保留 | `backend/internal/session_manager` | 原样保留 | 负责 spawn、restore、kill、消息投递和资源回滚，是核心命令引擎 |
| 保留 | `backend/internal/lifecycle` | 原样保留 | 生命周期事实唯一写入路径，不能被品牌或账号逻辑侵入 |
| 保留 | `backend/internal/observe` | 原样保留 | SCM、runtime 观察循环已有明确边界 |
| 保留 | `backend/internal/adapters/agent` | 原样保留 | Claude、Codex 等 agent harness 兼容层 |
| 保留 | `backend/internal/adapters/runtime` | 原样保留 | tmux/conpty 运行层 |
| 保留 | `backend/internal/adapters/workspace` | 原样保留 | Git worktree 隔离与清理安全边界 |
| 保留 | `backend/internal/storage/sqlite` 与 `cdc` | 原样保留 | 迁移、事实存储和变更广播是现有可靠主线 |
| 保留 | `ao` CLI、`AO_*`、`~/.ao`、daemon service id | 保持兼容 | 改名会破坏安装、升级、进程发现、数据目录和脚本兼容 |
| 扩展 | `frontend/src/renderer/i18n` | 复用并校准 | 上游已具备 i18next、8 个完整语言目录和 `zh-CN`，无需另建框架 |
| 扩展 | `frontend/src/shared/ui-locale.ts` | 简体中文作为首次启动默认语言 | AICodeRoom 当前目标用户以中文为主；英语继续作为缺词回退源 |
| 扩展 | Electron 打包、窗口、菜单、托盘和启动界面 | 用户可见名称改为 AICodeRoom | 品牌层变化，不影响 daemon 协议和执行能力 |
| 扩展 | 桌面端可见图标 | 使用 AICodeRoom 临时 SVG 标识 | 与已有品牌落地页的深色房间、暖色灯光语义保持一致 |
| 新建 | `docs/aicoderoom/` | 二开决策、审计和阶段记录 | 把 AICodeRoom 产品决策与上游架构文档分开 |
| 新建 | `server/` AICodeRoom Server | 独立控制面 | 用户、项目成员和任务记录不进入本地 daemon 核心 |
| 扩展 | 账号/项目/任务桌面接入 | 本地优先；云端控制面显式启用 | 开源桌面端不要求 AICodeRoom 账号；设置 `VITE_AICODEROOM_API_URL` 后才连接独立控制面 |
| 扩展 | `backend/internal/service/aiaccount` | GPT/Codex 与 Claude 独立账号档案 | 每个新任务在桌面端显式绑定档案；不把提供商凭证写入项目或 SQLite |

## 第一阶段已限定的代码范围

允许：

- i18n 启动、语言持久化和简体中文默认值
- 翻译目录里的用户可见品牌名
- Electron `productName`、窗口标题、About、托盘、安装包显示名
- 启动页、侧栏和空状态中的 AICodeRoom 名称与临时 SVG 标识
- 对应的单元测试、打包测试和覆盖检查

禁止：

- 修改 session spawn、restore、kill、handoff 或 lifecycle 状态机
- 修改 worktree 创建/销毁和 dirty worktree 安全规则
- 修改 agent、runtime、workspace、SCM、tracker adapters
- 修改 daemon listener、认证边界、API DTO、SQLite schema 或既有迁移
- 把未来多人账号、项目邀请、云端调度逻辑直接塞进本地 Electron 或 daemon

## 本地开发方式

环境要求：Go 1.25.7+、Node.js 20.19.0+、npm 10+、Git，以及至少一个可运行的 agent CLI。

```bash
# 安装桌面端依赖
cd frontend
npm install

# Electron 开发模式（会构建并启动 Go daemon）
npm run dev

# 仅启动 Web renderer，适合快速检查界面
npm run dev:web

# 前端验证
npm run typecheck
npm run test

# 后端验证（本阶段理论上应保持零业务差异）
cd ../backend
go test ./...
```

根目录 `npm run lint` 会执行完整 Go 测试和固定版本的 golangci-lint；`npm run frontend:typecheck` 可从根目录执行前端类型检查。

独立模型账号的实现与边界见 [`ACCOUNT-ISOLATION.md`](./ACCOUNT-ISOLATION.md)。可选的账号、项目、任务控制面边界见 [`CONTROL-PLANE.md`](./CONTROL-PLANE.md)。

## 下一阶段前置条件

1. 设计正式品牌资产，替换临时 SVG 以及 `.png/.icns/.ico` 安装图标。
2. 在现有 AICodeRoom Server 边界继续实现邀请、文件存储、结果归档和安全部署审批。
3. 本地跑通“导入项目 -> 选择独立账号 -> 启动 Claude/Codex -> 创建 worktree -> 结束/恢复会话”的闭环。
4. 首个多人闭环完成后尽早部署 staging；开发仍在本地进行，不直接在服务器修改源码。
