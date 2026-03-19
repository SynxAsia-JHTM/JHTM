# CMS UI Structure — Page Design Spec (Desktop-first)

## Global Styles (applies to all pages)
- Layout system: Flexbox for shells; CSS Grid for dashboard card layouts.
- Breakpoints: mobile-first utilities, but design decisions are desktop-first; primary breakpoint is `lg` for sidebars.
- Tokens (Tailwind-aligned):
  - Background: `bg-slate-50`, surfaces: `bg-white`, borders: `border-slate-200`
  - Primary: blue (`bg-blue-600`, `text-blue-700`, `bg-blue-50` active states)
  - Typography: headings bold; body text slate; 11–16px UI labels; 18–24px page headings.
  - Buttons: rounded `rounded-xl/2xl`; focus rings `focus-visible:ring-2` with blue.
- Shared interaction states: active nav item uses `bg-blue-50 text-blue-700`; hover uses `hover:bg-slate-50`.

## Shared UI Components (must be reused)
- Auth guards: `ProtectedRoute` (admin), `MemberPortalRoute` (portal).
- Layouts: `AppShell` (admin), `PortalLayout` (member).
- Navigation: `Sidebar` (admin), portal nav (desktop sidebar + mobile bottom tabs).
- Utilities: `Modal`, `ToastProvider` + `useToast`.
- Common patterns: Page header (title + actions), Card, Table, Form row, Empty state.

---

## Page: Public Entry & Auth
### Meta Information
- Title patterns:
  - Home: “JHTM Church Management”
  - Login/Register: “Sign in / Create account”
  - QR Check-in: “Check-in”
- OG: title mirrors page title; description concise.

### Page Structure
- Stacked sections centered; max width ~640px for auth; full width for home hero.

### Sections & Components
- Home
  - Primary CTA buttons: “Admin Dashboard” (→ /dashboard), “Member Portal” (→ /portal)
  - Secondary links: Login (/login), Register (/register)
- Login/Register
  - Form card: email/password (+ any existing fields)
  - Submit button + inline error area + link to the other auth route
- QR Check-in
  - Token-aware content panel + confirm action + success/failure toast

---

## Page Group: Admin Dashboard (CMS)
### Layout
- `AppShell` shell:
  - Left sidebar (`Sidebar`) collapsible; desktop width ~256px, collapsed width ~64px.
  - Sticky top bar: Back-to-home link, search field (UI-only), notifications icon (UI-only), user badge, logout.
  - Main content: `<Outlet />` container, max width `max-w-7xl`.

### Admin Sidebar (information architecture)
- Items (exact labels/paths): Dashboard (/dashboard), Members (/members), Events (/events), Attendance (/attendance), About (/about).
- Behavior: active state highlight; on mobile, clicking an item closes sidebar overlay.

### Page-level content pattern (all admin modules)
- Header row: page title + primary action (if any), optional filter/search row.
- Content: cards/tables consistent spacing (`p-4 sm:p-6 lg:p-8`).

---

## Page Group: Member Portal
### Layout
- `PortalLayout` shell:
  - Desktop: left sidebar navigation.
  - Mobile: top header + **bottom tab bar**.

### Member Bottom Tabs (mobile)
- Position: fixed bottom, safe-area padding, `bg-white` with top border.
- Tabs map 1:1 to existing portal routes (no route changes):
  - Dashboard (/portal)
  - Profile (/portal/profile)
  - Check-in (/portal/checkin)
  - Attendance (/portal/attendance)
  - Prayers (/portal/prayers)
  - Events (/portal/events)
- Active state: icon + label in blue; inactive slate.

### Portal Pages (content rules)
- Portal Dashboard (/portal): stacked cards + quick actions grid.
- Profile (/portal/profile): editable form sections; save action; toast on success.
- Check-in (/portal/checkin): primary check-in action and last check-in status.
- Attendance (/portal/attendance): list/table of attendance history with empty state.
- Prayers (/portal/prayers): submit request form + history list.
- Events (/portal/events): event list with details drawer/modal.
