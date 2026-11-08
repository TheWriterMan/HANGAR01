# HANGAR01 Checklist Guide

> Single reference for how checklists are written and structured.
> Guidelines, not hard rules. Use judgment. If breaking a guideline makes the result better, break it and note why.

---

## How it works

Checklists are flat JSON files in `content/checklists/<slug>.json`. The site fetches them at runtime and prerenders every checklist at build time. There is no CMS or database: the JSON file is the data.

`content/aircraft-index.json` is the summary index (all aircraft, no checklist detail). It is generated from the checklist files by `scripts/generate-aircraft-index.mjs` before dev, build and typecheck, and is gitignored; never edit it by hand.

Checklists are written from reference material that is not part of the repo. Work from your own references, such as the add-on's documentation.

---

## JSON schema

### Aircraft index entry (`content/aircraft-index.json`)

```json
{
  "checklistCount": 10,
  "description": "Short one-liner about the aircraft.",
  "manufacturer": "Boeing",
  "model": "747",
  "slug": "b747",
  "status": "active",
  "suffix": "-8i",
  "systemsType": "airliner"
}
```

`systemsType` values: `"piston"`, `"turboprop"`, `"airliner"`, `"business-jet"`, `"military"`.

### Checklist detail file (`content/checklists/<slug>.json`)

```json
{
  "checklist": [ ...phases ],
  "description": "Short one-liner about the aircraft.",
  "manufacturer": "Boeing",
  "model": "747",
  "slug": "b747",
  "status": "active",
  "suffix": "-8i",
  "systemsType": "airliner",
  "addon": "Microsoft",
  "flightsim": "MSFS",
  "simDepth": "High Fidelity"
}
```

### Metadata fields

