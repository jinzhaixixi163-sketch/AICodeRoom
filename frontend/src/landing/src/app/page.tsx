import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Database,
  FolderGit2,
  Github,
  Layers3,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
} from "lucide-react";

const capabilities = [
  {
    icon: Users,
    index: "01",
    title: "一支真正协作的 AI 团队",
    body: "Claude Code、Codex 与其他智能体围绕同一任务协作。编排器负责拆解、调度、跟踪与收口。",
  },
  {
    icon: FolderGit2,
    index: "02",
    title: "每一步都有 Git 依据",
    body: "分支、工作区、变更和评审都有清晰记录。即使并行执行，也能知道谁改了什么、为何修改。",
  },
  {
    icon: ShieldCheck,
    index: "03",
    title: "代码始终掌握在你手里",
    body: "本地同步、私有 GitHub 与项目备份共同构成恢复链路。服务器异常不等于项目丢失。",
  },
];

const flow = [
  ["创建项目", "导入本地目录、Git 仓库，或创建新的代码空间。"],
  ["描述任务", "用自然语言说明目标、约束和交付结果。"],
  ["AI 团队执行", "编排器拆解任务，工作智能体并行实现与验证。"],
  ["审核与交付", "确认代码变更后，下载、同步或部署到你的服务器。"],
];

