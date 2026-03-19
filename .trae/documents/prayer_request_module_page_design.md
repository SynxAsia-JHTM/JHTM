# Page Design — Prayer Request Module (Desktop-first)

## Global Styles
- Layout system: CSS Grid for page scaffolding + Flexbox for component internals.
- Breakpoints: Desktop ≥ 1024px (primary), Tablet 768–1023px (stack columns), Mobile ≤ 767px (single column, full-width actions).
- Tokens
  - Background: #0B1220 (app shell) and #0F1A2E (cards)
  - Text: #E6EEF8 (primary), #A7B4C6 (secondary)
  - Accent: #6EA8FE (primary action), #22C55E (success), #EF4444 (danger)
  - Radius: 12px cards, 10px inputs/buttons
  - Typography: 14/16 body, 20/24 section headers, 28/32 page title
- Buttons
  - Primary: filled accent, hover darken 6%, disabled 40% opacity
  - Secondary: outline 1px #2B3B55
- Links: underline on hover; keep within content width.

## Meta Information (defaults)
- Title: “Prayer Requests” / “Prayer Request Details” / “Admin Prayer Requests”
- Description: short, non-sensitive summary (avoid exposing private request content in meta tags).
- Open Graph: `og:title`, `og:description`, `og:type=website`.

---

## Page: Prayer Requests
### Page Structure
- Two-column dashboard on desktop: left = main list; right = create + my submissions.
- Tablet/mobile: stacked sections in order: create → list → my submissions.

### Sections & Components
1. Top App Bar (shared)
   - Left: app name + primary nav.
   - Right: account menu (sign-in state, role badge if admin).
2. Header Row
   - Page title “Prayer Requests”.
   - Quick actions: “New request” (opens Create panel / modal).
3. Filters Row
   - Search input (keyword).
   - Visibility filter (Public / Members / All (members only)).
   - Status filter is hidden for regular members; admins get “Pending/Approved/Rejected/Archived”.
4. Request List (Card List)
   - Card fields: title, created date, visibility badge, snippet (1–2 lines).
   - Author display rule: if `is_anonymous`, show “Anonymous”; else show display name (if available).
   - Click → details page.
   - Empty state: guidance text + “New request”.
5. Create Request Panel (Card)
   - Fields: Title (required), Details textarea (required), “Post anonymously” checkbox, Visibility select.
   - Submit button: creates request and returns to list with a “Submitted (pending approval)” toast.
6. My Submissions (Card)
   - Table/list of user’s requests: title, created date, status badge.
   - If rejected: show “View reason” expandable row (only for owner).

---

## Page: Prayer Request Details
### Page Structure
- Single main column (max width ~840px) centered; optional right sidebar for metadata on desktop.

### Sections & Components
1. Breadcrumbs
   - “Prayer Requests / Details”.
2. Request Header
   - Title.
   - Badges: Visibility + Status (status visible to owner/admin; hidden for other members).
3. Request Body
   - Render plain text with safe formatting (line breaks preserved).
4. Metadata Panel
   - Created date.
   - Author label: Anonymous vs name.
5. Owner Controls (only if owner and status=pending)
   - “Edit” opens inline form for title/body/flags.
6. Admin Controls (only admin)
   - Approve, Reject (requires reason input), Archive.
   - “Edit before approve” inline fields.

---

## Page: Admin Moderation
### Page Structure
- Admin table-centric layout: filters on top, table in the middle, details drawer on the right.

### Sections & Components
1. Admin Header
   - Title “Admin Prayer Requests”.
   - Tabs: Pending (default), Approved, Rejected, Archived.
2. Review Table
   - Columns: Submitted at, Title, Visibility, Submitter, Status.
   - Row click opens Details Drawer.
3. Details Drawer (right side)
   - Full request content.
   - Edit fields (title/body/visibility/anonymity).
   - Actions: Approve, Reject (reason required), Archive.
4. Audit Microcopy
   - Show “Approved at” / “Rejected reason” where relevant.

## Interaction & Loading States
- Use skeleton rows for list/table loading.
- Use optimistic UI for create (show pending immediately in “My submissions”).
- Permission errors: show non-technical message (“You don’t have access to this request.”).