"use client";

import { Globe2 } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const SITE_LOCALES = [
  "zh-CN",
  "en",
  "ja",
  "ko",
  "es",
  "fr",
  "de",
  "pt-BR",
] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

const localeNames: Record<SiteLocale, string> = {
  "zh-CN": "简体中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português",
};

const zhCN = {
  meta: {
    title: "AICodeRoom｜AI 软件开发协作空间",
    description: "多用户、多项目、可邀请协作的 AI 软件开发工作台。",
  },
  common: {
    language: "切换语言",
    home: "AICodeRoom 首页",
    mainNav: "主导航",
    running: "运行中",
    waiting: "等待中",
    tokens: "令牌",
    projects: "项目",
    projectA: "慧学时间",
    projectB: "内容工作台",
    privateSpace: "私有空间",
    taskTitle: "完整中文版与 Web 工作台",
    orchestrator: "编排智能体",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "本地镜像",
    privateGithub: "私有 GitHub",
    githubPrivateRepo: "GitHub 私有仓库",
  },
  home: {
    nav: {
      capabilities: "产品能力",
      workflow: "工作方式",
      safety: "数据安全",
      usage: "令牌用量",
      workspace: "查看工作台",
    },
    stage: {
      aria: "AICodeRoom 工作台界面预览",
      title: "产品工作台",
      connected: "本地运行时已连接",
      executing: "正在执行",
      newTask: "新建任务",
      splitting: "正在拆解任务",
      orchestratorBody:
        "已将网页建设拆分为品牌、界面、数据安全与部署四个阶段。",
      building: "构建网页界面",
      codexBody: "正在完成响应式布局、多语言内容和交互状态。",
      activity: "实时动态",
      records: "12 条记录",
      now: "刚刚",
      minute1: "1 分钟",
      minute3: "3 分钟",
      coverage: "多语言界面覆盖检查通过",
      usageReady: "令牌用量模块已连接",
      backupDone: "GitHub 私有备份完成",
      currentUsage: "本次用量",
      input: "输入 31%",
      output: "输出 69%",
    },
    hero: {
      badge: "AICodeRoom 私有测试",
      line1: "让一支 AI 团队，",
      line2: "在同一个代码空间里工作。",
      body: "从一句任务描述，到可审核、可备份、可交付的代码结果。把 Claude、Codex 与 Git 协作收进一个安静、清晰的开发空间。",
      primary: "进入 Web 工作台预览",
      secondary: "了解工作方式",
      localFirst: "本地优先",
      githubBackup: "私有 GitHub 备份",
      ownServer: "自有服务器交付",
    },
    intro: {
      eyebrow: "不是另一个聊天窗口",
      title: "这是 AI 软件开发的\n协作控制室。",
      body: "你关注目标与结果，AICodeRoom 负责把复杂的执行过程变得可见、可控、可恢复。",
    },
    capabilities: [
      {
        title: "一支真正协作的 AI 团队",
        body: "Claude Code、Codex 与其他智能体围绕同一任务协作。编排器负责拆解、调度、跟踪与收口。",
      },
      {
        title: "每一步都有 Git 依据",
        body: "分支、工作区、变更和评审都有清晰记录。即使并行执行，也能知道谁改了什么、为何修改。",
      },
      {
        title: "代码始终掌握在你手里",
        body: "本地同步、私有 GitHub 与项目备份共同构成恢复链路。服务器异常不等于项目丢失。",
      },
    ],
    workflow: {
      eyebrow: "从想法到交付",
      title: "复杂留给系统，\n决定权留给你。",
      body: "每个阶段都有明确状态，AI 不会在你看不见的地方悄悄改变项目。",
      link: "查看完整工作台",
      steps: [
        {
          title: "创建项目",
          body: "导入本地目录、Git 仓库，或创建新的代码空间。",
        },
        { title: "描述任务", body: "用自然语言说明目标、约束和交付结果。" },
        {
          title: "AI 团队执行",
          body: "编排器拆解任务，工作智能体并行实现与验证。",
        },
        {
          title: "审核与交付",
          body: "确认代码变更后，下载、同步或部署到你的服务器。",
        },
      ],
    },
    safety: {
      eyebrow: "数据安全与恢复",
      title: "服务器可以重建，\n你的代码不能丢。",
      body: "AICodeRoom 将项目工作区、Git 历史与备份目标分开管理。你可以保留本地镜像，也可以绑定自己的私有 GitHub 仓库。",
      checks: ["本地文件持续同步", "Git 历史可追溯", "备份失败即时提醒"],
      project: "AICodeRoom 项目",
      workspace: "当前工作空间",
      quick: "快速恢复",
      remote: "异地备份",
    },
    usage: {
      eyebrow: "令牌透明度",
      title: "每一次 AI 消耗，\n都应该看得懂。",
      body: "按 AI 智能体、模型与会话查看本机报告的累计令牌用量。套餐额度和账单金额会明确区分，不混为一谈。",
      monthly: "本月累计令牌",
      days: "最近 30 天",
    },
    final: {
      eyebrow: "从一个真实项目开始",
      title: "把 AI 从工具，变成你的软件团队。",
      body: "当前处于私有开发阶段。先从本机 AICodeRoom 开始，网页工作台将与同一项目和账户体系逐步接通。",
      primary: "查看工作台设计",
      secondary: "重新了解产品",
    },
    footer: "多智能体软件开发协作空间",
  },
  workspace: {
    preview: "Web 工作台产品预览",
    previewBody:
      "界面已进入开发；AI 执行目前仍由本机 AICodeRoom Runtime 驱动。",
    back: "返回官网",
    search: "搜索项目、任务或会话",
    notifications: "通知",
    nav: "工作台导航",
    overview: "总览",
    tasks: "任务",
    team: "AI 团队",
    usage: "用量",
    newProject: "新建项目",
    developer: "本地开发者",
    owner: "所有者",
    projectOverview: "项目总览",
    syncedNow: "最后同步于刚刚 · 私有项目",
    backupSettings: "备份设置",
    newTask: "新建任务",
    runtime: "本地运行时",
    connected: "已连接",
    branch: "当前分支",
    githubBackup: "GitHub 备份",
    synced: "已同步",
    deploy: "部署目标",
    notConfigured: "尚未配置",
    currentTask: "当前任务",
    viewAll: "查看全部",
    progress: "整体进度",
    milestones: [
      ["桌面端完整中文化", "已完成"],
      ["高级感官网设计", "正在进行"],
      ["Web API 接入", "等待开始"],
    ],
    created: "创建时间",
    today: "今天 03:58",
    target: "执行目标",
    localRuntime: "本机 Runtime",
    changed: "变更文件",
    files: "12 个",
    collaboration: "协作现场",
    manageAgents: "管理智能体",
    agentRoles: ["任务拆解与调度", "网页界面实现", "架构复核"],
    updated: "最近更新于刚刚",
    transparency: "资源透明度",
    tokenUsage: "令牌用量",
    docs: "查看说明",
    currentUsage: "本次任务",
    recovery: "恢复能力",
    projectBackup: "项目备份",
    configure: "配置",
    continuous: "持续同步",
    normal: "正常",
    mainNow: "main · 刚刚",
  },
} as const;

type DeepWiden<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepWiden<U>[]
    : T extends object
      ? { [K in keyof T]: DeepWiden<T[K]> }
      : T;
export type SiteCopy = DeepWiden<typeof zhCN>;

