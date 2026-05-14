# RotationPlanView Component

This file documents the separate `RotationPlanView` component.

- The component is defined in `components/RotationPlanView.js`.
- It exports a Vue component object with a `name` and a template string.
- It is associated with the `Rotation Plan` menu item in the sidebar.
- The app displays this component when `setView('RotationPlanView')` is called.
- Styling is shared from `styles.css`, so the component file contains only markup.

Reproduce:
1. Create `components/RotationPlanView.js`.
2. Export default a Vue component object.
3. Import and register it in `app.js`.
4. Add `Rotation Plan` button in the sidebar under `Operations`.
