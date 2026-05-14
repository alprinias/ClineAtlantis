# Prompt: Recreate nikiMockRotation24.html — Maritime ERP Fleet Rotation Gantt

## Context

Single-file Vue 3 + Tailwind CSS (CDN) mockup for a maritime manning agency ERP. No build step. All logic in one `.html` file. The file is called `nikiMockRotation24.html`.

\---

## Tech stack

* **Vue 3** via CDN (`createApp`)
* **Tailwind CSS** via CDN
* All helper functions and `allVessels` data defined as `const` globals above the `createApp({})` call
* Global date helpers: `TODAY = new Date()`, `d(s)`, `addM(dt, n)`, `daysB(a, b)`, `isoDate(dt)`, `fmtShort(s)`, `shortName(full)`

\---

## Layout

```
┌─────────────────────────────────────────────────┐
│  Header: dark slate, "MARITIMEERP Fleet Rotation — All Vessels"
│  Links: ← Ops Module | Per-Vessel View
├─────────────────────────────────────────────────┤
│  Filter bar (one row):
│    Client dropdown → Vessel dropdown (disabled until client picked)
│    Rank dropdown
│    RF Type segmented buttons: All | Any RF | RFS | RFR | RFE | RFP | RFX
│    Window toggle: 6 / 12 / 18 mo
│    Include Ratings checkbox
│    From date + Reset button
├─────────────────────────────────────────────────┤
│  Sticky month ruler (top)
│  Scrollable chart body:
│    For each vessel → vessel header row + rank rows + RFE rows
└─────────────────────────────────────────────────┘
```

\---

## Chart structure

### Vessel header row

* Dark slate background
* Shows: Client · Vessel name · vessel type · **+ Embark** button (opens Embark modal)

### Rank rows (62px tall)

* Left label column (240px, sticky): rank name only
* Chart zone: month gridlines + today line (white) + RFA horizon line (amber, today+2mo) + bars

### RFE rows (50px, `bg-blue-50`)

* Shown below the vessel's rank rows
* Label: rank + RFE number + status badge
* Chart zone: future-service bar (sky blue `#93b8d8`)
* Clicking an **active** RFE opens a two-pane modal (see below)

\---

## Vertical bar zones within a 62px rank row

```
top: 3%,  height: 22%,  z-index: 4  → RFS / RFR sign-off thin bar  (TOP)
top: 28%, height: 44%,  z-index: 2  → Onboard service bar           (MIDDLE)
top: 76%, height: 22%,  z-index: 3  → RFE / RFR embark / RFX / RFP (BOTTOM)
```

\---

## CSS classes

### Service bars

* `.bar-onboard` — `#5b7fbd`, middle zone
* `.bar-future-service` — `#93b8d8`, middle zone (RFE rows)

### Sign-off adjustment overlays (z-index 5, on top of onboard bar)

* `.bar-signoff-early` — red diagonal hatch (early sign-off)
* `.bar-signoff-late` — pale green extension (late sign-off)

### RFA thin bars (top or bottom zone)

Position classes: `.rfa-top` / `.rfa-bottom`

Type → colour:

* `.rfa-rfs` — Rose `#fda4af` / `#f43f5e`
* `.rfa-rfr` — Amber `#fcd34d` / `#f59e0b`
* `.rfa-rfe` — Sky `#7dd3fc` / `#0ea5e9`
* `.rfa-rfp` — Purple `#d8b4fe` / `#a855f7`
* `.rfa-rfx` — Teal `#5eead4` / `#14b8a6`

Status → texture:

* `.rfa-active` — solid fill
* `.rfa-approval` — diagonal stripes
* `.rfa-preparation` — dot grid
* `.rfa-completed` — desaturated

\---

## Reactive state (`data()`)

```js
viewMonths: 12, dayWidth: 3.0, rankColWidth: 240,
ganttStartStr: isoDate(addM(TODAY, -3)),
includeRatings: false,
filterClient: '', filterVessel: '', filterRank: '', filterRfType: '',
ctxMenu: { visible, x, y, vessel, row },
modal:   { visible, action, vessel, row },
extendForm:  { newSignoff: '' },
replaceForm: { replacementDate: '', port: '' },
promoteForm: { newRank: '', promotionDate: '' },
embarkForm:  { rank, embarkDate, port, contractMonths: 6, contractVariation: 1 },
signoffForm: { signoffDate: '', port: '' },
rfaModal: { visible, kind, data, row, vessel, editStatus, confirmDelete,
            rfcIssued, selectedCandidates: \[], availFilter, showCompare, showProposal },
todayStr: isoDate(TODAY),
rfeRows: \[ /\* standalone RFE row objects \*/ ],
allSeafarers: \[ /\* 12+ seafarers with rank, category, availDate, cesStcw, cesEnglish, services\[] \*/ ],
```

