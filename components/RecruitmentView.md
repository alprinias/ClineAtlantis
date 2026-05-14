# RecruitmentView Component

This file documents the separate `RecruitmentView` component.

- The component is defined in `components/RecruitmentView.js`.
- It exports a Vue component object with a `name` and a template string.
- Global styling is shared from `styles.css`.
- Clicking the `Recruitment` sidebar button sets `currentView` to `RecruitmentView`.
- The app renders the component in `index.html` using `<component :is="currentViewComponent"></component>`.

Reproduce:
1. Create `components/RecruitmentView.js`.
2. Export a Vue component object.
3. Import it in `app.js`.
4. Add a sidebar button for `RecruitmentView`.