const en: SiteCopy = {
  meta: {
    title: "AICodeRoom | AI Software Collaboration Workspace",
    description:
      "A multi-user, multi-project AI software development workspace built for collaboration.",
  },
  common: {
    language: "Change language",
    home: "AICodeRoom home",
    mainNav: "Main navigation",
    running: "Running",
    waiting: "Waiting",
    tokens: "tokens",
    projects: "Projects",
    projectA: "Learning Time",
    projectB: "Content Studio",
    privateSpace: "Private space",
    taskTitle: "Complete localization and Web workspace",
    orchestrator: "Orchestrator",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "Local mirror",
    privateGithub: "Private GitHub",
    githubPrivateRepo: "Private GitHub repository",
  },
  home: {
    nav: {
      capabilities: "Capabilities",
      workflow: "How it works",
      safety: "Data safety",
      usage: "Token usage",
      workspace: "View workspace",
    },
    stage: {
      aria: "AICodeRoom workspace preview",
      title: "Product workspace",
      connected: "Local runtime connected",
      executing: "In progress",
      newTask: "New task",
      splitting: "Breaking down the task",
      orchestratorBody:
        "The website build is organized into brand, interface, data safety, and delivery stages.",
      building: "Building the web interface",
      codexBody:
        "Finishing responsive layout, multilingual content, and interaction states.",
      activity: "Live activity",
      records: "12 events",
      now: "Just now",
      minute1: "1 min",
      minute3: "3 min",
      coverage: "Multilingual coverage check passed",
      usageReady: "Token usage connected",
      backupDone: "Private GitHub backup complete",
      currentUsage: "Current usage",
      input: "Input 31%",
      output: "Output 69%",
    },
    hero: {
      badge: "AICodeRoom Private Beta",
      line1: "Let an AI team work",
      line2: "inside one shared code space.",
      body: "From a single task description to code you can review, back up, and deliver. Bring Claude, Codex, and Git collaboration into one calm, transparent workspace.",
      primary: "Preview the Web workspace",
      secondary: "See how it works",
      localFirst: "Local first",
      githubBackup: "Private GitHub backup",
      ownServer: "Deploy to your server",
    },
    intro: {
      eyebrow: "Not another chat window",
      title: "The control room for\nAI software development.",
      body: "You stay focused on goals and outcomes. AICodeRoom makes complex execution visible, controllable, and recoverable.",
    },
    capabilities: [
      {
        title: "An AI team that truly collaborates",
        body: "Claude Code, Codex, and other agents work around one task while the orchestrator plans, schedules, tracks, and closes the loop.",
      },
      {
        title: "Every step has a Git trail",
        body: "Branches, workspaces, changes, and reviews stay explicit—even while agents execute in parallel.",
      },
      {
        title: "Your code remains yours",
        body: "Local sync, private GitHub, and project backups form a recovery chain. A server incident never has to mean lost work.",
      },
    ],
    workflow: {
      eyebrow: "From idea to delivery",
      title: "Leave complexity to the system.\nKeep decisions in your hands.",
      body: "Every phase has a clear state. AI never changes your project somewhere you cannot see.",
      link: "Explore the full workspace",
      steps: [
        {
          title: "Create a project",
          body: "Import a local folder or Git repository, or start a new code space.",
        },
        {
          title: "Describe the task",
          body: "State the goal, constraints, and expected outcome in natural language.",
        },
        {
          title: "The AI team executes",
          body: "The orchestrator decomposes work while agents implement and verify in parallel.",
        },
        {
          title: "Review and deliver",
          body: "Approve the changes, then download, sync, or deploy to your server.",
        },
      ],
    },
    safety: {
      eyebrow: "Data safety and recovery",
      title: "Servers can be rebuilt.\nYour code cannot be lost.",
      body: "AICodeRoom separates the project workspace, Git history, and backup targets. Keep a local mirror and connect your own private GitHub repository.",
      checks: [
        "Continuous local file sync",
        "Traceable Git history",
        "Immediate backup failure alerts",
      ],
      project: "AICodeRoom project",
      workspace: "Current workspace",
      quick: "Fast recovery",
      remote: "Off-site backup",
    },
    usage: {
      eyebrow: "Token transparency",
      title: "Every AI cost\nshould make sense.",
      body: "See cumulative local usage by agent, model, and session. Plan allowances and billing amounts remain clearly separated.",
      monthly: "Tokens this month",
      days: "Last 30 days",
    },
    final: {
      eyebrow: "Start with a real project",
      title: "Turn AI from a tool into your software team.",
      body: "AICodeRoom is currently in private development. Start locally while the Web workspace connects to the same projects and account system.",
      primary: "View workspace design",
      secondary: "Explore the product again",
    },
    footer: "Multi-agent software development workspace",
  },
  workspace: {
    preview: "Web workspace product preview",
    previewBody:
      "The interface is in development; AI execution is still powered by the local AICodeRoom Runtime.",
    back: "Back to website",
    search: "Search projects, tasks, or sessions",
    notifications: "Notifications",
    nav: "Workspace navigation",
    overview: "Overview",
    tasks: "Tasks",
    team: "AI team",
    usage: "Usage",
    newProject: "New project",
    developer: "Local developer",
    owner: "Owner",
    projectOverview: "Project overview",
    syncedNow: "Synced just now · Private project",
    backupSettings: "Backup settings",
    newTask: "New task",
    runtime: "Local runtime",
    connected: "Connected",
    branch: "Current branch",
    githubBackup: "GitHub backup",
    synced: "Synced",
    deploy: "Deployment target",
    notConfigured: "Not configured",
    currentTask: "Current task",
    viewAll: "View all",
    progress: "Overall progress",
    milestones: [
      ["Desktop localization", "Complete"],
      ["Premium website design", "In progress"],
      ["Web API integration", "Not started"],
    ],
    created: "Created",
    today: "Today 03:58",
    target: "Execution target",
    localRuntime: "Local Runtime",
    changed: "Changed files",
    files: "12 files",
    collaboration: "Collaboration live",
    manageAgents: "Manage agents",
    agentRoles: [
      "Task planning and scheduling",
      "Web interface implementation",
      "Architecture review",
    ],
    updated: "Updated just now",
    transparency: "Resource transparency",
    tokenUsage: "Token usage",
    docs: "View details",
    currentUsage: "Current task",
    recovery: "Recovery",
    projectBackup: "Project backup",
    configure: "Configure",
    continuous: "Continuous sync",
    normal: "Healthy",
    mainNow: "main · just now",
  },
};

