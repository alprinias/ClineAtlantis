# Crossworld Marine Mock SPA Application

This project is a Vue 3 Single Page Application with separate component files for each menu view.

## Component files

- `components/AdminView.js`
- `components/RecruitmentView.js`
- `components/OperationsView.js`
- `components/RotationPlanView.js`

## Documentation files

- `components/AdminView.md`
- `components/RecruitmentView.md`
- `components/OperationsView.md`
- `components/RotationPlanView.md`

## How it works

1. `index.html` defines the application shell with a fixed header, left sidebar, and scrollable right content pane.
2. `styles.css` contains all shared styling for the entire app.
3. `app.js` imports each component module and registers them with Vue.
4. The sidebar buttons call `setView(viewName)` to update `currentView`.
5. The content area uses Vue's dynamic component syntax:
   ```html
   <component v-if="currentViewComponent" :is="currentViewComponent"></component>
   ```
6. Each component is kept in its own file so it can be edited independently.

## Future iteration

- Add new component files for additional menu items.
- Keep styling in `styles.css` so components remain markup-only.
- Use the `.md` documentation files to describe the purpose and reproduction steps for each component.
