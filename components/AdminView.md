# AdminView Component

This file documents the separate `AdminView` component.

- The component is defined in `components/AdminView.js`.
- It exports a Vue component object with a template string only.
- Styling is defined globally in `styles.css` and shared by all components.
- When the user clicks the `Admin` button in the sidebar, the app sets `currentView` to `AdminView`.
- The app renders this component via the dynamic `<component :is="currentViewComponent">` element in `index.html`.

Reproduce:
1. Create `components/AdminView.js`.
2. Export default a Vue component object with a `name` and `template`.
3. Import and register it in `app.js`.
4. Add a sidebar button that calls `setView('AdminView')`.