const ja: SiteCopy = {
  meta: {
    title: "AICodeRoom｜AI ソフトウェア開発コラボレーション",
    description:
      "複数ユーザー・複数プロジェクトに対応した AI ソフトウェア開発ワークスペース。",
  },
  common: {
    language: "言語を切り替える",
    home: "AICodeRoom ホーム",
    mainNav: "メインナビゲーション",
    running: "実行中",
    waiting: "待機中",
    tokens: "トークン",
    projects: "プロジェクト",
    projectA: "学習時間",
    projectB: "コンテンツスタジオ",
    privateSpace: "プライベート空間",
    taskTitle: "完全な多言語化と Web ワークスペース",
    orchestrator: "オーケストレーター",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "ローカルミラー",
    privateGithub: "プライベート GitHub",
    githubPrivateRepo: "GitHub プライベートリポジトリ",
  },
  home: {
    nav: {
      capabilities: "製品機能",
      workflow: "ワークフロー",
      safety: "データ保護",
      usage: "トークン使用量",
      workspace: "ワークスペースを見る",
    },
    stage: {
      aria: "AICodeRoom ワークスペースプレビュー",
      title: "プロダクトワークスペース",
      connected: "ローカルランタイム接続済み",
      executing: "実行中",
      newTask: "新しいタスク",
      splitting: "タスクを分解中",
      orchestratorBody:
        "Web 構築をブランド、インターフェース、データ保護、デリバリーの4段階に分けました。",
      building: "Web インターフェースを構築中",
      codexBody:
        "レスポンシブレイアウト、多言語コンテンツ、操作状態を仕上げています。",
      activity: "リアルタイム活動",
      records: "12 件",
      now: "たった今",
      minute1: "1 分前",
      minute3: "3 分前",
      coverage: "多言語カバレッジチェック合格",
      usageReady: "トークン使用量を接続",
      backupDone: "GitHub プライベートバックアップ完了",
      currentUsage: "今回の使用量",
      input: "入力 31%",
      output: "出力 69%",
    },
    hero: {
      badge: "AICodeRoom プライベートベータ",
      line1: "AI チームを、",
      line2: "ひとつのコード空間で働かせる。",
      body: "ひとつのタスク説明から、レビュー・バックアップ・納品可能なコードへ。Claude、Codex、Git の協業を、静かで明快な開発空間にまとめます。",
      primary: "Web ワークスペースをプレビュー",
      secondary: "仕組みを見る",
      localFirst: "ローカル優先",
      githubBackup: "プライベート GitHub バックアップ",
      ownServer: "自社サーバーへ納品",
    },
    intro: {
      eyebrow: "もう一つのチャット画面ではない",
      title: "AI ソフトウェア開発の\nコントロールルーム。",
      body: "目標と成果に集中してください。AICodeRoom が複雑な実行を可視化し、制御可能で復元可能にします。",
    },
    capabilities: [
      {
        title: "本当に協働する AI チーム",
        body: "Claude Code、Codex、その他のエージェントが同じタスクで協働し、オーケストレーターが計画・調整・追跡・収束を担います。",
      },
      {
        title: "すべての工程に Git の根拠",
        body: "ブランチ、ワークスペース、変更、レビューが明確に残り、並列実行でも誰が何を変えたか分かります。",
      },
      {
        title: "コードは常にあなたの手元に",
        body: "ローカル同期、プライベート GitHub、プロジェクトバックアップが復旧経路を構成します。",
      },
    ],
    workflow: {
      eyebrow: "アイデアから納品まで",
      title: "複雑さはシステムへ。\n決定権はあなたへ。",
      body: "各段階の状態は明確です。AI が見えない場所でプロジェクトを変更することはありません。",
      link: "ワークスペース全体を見る",
      steps: [
        {
          title: "プロジェクトを作成",
          body: "ローカルフォルダや Git リポジトリを読み込むか、新しいコード空間を作成します。",
        },
        {
          title: "タスクを説明",
          body: "目標、制約、期待する成果を自然言語で伝えます。",
        },
        {
          title: "AI チームが実行",
          body: "オーケストレーターが分解し、エージェントが並列に実装・検証します。",
        },
        {
          title: "レビューして納品",
          body: "変更を確認し、ダウンロード、同期、またはサーバーへデプロイします。",
        },
      ],
    },
    safety: {
      eyebrow: "データ保護と復旧",
      title: "サーバーは再構築できる。\nコードは失えない。",
      body: "AICodeRoom はプロジェクト空間、Git 履歴、バックアップ先を分離管理します。ローカルミラーと自分のプライベート GitHub を利用できます。",
      checks: [
        "ローカルファイルを継続同期",
        "追跡可能な Git 履歴",
        "バックアップ失敗を即時通知",
      ],
      project: "AICodeRoom プロジェクト",
      workspace: "現在のワークスペース",
      quick: "迅速な復旧",
      remote: "オフサイトバックアップ",
    },
    usage: {
      eyebrow: "トークンの透明性",
      title: "AI の消費を\nすべて理解できる。",
      body: "エージェント、モデル、セッション別にローカル報告の累積トークンを確認。プラン上限と請求額は明確に分けます。",
      monthly: "今月のトークン",
      days: "過去 30 日",
    },
    final: {
      eyebrow: "実際のプロジェクトから始める",
      title: "AI をツールからソフトウェアチームへ。",
      body: "現在はプライベート開発中です。まずローカルで始め、Web ワークスペースを同じプロジェクトとアカウントへ接続していきます。",
      primary: "ワークスペースデザインを見る",
      secondary: "製品をもう一度見る",
    },
    footer: "マルチエージェント・ソフトウェア開発空間",
  },
  workspace: {
    preview: "Web ワークスペース製品プレビュー",
    previewBody:
      "画面は開発中です。AI 実行は現在もローカル AICodeRoom Runtime が担当します。",
    back: "公式サイトへ戻る",
    search: "プロジェクト、タスク、セッションを検索",
    notifications: "通知",
    nav: "ワークスペースナビゲーション",
    overview: "概要",
    tasks: "タスク",
    team: "AI チーム",
    usage: "使用量",
    newProject: "新しいプロジェクト",
    developer: "ローカル開発者",
    owner: "オーナー",
    projectOverview: "プロジェクト概要",
    syncedNow: "たった今同期 · プライベートプロジェクト",
    backupSettings: "バックアップ設定",
    newTask: "新しいタスク",
    runtime: "ローカルランタイム",
    connected: "接続済み",
    branch: "現在のブランチ",
    githubBackup: "GitHub バックアップ",
    synced: "同期済み",
    deploy: "デプロイ先",
    notConfigured: "未設定",
    currentTask: "現在のタスク",
    viewAll: "すべて表示",
    progress: "全体の進捗",
    milestones: [
      ["デスクトップ完全多言語化", "完了"],
      ["プレミアム Web デザイン", "進行中"],
      ["Web API 接続", "未開始"],
    ],
    created: "作成日時",
    today: "今日 03:58",
    target: "実行先",
    localRuntime: "ローカル Runtime",
    changed: "変更ファイル",
    files: "12 ファイル",
    collaboration: "コラボレーション",
    manageAgents: "エージェント管理",
    agentRoles: [
      "タスク分解と調整",
      "Web インターフェース実装",
      "アーキテクチャレビュー",
    ],
    updated: "たった今更新",
    transparency: "リソース透明性",
    tokenUsage: "トークン使用量",
    docs: "詳細を見る",
    currentUsage: "現在のタスク",
    recovery: "復旧能力",
    projectBackup: "プロジェクトバックアップ",
    configure: "設定",
    continuous: "継続同期",
    normal: "正常",
    mainNow: "main · たった今",
  },
};