\---

## Row data shape

### Rank row

```js
{
  rank, isRating,
  onboard: { name, shortName, embark, signoff, contract },
  rfa: null | { rfaNo, type('Extend'|'Replace'|'Promote'), status, rfaStart, rfaEnd, newRank?, proposed:\[], confirmedSeafarer },
  rfs: null | { rfaNo, dateCreated, signoffDate, port, status },
  rfr\_rfe: null | { rfaNo, dateCreated, embarkDate, port, status }
}
```

### rfeRow object

```js
{ vesselId, rfaNo, rank, dateCreated, embarkDate, port,
  contractMonths, contractVariation, serviceEnd, status }
```

\---

## RF ID scheme

* `RFS-xxxx` — Request For Sign-off
* `RFR-xxxx` — Request For Replacement
* `RFE-xxxx` — Request For Embarkation (standalone)
* `RFP-xxxx` — Request For Promotion
* `RFX-xxxx` — Request For Extension

\---

## Key computed properties

* `ganttStart/End/TotalDays`, `todayOffset`, `rfaHorizonOffset`, `ganttMonths`
* `allClients`, `clientVessels`, `allRanks`
* `rankHierarchy` — ordered array of ranks (OS → AB → Bosun → 3/O → 3/E → 2/O → 2/E → C/O → C/E → Captain)
* `higherRanks` — ranks above `modal.row.rank` (for Promote dropdown)
* `rfaModalTypeName`, `rfaModalHeaderClass`, `rfaStatusBadgeClass`, `rfaStatusOptions`
* `allFlatRows` — applies all filters at row level (not bar level), groups vessels with their ranks and rfeRows
* `rfaModalAvailDefault`, `candidateCategories`, `getRfeCandidates(category)`

### `rowHasRfType(row, ft)` logic

* `any` → `row.rfs || row.rfr\_rfe || (row.rfa \&\& row.rfa.type \&\& rfaStart <= TODAY)`
* `rfs` → `row.rfs \&\& !row.rfr\_rfe`
* `rfr` → `row.rfr\_rfe` (not old-style rfa.type='Replace')
* `rfx` → `rfaActive \&\& rfa.type === 'Extend'`
* `rfp` → `rfaActive \&\& rfa.type === 'Promote'`

\---

## RF Type filter behaviour

* **All** — show all rows
* **Any RF** — show only rows with a *visible* typed RF (rfaStart ≤ TODAY, or rfs/rfr\_rfe present)
* **RFS/RFR/RFE/RFP/RFX** — show only rows matching that specific type
* Filtering is **row-level** (rows hidden/shown), not bar-level
* RFE rows shown only when filter is `rfe`, `any`, or `''`

\---

## Modals

### Action modal (opened from context menu or + Embark button)

Triggered by `openModal(action, vessel, row)`. Actions:

**Embark (RFE)** — single column form:

* Vessel (RO), Rank dropdown, Date Created (RO=today), Est. Embarkation Date, Embarkation Port
* Contract Length stepper (1–24 mo), ± Variation stepper (0–6)
* Preview panel (shown when rank + date set)
* On submit → pushes new entry to `rfeRows` with `status:'active'`

**Extend (RFX)**:

* Vessel+Rank (RO), Seafarer (RO), Embarkation (RO), New Est. Sign-off (datepicker, min=current signoff)
* Preview panel
* On submit → sets `row.rfa = { rfaNo:'RFX-xxxx', type:'Extend', ... }`

**Replace (RFR)**:

* Vessel+Rank (RO), Current Seafarer (RO), Date Created (RO), Est. Replacement Date, Port
* Preview: dual RFS+RFE panel
* On submit → creates `row.rfs` (RFS-xxxx), `row.rfr\_rfe` (RFE-xxxx), **and** pushes a standalone rfeRow with `status:'active'`

**Sign Off (RFS)**:

* Vessel+Rank (RO), Seafarer (RO), Date Created (RO), Est. Sign-off Date (pre-filled), Port
* On submit → sets `row.rfs = { rfaNo:'RFS-xxxx', ... }`

**Promote (RFP)**:

* Vessel (RO), Current Rank (RO), Seafarer (RO), Embarkation Date (RO), Est. Sign-off (RO)
* New Rank dropdown (only ranks above current via `higherRanks`)
* Date of Promotion (datepicker, min=today)
* Preview: rank transition arrow (Current → New) + effective date
* On submit → sets `row.rfa = { rfaNo:'RFP-xxxx', type:'Promote', ... }`

