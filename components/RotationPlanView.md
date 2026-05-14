# RotationPlanView Component

This component implements the Rotation Plan view using the new modular Vue structure and shares styling from `styles.css`.

## What was extracted and reused

- The Rotation Plan design was derived from `components/nikiMockRotation24.html` and its prompt file (`nikiMockRotation24_prompt.md`).
- The layout follows the same structure: header, one-row filters, a sticky month ruler, and a scrollable Gantt-style chart body.
- The component uses the same shared CSS strategy as the rest of the app.
- Date helpers, chart rules, and RF type conventions are borrowed from the original mockup.

## Component details

- File: `components/RotationPlanView.js`
- Template: contains the Rotation Plan header, filter row, timeline axis, vessel headers, rank rows, and RFE rows.
- Styling: class names are defined in `styles.css`, not inside the component.
- Data: sample vessel/row data is defined inside the component for the mock view.
- Computed state: `ganttStart`, `ganttEnd`, `todayOffset`, `rfaHorizonOffset`, `ganttMonths`, `allClients`, `clientVessels`, `allRanks`, `filteredVessels`.
- Methods: `resetGanttStart()`, `clampDays()`, `barStyle()`, `rowHasRfType()`.

## Reproduction notes

1. Keep shared CSS in `styles.css` so all Rotation Plan bars and layout visuals remain consistent.
2. Keep each menu view as a dedicated component file so it can be edited separately.
3. Use the docs in `components/nikiMockRotation24_prompt.md` as the source of truth for chart behaviour and visual rules.
4. If new rows are added, preserve the rank row shape and the `barStyle(start, end)` calculation.