const ko: SiteCopy = {
  meta: {
    title: "AICodeRoom | AI 소프트웨어 개발 협업 공간",
    description:
      "다중 사용자와 다중 프로젝트를 위한 AI 소프트웨어 개발 워크스페이스입니다.",
  },
  common: {
    language: "언어 변경",
    home: "AICodeRoom 홈",
    mainNav: "주요 탐색",
    running: "실행 중",
    waiting: "대기 중",
    tokens: "토큰",
    projects: "프로젝트",
    projectA: "학습 시간",
    projectB: "콘텐츠 스튜디오",
    privateSpace: "비공개 공간",
    taskTitle: "완전한 다국어화와 Web 워크스페이스",
    orchestrator: "오케스트레이터",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "로컬 미러",
    privateGithub: "비공개 GitHub",
    githubPrivateRepo: "GitHub 비공개 저장소",
  },
  home: {
    nav: {
      capabilities: "제품 기능",
      workflow: "작동 방식",
      safety: "데이터 안전",
      usage: "토큰 사용량",
      workspace: "워크스페이스 보기",
    },
    stage: {
      aria: "AICodeRoom 워크스페이스 미리보기",
      title: "제품 워크스페이스",
      connected: "로컬 런타임 연결됨",
      executing: "실행 중",
      newTask: "새 작업",
      splitting: "작업 분해 중",
      orchestratorBody:
        "웹 구축을 브랜드, 인터페이스, 데이터 안전, 배포의 네 단계로 나눴습니다.",
      building: "웹 인터페이스 구축",
      codexBody:
        "반응형 레이아웃, 다국어 콘텐츠, 상호작용 상태를 완성하고 있습니다.",
      activity: "실시간 활동",
      records: "기록 12개",
      now: "방금",
      minute1: "1분 전",
      minute3: "3분 전",
      coverage: "다국어 화면 검사 통과",
      usageReady: "토큰 사용량 연결됨",
      backupDone: "GitHub 비공개 백업 완료",
      currentUsage: "이번 사용량",
      input: "입력 31%",
      output: "출력 69%",
    },
    hero: {
      badge: "AICodeRoom 비공개 베타",
      line1: "하나의 AI 팀이",
      line2: "같은 코드 공간에서 일하게 하세요.",
      body: "한 줄의 작업 설명에서 검토, 백업, 배포 가능한 코드까지. Claude, Codex, Git 협업을 조용하고 명확한 개발 공간에 모읍니다.",
      primary: "Web 워크스페이스 미리보기",
      secondary: "작동 방식 보기",
      localFirst: "로컬 우선",
      githubBackup: "비공개 GitHub 백업",
      ownServer: "자체 서버에 배포",
    },
    intro: {
      eyebrow: "또 하나의 채팅창이 아닙니다",
      title: "AI 소프트웨어 개발의\n컨트롤 룸.",
      body: "목표와 결과에 집중하세요. AICodeRoom이 복잡한 실행을 보이고, 제어하고, 복구할 수 있게 만듭니다.",
    },
    capabilities: [
      {
        title: "진정으로 협업하는 AI 팀",
        body: "Claude Code, Codex와 다른 에이전트가 한 작업을 중심으로 협업하고 오케스트레이터가 계획, 조정, 추적, 마무리를 담당합니다.",
      },
      {
        title: "모든 단계에 Git 근거",
        body: "브랜치, 워크스페이스, 변경, 리뷰가 명확히 남아 병렬 실행에서도 누가 무엇을 바꿨는지 알 수 있습니다.",
      },
      {
        title: "코드는 언제나 당신의 것",
        body: "로컬 동기화, 비공개 GitHub, 프로젝트 백업이 복구 경로를 만듭니다.",
      },
    ],
    workflow: {
      eyebrow: "아이디어에서 배포까지",
      title: "복잡함은 시스템에,\n결정권은 당신에게.",
      body: "모든 단계의 상태가 명확합니다. AI가 보이지 않는 곳에서 프로젝트를 바꾸지 않습니다.",
      link: "전체 워크스페이스 보기",
      steps: [
        {
          title: "프로젝트 만들기",
          body: "로컬 폴더나 Git 저장소를 가져오거나 새 코드 공간을 만듭니다.",
        },
        {
          title: "작업 설명",
          body: "목표, 제약, 기대 결과를 자연어로 설명합니다.",
        },
        {
          title: "AI 팀 실행",
          body: "오케스트레이터가 작업을 나누고 에이전트가 병렬로 구현하고 검증합니다.",
        },
        {
          title: "검토 및 배포",
          body: "변경을 승인한 뒤 다운로드, 동기화 또는 서버에 배포합니다.",
        },
      ],
    },
    safety: {
      eyebrow: "데이터 안전과 복구",
      title: "서버는 다시 만들 수 있어도,\n코드는 잃을 수 없습니다.",
      body: "AICodeRoom은 프로젝트 공간, Git 기록, 백업 대상을 분리 관리합니다. 로컬 미러와 개인 비공개 GitHub를 함께 사용할 수 있습니다.",
      checks: [
        "로컬 파일 지속 동기화",
        "추적 가능한 Git 기록",
        "백업 실패 즉시 알림",
      ],
      project: "AICodeRoom 프로젝트",
      workspace: "현재 워크스페이스",
      quick: "빠른 복구",
      remote: "원격 백업",
    },
    usage: {
      eyebrow: "토큰 투명성",
      title: "모든 AI 사용량을\n이해할 수 있어야 합니다.",
      body: "에이전트, 모델, 세션별 로컬 누적 토큰을 확인합니다. 요금제 한도와 청구 금액은 분리해 표시합니다.",
      monthly: "이번 달 토큰",
      days: "최근 30일",
    },
    final: {
      eyebrow: "실제 프로젝트로 시작",
      title: "AI를 도구에서 소프트웨어 팀으로.",
      body: "현재 비공개 개발 단계입니다. 로컬 AICodeRoom에서 시작하고 Web 워크스페이스를 같은 프로젝트와 계정에 연결해 나갑니다.",
      primary: "워크스페이스 디자인 보기",
      secondary: "제품 다시 보기",
    },
    footer: "멀티 에이전트 소프트웨어 개발 공간",
  },
  workspace: {
    preview: "Web 워크스페이스 제품 미리보기",
    previewBody:
      "화면은 개발 중이며 AI 실행은 아직 로컬 AICodeRoom Runtime이 담당합니다.",
    back: "홈으로",
    search: "프로젝트, 작업 또는 세션 검색",
    notifications: "알림",
    nav: "워크스페이스 탐색",
    overview: "개요",
    tasks: "작업",
    team: "AI 팀",
    usage: "사용량",
    newProject: "새 프로젝트",
    developer: "로컬 개발자",
    owner: "소유자",
    projectOverview: "프로젝트 개요",
    syncedNow: "방금 동기화 · 비공개 프로젝트",
    backupSettings: "백업 설정",
    newTask: "새 작업",
    runtime: "로컬 런타임",
    connected: "연결됨",
    branch: "현재 브랜치",
    githubBackup: "GitHub 백업",
    synced: "동기화됨",
    deploy: "배포 대상",
    notConfigured: "설정되지 않음",
    currentTask: "현재 작업",
    viewAll: "모두 보기",
    progress: "전체 진행률",
    milestones: [
      ["데스크톱 다국어화", "완료"],
      ["프리미엄 웹 디자인", "진행 중"],
      ["Web API 연결", "시작 전"],
    ],
    created: "생성 시간",
    today: "오늘 03:58",
    target: "실행 대상",
    localRuntime: "로컬 Runtime",
    changed: "변경 파일",
    files: "파일 12개",
    collaboration: "협업 현황",
    manageAgents: "에이전트 관리",
    agentRoles: ["작업 분해 및 조정", "웹 인터페이스 구현", "아키텍처 검토"],
    updated: "방금 업데이트",
    transparency: "리소스 투명성",
    tokenUsage: "토큰 사용량",
    docs: "설명 보기",
    currentUsage: "현재 작업",
    recovery: "복구 능력",
    projectBackup: "프로젝트 백업",
    configure: "설정",
    continuous: "지속 동기화",
    normal: "정상",
    mainNow: "main · 방금",
  },
};

