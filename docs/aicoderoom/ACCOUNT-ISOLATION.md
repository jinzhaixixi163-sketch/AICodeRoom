# AICodeRoom 多账号隔离边界

本文件记录当前源码真正提供的 GPT/Codex 与 Claude 账号隔离能力，以及它明确不能保证的边界。

## 已实现

- 每个账号档案都有独立 ID，任务和会话只持久化这个非敏感 ID。
- Codex 档案使用各自的 `CODEX_HOME`、`CODEX_SQLITE_HOME`、`auth.json` 和 OAuth 浏览器资料目录；`config.toml` 强制使用文件凭证存储。
- Claude 档案使用各自的 `CLAUDE_CONFIG_DIR`；订阅令牌按档案 ID 分别保存在系统钥匙串，不写入 SQLite、项目文件、日志或命令参数。
- 选定档案启动任务前，会清空进程继承的 OpenAI、Codex、Anthropic 和 Claude 凭证变量，再注入所选档案需要的环境。
- 账号档案 ID 会随会话保存；启动、恢复以及 TUI/Chat 界面切换都会重新解析同一档案。
- 桌面端一旦发现某个模型已有独立档案，新任务必须选择其中一个档案，不能再选择共享的“当前默认登录”。
- 账号根目录和档案目录权限为 `0700`，Codex 配置文件权限为 `0600`。

## 兼容边界

升级前已经存在且没有 `account_profile_id` 的会话仍按原有默认登录恢复，避免历史任务失效。通过底层 API 或 CLI 创建任务的调用方也必须显式传入档案 ID，才能获得上述隔离。

## 不保证

这不是虚拟机或独立 macOS 用户级隔离。同一台电脑上的账号仍共享公网 IP、硬件和操作系统身份、系统用户、内核、已安装的 CLI 和浏览器程序。AICodeRoom 不伪造设备指纹，也不能保证模型平台不会触发登录验证、限额或风控。

运行中的 Claude 进程必须在自己的环境中持有所选令牌；同一 macOS 用户下具有调试或进程检查权限的软件仍可能观察进程环境。需要更强边界时，应为账号使用不同的 macOS 用户、虚拟机或独立主机。

## 验证

开源发布前至少运行：

```bash
cd backend
go test ./internal/service/aiaccount ./internal/adapters/chatdriver/processenv ./internal/session_manager/...

cd ../frontend
npm run typecheck
npm test
```

本机状态验证只检查档案目录、权限、非敏感元数据与登录状态；不得打印 `auth.json`、钥匙串令牌或进程中的凭证值。
