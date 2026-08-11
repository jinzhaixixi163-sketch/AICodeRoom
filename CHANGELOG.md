# AICodeRoom 更新记录

本文件记录 AICodeRoom 相对 Agent Orchestrator 上游基线的产品更新。上游项目自己的历史仍保留在 Git 历史和原有文档中。

## 2026-08-10

### 桌面端与品牌

- 将用户可见的产品名称、窗口、菜单、托盘、安装包和启动界面更新为 AICodeRoom。
- 简体中文成为首次启动默认语言，英语继续作为翻译回退语言。
- 补全简体中文、英语、日语、韩语、西班牙语、法语、德语和巴西葡萄牙语界面文本。
- 保留内部 `ao` CLI、`AO_*` 环境变量、`~/.ao` 数据目录、daemon 标识和上游协议，避免破坏兼容性。

### 多模型账号

- 新增 GPT/Codex 与 Claude 独立账号档案的数据库模型、迁移、服务、HTTP API 和设置界面。
- Codex 档案使用独立 `CODEX_HOME`、`CODEX_SQLITE_HOME`、`auth.json`、文件凭证模式和 OAuth 浏览器资料目录。
- Claude 档案使用独立 `CLAUDE_CONFIG_DIR`，订阅令牌以档案 ID 分别存入 macOS 系统钥匙串。
- 任务启动前清除继承的 OpenAI、Codex、Anthropic 和 Claude 凭证变量，只注入所选档案需要的凭证。
- 会话保存 `account_profile_id`，并在启动、恢复以及 TUI/Chat 界面切换时重新解析同一档案。
- 桌面端发现某个模型已有独立档案后，新任务必须选择其中一个账号，不再提供共享的“当前默认登录”选项。
- 增加单档案凭证清除、启用/停用、登录状态检测和档案目录保护。

### 用量与本地优先模式

- 增加 Token 用量总览、模型汇总和会话详情，并复用提供商真实上报的用量与额度状态。
- 移除 AICodeRoom 自身的登录/注册门禁和侧栏退出入口；公开桌面端默认直接进入本地项目。
- 本地模式不再依赖 `127.0.0.1:8788` 控制面服务器；项目、任务与备份设置具备本地回退。
- 保留可选 AICodeRoom Server。开发者显式设置 `VITE_AICODEROOM_API_URL` 后，可继续接入用户、成员、任务和备份元数据。
- 将打包与自动更新仓库指向 `jinzhaixixi163-sketch/AICodeRoom`，避免误从上游产品更新。

### 文档与验证

- 新增多账号隔离边界说明，明确同一 Mac 下仍共享 IP、硬件、系统用户、内核和进程检查权限。
- 保留 Apache License 2.0 和 Agent Orchestrator 上游归属信息。
- 已验证 Go 全量测试、前端 TypeScript、前端 2098 项测试、AICodeRoom Server 测试和 macOS Electron 打包。

### 已知边界

- 升级前没有 `account_profile_id` 的旧会话仍使用原来的默认提供商登录，以避免历史任务失效。
- 多账号档案不是虚拟机或独立 macOS 用户级隔离，不能承诺规避模型平台的登录验证、限额或风控。
- 云端多人协作、自动 GitHub 备份、文件上传、结果归档和服务器部署仍属于后续能力，当前文档不会将其描述为已经完成。