const es: SiteCopy = {
  meta: {
    title: "AICodeRoom | Espacio de colaboración para software con IA",
    description:
      "Un espacio de desarrollo con IA para múltiples usuarios y proyectos.",
  },
  common: {
    language: "Cambiar idioma",
    home: "Inicio de AICodeRoom",
    mainNav: "Navegación principal",
    running: "En curso",
    waiting: "En espera",
    tokens: "tokens",
    projects: "Proyectos",
    projectA: "Tiempo de aprendizaje",
    projectB: "Estudio de contenidos",
    privateSpace: "Espacio privado",
    taskTitle: "Localización completa y espacio Web",
    orchestrator: "Orquestador",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "Copia local",
    privateGithub: "GitHub privado",
    githubPrivateRepo: "Repositorio privado de GitHub",
  },
  home: {
    nav: {
      capabilities: "Capacidades",
      workflow: "Cómo funciona",
      safety: "Seguridad de datos",
      usage: "Uso de tokens",
      workspace: "Ver espacio",
    },
    stage: {
      aria: "Vista previa del espacio AICodeRoom",
      title: "Espacio de producto",
      connected: "Runtime local conectado",
      executing: "En ejecución",
      newTask: "Nueva tarea",
      splitting: "Dividiendo la tarea",
      orchestratorBody:
        "El sitio se divide en marca, interfaz, seguridad de datos y entrega.",
      building: "Construyendo la interfaz web",
      codexBody:
        "Completando diseño adaptable, contenido multilingüe y estados interactivos.",
      activity: "Actividad en vivo",
      records: "12 registros",
      now: "Ahora",
      minute1: "Hace 1 min",
      minute3: "Hace 3 min",
      coverage: "Comprobación multilingüe superada",
      usageReady: "Uso de tokens conectado",
      backupDone: "Copia privada en GitHub completada",
      currentUsage: "Uso actual",
      input: "Entrada 31%",
      output: "Salida 69%",
    },
    hero: {
      badge: "Beta privada de AICodeRoom",
      line1: "Haz que un equipo de IA trabaje",
      line2: "en un mismo espacio de código.",
      body: "De una descripción a código revisable, respaldado y entregable. Reúne Claude, Codex y Git en un espacio de desarrollo sereno y transparente.",
      primary: "Ver el espacio Web",
      secondary: "Cómo funciona",
      localFirst: "Local primero",
      githubBackup: "Copia privada en GitHub",
      ownServer: "Entrega en tu servidor",
    },
    intro: {
      eyebrow: "No es otra ventana de chat",
      title: "La sala de control del\ndesarrollo de software con IA.",
      body: "Tú te concentras en objetivos y resultados. AICodeRoom hace que la ejecución compleja sea visible, controlable y recuperable.",
    },
    capabilities: [
      {
        title: "Un equipo de IA que colabora de verdad",
        body: "Claude Code, Codex y otros agentes trabajan en una misma tarea mientras el orquestador planifica, coordina y supervisa.",
      },
      {
        title: "Cada paso tiene respaldo en Git",
        body: "Ramas, espacios, cambios y revisiones quedan claros incluso durante la ejecución paralela.",
      },
      {
        title: "Tu código siempre es tuyo",
        body: "La sincronización local, GitHub privado y las copias del proyecto forman una cadena de recuperación.",
      },
    ],
    workflow: {
      eyebrow: "De la idea a la entrega",
      title: "La complejidad para el sistema.\nLas decisiones para ti.",
      body: "Cada fase tiene un estado claro. La IA nunca modifica tu proyecto donde no puedas verlo.",
      link: "Explorar el espacio completo",
      steps: [
        {
          title: "Crear un proyecto",
          body: "Importa una carpeta local o un repositorio Git, o crea un nuevo espacio de código.",
        },
        {
          title: "Describir la tarea",
          body: "Define el objetivo, las restricciones y el resultado esperado en lenguaje natural.",
        },
        {
          title: "El equipo de IA ejecuta",
          body: "El orquestador divide el trabajo y los agentes implementan y verifican en paralelo.",
        },
        {
          title: "Revisar y entregar",
          body: "Aprueba los cambios y luego descarga, sincroniza o despliega en tu servidor.",
        },
      ],
    },
    safety: {
      eyebrow: "Seguridad y recuperación",
      title: "Los servidores se reconstruyen.\nTu código no puede perderse.",
      body: "AICodeRoom separa el espacio de trabajo, el historial Git y los destinos de respaldo. Conserva una copia local y conecta tu GitHub privado.",
      checks: [
        "Sincronización local continua",
        "Historial Git rastreable",
        "Avisos inmediatos de fallos",
      ],
      project: "Proyecto AICodeRoom",
      workspace: "Espacio actual",
      quick: "Recuperación rápida",
      remote: "Copia externa",
    },
    usage: {
      eyebrow: "Transparencia de tokens",
      title: "Cada consumo de IA\ndebe entenderse.",
      body: "Consulta el uso acumulado por agente, modelo y sesión. Los límites del plan y la facturación se mantienen separados.",
      monthly: "Tokens de este mes",
      days: "Últimos 30 días",
    },
    final: {
      eyebrow: "Empieza con un proyecto real",
      title: "Convierte la IA en tu equipo de software.",
      body: "AICodeRoom está en desarrollo privado. Empieza en local mientras el espacio Web se conecta a los mismos proyectos y cuentas.",
      primary: "Ver diseño del espacio",
      secondary: "Explorar el producto",
    },
    footer: "Espacio de desarrollo de software multiagente",
  },
  workspace: {
    preview: "Vista previa del espacio Web",
    previewBody:
      "La interfaz está en desarrollo; la ejecución de IA sigue usando el Runtime local de AICodeRoom.",
    back: "Volver al sitio",
    search: "Buscar proyectos, tareas o sesiones",
    notifications: "Notificaciones",
    nav: "Navegación del espacio",
    overview: "Resumen",
    tasks: "Tareas",
    team: "Equipo de IA",
    usage: "Uso",
    newProject: "Nuevo proyecto",
    developer: "Desarrollador local",
    owner: "Propietario",
    projectOverview: "Resumen del proyecto",
    syncedNow: "Sincronizado ahora · Proyecto privado",
    backupSettings: "Ajustes de copia",
    newTask: "Nueva tarea",
    runtime: "Runtime local",
    connected: "Conectado",
    branch: "Rama actual",
    githubBackup: "Copia GitHub",
    synced: "Sincronizado",
    deploy: "Destino de despliegue",
    notConfigured: "Sin configurar",
    currentTask: "Tarea actual",
    viewAll: "Ver todo",
    progress: "Progreso total",
    milestones: [
      ["Localización de escritorio", "Completada"],
      ["Diseño web premium", "En curso"],
      ["Integración Web API", "Sin iniciar"],
    ],
    created: "Creado",
    today: "Hoy 03:58",
    target: "Destino de ejecución",
    localRuntime: "Runtime local",
    changed: "Archivos cambiados",
    files: "12 archivos",
    collaboration: "Colaboración en vivo",
    manageAgents: "Gestionar agentes",
    agentRoles: [
      "Planificación y coordinación",
      "Implementación web",
      "Revisión de arquitectura",
    ],
    updated: "Actualizado ahora",
    transparency: "Transparencia de recursos",
    tokenUsage: "Uso de tokens",
    docs: "Ver detalles",
    currentUsage: "Tarea actual",
    recovery: "Recuperación",
    projectBackup: "Copia del proyecto",
    configure: "Configurar",
    continuous: "Sincronización continua",
    normal: "Correcto",
    mainNow: "main · ahora",
  },
};

