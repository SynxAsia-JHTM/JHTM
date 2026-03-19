# Admin Dashboard Module — Page Design Spec (Desktop-first)

## Global styles (all admin pages)
- Theme: light, high-contrast admin UI.
- Tokens:
  - Background: #F6F7FB; Surface: #FFFFFF; Border: #E6E8F0
  - Primary: #2563EB; Primary hover: #1D4ED8
  - Text: #0F172A; Muted: #64748B; Danger: #DC2626
  - Radius: 10px cards, 8px inputs/buttons; Shadow: subtle (0 2px 10px rgba(15,23,42,0.06))
- Typography: 14px base, 12px secondary; headings 18/20/24.
- Buttons: primary/secondary/ghost + disabled; destructive confirmation requires modal.
- Tables: sticky header, row hover highlight, compact density toggle.

## Layout system (all admin pages)
- Primary layout: CSS Grid.
  - Desktop grid: `240px (sidebar) / 1fr (content)`.
  - Content area: max-width 1280px, centered, 24px padding.
- Responsive behavior:
  - <1024px: sidebar collapses to icon rail; content padding 16px.
  - <768px: sidebar becomes off-canvas drawer; tables switch to stacked rows.

## Shared components
- AdminShell
  - Left Sidebar: app logo, nav sections, role-aware nav items, collapse toggle.
  - Top Bar: page title, global search (optional), current admin user menu (profile/sign out).
  - Breadcrumbs: shown on deeper routes (/users/:id, /data/:entity/:id).
- Feedback: toast notifications; inline form errors; empty-state cards.
- Access gates:
  - Route guard: redirect unauthenticated to /admin/login.
  - Permission guard: show “Not authorized” panel + link back to dashboard.

---

## Page: Admin Sign-in
### Meta Information
- Title: “Admin Sign-in”
- Description: “Sign in to administer the system.”
- Open Graph: title + description, no indexing recommended.

### Page Structure
- Centered card (max 420px) on neutral background.

### Sections & Components
- Brand header: logo + “Admin Console”.
- Sign-in form:
  - Email input, Password input, “Sign in” primary button.
  - “Forgot password?” link opens recovery flow.
- Recovery flow (same page): email entry → submit → confirmation state.
- Error states: invalid credentials, disabled account, insufficient role.

---

## Page: Admin Dashboard Home (/admin)
### Meta Information
- Title: “Admin Dashboard”
- Description: “Overview of system activity and administrative actions.”

### Page Structure
- AdminShell + stacked sections.

### Sections & Components
1. KPI row (card grid, 3–4 cards)
   - Metrics placeholders: “Active users”, “Pending items”, “Errors”, “Last import”.
   - Each card supports click-through to relevant page/filter.
2. Quick actions (button row)
   - “Invite admin”, “Create record”, “View audit logs” (permission-gated).
3. Recent activity
   - Table/list of latest audit events: actor, action, entity, timestamp.
   - “View all” link navigates to /admin/audit with prefilled filters.

---

## Page: User & Role Management (/admin/users, /admin/roles)
### Meta Information
- Title: “User & Role Management”
- Description: “Manage administrators, roles, and permissions.”

### Page Structure
- Two-level navigation: sidebar item + local tabs (“Users”, “Roles”).

### Sections & Components (Users)
- Toolbar: search, status filter (active/disabled), role filter.
- Users table:
  - Columns: email, display name, roles, status, last active, actions.
  - Row actions: “View”, “Assign role”, “Disable/Enable” (destructive modal).
- User detail drawer/modal:
  - Role assignment multi-select; save/cancel.
  - Guardrails: hide/disable super-admin changes for non-super.

### Sections & Components (Roles)
- Roles list: left column list; right column editor.
- Role editor:
  - Name, description.
  - Permissions checklist grouped by domain.
  - Save button; validation for unique name.

---

## Page: Data Management (/admin/data, /admin/data/:entity/:id)
### Meta Information
- Title: “Data Management”
- Description: “Search, edit, import, and export managed records.”

### Page Structure
- Entity picker → record table → editor.

### Sections & Components
- Entity directory (top): dropdown or cards for available entities.
- Record table:
  - Search, filters, column visibility, pagination.
  - Primary actions: “Create”, “Import CSV”, “Export”.
- Record editor page:
  - Form sections in cards; sticky footer with Save/Cancel.
  - Shows “Last updated at/by” (read-only).
- Bulk import modal:
  - Upload area, template download link, validation summary, error CSV download.

---

## Page: Settings & Audit Logs (/admin/settings, /admin/audit)
### Meta Information
- Title: “Settings & Audit Logs”
- Description: “Configure system behavior and review administrative actions.”

### Page Structure
- Local tabs (“Settings”, “Audit Logs”).

### Sections & Components (Settings)
- Settings table/list:
  - Key, value preview, last updated.
  - Edit opens side panel with JSON editor (or structured form if known keys).
  - Save requires confirmation; writes an audit event.

### Sections & Components (Audit Logs)
- Filter bar: date range, actor, action, entity type, free-text search.
- Audit log table:
  - Columns: timestamp, actor, action, entity, details.
  - Row expands to show JSON metadata.
- Export: “Export CSV” uses current filters.
