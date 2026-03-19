# Member Portal — Page Design Spec (Desktop-first)

## Global styles
- Layout system: Flexbox for app shell; CSS Grid for card lists (resources).
- Breakpoints: Desktop (≥1024px) primary; Tablet (768–1023px) collapses multi-column grids; Mobile (<768px) stacks all sections.
- Spacing: 8px scale (8/16/24/32).
- Typography: 
  - H1 28/32, H2 20/28, Body 14/20, Caption 12/16.
- Colors (tokens):
  - `--bg`: #0B1220, `--surface`: #111A2E, `--border`: rgba(255,255,255,0.10)
  - `--text`: #EAF0FF, `--muted`: rgba(234,240,255,0.70)
  - `--primary`: #4F7DFF, `--primary-hover`: #3D68E6
  - `--danger`: #FF5A6A
- Buttons:
  - Primary: solid `--primary`, hover `--primary-hover`, disabled 40% opacity.
  - Secondary: transparent with 1px `--border`.
- Inputs:
  - 40px height, 10–12px padding, focus ring 2px `--primary`.
- Feedback:
  - Inline field errors under inputs; toast for global success/error.

## Shared app components
- App Shell (authenticated routes): top navigation bar + centered content container (max-width 1040px).
- Top Nav:
  - Left: product name “Member Portal” (click to `/app`).
  - Right: user email (muted) + “Account” link + “Log out” button.
- Card:
  - Surface background, 12px radius, 16–24px padding.
- Empty State:
  - Icon placeholder + short text + optional action link.

---

## Page: Authentication (Login / Sign-up / Reset)
### Meta Information
- Title: “Member Portal – Sign in” (or Sign up / Reset)
- Description: “Secure access to your membership and resources.”
- Open Graph: title + description; `og:type=website`

### Page Structure
- Centered auth panel on neutral background.
- Two-column layout on desktop:
  - Left: brand / value summary panel.
  - Right: auth form card.
- Tablet/mobile: single column, brand panel collapses above form.

### Sections & Components
1. Brand Panel
   - Logo placeholder + short tagline.
   - Bullet list: “View membership status”, “Access resources”, “Update profile”.
2. Auth Form Card
   - Tabs (or segmented control): “Sign in” / “Sign up”.
   - Fields:
     - Email (required)
     - Password (required)
   - Actions:
     - Primary submit button
     - “Forgot password?” link → `/reset-password`
   - Validation states:
     - Inline errors for invalid email, missing password.
     - Toast on server/auth errors.
3. Reset Password (route: `/reset-password`)
   - Email field + “Send reset link” button.
   - Confirmation state: show “Check your email”.

---

## Page: Member Dashboard (`/app`)
### Meta Information
- Title: “Member Portal – Dashboard”
- Description: “Your membership overview and resources.”
- Open Graph: title + description

### Page Structure
- Stacked sections within container.
- Desktop: membership summary and quick actions in a 2-column grid; resources list below.
- Mobile: all sections stacked.

### Sections & Components
1. Welcome Header
   - “Welcome, {full_name or email}”
   - Subtext: last sign-in (optional if available; otherwise omit).
2. Membership Summary Card
   - Status pill: Active / Inactive (color-coded).
   - Plan name.
   - Dates: start date, end/renewal date (if present).
   - If inactive:
     - Show blocking message: “Your membership is inactive; resources are unavailable.”
     - Link/button: “View membership details” → `/app/account`.
3. Quick Links Card
   - Buttons: “Account & Membership”, “Log out”.
4. Resources Section
   - Header row: “Resources” + count.
   - Grid/list:
     - Resource card: title, short description, “Open” button.
   - States:
     - Loading skeleton.
     - Empty: “No resources available for your plan.”
     - Blocked (inactive membership): hide list and show a single empty/blocked panel.

---

## Page: Account & Membership (`/app/account`)
### Meta Information
- Title: “Member Portal – Account”
- Description: “Manage your profile and review membership details.”
- Open Graph: title + description

### Page Structure
- Desktop: 2-column layout.
  - Left column: Profile form.
  - Right column: Membership details.
- Mobile: stacked with Profile first.

### Sections & Components
1. Profile Card
   - Readonly email field.
   - Editable fields:
     - Full name
     - Phone
   - Actions:
     - “Save changes” primary button
     - Success toast: “Profile updated”.
   - Form states:
     - Disabled while saving.
     - Inline validation for required fields (if you enforce any).
2. Membership Details Card
   - Plan name, status pill.
   - Start/end dates.
   - Guidance block:
     - If inactive/expired: show next step text (e.g., “Please contact support to renew.”)
     - If active: show “You can access resources from the Dashboard.”
3. Navigation
   - Back link to Dashboard.
