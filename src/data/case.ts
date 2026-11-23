/**
 * The numbers of the reference deployment, copied from CASE.md and README.md
 * of the mainstay repository (https://github.com/Kamtomir/mainstay).
 *
 * RULE. Every number on the site comes from here, and every value here comes
 * from those two files. Pages, the facts block, JSON-LD and llms.txt read this
 * module, so a number cannot differ between them. When CASE.md changes, change
 * this file and search src/locales/<language>/blog for the old value: articles are
 * prose and repeat a few of these numbers by hand.
 */
export const caseData = {
  /** "As of 6 and 7 November 2026" (CASE.md, The numbers). */
  asOfFrom: "2026-11-06",
  asOf: "2026-11-07",
  /** "from 14 March to 7 November 2026" (CASE.md, intro). */
  periodStart: "2026-03-14",
  periodEnd: "2026-11-07",
  /** "in eight months" (README.md). */
  months: 8,
  ciRun: "42307651951",
  commit: "25307593",

  unitTests: 15826,
  unitTestFiles: 1407,
  /** Vitest duration of the unit tests: 860.58 s, that is 14 min 21 s. */
  unitTestsDuration: { min: 14, s: 21 },
  integrationTests: 166,
  integrationTestFiles: 19,
  /** The full CI run. */
  ciFull: { min: 26, s: 12 },
  ciShouldRun: { min: 0, s: 15 },
  ciTestsAndBuild: { min: 25, s: 46 },
  ciIntegration: { min: 3, s: 3 },
  guardSuites: 23,
  mergedPrs: 1373,
  commits: 1725,
  days: 238,
  migrations: 363,
  databases: 3,
  /** Thousands of lines of TypeScript, tests excluded. */
  tsLinesK: 445,
  sourceFiles: 2478,
  decisionDocs: 143,

  /** "The last 30 days, to 9 November 2026" (CASE.md). */
  last30: {
    until: "2026-11-09",
    days: 30,
    mergedPrs: 161,
    prsWithTestsPct: 97.4,
    prsWithTests: 150,
    codePrs: 154,
    redSharePct: 5.7,
    redRuns: 15,
    greenRuns: 247,
    skippedRuns: 102,
    cancelledRuns: 55,
    ciMedianMin: 15,
    ciP90Min: 21,
    flakyPct: 0.5,
    flakyCommits: 2,
    commitsWithRuns: 419,
    mainRedRuns: 0,
    mainGreenPushes: 147,
    mainCancelled: 14,
  },

  /** CASE.md, "The six layers there". */
  refusalCases: 21,
  toolModules: 63,
  sanitizerModules: 3,
  watchdogHours: 2,

  /** README.md: "a team ships five or six pull requests a day". */
  prsPerDayLow: 5,
  prsPerDayHigh: 6,
  /** README.md: the number of layers and "15-minute setup". */
  layers: 6,
  setupMinutes: 15,
} as const;

/** The commands that reproduce the numbers, verbatim from CASE.md. */
export const reproduce = {
  testCounts: `gh run view ${caseData.ciRun} --log | grep -E "Test Files|Tests|Duration"`,
  testCountsOutput: [
    "RPC integration (real Postgres)  Test Files  19 passed (19)",
    "RPC integration (real Postgres)       Tests  166 passed (166)",
    "RPC integration (real Postgres)    Duration  10.75s (transform 837ms, setup 0ms, import 2.31s, tests 6.29s, environment 2ms)",
    "Test + Build (Next.js)           Test Files  1407 passed (1407)",
    "Test + Build (Next.js)                Tests  15826 passed (15826)",
    "Test + Build (Next.js)             Duration  860.58s (transform 30.06s, setup 0ms, import 233.97s, tests 408.72s, environment 159ms)",
  ].join("\n"),
  guardSuites: "git ls-files | grep -c guard.test",
  guardSuitesOutput: "23",
  rest: [
    "# job durations",
    `gh run view ${caseData.ciRun} --json jobs --jq '.jobs[] | [.name, .startedAt, .completedAt] | @tsv'`,
    "",
    "# merged PRs, commits, migrations",
    "gh pr list --state merged --base main --limit 5000 --json number --jq length",
    "git rev-list --count HEAD",
    "git ls-files 'supabase/*migrations/*.sql' | wc -l",
    "",
    "# TypeScript source files and lines of the app, tests excluded",
    "git ls-files 'nextjs/src/**/*.ts' 'nextjs/src/**/*.tsx' | grep -vcE '\\.test\\.tsx?$'",
    "git ls-files 'nextjs/src/**/*.ts' 'nextjs/src/**/*.tsx' | grep -vE '\\.test\\.tsx?$' | tr '\\n' '\\0' | xargs -0 cat | wc -l",
    "",
    "# decision documents",
    "git ls-files 'docs/*.md' | wc -l",
    "",
    "# the 30-day baseline (from a clone of the mainstay repository)",
    "OWNER=... REPO=... GITHUB_TOKEN=... DAYS=30 WORKFLOW=ci.yml MIN_RUN_MINUTES=2 node metrics/baseline.mjs",
  ].join("\n"),
};

/** The plugin: commands and output, verbatim from README.md. */
export const plugin = {
  marketplaceAdd: "/plugin marketplace add Kamtomir/mainstay",
  install: "/plugin install mainstay@mainstay",
  setup: "/mainstay:setup",
  /** README.md, "Running it": what a failing guard prints in CI. */
  redOutput: {
    title: "GuardViolation: 1 violation: every API route checks the session",
    file: "app/api/orders/export/route.ts",
    rule: "[require]",
    message: "does not call requireUser(request)",
    hint: "What to do: call requireUser(request) first and return its response when it fails,\nor add the route to `allow` with the reason it is public.",
  },
  /** README.md, "15-minute setup": the first guard, as written there. */
  firstGuard: `import { surfaceGuard } from "./surface-guard";

surfaceGuard({
  name: "every API route checks the session",
  root: "src/app/api",
  files: /(^|\\/)route\\.ts$/,
  require: /\\brequireUser\\(/,
  requirement: "call requireUser(request)",
  allow: { "health/route.ts": "liveness probe: answers 200 and returns no data" },
});`,
};