const fr: SiteCopy = {
  meta: {
    title: "AICodeRoom | Espace collaboratif de développement IA",
    description:
      "Un espace de développement logiciel IA multi-utilisateur et multi-projet.",
  },
  common: {
    language: "Changer de langue",
    home: "Accueil AICodeRoom",
    mainNav: "Navigation principale",
    running: "En cours",
    waiting: "En attente",
    tokens: "jetons",
    projects: "Projets",
    projectA: "Temps d'apprentissage",
    projectB: "Studio de contenu",
    privateSpace: "Espace privé",
    taskTitle: "Localisation complète et espace Web",
    orchestrator: "Orchestrateur",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "Miroir local",
    privateGithub: "GitHub privé",
    githubPrivateRepo: "Dépôt GitHub privé",
  },
  home: {
    nav: {
      capabilities: "Fonctionnalités",
      workflow: "Fonctionnement",
      safety: "Sécurité des données",
      usage: "Utilisation des jetons",
      workspace: "Voir l'espace",
    },
    stage: {
      aria: "Aperçu de l'espace AICodeRoom",
      title: "Espace produit",
      connected: "Runtime local connecté",
      executing: "En cours",
      newTask: "Nouvelle tâche",
      splitting: "Découpage de la tâche",
      orchestratorBody:
        "Le site est organisé en quatre étapes : marque, interface, sécurité et livraison.",
      building: "Construction de l'interface Web",
      codexBody:
        "Finalisation du responsive, du contenu multilingue et des états d'interaction.",
      activity: "Activité en direct",
      records: "12 événements",
      now: "À l'instant",
      minute1: "Il y a 1 min",
      minute3: "Il y a 3 min",
      coverage: "Contrôle multilingue réussi",
      usageReady: "Utilisation des jetons connectée",
      backupDone: "Sauvegarde GitHub privée terminée",
      currentUsage: "Utilisation actuelle",
      input: "Entrée 31 %",
      output: "Sortie 69 %",
    },
    hero: {
      badge: "Bêta privée AICodeRoom",
      line1: "Faites travailler une équipe IA",
      line2: "dans un même espace de code.",
      body: "D'une simple tâche à un code révisable, sauvegardé et livrable. Réunissez Claude, Codex et Git dans un espace calme et transparent.",
      primary: "Voir l'espace Web",
      secondary: "Comprendre le fonctionnement",
      localFirst: "Local d'abord",
      githubBackup: "Sauvegarde GitHub privée",
      ownServer: "Livraison sur votre serveur",
    },
    intro: {
      eyebrow: "Pas une fenêtre de chat de plus",
      title: "La salle de contrôle du\ndéveloppement logiciel IA.",
      body: "Concentrez-vous sur les objectifs. AICodeRoom rend l'exécution complexe visible, contrôlable et récupérable.",
    },
    capabilities: [
      {
        title: "Une équipe IA qui collabore vraiment",
        body: "Claude Code, Codex et d'autres agents travaillent sur une même tâche, guidés par l'orchestrateur.",
      },
      {
        title: "Chaque étape est traçable dans Git",
        body: "Branches, espaces, changements et revues restent explicites, même en exécution parallèle.",
      },
      {
        title: "Votre code reste le vôtre",
        body: "La synchronisation locale, GitHub privé et les sauvegardes forment une chaîne de récupération.",
      },
    ],
    workflow: {
      eyebrow: "De l'idée à la livraison",
      title: "La complexité au système.\nLes décisions à vous.",
      body: "Chaque phase possède un état clair. L'IA ne modifie jamais votre projet hors de votre vue.",
      link: "Explorer l'espace complet",
      steps: [
        {
          title: "Créer un projet",
          body: "Importez un dossier local ou un dépôt Git, ou démarrez un nouvel espace de code.",
        },
        {
          title: "Décrire la tâche",
          body: "Indiquez l'objectif, les contraintes et le résultat attendu en langage naturel.",
        },
        {
          title: "L'équipe IA exécute",
          body: "L'orchestrateur découpe le travail et les agents implémentent et vérifient en parallèle.",
        },
        {
          title: "Réviser et livrer",
          body: "Validez les changements puis téléchargez, synchronisez ou déployez sur votre serveur.",
        },
      ],
    },
    safety: {
      eyebrow: "Sécurité et récupération",
      title: "Un serveur se reconstruit.\nVotre code ne se perd pas.",
      body: "AICodeRoom sépare espace projet, historique Git et cibles de sauvegarde. Gardez un miroir local et connectez votre GitHub privé.",
      checks: [
        "Synchronisation locale continue",
        "Historique Git traçable",
        "Alertes immédiates d'échec",
      ],
      project: "Projet AICodeRoom",
      workspace: "Espace actuel",
      quick: "Récupération rapide",
      remote: "Sauvegarde distante",
    },
    usage: {
      eyebrow: "Transparence des jetons",
      title: "Chaque coût IA\ndoit être compréhensible.",
      body: "Consultez l'usage cumulé par agent, modèle et session. Les limites du forfait et la facturation restent distinctes.",
      monthly: "Jetons ce mois-ci",
      days: "30 derniers jours",
    },
    final: {
      eyebrow: "Commencez par un vrai projet",
      title: "Transformez l'IA en équipe logiciel.",
      body: "AICodeRoom est en développement privé. Commencez en local pendant que l'espace Web rejoint les mêmes projets et comptes.",
      primary: "Voir le design de l'espace",
      secondary: "Revoir le produit",
    },
    footer: "Espace de développement logiciel multi-agent",
  },
  workspace: {
    preview: "Aperçu de l'espace Web",
    previewBody:
      "L'interface est en développement ; l'exécution IA reste assurée par le Runtime local AICodeRoom.",
    back: "Retour au site",
    search: "Rechercher projets, tâches ou sessions",
    notifications: "Notifications",
    nav: "Navigation de l'espace",
    overview: "Vue d'ensemble",
    tasks: "Tâches",
    team: "Équipe IA",
    usage: "Utilisation",
    newProject: "Nouveau projet",
    developer: "Développeur local",
    owner: "Propriétaire",
    projectOverview: "Vue du projet",
    syncedNow: "Synchronisé à l'instant · Projet privé",
    backupSettings: "Réglages de sauvegarde",
    newTask: "Nouvelle tâche",
    runtime: "Runtime local",
    connected: "Connecté",
    branch: "Branche actuelle",
    githubBackup: "Sauvegarde GitHub",
    synced: "Synchronisé",
    deploy: "Cible de déploiement",
    notConfigured: "Non configuré",
    currentTask: "Tâche actuelle",
    viewAll: "Tout voir",
    progress: "Progression globale",
    milestones: [
      ["Localisation du bureau", "Terminée"],
      ["Design Web premium", "En cours"],
      ["Intégration Web API", "À démarrer"],
    ],
    created: "Créée",
    today: "Aujourd'hui 03:58",
    target: "Cible d'exécution",
    localRuntime: "Runtime local",
    changed: "Fichiers modifiés",
    files: "12 fichiers",
    collaboration: "Collaboration en direct",
    manageAgents: "Gérer les agents",
    agentRoles: [
      "Planification et coordination",
      "Implémentation Web",
      "Revue d'architecture",
    ],
    updated: "Mis à jour à l'instant",
    transparency: "Transparence des ressources",
    tokenUsage: "Utilisation des jetons",
    docs: "Voir les détails",
    currentUsage: "Tâche actuelle",
    recovery: "Récupération",
    projectBackup: "Sauvegarde du projet",
    configure: "Configurer",
    continuous: "Synchronisation continue",
    normal: "Normal",
    mainNow: "main · à l'instant",
  },
};

