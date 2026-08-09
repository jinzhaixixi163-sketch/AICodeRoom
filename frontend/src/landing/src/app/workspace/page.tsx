"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
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
import { LanguageSwitcher, useSiteI18n } from "../site-i18n";

function WorkspaceBrand({ homeLabel }: { homeLabel: string }) {
  return (
    <Link className="aicr-brand" href="/" aria-label={homeLabel}>
      <span className="aicr-brand-mark" aria-hidden="true">
        <span />
      </span>
      <span>AICodeRoom</span>
    </Link>
  );
}

export default function WorkspacePreview() {
  const { copy } = useSiteI18n();
  const { common, workspace } = copy;
  const agents = [
    {
      name: common.orchestrator,
      role: workspace.agentRoles[0],
      state: common.running,
      progress: 78,
      icon: Sparkles,
      tone: "coral",
    },
    {
      name: common.codex,
      role: workspace.agentRoles[1],
      state: common.running,
      progress: 61,
      icon: Code2,
      tone: "cyan",
    },
    {
      name: common.claude,
      role: workspace.agentRoles[2],
      state: common.waiting,
      progress: 24,
      icon: Bot,
      tone: "violet",
    },
  ];

  return (
    <div className="aicr-workspace-page">
      <div className="aicr-preview-notice">
        <span>
          <ShieldCheck size={14} /> {workspace.preview}
        </span>
        <p>{workspace.previewBody}</p>
        <Link href="/">
          <ArrowLeft size={14} /> {workspace.back}
        </Link>
      </div>
      <header className="aicr-workspace-header">
        <WorkspaceBrand homeLabel={common.home} />
        <div className="aicr-workspace-search">
          <Search size={15} />
          <span>{workspace.search}</span>
          <kbd>⌘ K</kbd>
        </div>
        <div className="aicr-workspace-actions">
          <LanguageSwitcher compact />
          <button type="button" aria-label={workspace.notifications}>
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
          <nav aria-label={workspace.nav}>
            <a className="active" href="#overview">
              <LayoutDashboard size={16} />
              {workspace.overview}
            </a>
            <a href="#tasks">
              <CircleCheck size={16} />
              {workspace.tasks}
            </a>
            <a href="#team">
              <Users size={16} />
              {workspace.team}
            </a>
            <a href="#usage">
              <Activity size={16} />
              {workspace.usage}
            </a>
          </nav>
          <div className="aicr-workspace-projects">
            <div>
              <span>{common.projects}</span>
              <button type="button" aria-label={workspace.newProject}>
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
              {common.projectA}
              <MoreHorizontal size={15} />
            </button>
            <button type="button">
              <i className="violet" />
              {common.projectB}
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="aicr-workspace-account">
            <div className="aicr-avatar">T</div>
            <div>
              <b>{workspace.developer}</b>
              <small>{workspace.owner}</small>
            </div>
            <Settings size={15} />
          </div>
        </aside>
        <main className="aicr-workspace-main" id="overview">
          <div className="aicr-workspace-title">
            <div>
              <span>{workspace.projectOverview}</span>
              <h1>AICodeRoom</h1>
              <p>{workspace.syncedNow}</p>
            </div>
            <div>
              <button className="secondary" type="button">
                <Github size={15} />
                {workspace.backupSettings}
              </button>
              <button className="primary" type="button">
                <Plus size={15} />
                {workspace.newTask}
              </button>
            </div>
          </div>
          <div className="aicr-status-strip">
            <div>
              <span>
                <i />
                {workspace.runtime}
              </span>
              <b>{workspace.connected}</b>
            </div>
            <div>
              <span>
                <GitBranch size={14} />
                {workspace.branch}
              </span>
              <b>aicoderoom/main</b>
            </div>
            <div>
              <span>
                <Github size={14} />
                {workspace.githubBackup}
              </span>
              <b className="success">{workspace.synced}</b>
            </div>
            <div>
              <span>
                <CloudCog size={14} />
                {workspace.deploy}
              </span>
              <b>{workspace.notConfigured}</b>
            </div>
          </div>

          <section className="aicr-workspace-section" id="tasks">
            <div className="aicr-workspace-section-head">
              <div>
                <span>{workspace.currentTask}</span>
                <h2>{common.taskTitle}</h2>
              </div>
              <button type="button">
                {workspace.viewAll} <ChevronDown size={14} />
              </button>
            </div>
            <div className="aicr-task-summary">
              <div className="aicr-task-progress">
                <div>
                  <strong>68%</strong>
                  <span>{workspace.progress}</span>
                </div>
                <div
                  className="aicr-ring"
                  style={{ "--progress": "68%" } as CSSProperties}
                >
                  <i />
                </div>
              </div>
              <div className="aicr-task-milestones">
                {workspace.milestones.map(([title, state], index) => (
                  <div
                    className={
                      index === 0 ? "done" : index === 1 ? "active" : ""
                    }
                    key={title}
                  >
                    {index === 0 ? (
                      <CircleCheck size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}
                    <span>
                      <b>{title}</b>
                      <small>{state}</small>
                    </span>
                  </div>
                ))}
              </div>
              <div className="aicr-task-meta">
                <span>{workspace.created}</span>
                <b>{workspace.today}</b>
                <span>{workspace.target}</span>
                <b>{workspace.localRuntime}</b>
                <span>{workspace.changed}</span>
                <b>{workspace.files}</b>
              </div>
            </div>
          </section>

          <section className="aicr-workspace-section" id="team">
            <div className="aicr-workspace-section-head">
              <div>
                <span>{workspace.collaboration}</span>
                <h2>{workspace.team}</h2>
              </div>
              <button type="button">{workspace.manageAgents}</button>
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
                        <em
                          className={state === common.running ? "active" : ""}
                        >
                          {state}
                        </em>
                      </div>
                      <p>{role}</p>
                      <div className="aicr-workspace-progress">
                        <i style={{ width: `${progress}%` }} />
                      </div>
                      <small>
                        {progress}% · {workspace.updated}
                      </small>
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
                  <span>{workspace.transparency}</span>
                  <h2>{workspace.tokenUsage}</h2>
                </div>
                <Link href="/#usage">{workspace.docs}</Link>
              </div>
              <div className="aicr-workspace-usage">
                <div>
                  <small>{workspace.currentUsage}</small>
                  <strong>48.6K</strong>
                  <span>{common.tokens}</span>
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
                  <span>{workspace.recovery}</span>
                  <h2>{workspace.projectBackup}</h2>
                </div>
                <button type="button">{workspace.configure}</button>
              </div>
              <div className="aicr-backup-status">
                <div>
                  <span className="aicr-backup-logo local">
                    <Database size={16} />
                  </span>
                  <div>
                    <b>{common.localMirror}</b>
                    <small>{workspace.continuous}</small>
                  </div>
                  <em>{workspace.normal}</em>
                </div>
                <div>
                  <span className="aicr-backup-logo">
                    <Github size={16} />
                  </span>
                  <div>
                    <b>{common.githubPrivateRepo}</b>
                    <small>{workspace.mainNow}</small>
                  </div>
                  <em>{workspace.normal}</em>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