| Field       | Required | Values                                                                                                                                                                                                                              |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addon`     | Yes      | Developer name. Use `"Microsoft"` for default/bundled aircraft. Third-party examples: `"PMDG"`, `"FlyByWire"`, `"Milviz"`, `"FlightFX"`, `"Headwind"`, `"iniBuilds"`, `"Working Title"`, `"Black Square"`, `"Horizon Simulations"`. |
| `flightsim` | Yes      | `"MSFS"` (currently the only supported sim).                                                                                                                                                                                        |
| `simDepth`  | Yes      | `"Standard"` (basic default aircraft), `"High Fidelity"` (detailed systems but not full study-level), `"Study Level"` (accurate to real-world procedures, deep system modeling).                                                    |

### Phase

```json
{
  "title": "Preflight",
  "id": "preflight",
  "groups": [ ...groups ]
}
```

### Group

```json
{
  "title": "Power-Up",
  "items": [ ...items ]
}
```

### Item

```json
{
  "label": "Battery",
  "action": "ON",
  "id": "battery",
  "info": "Overhead Panel. Powers the standby buses so the rest of the aircraft can wake up.",
  "tier": "quick"
}
```

### Field reference

| Field    | Required | Notes                                                            |
| -------- | -------- | ---------------------------------------------------------------- |
| `label`  | Yes      | Title Case, ≤22 chars preferred, ≤30 absolute.                   |
| `action` | Yes      | Title Case, short (1-3 words). Rendered uppercase via CSS.       |
| `id`     | Yes      | Kebab-case, unique within the phase, permanent. See [Ids](#ids). |
| `info`   | No       | Location first, then context. Almost every item should have one. |
| `tier`   | Yes      | `"quick"`, `"normal"`, or `"full"`. Always explicit in JSON.     |

### Ids

Users' ticks are saved under `<phaseId>/<itemId>`, so ids are what keeps progress on the right item. Array order is display order only; reordering, inserting or deleting items never moves anyone's ticks.

- **Format:** lowercase letters, digits and single hyphens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Scope:** phase ids are unique within the aircraft; item ids are unique within their phase. The same item id in two phases is fine (`preflight/battery`, `shutdown-secure/battery`).
- **New item:** the kebab-case of its label (`Bat & Alt Master` → `bat-alt-master`). If that id is taken in the phase, add `-2`, `-3`, … (the first free one).
- **Permanent:** editing a label does not change its id. Deleting an item retires its id; don't reuse it for a different item in that phase.
- `node scripts/validate-checklists.mjs` enforces the format and uniqueness rules.

---

## Tiers

The tier system is about user experience, not item counts.

**Quick** — bare minimum. Would the engine fail to start or the plane crash without it? If yes, quick. These items form a self-sufficient path from cold-and-dark to airborne to shutdown.

**Normal** (default) — the satisfying core flow. Lights, signs, packs, FMS programming, key system actions. If an item is enjoyable or educational, it belongs here. Normal should be manageable — not exhaustive.

**Full** — study-mode. Tests, fire alarms, AS REQUIRED conditionals, initial-state verifies, set-and-forget switches, passive CHECK items, panel-scan cleanup. If only a serious study-level simmer cares about it, it's full.

The dividing line: does skipping it break something? Quick. Does skipping it make a real pilot uncomfortable? Normal. Is it tedious completionism? Full. Push hard toward full for complex aircraft — Normal should feel good to use, not like a slog.

**Reference — what goes where:**

| Tier   | Examples                                                                                                                                                                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quick  | Battery ON, APU START, ADIRU ON, Fuel Pumps ON, FMC PROGRAM, Trim SET, engine start sequence, Flaps SET FOR T/O, takeoff roll, approach config (flaps/gear/speed brake), Fuel Control CUTOFF, Battery OFF                                                                                                                            |
| Normal | Lights (beacon, strobes, landing, NAV), signs (seat belts), Parking Brake SET, Altimeters SET QNH, Flight Director ON, Autopilot ON, ATIS/clearance, APU OFF after start, Engine Sync ON, Pressurization SET, Oxygen supply ON/OFF (for pressurized aircraft or operations above 12,500 ft)                                          |
| Full   | All AS REQUIRED conditionals, initial-state verifies (Speed Brake DOWN, Throttles IDLE, Flap Lever AGREE), passive CHECK/VERIFY items, set-and-forget switches (yaw damper, bus tie, generator control, crossfeed, trim air, recirc fans), fire tests, recall checks, individual VERIFY UP/DOWN items after a procedure already done |

---

## Phase structure

This is a **palette, not a quota.** The list below is the common set of phases and the IDs to use when a phase is present. It is not a target to hit. Do not pad a checklist to reach some number of phases, and do not split a natural flow just to make the list look complete. Use the phases the aircraft actually needs, in the order they happen, and name them from this table when they match.

Common phases and their IDs:

| Title                 | ID                    |
| --------------------- | --------------------- |
| Preflight             | `preflight`           |
| Engine Start          | `engine-start`        |
| Before Takeoff        | `before-takeoff`      |
| Takeoff               | `takeoff`             |
| After Takeoff / Climb | `after-takeoff-climb` |
| Cruise                | `cruise`              |
| Descent               | `descent`             |
| Approach              | `approach`            |
| Landing               | `landing`             |
| Shutdown & Secure     | `shutdown-secure`     |

### Merge thin phases

The frontend hides any phase that drops below `PHASE_MIN_ITEMS` (currently 4) items _after tier filtering_ — see `src/utils/checklist.ts`. A phase padded with filler to look complete simply vanishes in Quick/Normal mode, so padding buys nothing. When a split produces a phase too thin to stand on its own, merge it into a neighbor:

- Engine Start absorbs Before Start → first group "Pre-Start Flow"
- Before Takeoff absorbs Taxi → first group "Taxi Flow", then "Lineup"
- Shutdown & Secure absorbs After Landing → first group "After Landing Flow"

These three merges are the common case, but they are examples, not rules. Merge wherever the source and the aircraft make a standalone phase too thin (e.g. a light GA aircraft may fold Cruise and Descent together; a fighter may have almost nothing between climb and the visual pattern).

### Add phases the type needs

When an aircraft genuinely flies a phase the common list doesn't name, add it with a sensible kebab-case ID rather than forcing it into an ill-fitting slot. Examples:

- Airliners and military transports often warrant an **In-Range / Descent Prep** phase (`in-range`) distinct from the descent itself.
- Piston and turboprop types warrant a **Run-Up** group (inside Before Takeoff) that jets never have.
- The existing King Air checklist legitimately runs 12 phases with merged IDs (`after-start-taxi`, `run-up-before-takeoff`, `climb-cruise`). That is correct, not a defect.

### Phases that are naturally thin

Cruise and Descent legitimately have zero or few quick items — that is correct, and in Quick mode they will (correctly) disappear. Climb can stay its own phase even with a low quick count. The point is never the count: it is whether the phase reflects a real, distinct block of how this specific aircraft is flown by one simmer.

---

## Groups

Groups are the subheadings within a phase. The guideline is enough items to be worth a heading, not so many that the group becomes hard to scan. A lone item or a pair almost always belongs with a neighbor. A group that has grown very large should be split.

There's no fixed number. Use judgment. The only case where a small group is fine on its own is when it's the sole group in its phase and there's nowhere natural to merge it (e.g. "Cruise Monitoring" or "Takeoff Roll").

**Canonical group titles:**

| Phase                 | Common groups                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Preflight             | `Power-Up`, `Overhead Flow`, `Air & Fuel`, `FMC Preflight`, `MCP`, `Pedestal`, `Cockpit Setup` |
| Engine Start          | `Pre-Start Flow`, `Engine Start`, `After Start Flow`                                           |
| Before Takeoff        | `Taxi Flow`, `Run-Up` (piston/turboprop only), `Lineup`                                        |
| Takeoff               | `Takeoff Roll`                                                                                 |
| After Takeoff / Climb | `Initial Climb`, `Passing 10,000 ft`                                                           |
| Cruise                | `Cruise Monitoring`                                                                            |
| Descent               | `Descent Prep`, `Descent`                                                                      |
| Approach              | `Approach Setup`, `Configuration`                                                              |
| Landing               | `Landing`                                                                                      |
| Shutdown & Secure     | `After Landing Flow`, `Shutdown`, `Secure`, `Cabin & Avionics`                                 |

---

## Labels

Singular noun phrase, Title Case, ≤22 chars preferred, ≤30 absolute. Acronyms ALL CAPS. No embedded values, counts, or conditions — those go in `action` or `info`.

**Canonical labels:**

| System                       | Label                                                               |
| ---------------------------- | ------------------------------------------------------------------- |
| Anti-collision red light     | `Beacon`                                                            |
| White strobe lights          | `Strobes`                                                           |
| Landing lights               | `Landing Lights`                                                    |
| Taxi / turn lights           | `Taxi Lights`                                                       |
| Wing-root runway lights      | `Runway Turnoff Lights`                                             |
| Logo / tail lights           | `Logo Lights`                                                       |
| Pitot heat                   | `Pitot Heat`                                                        |
| Probe / TAT heat             | `Probe Heat`                                                        |
| Window heat                  | `Window Heat`                                                       |
| Engine bleed valves          | `Bleeds` or `Engine Bleeds`                                         |
| APU bleed                    | `APU Bleed`                                                         |
| Air conditioning packs       | `Pack 1+2` (twin) / `Pack 1+2+3` (quad)                             |
| Recirc fans                  | `Recirc Fans`                                                       |
| Trim air                     | `Trim Air`                                                          |
| Cabin pressurization         | `Pressurization`                                                    |
| External power               | `External Power`                                                    |
| APU                          | `APU`, `APU Master`, `APU Bleed`, `APU Generator`, `APU Generators` |
| Engine ignition (Airbus)     | `ENG Mode`                                                          |
| Engine ignition (Boeing/GA)  | `Ignition` or `Engine Ignition`                                     |
| Engine sync                  | `Engine Sync`                                                       |
| Thrust levers (Airbus)       | `Thrust Levers`                                                     |
| Throttles (Boeing/GA)        | `Throttles`                                                         |
| Fuel shutoff (Boeing)        | `Fuel Control`                                                      |
| Fuel mixture (GA piston)     | `Mixture`                                                           |
| Engine start (Airbus)        | `Engine Masters`                                                    |
| Engine start (Boeing)        | `Start Selector` or `Start Button`                                  |
| Hydraulic eng-driven pumps   | `Hyd EDPs`                                                          |
| Hydraulic electric pumps     | `Hyd EMPs`                                                          |
| Hydraulic demand pumps       | `Hyd Demand Pumps`                                                  |
| Speed brake / spoiler lever  | `Speed Brake`                                                       |
| Ground spoiler arming        | `Ground Spoilers`                                                   |
| Auto-brake                   | `Autobrake`                                                         |
| Brake pedal test             | `Brakes`                                                            |
| Parking brake                | `Parking Brake`                                                     |
| Flap selector                | `Flap Lever` (preflight) / `Flaps` (in motion)                      |
| Gear selector                | `Gear` or `Landing Gear`                                            |
| Pitch trim                   | `Pitch Trim` or `Stab Trim` (Boeing)                                |
| Rudder trim                  | `Rudder Trim`                                                       |
| Transponder                  | `Transponder`                                                       |
| Weather radar                | `Weather Radar`                                                     |
| TCAS                         | `TCAS` or `Radar & TCAS` (when set together)                        |
| Altimeters                   | `Altimeters`                                                        |
| Minimums (DH/DA/MDA)         | `Minimums`                                                          |
| Seat belt / no smoking signs | `Seat Belts` or `Passenger Signs`                                   |
| Autopilot                    | `Autopilot`                                                         |
| Autothrottle / autothrust    | `Autothrust`                                                        |
| MCP speed/hdg/alt bugs       | `MCP Bugs` — collapse to one item                                   |
| FMC/MCDU programming         | `FMC Preflight` or `MCDU Preflight` — collapse to one item          |

**Collapsing FMC pages:** never explode IDENT / POS INIT / RTE / DEP-ARR / PERF INIT / THRUST LIM / TAKEOFF REF into separate items. Collapse to one:

```
label:  FMC Preflight
action: PROGRAM
info:   Walk through the CDU pages in order: IDENT, POS INIT, RTE, DEP/ARR,
        PERF INIT, THRUST LIM, TAKEOFF REF. Hit EXEC after each page.
