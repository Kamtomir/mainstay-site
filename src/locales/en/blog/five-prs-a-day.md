---
title: "Five changes a day: who checks all of this?"
description: >-
  An agent writes faster than a person reads. What I put in place of checking
  by hand, and what the numbers showed after eight months.
date: 2026-11-23
updated: 2026-11-23
sources:
  - label: "mainstay, README.md: the six parts of the system"
    href: https://github.com/Kamtomir/mainstay/blob/main/README.md
  - label: "mainstay, CASE.md: the numbers and how to check them again"
    href: https://github.com/Kamtomir/mainstay/blob/main/CASE.md
  - label: "mainstay, metrics/METRICS.md: which numbers to watch"
    href: https://github.com/Kamtomir/mainstay/blob/main/metrics/METRICS.md
---

When an AI agent writes the code, one thing changes. It writes faster than you read.

That was my life for eight months. I built Catch Club alone. It is a platform for paid Telegram communities. The code was written by the Claude Code agent. In 238 days, 1,373 changes went into the main code. That is five or six a day.

I could not read all of it. And I soon saw that three familiar things no longer worked.

## What stopped working

**Checking by hand.** After a big update you can sit down and click through the product. You cannot do it five times a day.

**Writing tests “later”.** Later never comes. The next change is already here.

**Reading everything with your own eyes.** A person looks at what is in front of them. They do not remember every page that needs a sign-in. Or every place where money moves.

## A different question

I used to ask: “How do I check this feature?”

Now I ask something else: “How do I make sure no change breaks what matters?”

What matters is three things. Personal data. Money. Access.

## What I put in place

Checks that run by themselves. On every change. They do not care who wrote the code.

The simplest one works like this. There is a rule: “every page with data first checks that the person is signed in”. The check reads the code. It finds a page without it and goes red. And it names the file.

I have 23 sets of such checks. Along with them, 15,826 ordinary tests pass on every change. And 166 more tests on a real database. All together it takes 26 minutes 12 seconds.

The whole system has six parts. Each is described on [the plugin page](/plugin/).

## What the last 30 days showed

I do not trust the words “it got better”. So I count. Here are the 30 days to 9 November 2026.

| Number | What it is |
|---|---|
| 161 | changes accepted |
| 15 | times a run of the checks was red |
| 0 | times the main version of the code was red |
| 97.4% | of code changes came with a change to the tests (150 of 154) |
| 15&nbsp;minutes | is how long a check usually takes |

The line that matters is the third. Fifteen times a run was red. All fifteen were in drafts. The main version did not go red once.

About the fourth line, honestly: a changed test is not yet a good test. I read this number together with the others.

## What these numbers do not say

- This is one person's experience. A large team needs a different setup.
- I have no tests that click through the site by themselves. I check the Telegram screens by hand.
- I tested under load once, in August 2026.
- I do not yet count separately the mistakes that reached people.

## Where to start

Not with a system. With one check.

Take the rule that is most expensive to break. For example, the one about signing in on pages with data. And write it down as a check.

If you use Claude Code, [the free plugin](/plugin/) does this. Three commands, and it shows what it found.
