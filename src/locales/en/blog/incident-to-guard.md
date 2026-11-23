---
title: "A mistake you cannot see with your eyes"
description: >-
  A tool put invisible characters into the code. You cannot see them on the
  screen. How it was found, and why a check appeared together with the fix.
date: 2026-11-23
updated: 2026-11-23
sources:
  - label: "mainstay, README.md: the rule “it broke, so a check appeared”"
    href: https://github.com/Kamtomir/mainstay/blob/main/README.md
  - label: "mainstay, mainstay.guard.test.ts: the check itself"
    href: https://github.com/Kamtomir/mainstay/blob/main/mainstay.guard.test.ts
  - label: "mainstay, agent/CLAUDE.md.template: the rules for the agent"
    href: https://github.com/Kamtomir/mainstay/blob/main/agent/CLAUDE.md.template
  - label: "mainstay, CASE.md: the numbers of Catch Club"
    href: https://github.com/Kamtomir/mainstay/blob/main/CASE.md
---

While I was putting mainstay together, a strange thing happened.

There was an ordinary line in the code: a pattern for searching text. It contained character codes, written out in letters. During an edit, a tool replaced those codes with the characters themselves. And those characters are invisible.

You cannot see them on the screen. So two files read one way and ran another way.

You cannot find a mistake like this with your eyes. A person looks at the line and sees what they expect. So does an agent.

## What I did

I fixed those two files.

But stopping there means waiting for the next time. The same tool could do the same thing in any other file. Tomorrow, or in a month.

So in the same change I added a check. It looks through every file of the project. It finds an invisible character and fails. And it says in which file.

## A four-step rule

I have done it this way ever since.

1. Something breaks.
2. I find the cause, not only what is visible from outside.
3. I write a check that would have failed on this mistake. In the same change as the fix.
4. Done. From now on the check catches this kind of mistake.

Step three is the one people skip. They fix it and move on. But a fix closes one case. A check closes all the similar ones. Including the files that do not exist yet.

## Three details worth copying

**A check must not contain what it looks for.** The invisible characters are not written in my check. They are built from their numbers. Otherwise it would be the same mistake again.

**A check must fail when it has nothing to check.** It happens like this: a folder is renamed, the check finds nothing, and it is quietly green. My check fails if it sees fewer than forty files. An empty result is a breakdown, not a success.

**The message must say what to do.** Not “an error in the file”, but “an invisible character: write it as a code”. Whoever sees it, a person or an agent, knows at once how to fix it.

## A red check is a fork in the road

When a check fails, there are two honest ways. Fix the code. Or write down why this file is allowed, with a reason.

The third way is to weaken the check itself until it is green. That one is forbidden. This rule is written in the file my agent reads before every task. So it does not depend on whether I remember it.

## The same in the big project

In Catch Club it works the same way. Errors from browsers land in one list by themselves. A mistake in the live product becomes a check the same day. By 7 November 2026 there were 23 such sets.

One of them appeared after the story with the iPhones. A construct that older iPhones do not understand got into the code for the browser. Because of it, a page did not open on them. Now a check keeps such things out of the code for the browser. Nobody has to remember it.
