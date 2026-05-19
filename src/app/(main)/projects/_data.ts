export type TPortfolioProject = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  cover?: string;
  screenshots?: { src: string; alt: string }[];
  links?: { label: string; href: string }[];
  blog: {
    heading: string;
    body: string;
    images?: { src: string; alt: string }[];
    demoId?: string;
  }[];
};

export const PORTFOLIO_PROJECTS: TPortfolioProject[] = [
  {
    slug: "golf",
    title: "Golf Games",
    tagline:
      "A mobile-first scorekeeper for nine different on-course golf game formats.",
    description:
      "Track scores, side bets, and team formats for nine different golf games — from Stableford to Wolf — without pulling out a pencil.",
    tech: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "PWA",
      "Vitest",
      "Local Storage",
    ],
    links: [
      { label: "Launch app", href: "/golf" },
      {
        label: "Source",
        href: "https://github.com/jack-rowe/portfolio/tree/main/src/app/(main)/golf",
      },
    ],
    blog: [
      {
        heading: "Why I built it",
        body: "I love playing golf with friends, but keeping track of certain game formats can be a major hassle using pen and paper scorecards. Additionally, we invented a new game format that had some unique scoring rules and wanted a way to easily manage it. I built this project to solve those problems and make it easier to play fun games on the course. The ultimate goal is to keep it simple enough to use during a round while still supporting a variety of formats.",
        images: [
          {
            src: "/projects/golf/main-1.png",
            alt: "Screenshot of the main setup screen for a round of golf, showing player names, handicaps, and game formats",
          },
          {
            src: "/projects/golf/main-2.png",
            alt: "Screenshot of the main setup screen for a round of golf, showing player names, handicaps, and game formats",
          },
        ],
      },
      {
        heading: "What it does",
        body: "Currently, nine games are supported - with more to come as I continue to develop the app. Each has its own scoring engine and hole-by-hole UI. Rounds persist locally, handicaps are computed per the World Handicap System, and finished rounds can be shared via a generated URL.",
      },
      {
        heading: "UX decisions",
        body: "The app is designed to be used on mobile devices, so I focused on creating a clean and intuitive interface that minimizes the number of taps required to enter scores. The main screen shows all players, holes, and games in a single view with quick access to score entry. Every single round I play results in at least one feature request or UX improvement, so it’s been a fun ongoing project to evolve the app based on real-world use.",
        images: [
          {
            src: "/projects/golf/scoring-1.png",
            alt: "Screenshot of the scoring screen for a round of golf, showing player scores and game formats in a single view for easy score entry",
          },
        ],
      },
      {
        heading: "Architecture notes",
        body: "The game logic is isolated under `_lib/<game>` with pure scoring functions covered by Vitest. Each game has a matching `_hooks/use-<game>.ts` that owns state and persists it through a shared storage layer. UI lives in `_components/<game>` so a new game is roughly: add a lib, a hook, and a component folder. The whole thing is installable as a PWA.",
      },
    ],
  },
  {
    slug: "pulse",
    title: "Pulse",
    tagline:
      "A single-binary, self-hosted uptime monitor with a built-in status dashboard.",
    description:
      "Monitor HTTP endpoints, TCP ports, and WebSocket connections. Get alerts via Slack, Discord, email, or webhooks. No runtime, no containers, no dependencies.",
    tech: ["Go", "BBolt", "Docker", "Systemd", "REST API"],
    links: [{ label: "Source", href: "https://github.com/jack-rowe/pulse" }],
    blog: [
      {
        heading: "What it is",
        body: "Pulse is a self-hosted uptime monitor that ships as a single binary. Drop it on any server, point it at your endpoints, and get alerted when something goes down. No runtime, no database server, no containers required.",
      },
      {
        heading: "What it does",
        body: "Pulse checks HTTP endpoints, TCP ports, and WebSocket connections on configurable intervals. On state change it fires alerts through Slack, Discord, email, or any generic webhook. A failure debounce threshold stops noise from flaky networks. There's a built-in dark-mode status dashboard at / and a JSON API at /api/status for integrations. All state lives in an embedded BBolt key-value file — no Postgres, no Redis.",
      },
      {
        heading: "Why I built it",
        body: "Most uptime tools are SaaS products that phone home to a third party, or open-source projects that drag in a full database and a dozen services just to watch a couple of URLs. I wanted something I could drop on a cheap VPS, point at my own projects, and forget about — a single binary, a single config file, done.",
      },
      {
        heading: "Architecture",
        body: "The repo is split into focused packages: checker (health probe logic), scheduler (interval management), store (BBolt wrapper), notifier (alert delivery), and api (HTTP handlers + embedded dashboard). Each package has its own tests. A single main.go wires them together and compiles to a binary for Linux, macOS, Windows, and ARM64.",
      },
      {
        heading: "Deployment",
        body: "Ship it as a systemd service, a Docker container, or via Docker Compose. A --init flag generates a starter config.yaml and --validate checks it before you restart. An optional api_key protects the API and dashboard from public access.",
      },
    ],
  },
  {
    slug: "easy-history",
    title: "Easy History",
    tagline:
      "A lightweight React hook for undo, redo, batch updates, and snapshotting.",
    description:
      "Easy History is a flexible state management utility for React that adds a full undo/redo stack, batch commits, and point-in-time snapshots to any piece of state.",
    tech: ["TypeScript", "React", "Jest"],
    links: [
      { label: "Source", href: "https://github.com/jack-rowe/easy-history" },
    ],
    blog: [
      {
        heading: "What it is",
        body: "Easy History is a lightweight TypeScript library that adds a full undo/redo stack, batch commits, and point-in-time snapshots to any React state. It ships as a useHistory hook that's a direct replacement for useState.",
      },
      {
        heading: "What it does",
        body: "The hook returns set, undo, redo, canUndo, canRedo, batch, takeSnapshot, and restoreSnapshot. Batch groups multiple state mutations into a single history entry. Snapshots are full copies of the entire stack — not just the current value — so you can jump to any previous checkpoint. History depth is configurable and a custom isEqual function controls when new entries are created.",
        demoId: "counter",
      },
      {
        heading: "Batch updates & snapshots",
        body: "batch() lets you derive the next state from current state in a single history entry — useful for bulk edits like completing all tasks at once. takeSnapshot() captures the entire stack, not just the present value, so restoreSnapshot() brings back the full undo/redo history from that point. Try it below: edit the list, save a checkpoint, keep making changes, then restore.",
        demoId: "task-list",
      },
      {
        heading: "Even works with canvas!",
        body: "Easy History can manage any state shape, including complex objects like canvas drawings. The Canvas Draw demo uses useHistory to track an array of stroke objects representing user drawings. Each stroke is a series of points, and the history stack captures every change, allowing full undo/redo functionality for freehand drawing.",
        demoId: "canvas-draw",
      },
      {
        heading: "Why I built it",
        body: "I kept reaching for undo/redo in side projects — canvas tools, form builders, config editors — and finding nothing lightweight enough. Every solution either pulled in a large state management library or required rewriting the component around a specific API. I wanted something I could drop next to an existing useState call without changing anything else.",
      },
      {
        heading: "Implementation",
        body: "The core is a History class that manages past, present, and future stacks independently of React. The useHistory hook is a thin wrapper that syncs the class instance into component state on each mutation. Batch updates accumulate changes in a local transaction before committing a single entry to the stack. Snapshots deep-clone the full stack state, not just the present value.",
      },
    ],
  },
];

export function getProject(slug: string) {
  return PORTFOLIO_PROJECTS.find((p) => p.slug === slug);
}
