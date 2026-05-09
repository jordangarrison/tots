---
name: new-adventure-story
description: Author a new choose-your-own-adventure story for the TOTS arcade. Use when the user wants to add a story to src/lib/adventure/stories/ for the /games/adventure game.
---

# Authoring a new TOTS adventure story

The TOTS arcade has a choose-your-own-adventure game at `/games/adventure`. This skill walks through adding a new story to the rotation in a way that stays on tone with the existing one.

## Tone rubric — every story must follow

The aesthetic is closer to *Mister Rogers' Neighborhood* than to fairy-tale adventure. Emotional skill is the through-line, not winning.

1. **No winning, no losing.** Every path is a good path. There are no wrong answers, no game-over states.
2. **Helpers in every scene.** Even quiet helpers (the wind, the stars, your own breath).
3. **Name at least one feeling per scene** via `feelingNote`. Both/and feelings are encouraged ("curious *and* a little nervous"). It's okay for grown-ups to feel that way too — say so.
4. **No defeated antagonists.** Conflict, if any, is loneliness or fear or a misunderstanding — and gets cared for, not defeated.
5. **End at home.** A short ending scene with cocoa / blanket / safety, and a sentence that reflects what the child did.
6. **Speak directly to the listener at least once.** Rogers always did. Save it for moments that land — usually the closing.

## Choice design — the rule that matters most

**Every choice must feel like it had an effect.** Choices can converge (no need to truly fork the plot), but each option must produce visible acknowledgment. Two valid patterns:

- **Branched scenes** — the choice routes to a unique scene before re-converging. (E.g., Lonely Lantern's `wind_helper` / `rabbit_helper` / `owl_helper`.)
- **Acknowledgment scenes** — each choice routes through a tiny one-beat scene that mirrors back what the child chose, with a single "→ keep going" choice that converges. (E.g., Lonely Lantern's `forest_validate` / `forest_company` / `forest_present` and `comfort_hold` / `comfort_share` / `comfort_hum`.)

If three choices share a `nextId`, you've made fake choices. Fix it before shipping.

## Length

Aim for **10-18 scenes** (Lonely Lantern is 16). Larger and toddlers lose focus; smaller and choices don't have room to feel meaningful.

## File layout

```
src/lib/adventure/stories/<slug>.ts        ← the story
src/lib/adventure/stories/index.ts         ← register it here
```

Add the story in two places: write the file, then import + push onto the `stories` array in `index.ts`.

## Schema

```ts
import type { Story } from '../types';

export const myStory: Story = {
  id: 'my-story',                  // matches filename slug
  title: 'My Story Title',
  description: 'One line, ~10 words, parent-readable, sets the vibe.',
  emoji: '🏮',                      // single emoji for the picker card
  accent: 'var(--rp-gold)',        // Rose Pine: love | gold | rose | foam | iris | pine
  startId: 'intro',
  restId: 'rest',
  scenes: {
    intro: {
      id: 'intro',
      art: { emoji: '🌙', background: '🏰' },   // primary emoji + optional collage backdrop
      narration: [
        '{Title} {name} ...',                   // beat 1
        'Another sentence ...',                 // beat 2
        'A third short beat.'                   // beat 3 (optional)
      ],
      feelingNote: '{Name} felt curious and a little nervous.',
      flavor: {
        jane: 'Jane-specific line, hard-coded names/pronouns.',
        isla: 'Isla-specific line.',
        ollie: 'Ollie-specific line — lean into mini Aussie behaviors.'
      },
      choices: [
        { label: 'Action one.', nextId: 'next_scene' }
      ]
    },
    // ... more story-kind scenes (default kind, omit `kind` field)
    rest: {
      id: 'rest',
      kind: 'rest',
      art: { emoji: '🪟', background: '🌙✨' },
      narration: [/* 2-3 calming beats inviting the child to pause */],
      choices: []  // engine renders "I'm ready to keep going" + "All done for tonight"
    },
    home: {
      id: 'home',
      kind: 'ending',
      art: { emoji: '☕', background: '🏰🛏️' },
      narration: [/* closer + one line of direct address to the listener */],
      choices: [{ label: 'Tell it again. ✨', nextId: 'intro' }]
    }
  }
};
```

## Token vocabulary (use only in `narration` and `feelingNote`)

`flavor` lines hard-code the character's name and pronouns since they're already character-specific.

| Token | Resolves to |
|---|---|
| `{name}` / `{Name}` | first name |
| `{title}` / `{Title}` | "princess" / "prince" |
| `{they}` / `{They}` | "she" / "he" |
| `{them}` / `{Them}` | "her" / "him" |
| `{their}` / `{Their}` | "her" / "his" |
| `{theirs}` / `{Theirs}` | "hers" / "his" |
| `{themselves}` / `{Themselves}` | "herself" / "himself" |

All current characters use singular agreement, so `{they} was` reads correctly ("she was" / "he was"). Avoid plural-only verb forms. Do **not** invent tokens like `{he}`, `{is}`, `{paws}` — only the table above is supported by `format()` in `src/lib/adventure/types.ts`.

## Characters — write `flavor` to who they are

- **Jane** (Princess, she/her, love accent) — humming, wildflowers, observes small kindnesses, leaves crumbs for "any other small friends."
- **Isla** (Princess, she/her, iris accent) — stars, patterns, decides things mean good luck, knows her favorite star, counts under her breath.
- **Ollie** (Prince, he/him, foam accent) — a **miniature Australian shepherd with a very short tail**. He has *no tail to wag* — his whole back end wiggles instead. He swivels his ears in two directions at once, has a very good nose, and *herds* (gentle nudge things back to the path). He's anthropomorphic enough to "hold a snack" or "ask a question," but flavor lines should reach for dog-specific behaviors first.

## Process — recommended order

1. **Synopsis first.** Propose a 1-paragraph premise. Confirm it passes the tone rubric (helpers? feelings? home ending? no defeated antagonist?). **Wait for the user's go-ahead before drafting scenes.**
2. **Scene tree.** List scenes with one-line summaries and the choice graph. Verify every choice is acknowledged (different next scene OR a tiny acknowledgment scene).
3. **Narration draft.** Write the full TS file. Preserve token discipline.
4. **Register.** Add the import + array entry in `src/lib/adventure/stories/index.ts`.
5. **Verify.** `npm run check` should pass with 0 errors. (Node 20 is required — there's an `.npmrc` enforcing engine-strict. Use `/usr/local/bin/node` if your default `node` is newer.)

## Pre-commit checklist

- [ ] Every `nextId` references a scene that exists
- [ ] `startId` and `restId` exist; at least one scene has `kind: 'ending'`
- [ ] Each story-kind scene has a `feelingNote`
- [ ] No two choices in the same scene share a `nextId` (or if they do, they each route through an acknowledgment scene first)
- [ ] No "wrong" or punitive choices — every option is kind, Rogers-tone
- [ ] Direct address to the listener appears at least once (usually in the ending)
- [ ] No invented tokens — only the ones in the vocabulary table above
- [ ] `npm run check` passes
- [ ] Scene count is 10-18

## Reference

The canonical example is `src/lib/adventure/stories/lonely-lantern.ts`. Read it before drafting — especially the `forest_path` → `forest_validate / forest_company / forest_present` → `lantern_scared` flow, which is the reference implementation for "every choice has its own moment."