function Brand() {
  return (
    <Link className="aicr-brand" href="/" aria-label="AICodeRoom 首页">
      <span className="aicr-brand-mark" aria-hidden="true">
        <span />
      </span>
      <span>AICodeRoom</span>
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="aicr-header">
      <div className="aicr-shell aicr-header-inner">
        <Brand />
        <nav className="aicr-nav" aria-label="主导航">
          <a href="#capabilities">产品能力</a>
          <a href="#workflow">工作方式</a>
          <a href="#safety">数据安全</a>
          <a href="#usage">令牌用量</a>
        </nav>
        <Link className="aicr-nav-cta" href="/workspace">
          查看工作台 <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
}

function ProductStage() {
  return (
    <div className="aicr-stage" aria-label="AICodeRoom 工作台界面预览">
      <div className="aicr-stage-topbar">
        <div className="aicr-traffic">
          <i />
          <i />
          <i />
        </div>
        <span>产品工作台</span>
        <div className="aicr-stage-state">
          <i /> 本地运行时已连接
        </div>
      </div>
      <div className="aicr-stage-grid">
        <aside className="aicr-stage-sidebar">
          <div className="aicr-sidebar-title">
            <Layers3 size={15} /> 项目
          </div>
          <div className="aicr-project active">
            <span className="aicr-project-dot coral" /> AICodeRoom
          </div>
          <div className="aicr-project">
            <span className="aicr-project-dot teal" /> 慧学时间
          </div>
          <div className="aicr-project">
            <span className="aicr-project-dot violet" /> 内容工作台
          </div>
          <div className="aicr-sidebar-space" />
          <div className="aicr-sidebar-meta">
            <ShieldCheck size={14} /> 私有空间
          </div>
        </aside>
        <section className="aicr-stage-main">
          <div className="aicr-stage-heading">
            <div>
              <span className="aicr-eyebrow">正在执行</span>
              <h3>完整中文版与 Web 工作台</h3>
            </div>
            <button type="button">
              新建任务 <span>⌘ N</span>
            </button>
          </div>
          <div className="aicr-agent-grid">
            <article className="aicr-agent-card focus">
              <div className="aicr-agent-head">
                <span className="aicr-agent-icon">
                  <Sparkles size={15} />
                </span>
                <div>
                  <b>编排智能体</b>
                  <small>正在拆解任务</small>
                </div>
                <em>运行中</em>
              </div>
              <p>已将网页建设拆分为品牌、界面、数据安全与部署四个阶段。</p>
              <div className="aicr-progress">
                <i style={{ width: "78%" }} />
              </div>
            </article>
            <article className="aicr-agent-card">
              <div className="aicr-agent-head">
                <span className="aicr-agent-icon cyan">
                  <Code2 size={15} />
                </span>
                <div>
                  <b>Codex</b>
                  <small>构建网页界面</small>
                </div>
                <em>运行中</em>
              </div>
              <p>正在完成响应式布局、中文内容和交互状态。</p>
              <div className="aicr-progress">
                <i style={{ width: "61%" }} />
              </div>
            </article>
          </div>
          <div className="aicr-stage-bottom">
            <div className="aicr-console">
              <div className="aicr-console-head">
                <TerminalSquare size={14} /> 实时动态 <span>12 条记录</span>
              </div>
              <div className="aicr-console-row">
                <i className="success" />
                <time>刚刚</time>
                <span>中文界面覆盖检查通过</span>
              </div>
              <div className="aicr-console-row">
                <i />
                <time>1 分钟</time>
                <span>令牌用量模块已连接</span>
              </div>
              <div className="aicr-console-row muted">
                <i />
                <time>3 分钟</time>
                <span>GitHub 私有备份完成</span>
              </div>
            </div>
            <div className="aicr-usage-mini">
              <div className="aicr-console-head">
                <Database size={14} /> 本次用量
              </div>
              <strong>48.6K</strong>
              <small>令牌</small>
              <div className="aicr-usage-bars">
                <i />
                <i />
                <i />
              </div>
              <p>
                <span>输入 31%</span>
                <span>输出 69%</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="aicr-site">
      <SiteHeader />
      <main>
        <section className="aicr-hero">
          <div className="aicr-orb aicr-orb-one" />
          <div className="aicr-orb aicr-orb-two" />
          <div className="aicr-shell aicr-hero-content">
            <div className="aicr-kicker">
              <span /> AICodeRoom Private Beta
            </div>
            <h1>
              让一支 AI 团队，
              <br />
              <span>在同一个代码空间里工作。</span>
            </h1>
            <p className="aicr-hero-copy">
              从一句任务描述，到可审核、可备份、可交付的代码结果。把
              Claude、Codex 与 Git 协作收进一个安静、清晰的开发空间。
            </p>
            <div className="aicr-hero-actions">
              <Link className="aicr-primary-button" href="/workspace">
                进入 Web 工作台预览 <ArrowRight size={17} />
              </Link>
              <a className="aicr-secondary-button" href="#workflow">
                了解工作方式 <ChevronRight size={16} />
              </a>
            </div>
            <div className="aicr-proof-row">
              <span>
                <LockKeyhole size={14} /> 本地优先
              </span>
              <span>
                <Github size={14} /> 私有 GitHub 备份
              </span>
              <span>
                <ServerCog size={14} /> 自有服务器交付
              </span>
            </div>
            <ProductStage />
          </div>
        </section>

        <section className="aicr-section" id="capabilities">
          <div className="aicr-shell">
            <div className="aicr-section-intro">
              <span>不是另一个聊天窗口</span>
              <h2>
                这是 AI 软件开发的
                <br />
                协作控制室。
              </h2>
              <p>
                你关注目标与结果，AICodeRoom
                负责把复杂的执行过程变得可见、可控、可恢复。
              </p>
            </div>
            <div className="aicr-capability-grid">
              {capabilities.map(({ icon: Icon, index, title, body }) => (
                <article className="aicr-capability" key={index}>
                  <div>
                    <span>{index}</span>
                    <Icon size={22} />
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="aicr-section aicr-workflow-section" id="workflow">
          <div className="aicr-shell aicr-workflow-layout">
            <div className="aicr-workflow-copy">
              <span>从想法到交付</span>
              <h2>
                复杂留给系统，
                <br />
                决定权留给你。
              </h2>
              <p>每个阶段都有明确状态，AI 不会在你看不见的地方悄悄改变项目。</p>
              <Link href="/workspace">
                查看完整工作台 <ArrowRight size={16} />
              </Link>
            </div>
            <ol className="aicr-flow-list">
              {flow.map(([title, body], index) => (
                <li key={title}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                  <Check size={16} />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="aicr-section" id="safety">
          <div className="aicr-shell">
            <div className="aicr-safety-card">
              <div className="aicr-safety-copy">
                <span className="aicr-eyebrow">数据安全与恢复</span>
                <h2>
                  服务器可以重建，
                  <br />
                  你的代码不能丢。
                </h2>
                <p>
                  AICodeRoom 将项目工作区、Git
                  历史与备份目标分开管理。你可以保留本地镜像，也可以绑定自己的私有
                  GitHub 仓库。
                </p>
                <div className="aicr-checks">
                  <span>
                    <Check size={14} /> 本地文件持续同步
                  </span>
                  <span>
                    <Check size={14} /> Git 历史可追溯
                  </span>
                  <span>
                    <Check size={14} /> 备份失败即时提醒
                  </span>
                </div>
              </div>
              <div className="aicr-backup-map">
                <div className="aicr-backup-node primary">
                  <Layers3 size={20} />
                  <b>AICodeRoom 项目</b>
                  <small>当前工作空间</small>
                </div>
                <div className="aicr-backup-line">
                  <i />
                  <i />
                </div>
                <div className="aicr-backup-targets">
                  <div className="aicr-backup-node">
                    <Database size={18} />
                    <b>本地镜像</b>
                    <small>快速恢复</small>
                  </div>
                  <div className="aicr-backup-node">
                    <Github size={18} />
                    <b>私有 GitHub</b>
                    <small>异地备份</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="aicr-section" id="usage">
          <div className="aicr-shell aicr-usage-layout">
            <div className="aicr-usage-copy">
              <span>令牌透明度</span>
              <h2>
                每一次 AI 消耗，
                <br />
                都应该看得懂。
              </h2>
              <p>
                按 AI
                智能体、模型与会话查看本机报告的累计令牌用量。套餐额度和账单金额会明确区分，不混为一谈。
              </p>
            </div>
            <div className="aicr-usage-panel">
              <div className="aicr-usage-panel-head">
                <div>
                  <small>本月累计令牌</small>
                  <strong>2.48M</strong>
                </div>
                <span>最近 30 天</span>
              </div>
              <div className="aicr-chart">
                {[32, 48, 37, 62, 51, 73, 66, 88, 72, 94, 82, 100].map(
                  (height, index) => (
                    <i key={index} style={{ height: `${height}%` }} />
                  ),
                )}
              </div>
              <div className="aicr-usage-split">
                <span>
                  <i className="cyan" /> Codex <b>1.62M</b>
                </span>
                <span>
                  <i className="violet" /> Claude Code <b>860K</b>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="aicr-final-cta">
          <div className="aicr-shell">
            <div className="aicr-final-card">
              <div className="aicr-final-glow" />
              <span>从一个真实项目开始</span>
              <h2>把 AI 从工具，变成你的软件团队。</h2>
              <p>
                当前处于私有开发阶段。先从本机 AICodeRoom
                开始，网页工作台将与同一项目和账户体系逐步接通。
              </p>
              <div>
                <Link className="aicr-primary-button" href="/workspace">
                  查看工作台设计 <ArrowRight size={17} />
                </Link>
                <a className="aicr-text-button" href="#capabilities">
                  重新了解产品 <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="aicr-footer">
        <div className="aicr-shell">
          <Brand />
          <p>多智能体软件开发协作空间</p>
          <span>Private Beta · 2026</span>
        </div>
      </footer>
    </div>
  );
}
