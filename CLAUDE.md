# mainstay-site: contract for the coding agent

A static site (Astro) for one person's service: a quality system for AI-assisted development.
Read README.md first: it says where everything lives and how to add an article or a language.

The rules are conditions, not wishes. When a rule and a request disagree, say so and ask.

## Facts

- Numbers come only from CASE.md and README.md of the mainstay repository
  (https://github.com/Kamtomir/mainstay). They are typed once, in `src/data/case.ts`; texts use
  `{placeholders}`. Never type a case number into a YAML text.
- No promises of results and no guarantees. Write what is done and what was measured.
- Workplaces, job titles and contacts appear only when the author confirmed them himself.
- The site says plainly who does the work: an AI agent (Claude Code) reads the client's code under
  the author's direction, and the author checks every finding. Never write that he reads the code
  himself, and never drop the answers about access, the AI provider and the NDA.
- The site promises that client code is processed under the author's COMMERCIAL AI account (an API
  key), where it is not used to train models. A personal subscription must never be used on client
  code. If the author changes how he works, change the sentence in the same commit.
- Move `factsCheckedAt` in `site.config.mjs` only after the facts were really checked.

## Voice

- Every text is written in the author's voice: short sentences (5 to 12 words), one thought per
  sentence, his own stories instead of general claims, plain words. A term is explained where it
  first appears, or replaced: "check" for "guard", "change" for "pull request".
- An earlier version read like reference documentation: correct, and hard to read for a person who
  is not an engineer. Do not bring that style back.
- For a new page or article, show the author the opening and the first part before writing the rest.
- The "In short" block is the one place written for search engines. It stays near the end of the
  page.

## The look

- An earlier look was a dark page in one colour with walls of text: nothing for the eye to catch.
  Do not bring back a dark page, one colour for everything or walls of text.
- One light theme, no automatic dark mode. The page is built of full-width bands (`Band.astro`):
  paper, mist, night, and a green one at the end. Two neighbours never share a tone.
- Colour carries meaning, as in a run of checks: green passed, red failed. Never use them as
  decoration.
- Every section of the landing page has its own device (the run of checks, three tiles, a diff,
  files, a flow, big numbers with a history of runs, a receipt, questions, the author's card). A
  new section gets a device of its own, not one more grid of identical cards.
- The monospace face is only for real code, file names and program output. No eyebrow labels in
  capitals, no arrows after link texts, no gradients for decoration.
- Motion is CSS only and shows something happening; it is off under `prefers-reduced-motion`.
- After a change of the look, check the pages at phone width (375) as well as on a desktop.
- The header: one tier on a wide screen; on a phone the name and the line under it scroll away and
  the four links stay. The rows of the first tier have fixed heights (`--header-fold`).

## The site

- No server, no forms, no trackers, no cookies. No script files: all text is in the HTML.
- A language is one folder in `src/locales/`. Do not list languages anywhere else.
- Every page exists in every language. An article may be in one language first.
- `npm run build` must end green: it runs `scripts/check.mjs` on `dist/`. A red check is a
  finding: fix the page, never loosen the check to get green.
- Do not write `\uXXXX` escapes through editing tools: they turn into real invisible characters.
  Build such characters from code points, as `scripts/check.mjs` does.

## Publishing

- The repository is public. A push to `main` builds the site, runs the checks and publishes it at
  https://dashdamirov.dev. Push only with the author's yes.
- Commit messages and files are public too: write what changed and how it was checked. No private
  remarks, no drafts of decisions.
- Never buy a domain, touch DNS or create an account without the author's explicit yes for that
  action.
- Never push to the public mainstay repository from here.