### RFA detail modal (click any RF bar)

* Single-pane, colour-coded header by RF type
* Shows vessel, rank, current seafarer, dates (varies by kind), port
* Status editor: 4 buttons (Active / Approval / Preparation / Completed) → Save
* Delete with inline confirmation
* **Exception**: active RFE kind → two-pane layout (see below)

### Active RFE detail modal (two-pane, 960px)

Opened by clicking an RFE bar with `status:'active'`.

**Left pane (288px)**:

* Vessel (RO), Rank (RO), Date Created, Est. Embarkation, Port, Contract
* Status editor
* Delete confirmation
* Footer: "Issue RFC to Recruitment" button (toggles to confirmed state) + Cancel/Save/Delete

**Right pane (flex)**:

* Header: rank + vessel name, Compare button (needs ≥2 selected), Propose button (needs ≥1 selected)
* Availability date filter (from → to embark date)
* Candidate list grouped by category (Client Ex-Crew / Other Ex-Crew / New Candidates), colour-coded left border
* Each card: checkbox, name, nationality, availability date, Age/BMI/CES STCW/CES Eng grid, service history (At Rank + As Officer)
* `getRfeCandidates(category)` filters `allSeafarers` by rank (from `rfaModal.data.rank` since row is null for standalone RFEs), category, and availability window

**Compare modal** (z-10100): full comparison table of selected candidates across all criteria.

**Proposal modal** (z-10100): draft email to principal with candidate list, attached documents.

### Context menu (right-click on onboard bar)

* Shows seafarer name, rank · vessel, embark/signoff/contract dates
* "Issue RFA as" section: Extend, Replace, Promote, Sign Off buttons
* `openModal(action, vessel, row)`

\---

## Sample data

**6 vessels** across 4 clients:

* Global Shipping Ltd: MV Sea Star (Oil Tanker, v1), MV Atlantic Pride (Bulk Carrier, v2)
* Blue Water Corp: Oceanic Express (Container, v3)
* Alpha Tankers: Alpha Prime (Chemical Tanker, v4), Alpha Horizon (Oil Tanker, v5)
* Pacific Logistics: Pacific Trader (RoRo, v6)

**Named typed RFAs** in sample data (dates \~2 months ahead of today):

* `RFX-1074`: type:'Extend', status:'active' (Captain, v3)
* `RFR-1051`: type:'Replace', status:'approval' (Chief Officer, v3)
* `RFP-1090`: type:'Promote', status:'active' (Bosun, v3)

**3 seed rfeRows** (all `status:'active'`):

* `RFE-2011`: Chief Officer, MV Sea Star (v1), embark \~2 months from now
* `RFE-2019`: Captain, MV Atlantic Pride (v2), embark \~3 months from now
* `RFE-2024`: Second Engineer, Alpha Prime (v4), embark \~4 months from now

**12+ allSeafarers** with ranks matching the seed rfeRows (Chief Officer × 3, Second Engineer × 2+, Captain × 4, plus Second Officer, Chief Engineer × 2, Bosun), each with `category` (Client Ex-Crew / Other Ex-Crew / New Candidates), `availDate`, `cesStcw`, `cesEnglish`, `nationality`, `services\[]` (At Rank, As Officer, Other).

**All dates** are set relative to today (file loaded date) via `TODAY = new Date()`. The Gantt window defaults to `TODAY - 3 months` to `TODAY + 9 months` (12mo window). The two vertical lines are:

* White line: today (`todayOffset`)
* Amber line: today + 2 months (`rfaHorizonOffset`)

\---

## Important implementation rules

1. **JS validation after every edit**: `new Function('Vue', script + '; return true;')({createApp:()=>({mount:()=>{}})})` — must pass before shipping
2. **Div balance check**: `<div>` count must equal `</div>` count
3. `openModal` and `submitModal` are fragile — every new `if` block risks dropping the opening line of the adjacent block. Always validate after changes.
4. Inner `v-if` inside a `v-if/v-else-if` chain breaks Vue's template compiler — use `v-show` for conditional visibility inside a branch.
5. `rfaVisible(rfa)` = `TODAY >= d(rfa.rfaStart)` — bars only render when their start date has passed.
6. `rowHasRfType` must check `rfaVisible` for `rfa.type`-based rows to avoid showing rows whose bars aren't yet visible.
7. Standalone RFE rows are opened with `openRfaModal(rfe, 'rfe', null, vessel)` — `row` is null. All code reading `rfaModal.row.rank` must fall back to `rfaModal.data.rank`.
8. Replace (RFR) creates three things simultaneously: `row.rfs` + `row.rfr\_rfe` + a new standalone rfeRow pushed to `rfeRows`.

