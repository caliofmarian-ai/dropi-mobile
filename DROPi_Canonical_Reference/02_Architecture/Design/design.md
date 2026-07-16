# DROPi Mobile App — Interface Design

## Brand Colors
- **Primary (DROPi Blue):** #0066FF — Used for primary actions, active states, headers
- **Background:** Light #FFFFFF / Dark #0F1419
- **Surface:** Light #F7F9FC / Dark #1A1F25
- **Foreground:** Light #0F1419 / Dark #F0F4F8
- **Muted:** Light #6B7280 / Dark #9CA3AF
- **Success (Green):** #10B981 — Completed, confirmed states
- **Warning (Amber):** #F59E0B — Preparing, attention needed
- **Error (Red):** #EF4444 — STOP, cancelled, critical alerts
- **Border:** Light #E5E7EB / Dark #2D3748

## Screen List

### Authentication
1. **Login Screen** — Email + password, role indicator
2. **Role Selection Screen** — After login, user selects active role (if multi-role)

### Client Screens
3. **Client Dashboard (Home)** — Active deliveries list (cards with status badges)
4. **Order Detail** — Full order info, progress timeline, ETA
5. **Live Tracking** — Map view with drone/courier position (only during IN_EXECUTION)
6. **Order History** — Past orders with final status

### Merchant Screens
7. **Merchant Dashboard (Queue)** — Orders grouped: New | Preparing | Ready
8. **Order Processing** — Order details + action buttons (Start Preparing, Mark Ready)
9. **Report Issue** — Form to report stock/preparation problems

### Pilot Screens
10. **Pilot Dashboard (Mission Radar)** — Available missions in zone
11. **Mission Detail** — Pickup/delivery info, weight, distance
12. **Pre-Flight Checklist** — Mandatory checks before launch
13. **In-Flight Supervision** — Map + telemetry + STOP + FALLBACK controls
14. **Post-Flight Report** — Completion confirmation + incident report

### Operator Screens
15. **Operator Dashboard (Zone Map)** — God's eye view of all active flights
16. **Fleet Status** — List of drones/pilots with status indicators
17. **Alert Feed** — Real-time incident and weather alerts
18. **Zone Control** — Suspend/resume zone operations

### Shared Screens
19. **Profile** — User info, role badge, settings
20. **Support** — Create/view support tickets

## Primary Content and Functionality

### Client Dashboard
- Cards showing: Order ID (short), Merchant name, Status badge (color-coded), ETA countdown
- Pull-to-refresh for status updates
- Tap card → Order Detail

### Merchant Dashboard
- Three-column or sectioned list: NEW (blue dot) | PREPARING (amber) | READY (green)
- Each item: Order ID, items summary, time since received
- Swipe or tap to advance status

### Pilot Dashboard
- Mission cards: Pickup zone, Delivery zone, Package weight, Estimated distance
- Accept button on each card
- Active mission shown as full-screen map with controls overlay

### Operator Dashboard
- Full-screen map with colored markers (green/amber/red per drone status)
- DronePort markers with capacity indicators
- Bottom sheet with alert feed
- Floating action button for zone-wide commands

## Key User Flows

### Flow 1: Client tracks delivery
Login → Dashboard → Tap active order → See progress timeline → When IN_EXECUTION → Live map with drone position → Delivery confirmed → Rate experience

### Flow 2: Merchant prepares order
Login → Dashboard (Queue) → See new order → Tap "Start Preparing" → Timer starts → Finish preparation → Tap "Colet Ready" → Order moves to READY

### Flow 3: Pilot executes delivery
Login → Mission Radar → See available mission → Tap Accept → Pre-flight checklist → Confirm all checks → In-flight screen with map → Monitor flight → [If issue: STOP or FALLBACK] → Delivery complete → Post-flight report

### Flow 4: Operator monitors zone
Login → Zone Map → See all active flights → [If alert: tap to expand] → [If emergency: GROUND ALL button] → Review incident logs

## Navigation Structure

```
Tab Bar (role-dependent):
├── Client: [Home] [History] [Profile]
├── Merchant: [Queue] [History] [Profile]
├── Pilot: [Missions] [Active] [Profile]
└── Operator: [Map] [Alerts] [Fleet] [Profile]
```

## Layout Principles (Mobile Portrait 9:16)
- All screens use ScreenContainer with SafeArea
- Primary actions at thumb-reach (bottom 40% of screen)
- Critical controls (STOP, FALLBACK) are large, always visible, never hidden behind menus
- Status badges use consistent color coding across all roles
- One-handed usage: no critical actions requiring two-hand interaction