const de: SiteCopy = {
  meta: {
    title: "AICodeRoom | KI-Softwareentwicklung im Team",
    description:
      "Ein kollaborativer KI-Workspace für mehrere Nutzer und Projekte.",
  },
  common: {
    language: "Sprache wechseln",
    home: "AICodeRoom Startseite",
    mainNav: "Hauptnavigation",
    running: "Läuft",
    waiting: "Wartet",
    tokens: "Token",
    projects: "Projekte",
    projectA: "Lernzeit",
    projectB: "Content Studio",
    privateSpace: "Privater Bereich",
    taskTitle: "Vollständige Lokalisierung und Web-Workspace",
    orchestrator: "Orchestrator",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "Lokaler Spiegel",
    privateGithub: "Privates GitHub",
    githubPrivateRepo: "Privates GitHub-Repository",
  },
  home: {
    nav: {
      capabilities: "Funktionen",
      workflow: "Arbeitsweise",
      safety: "Datensicherheit",
      usage: "Token-Nutzung",
      workspace: "Workspace ansehen",
    },
    stage: {
      aria: "AICodeRoom Workspace-Vorschau",
      title: "Produkt-Workspace",
      connected: "Lokale Runtime verbunden",
      executing: "In Arbeit",
      newTask: "Neue Aufgabe",
      splitting: "Aufgabe wird zerlegt",
      orchestratorBody:
        "Der Website-Bau ist in Marke, Oberfläche, Datensicherheit und Auslieferung gegliedert.",
      building: "Web-Oberfläche wird gebaut",
      codexBody:
        "Responsive Layouts, mehrsprachige Inhalte und Interaktionszustände werden fertiggestellt.",
      activity: "Live-Aktivität",
      records: "12 Ereignisse",
      now: "Gerade eben",
      minute1: "Vor 1 Min.",
      minute3: "Vor 3 Min.",
      coverage: "Mehrsprachige Prüfung bestanden",
      usageReady: "Token-Nutzung verbunden",
      backupDone: "Privates GitHub-Backup abgeschlossen",
      currentUsage: "Aktuelle Nutzung",
      input: "Eingabe 31 %",
      output: "Ausgabe 69 %",
    },
    hero: {
      badge: "AICodeRoom Private Beta",
      line1: "Lassen Sie ein KI-Team",
      line2: "in einem gemeinsamen Code-Raum arbeiten.",
      body: "Von einer Aufgabenbeschreibung zu prüfbarem, gesichertem und auslieferbarem Code. Claude, Codex und Git in einem ruhigen, transparenten Workspace.",
      primary: "Web-Workspace ansehen",
      secondary: "Arbeitsweise verstehen",
      localFirst: "Lokal zuerst",
      githubBackup: "Privates GitHub-Backup",
      ownServer: "Auf eigenen Server liefern",
    },
    intro: {
      eyebrow: "Kein weiteres Chatfenster",
      title: "Der Kontrollraum für\nKI-Softwareentwicklung.",
      body: "Sie konzentrieren sich auf Ziele und Ergebnisse. AICodeRoom macht komplexe Ausführung sichtbar, steuerbar und wiederherstellbar.",
    },
    capabilities: [
      {
        title: "Ein KI-Team, das wirklich zusammenarbeitet",
        body: "Claude Code, Codex und weitere Agenten arbeiten an einer Aufgabe, während der Orchestrator plant, koordiniert und nachverfolgt.",
      },
      {
        title: "Jeder Schritt ist in Git belegt",
        body: "Branches, Workspaces, Änderungen und Reviews bleiben auch bei paralleler Ausführung klar.",
      },
      {
        title: "Ihr Code bleibt Ihrer",
        body: "Lokale Synchronisierung, privates GitHub und Projekt-Backups bilden eine belastbare Wiederherstellungskette.",
      },
    ],
    workflow: {
      eyebrow: "Von der Idee zur Auslieferung",
      title: "Komplexität ans System.\nEntscheidungen an Sie.",
      body: "Jede Phase hat einen klaren Status. KI verändert Ihr Projekt nie außerhalb Ihrer Sicht.",
      link: "Vollständigen Workspace ansehen",
      steps: [
        {
          title: "Projekt erstellen",
          body: "Lokalen Ordner oder Git-Repository importieren oder einen neuen Code-Raum anlegen.",
        },
        {
          title: "Aufgabe beschreiben",
          body: "Ziel, Einschränkungen und Ergebnis in natürlicher Sprache festlegen.",
        },
        {
          title: "KI-Team führt aus",
          body: "Der Orchestrator zerlegt die Arbeit; Agenten implementieren und prüfen parallel.",
        },
        {
          title: "Prüfen und liefern",
          body: "Änderungen freigeben und herunterladen, synchronisieren oder auf Ihrem Server bereitstellen.",
        },
      ],
    },
    safety: {
      eyebrow: "Datensicherheit und Wiederherstellung",
      title: "Server lassen sich neu bauen.\nCode darf nicht verloren gehen.",
      body: "AICodeRoom trennt Projekt-Workspace, Git-Verlauf und Backup-Ziele. Nutzen Sie einen lokalen Spiegel und Ihr privates GitHub-Repository.",
      checks: [
        "Kontinuierliche lokale Synchronisierung",
        "Nachvollziehbarer Git-Verlauf",
        "Sofortige Backup-Fehlerwarnung",
      ],
      project: "AICodeRoom Projekt",
      workspace: "Aktueller Workspace",
      quick: "Schnelle Wiederherstellung",
      remote: "Externes Backup",
    },
    usage: {
      eyebrow: "Token-Transparenz",
      title: "Jede KI-Nutzung\nsollte verständlich sein.",
      body: "Kumulierte Nutzung nach Agent, Modell und Sitzung. Tariflimits und Abrechnung bleiben klar getrennt.",
      monthly: "Token in diesem Monat",
      days: "Letzte 30 Tage",
    },
    final: {
      eyebrow: "Mit einem echten Projekt starten",
      title: "Machen Sie KI zu Ihrem Softwareteam.",
      body: "AICodeRoom befindet sich in privater Entwicklung. Starten Sie lokal, während der Web-Workspace dieselben Projekte und Konten verbindet.",
      primary: "Workspace-Design ansehen",
      secondary: "Produkt erneut ansehen",
    },
    footer: "Multi-Agent-Workspace für Softwareentwicklung",
  },
  workspace: {
    preview: "Web-Workspace Produktvorschau",
    previewBody:
      "Die Oberfläche ist in Entwicklung; die KI-Ausführung läuft weiterhin über die lokale AICodeRoom Runtime.",
    back: "Zurück zur Website",
    search: "Projekte, Aufgaben oder Sitzungen suchen",
    notifications: "Benachrichtigungen",
    nav: "Workspace-Navigation",
    overview: "Übersicht",
    tasks: "Aufgaben",
    team: "KI-Team",
    usage: "Nutzung",
    newProject: "Neues Projekt",
    developer: "Lokaler Entwickler",
    owner: "Eigentümer",
    projectOverview: "Projektübersicht",
    syncedNow: "Gerade synchronisiert · Privates Projekt",
    backupSettings: "Backup-Einstellungen",
    newTask: "Neue Aufgabe",
    runtime: "Lokale Runtime",
    connected: "Verbunden",
    branch: "Aktueller Branch",
    githubBackup: "GitHub-Backup",
    synced: "Synchronisiert",
    deploy: "Bereitstellungsziel",
    notConfigured: "Nicht konfiguriert",
    currentTask: "Aktuelle Aufgabe",
    viewAll: "Alle anzeigen",
    progress: "Gesamtfortschritt",
    milestones: [
      ["Desktop-Lokalisierung", "Abgeschlossen"],
      ["Premium-Webdesign", "In Arbeit"],
      ["Web-API-Anbindung", "Nicht begonnen"],
    ],
    created: "Erstellt",
    today: "Heute 03:58",
    target: "Ausführungsziel",
    localRuntime: "Lokale Runtime",
    changed: "Geänderte Dateien",
    files: "12 Dateien",
    collaboration: "Live-Zusammenarbeit",
    manageAgents: "Agenten verwalten",
    agentRoles: [
      "Aufgabenplanung und Koordination",
      "Web-Oberfläche implementieren",
      "Architektur prüfen",
    ],
    updated: "Gerade aktualisiert",
    transparency: "Ressourcentransparenz",
    tokenUsage: "Token-Nutzung",
    docs: "Details ansehen",
    currentUsage: "Aktuelle Aufgabe",
    recovery: "Wiederherstellung",
    projectBackup: "Projekt-Backup",
    configure: "Konfigurieren",
    continuous: "Laufende Synchronisierung",
    normal: "Normal",
    mainNow: "main · gerade eben",
  },
};