```

**Collapsing MCP bugs:** speed, heading, and altitude bugs are set together — one item:

```
label:  MCP Bugs
action: SET
info:   Speed bug at V2 + 10, heading bug at the runway, altitude at initial
        cleared level.
```

**Collapsing EFB workflows:** EFB interactions (SimBrief import, fuel/payload, pushback, ground services) are NOT individual checklist items. Mention the EFB path in the relevant item's info bubble. The FMS Preflight item can say "import via EFB if desired" in its info — but the EFB itself never gets its own line.

---

## Actions

Short, Title Case vocabulary. No semicolons or comma-separated lists — if you used one, you wrote two items and need to split them. No conditions or explanations — those go in `info`.

Keep actions short (1-3 words). They should be instantly scannable. Use the existing vocabulary below as a starting point, but don't treat it as an exhaustive list — use your judgment for actions that don't fit neatly into a single word.

**Common vocabulary:**

| Category    | Values                                                                     |
| ----------- | -------------------------------------------------------------------------- |
| State       | On, Off, Auto, Norm, Stby, Open, Closed                                    |
| Position    | Up, Down, Idle, Cutoff, Fwd, Retracted, Pushed In, Pulled Out              |
| Procedure   | Set, Check, Verify, Test, Obtain, Complete, Program, Press, Pull, Released |
| Arming      | Arm, Armed                                                                 |
| Mode        | Nav, Start, Run, RTO                                                       |
| Thrust      | Flex, TOGA                                                                 |
| Transponder | TA/RA, Stby                                                                |
| Altimeter   | Std, Set QNH                                                               |
| Conditional | As Required, As Briefed                                                    |
| Numeric     | Flaps 5, 250 KIAS, At Vr, Gear Up                                          |

Don't echo the label: `Beacon: On` not `Beacon: Beacon On`.

---

## Info bubbles

Almost every item should have an info bubble. The bar for including one is low — the bar for leaving one empty is high.

### Structure

1. **Start with location.** The first thing in every info bubble is where the item lives physically in the cockpit. "Overhead Panel." "Center Pedestal." "Glareshield." "Left side panel." This is always present.

2. **Add context if it exists.** After the location, add plain-English context that helps a simmer understand what this item does or why it matters. Fun facts, operational tidbits, things that prevent mistakes. Write in plain language with no tone, no emotion, no wit. No AI-isms. No creative writing. Just information.

3. **Include expected annunciator states for engine start and system tests.** When an item involves starting something or testing a system, state what the user should see: what lights illuminate, what CAS messages appear, what values to monitor. This prevents the common problem where the user doesn't know if the procedure actually worked.

4. **Don't force it.** For very simple, self-explanatory items where you genuinely cannot think of anything worth saying beyond the location, it's okay to stop after the location. "Overhead Panel." is a valid complete info bubble. But most items have something worth saying — don't be lazy about it.

### Consistency for universal items

For items that appear identically across many aircraft (Parking Brake, Beacon, NAV Lights), prefer a consistent standard wording. Don't invent unique phrasing for each aircraft when the item is genuinely the same everywhere. Example: Parking Brake info is always `"[Location]. Prevents the aircraft from rolling during prep."` — except where the aircraft has something genuinely worth noting (brake accumulator pressure check, specific handle mechanism).

### Style

- Plain English. No jargon. No formal pilot vocabulary. No FCOM prose.
- No tone, emotion, or personality. Write like a dry reference card.
- No AI-isms (avoid "ensures", "facilitates", "enhances", "it's important to note").
- Short sentences. Get to the point.

### Examples

**Good:**

> "Overhead Panel. The flashing red anti-collision light on top and bottom of the fuselage. Required before any engine start so ground crew know the engines are about to spool."

> "Center Pedestal. Damps out dutch roll, the wallowing yaw-roll oscillation swept-wing jets are prone to. Set and forget."

> "Center Pedestal. Move to IDLE when N2 reaches approximately 10%. Introducing fuel too early causes a hot start."

> "Left Panel. Activates the auxiliary fuel boost pump. AUX FUEL PUMP ON light should illuminate, confirming the pump is running."

> "Glareshield."

**Bad:**

> "The parking brake holds the aircraft stationary." — no location, restates the obvious
> "Expect THR REF (or HOLD) | TOGA | TOGA / LNAV | VNAV armed." — FCOM notation
> "INIT REF → APPROACH: enter VREF, select FLAPS VREF CONFIG." — unintelligible to a sim pilot
> "This switch ensures proper electrical distribution across the aircraft's systems." — AI slop

---

## What to skip

Always omit regardless of source:

- Walkaround / exterior inspection items
- Emergency and abnormal procedures
- Go-around procedures (see Issue #62 for future consideration)
- Speed / weight / flap reference tables
- Conditional procedures (icing, cold weather, grass runways)
- Items not modeled in the sim
- Addon-specific setup pages (PMDG OPTIONS, Newsky tracker, replay tools)
- EFB workflows as standalone items (fold into info bubbles instead)

---

## Corrections policy

The source material wins for addon-specific values — power settings, fuel quantities, speed targets, operational quirks, and system-specific procedures. These checklists are for specific sim addons, not real aircraft. The source was written by someone who tested it in the sim.

Apply real-world corrections ONLY for the specific cases below. Note any corrections made.

Corrections list:

- **Engine start order (Boeing twin):** engine 2 (right) first, then 1 — even if source says "L or R".
- **Engine start order (Boeing quad):** 4-2-3-1 cross-cockpit.
- **Transponder at lineup:** TA/RA, not TA-only — RA logic is needed in flight.
- **Altimeters:** STD at transition altitude on climb; QNH passing transition level on descent.

For everything else — if the source says a specific value, use it. Don't "correct" fuel thresholds, RPM targets, or power settings to what a real-world POH says. The sim may model things differently.

---

## Working rules

- Never mention the source material in any user-facing text: no author names, no "the source", no "based on X's checklist", in info bubbles, labels, actions or descriptions.
- Items must come from source material. Never invent items that don't exist in the source. But if the source has items that were missed in the initial JSON conversion — add them. The rule is about provenance (every item must be traceable to a source), not about freezing the first draft.
- When multiple source files exist for one aircraft, produce ONE generic checklist. Addon-specific differences go in info bubbles only. No addon names in labels or actions.
- Normal must be manageable. Tedious panel-scanning belongs in full.
- Read all source files before writing a single item.
- Three views, one tree: `"quick"` shows in all views. `"normal"` shows in Normal + Full. `"full"` shows in Full only.
- No emojis in data or commit messages.
