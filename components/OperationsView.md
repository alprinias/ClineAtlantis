# OperationsView Component

This file documents the separate `OperationsView` component.

- The component is defined in `components/OperationsView.js`.
- It exports a Vue component object with a `name` and an HTML template.
- Styling is controlled by `styles.css` and applied globally in the app.
- Clicking the `Operations` sidebar button sets `currentView` to `OperationsView`.
- The dynamic component renderer in `index.html` mounts it.

Reproduce:
1. Create `components/OperationsView.js`.
2. Export a Vue component object.
3. Import the component into `app.js`.
4. Add a menu button that calls `setView('OperationsView')`.