const ptBR: SiteCopy = {
  meta: {
    title: "AICodeRoom | Espaço colaborativo de desenvolvimento com IA",
    description:
      "Um workspace de desenvolvimento com IA para vários usuários e projetos.",
  },
  common: {
    language: "Alterar idioma",
    home: "Início do AICodeRoom",
    mainNav: "Navegação principal",
    running: "Em execução",
    waiting: "Aguardando",
    tokens: "tokens",
    projects: "Projetos",
    projectA: "Tempo de estudo",
    projectB: "Estúdio de conteúdo",
    privateSpace: "Espaço privado",
    taskTitle: "Localização completa e workspace Web",
    orchestrator: "Orquestrador",
    codex: "Codex",
    claude: "Claude Code",
    localMirror: "Espelho local",
    privateGithub: "GitHub privado",
    githubPrivateRepo: "Repositório privado do GitHub",
  },
  home: {
    nav: {
      capabilities: "Recursos",
      workflow: "Como funciona",
      safety: "Segurança de dados",
      usage: "Uso de tokens",
      workspace: "Ver workspace",
    },
    stage: {
      aria: "Prévia do workspace AICodeRoom",
      title: "Workspace do produto",
      connected: "Runtime local conectado",
      executing: "Em andamento",
      newTask: "Nova tarefa",
      splitting: "Dividindo a tarefa",
      orchestratorBody:
        "A construção do site foi dividida em marca, interface, segurança de dados e entrega.",
      building: "Construindo a interface Web",
      codexBody:
        "Finalizando layout responsivo, conteúdo multilíngue e estados de interação.",
      activity: "Atividade ao vivo",
      records: "12 registros",
      now: "Agora",
      minute1: "Há 1 min",
      minute3: "Há 3 min",
      coverage: "Verificação multilíngue aprovada",
      usageReady: "Uso de tokens conectado",
      backupDone: "Backup privado do GitHub concluído",
      currentUsage: "Uso atual",
      input: "Entrada 31%",
      output: "Saída 69%",
    },
    hero: {
      badge: "Beta privada AICodeRoom",
      line1: "Faça uma equipe de IA trabalhar",
      line2: "no mesmo espaço de código.",
      body: "De uma descrição a código revisável, protegido e pronto para entrega. Reúna Claude, Codex e Git em um workspace tranquilo e transparente.",
      primary: "Ver workspace Web",
      secondary: "Entender o fluxo",
      localFirst: "Local primeiro",
      githubBackup: "Backup privado no GitHub",
      ownServer: "Entrega no seu servidor",
    },
    intro: {
      eyebrow: "Não é outra janela de chat",
      title: "A sala de controle do\ndesenvolvimento de software com IA.",
      body: "Você se concentra nos objetivos e resultados. O AICodeRoom torna a execução complexa visível, controlável e recuperável.",
    },
    capabilities: [
      {
        title: "Uma equipe de IA que colabora de verdade",
        body: "Claude Code, Codex e outros agentes trabalham na mesma tarefa enquanto o orquestrador planeja, coordena e acompanha.",
      },
      {
        title: "Cada etapa tem histórico no Git",
        body: "Branches, workspaces, mudanças e revisões permanecem claros mesmo durante a execução paralela.",
      },
      {
        title: "Seu código continua sendo seu",
        body: "Sincronização local, GitHub privado e backups do projeto formam uma cadeia de recuperação.",
      },
    ],
    workflow: {
      eyebrow: "Da ideia à entrega",
      title: "Complexidade para o sistema.\nDecisões para você.",
      body: "Cada fase tem um estado claro. A IA nunca altera seu projeto fora da sua visão.",
      link: "Explorar o workspace completo",
      steps: [
        {
          title: "Criar um projeto",
          body: "Importe uma pasta local ou repositório Git, ou crie um novo espaço de código.",
        },
        {
          title: "Descrever a tarefa",
          body: "Defina objetivo, restrições e resultado esperado em linguagem natural.",
        },
        {
          title: "A equipe de IA executa",
          body: "O orquestrador divide o trabalho; os agentes implementam e validam em paralelo.",
        },
        {
          title: "Revisar e entregar",
          body: "Aprove as mudanças e então baixe, sincronize ou implante no seu servidor.",
        },
      ],
    },
    safety: {
      eyebrow: "Segurança e recuperação",
      title: "Servidores podem ser refeitos.\nSeu código não pode ser perdido.",
      body: "O AICodeRoom separa workspace, histórico Git e destinos de backup. Mantenha um espelho local e conecte seu GitHub privado.",
      checks: [
        "Sincronização local contínua",
        "Histórico Git rastreável",
        "Alertas imediatos de falha",
      ],
      project: "Projeto AICodeRoom",
      workspace: "Workspace atual",
      quick: "Recuperação rápida",
      remote: "Backup externo",
    },
    usage: {
      eyebrow: "Transparência de tokens",
      title: "Todo uso de IA\ndeve ser compreensível.",
      body: "Veja o uso acumulado por agente, modelo e sessão. Limites do plano e cobrança permanecem separados.",
      monthly: "Tokens neste mês",
      days: "Últimos 30 dias",
    },
    final: {
      eyebrow: "Comece com um projeto real",
      title: "Transforme a IA na sua equipe de software.",
      body: "O AICodeRoom está em desenvolvimento privado. Comece localmente enquanto o workspace Web se conecta aos mesmos projetos e contas.",
      primary: "Ver design do workspace",
      secondary: "Explorar o produto",
    },
    footer: "Workspace de desenvolvimento de software multiagente",
  },
  workspace: {
    preview: "Prévia do workspace Web",
    previewBody:
      "A interface está em desenvolvimento; a execução de IA ainda usa o Runtime local do AICodeRoom.",
    back: "Voltar ao site",
    search: "Buscar projetos, tarefas ou sessões",
    notifications: "Notificações",
    nav: "Navegação do workspace",
    overview: "Visão geral",
    tasks: "Tarefas",
    team: "Equipe de IA",
    usage: "Uso",
    newProject: "Novo projeto",
    developer: "Desenvolvedor local",
    owner: "Proprietário",
    projectOverview: "Visão do projeto",
    syncedNow: "Sincronizado agora · Projeto privado",
    backupSettings: "Configurações de backup",
    newTask: "Nova tarefa",
    runtime: "Runtime local",
    connected: "Conectado",
    branch: "Branch atual",
    githubBackup: "Backup GitHub",
    synced: "Sincronizado",
    deploy: "Destino de implantação",
    notConfigured: "Não configurado",
    currentTask: "Tarefa atual",
    viewAll: "Ver tudo",
    progress: "Progresso geral",
    milestones: [
      ["Localização do desktop", "Concluída"],
      ["Design Web premium", "Em andamento"],
      ["Integração Web API", "Não iniciada"],
    ],
    created: "Criada",
    today: "Hoje 03:58",
    target: "Destino de execução",
    localRuntime: "Runtime local",
    changed: "Arquivos alterados",
    files: "12 arquivos",
    collaboration: "Colaboração ao vivo",
    manageAgents: "Gerenciar agentes",
    agentRoles: [
      "Planejamento e coordenação",
      "Implementação da interface Web",
      "Revisão de arquitetura",
    ],
    updated: "Atualizado agora",
    transparency: "Transparência de recursos",
    tokenUsage: "Uso de tokens",
    docs: "Ver detalhes",
    currentUsage: "Tarefa atual",
    recovery: "Recuperação",
    projectBackup: "Backup do projeto",
    configure: "Configurar",
    continuous: "Sincronização contínua",
    normal: "Normal",
    mainNow: "main · agora",
  },
};

const copies: Record<SiteLocale, SiteCopy> = {
  "zh-CN": zhCN as SiteCopy,
  en,
  ja,
  ko,
  es,
  fr,
  de,
  "pt-BR": ptBR,
};

type SiteI18nValue = {
  locale: SiteLocale;
  copy: SiteCopy;
  setLocale: (locale: SiteLocale) => void;
};
const SiteI18nContext = createContext<SiteI18nValue | null>(null);

function isSiteLocale(value: string | null): value is SiteLocale {
  return !!value && (SITE_LOCALES as readonly string[]).includes(value);
}

export function SiteI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>("zh-CN");

  const setLocale = (next: SiteLocale) => {
    setLocaleState(next);
    window.localStorage.setItem("aicoderoom-site-locale", next);
    const url = new URL(window.location.href);
    if (next === "zh-CN") url.searchParams.delete("lang");
    else url.searchParams.set("lang", next);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  useEffect(() => {
    const queryLocale = new URL(window.location.href).searchParams.get("lang");
    const savedLocale = window.localStorage.getItem("aicoderoom-site-locale");
    const initial = isSiteLocale(queryLocale)
      ? queryLocale
      : isSiteLocale(savedLocale)
        ? savedLocale
        : "zh-CN";
    setLocaleState(initial);
  }, []);

  const copy = copies[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy.meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", copy.meta.description);
  }, [copy, locale]);

  const value = useMemo(() => ({ locale, copy, setLocale }), [copy, locale]);
  return (
    <SiteI18nContext.Provider value={value}>
      {children}
    </SiteI18nContext.Provider>
  );
}

export function useSiteI18n(): SiteI18nValue {
  const value = useContext(SiteI18nContext);
  if (!value)
    throw new Error("useSiteI18n must be used within SiteI18nProvider");
  return value;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, copy, setLocale } = useSiteI18n();
  return (
    <label
      className={`aicr-language-switcher${compact ? " compact" : ""}`}
      title={copy.common.language}
    >
      <Globe2 size={14} aria-hidden="true" />
      <span className="sr-only">{copy.common.language}</span>
      <select
        aria-label={copy.common.language}
        value={locale}
        onChange={(event) => setLocale(event.target.value as SiteLocale)}
      >
        {SITE_LOCALES.map((item) => (
          <option key={item} value={item}>
            {localeNames[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
