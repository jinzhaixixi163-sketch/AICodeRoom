"use client";

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
import { LanguageSwitcher, useSiteI18n, type SiteCopy } from "./site-i18n";

const capabilityIcons = [Users, FolderGit2, ShieldCheck];

function Brand({ homeLabel }: { homeLabel: string }) {
  return (
    <Link className="aicr-brand" href="/" aria-label={homeLabel}>
      <span className="aicr-brand-mark" aria-hidden="true">
        <span />
      </span>
      <span>AICodeRoom</span>
    </Link>
  );
}

function SiteHeader({ copy }: { copy: SiteCopy }) {
  return (
    <header className="aicr-header">
      <div className="aicr-shell aicr-header-inner">
        <Brand homeLabel={copy.common.home} />
        <nav className="aicr-nav" aria-label={copy.common.mainNav}>
          <a href="#capabilities">{copy.home.nav.capabilities}</a>
          <a href="#workflow">{copy.home.nav.workflow}</a>
          <a href="#safety">{copy.home.nav.safety}</a>
          <a href="#usage">{copy.home.nav.usage}</a>
        </nav>
        <div className="aicr-header-actions">
          <LanguageSwitcher />
          <Link className="aicr-nav-cta" href="/workspace">
            {copy.home.nav.workspace} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProductStage({ copy }: { copy: SiteCopy }) {
  const { common, home } = copy;
  const stage = home.stage;

  return (
    <div className="aicr-stage" aria-label={stage.aria}>
      <div className="aicr-stage-topbar">
        <div className="aicr-traffic">
          <i />
          <i />
          <i />
        </div>
        <span>{stage.title}</span>
        <div className="aicr-stage-state">
          <i /> {stage.connected}
        </div>
      </div>
      <div className="aicr-stage-grid">
        <aside className="aicr-stage-sidebar">
          <div className="aicr-sidebar-title">
            <Layers3 size={15} /> {common.projects}
          </div>
          <div className="aicr-project active">
            <span className="aicr-project-dot coral" /> AICodeRoom
          </div>
          <div className="aicr-project">
            <span className="aicr-project-dot teal" /> {common.projectA}
          </div>
          <div className="aicr-project">
            <span className="aicr-project-dot violet" /> {common.projectB}
          </div>
          <div className="aicr-sidebar-space" />
          <div className="aicr-sidebar-meta">
            <ShieldCheck size={14} /> {common.privateSpace}
          </div>
        </aside>
        <section className="aicr-stage-main">
          <div className="aicr-stage-heading">
            <div>
              <span className="aicr-eyebrow">{stage.executing}</span>
              <h3>{common.taskTitle}</h3>
            </div>
            <button type="button">
              {stage.newTask} <span>⌘ N</span>
            </button>
          </div>
          <div className="aicr-agent-grid">
            <article className="aicr-agent-card focus">
              <div className="aicr-agent-head">
                <span className="aicr-agent-icon">
                  <Sparkles size={15} />
                </span>
                <div>
                  <b>{common.orchestrator}</b>
                  <small>{stage.splitting}</small>
                </div>
                <em>{common.running}</em>
              </div>
              <p>{stage.orchestratorBody}</p>
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
                  <b>{common.codex}</b>
                  <small>{stage.building}</small>
                </div>
                <em>{common.running}</em>
              </div>
              <p>{stage.codexBody}</p>
              <div className="aicr-progress">
                <i style={{ width: "61%" }} />
              </div>
            </article>
          </div>
          <div className="aicr-stage-bottom">
            <div className="aicr-console">
              <div className="aicr-console-head">
                <TerminalSquare size={14} /> {stage.activity}
                <span>{stage.records}</span>
              </div>
              <div className="aicr-console-row">
                <i className="success" />
                <time>{stage.now}</time>
                <span>{stage.coverage}</span>
              </div>
              <div className="aicr-console-row">
                <i />
                <time>{stage.minute1}</time>
                <span>{stage.usageReady}</span>
              </div>
              <div className="aicr-console-row muted">
                <i />
                <time>{stage.minute3}</time>
                <span>{stage.backupDone}</span>
              </div>
            </div>
            <div className="aicr-usage-mini">
              <div className="aicr-console-head">
                <Database size={14} /> {stage.currentUsage}
              </div>
              <strong>48.6K</strong>
              <small>{common.tokens}</small>
              <div className="aicr-usage-bars">
                <i />
                <i />
                <i />
              </div>
              <p>
                <span>{stage.input}</span>
                <span>{stage.output}</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  const { copy } = useSiteI18n();
  const { common, home } = copy;

  return (
    <div className="aicr-site">
      <SiteHeader copy={copy} />
      <main>
        <section className="aicr-hero">
          <div className="aicr-orb aicr-orb-one" />
          <div className="aicr-orb aicr-orb-two" />
          <div className="aicr-shell aicr-hero-content">
            <div className="aicr-kicker">
              <span /> {home.hero.badge}
            </div>
            <h1>
              {home.hero.line1}
              <br />
              <span>{home.hero.line2}</span>
            </h1>
            <p className="aicr-hero-copy">{home.hero.body}</p>
            <div className="aicr-hero-actions">
              <Link className="aicr-primary-button" href="/workspace">
                {home.hero.primary} <ArrowRight size={17} />
              </Link>
              <a className="aicr-secondary-button" href="#workflow">
                {home.hero.secondary} <ChevronRight size={16} />
              </a>
            </div>
            <div className="aicr-proof-row">
              <span>
                <LockKeyhole size={14} /> {home.hero.localFirst}
              </span>
              <span>
                <Github size={14} /> {home.hero.githubBackup}
              </span>
              <span>
                <ServerCog size={14} /> {home.hero.ownServer}
              </span>
            </div>
            <ProductStage copy={copy} />
          </div>
        </section>

        <section className="aicr-section" id="capabilities">
          <div className="aicr-shell">
            <div className="aicr-section-intro">
              <span>{home.intro.eyebrow}</span>
              <h2>{home.intro.title}</h2>
              <p>{home.intro.body}</p>
            </div>
            <div className="aicr-capability-grid">
              {home.capabilities.map(({ title, body }, index) => {
                const Icon = capabilityIcons[index];
                return (
                  <article className="aicr-capability" key={title}>
                    <div>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <Icon size={22} />
                    </div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="aicr-section aicr-workflow-section" id="workflow">
          <div className="aicr-shell aicr-workflow-layout">
            <div className="aicr-workflow-copy">
              <span>{home.workflow.eyebrow}</span>
              <h2>{home.workflow.title}</h2>
              <p>{home.workflow.body}</p>
              <Link href="/workspace">
                {home.workflow.link} <ArrowRight size={16} />
              </Link>
            </div>
            <ol className="aicr-flow-list">
              {home.workflow.steps.map(({ title, body }, index) => (
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
                <span className="aicr-eyebrow">{home.safety.eyebrow}</span>
                <h2>{home.safety.title}</h2>
                <p>{home.safety.body}</p>
                <div className="aicr-checks">
                  {home.safety.checks.map((item) => (
                    <span key={item}>
                      <Check size={14} /> {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="aicr-backup-map">
                <div className="aicr-backup-node primary">
                  <Layers3 size={20} />
                  <b>{home.safety.project}</b>
                  <small>{home.safety.workspace}</small>
                </div>
                <div className="aicr-backup-line">
                  <i />
                  <i />
                </div>
                <div className="aicr-backup-targets">
                  <div className="aicr-backup-node">
                    <Database size={18} />
                    <b>{common.localMirror}</b>
                    <small>{home.safety.quick}</small>
                  </div>
                  <div className="aicr-backup-node">
                    <Github size={18} />
                    <b>{common.privateGithub}</b>
                    <small>{home.safety.remote}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="aicr-section" id="usage">
          <div className="aicr-shell aicr-usage-layout">
            <div className="aicr-usage-copy">
              <span>{home.usage.eyebrow}</span>
              <h2>{home.usage.title}</h2>
              <p>{home.usage.body}</p>
            </div>
            <div className="aicr-usage-panel">
              <div className="aicr-usage-panel-head">
                <div>
                  <small>{home.usage.monthly}</small>
                  <strong>2.48M</strong>
                </div>
                <span>{home.usage.days}</span>
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
              <span>{home.final.eyebrow}</span>
              <h2>{home.final.title}</h2>
              <p>{home.final.body}</p>
              <div>
                <Link className="aicr-primary-button" href="/workspace">
                  {home.final.primary} <ArrowRight size={17} />
                </Link>
                <a className="aicr-text-button" href="#capabilities">
                  {home.final.secondary} <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="aicr-footer">
        <div className="aicr-shell">
          <Brand homeLabel={common.home} />
          <p>{home.footer}</p>
          <span>Private Beta · 2026</span>
        </div>
      </footer>
    </div>
  );
}
