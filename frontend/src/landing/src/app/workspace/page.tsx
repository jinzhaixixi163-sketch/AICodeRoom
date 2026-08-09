import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Bell,
  Bot,
  ChevronDown,
  CircleCheck,
  Clock3,
  CloudCog,
  Code2,
  Database,
  GitBranch,
  Github,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Web 工作台预览",
  description: "AICodeRoom Web 工作台的产品界面与信息架构预览。",
};

const agents = [
  {
    name: "编排智能体",
    role: "任务拆解与调度",
    state: "运行中",
    progress: 78,
    icon: Sparkles,
    tone: "coral",
  },
  {
    name: "Codex",
    role: "网页界面实现",
    state: "运行中",
    progress: 61,
    icon: Code2,
    tone: "cyan",
  },
  {
    name: "Claude Code",
    role: "架构复核",
    state: "等待中",
    progress: 24,
    icon: Bot,
    tone: "violet",
  },
];

function WorkspaceBrand() {
  return (
    <Link className="aicr-brand" href="/">
      <span className="aicr-brand-mark" aria-hidden="true">
        <span />
      </span>
      <span>AICodeRoom</span>
    </Link>
  );
}

export default function WorkspacePreview() {
  return (
    <div className="aicr-workspace-page">
      <div className="aicr-preview-notice">
        <span>
          <ShieldCheck size={14} /> Web 工作台产品预览
        </span>
        <p>界面已进入开发；AI 执行目前仍由本机 AICodeRoom Runtime 驱动。</p>
        <Link href="/">
          <ArrowLeft size={14} /> 返回官网
        </Link>
      </div>
      <header className="aicr-workspace-header">
        <WorkspaceBrand />
        <div className="aicr-workspace-search">
          <Search size={15} />
          <span>搜索项目、任务或会话</span>
          <kbd>⌘ K</kbd>
        </div>
        <div className="aicr-workspace-actions">
          <button type="button" aria-label="通知">
            <Bell size={17} />
            <i />
          </button>
          <button className="aicr-avatar" type="button">
            T
          </button>
        </div>
      </header>
      <div className="aicr-workspace-body">
        <aside className="aicr-workspace-sidebar">
          <nav aria-label="工作台导航">
            <a className="active" href="#overview">
              <LayoutDashboard size={16} />
              总览
            </a>
            <a href="#tasks">
              <CircleCheck size={16} />
              任务
            </a>
            <a href="#team">
              <Users size={16} />
              AI 团队
            </a>
            <a href="#usage">
              <Activity size={16} />
              用量
            </a>
          </nav>
          <div className="aicr-workspace-projects">
            <div>
              <span>项目</span>
              <button type="button" aria-label="新建项目">
                <Plus size={14} />
              </button>
            </div>
            <button className="active" type="button">
              <i className="coral" />
              AICodeRoom
              <MoreHorizontal size={15} />
            </button>
            <button type="button">
              <i className="teal" />
              慧学时间
              <MoreHorizontal size={15} />
            </button>
            <button type="button">
              <i className="violet" />
              内容工作台
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="aicr-workspace-account">
            <div className="aicr-avatar">T</div>
            <div>
              <b>本地开发者</b>
              <small>所有者</small>
            </div>
            <Settings size={15} />
          </div>
        </aside>
        <main className="aicr-workspace-main" id="overview">
          <div className="aicr-workspace-title">
            <div>
              <span>项目总览</span>
              <h1>AICodeRoom</h1>
              <p>最后同步于刚刚 · 私有项目</p>
            </div>
            <div>
              <button className="secondary" type="button">
                <Github size={15} />
                备份设置
              </button>
              <button className="primary" type="button">
                <Plus size={15} />
                新建任务
              </button>
            </div>
          </div>
          <div className="aicr-status-strip">
            <div>
              <span>
                <i />
                本地运行时
              </span>
              <b>已连接</b>
            </div>
            <div>
              <span>
                <GitBranch size={14} />
                当前分支
              </span>
              <b>aicoderoom/main</b>
            </div>
            <div>
              <span>
                <Github size={14} />
                GitHub 备份
              </span>
              <b className="success">已同步</b>
            </div>
            <div>
              <span>
                <CloudCog size={14} />
                部署目标
              </span>
              <b>尚未配置</b>
            </div>
          </div>

          <section className="aicr-workspace-section" id="tasks">
            <div className="aicr-workspace-section-head">
              <div>
                <span>当前任务</span>
                <h2>完整中文版与 Web 工作台</h2>
              </div>
              <button type="button">
                查看全部 <ChevronDown size={14} />
              </button>
            </div>
            <div className="aicr-task-summary">
              <div className="aicr-task-progress">
                <div>
                  <strong>68%</strong>
                  <span>整体进度</span>
                </div>
                <div
                  className="aicr-ring"
                  style={{ "--progress": "68%" } as React.CSSProperties}
                >
                  <i />
                </div>
              </div>
              <div className="aicr-task-milestones">
                <div className="done">
                  <CircleCheck size={15} />
                  <span>
                    <b>桌面端完整中文化</b>
                    <small>已完成</small>
                  </span>
                </div>
                <div className="active">
                  <Clock3 size={15} />
                  <span>
                    <b>高级感官网设计</b>
                    <small>正在进行</small>
                  </span>
                </div>
                <div>
                  <Clock3 size={15} />
                  <span>
                    <b>Web API 接入</b>
                    <small>等待开始</small>
                  </span>
                </div>
              </div>
              <div className="aicr-task-meta">
                <span>创建时间</span>
                <b>今天 03:58</b>
                <span>执行目标</span>
                <b>本机 Runtime</b>
                <span>变更文件</span>
                <b>12 个</b>
              </div>
            </div>
          </section>

          <section className="aicr-workspace-section" id="team">
            <div className="aicr-workspace-section-head">
              <div>
                <span>协作现场</span>
                <h2>AI 团队</h2>
              </div>
              <button type="button">管理智能体</button>
            </div>
            <div className="aicr-workspace-agent-grid">
              {agents.map(
                ({ name, role, state, progress, icon: Icon, tone }) => (
                  <article key={name}>
                    <div className={`aicr-workspace-agent-icon ${tone}`}>
                      <Icon size={17} />
                    </div>
                    <div className="aicr-workspace-agent-info">
                      <div>
                        <b>{name}</b>
                        <em className={state === "运行中" ? "active" : ""}>
                          {state}
                        </em>
                      </div>
                      <p>{role}</p>
                      <div className="aicr-workspace-progress">
                        <i style={{ width: `${progress}%` }} />
                      </div>
                      <small>{progress}% · 最近更新于刚刚</small>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>

          <div className="aicr-workspace-panels">
            <section className="aicr-workspace-section" id="usage">
              <div className="aicr-workspace-section-head compact">
                <div>
                  <span>资源透明度</span>
                  <h2>令牌用量</h2>
                </div>
                <Link href="/#usage">查看说明</Link>
              </div>
              <div className="aicr-workspace-usage">
                <div>
                  <small>本次任务</small>
                  <strong>48.6K</strong>
                  <span>令牌</span>
                </div>
                <div className="aicr-workspace-donut">
                  <i />
                </div>
              </div>
              <div className="aicr-workspace-legend">
                <span>
                  <i className="cyan" />
                  Codex <b>29.7K</b>
                </span>
                <span>
                  <i className="violet" />
                  Claude Code <b>18.9K</b>
                </span>
              </div>
            </section>
            <section className="aicr-workspace-section">
              <div className="aicr-workspace-section-head compact">
                <div>
                  <span>恢复能力</span>
                  <h2>项目备份</h2>
                </div>
                <button type="button">配置</button>
              </div>
              <div className="aicr-backup-status">
                <div>
                  <span className="aicr-backup-logo local">
                    <Database size={16} />
                  </span>
                  <div>
                    <b>本地镜像</b>
                    <small>持续同步</small>
                  </div>
                  <em>正常</em>
                </div>
                <div>
                  <span className="aicr-backup-logo">
                    <Github size={16} />
                  </span>
                  <div>
                    <b>GitHub 私有仓库</b>
                    <small>main · 刚刚</small>
                  </div>
                  <em>正常</em>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
