# Fleet Logistics & Management Software — Implementation Plan & Status

## Project Overview
A modern, high-performance React web frontend for fleet logistics, dispatch, asset tracking, maintenance, compliance, and team management.

---

## Current Implementation Status ✅

### 1. Architecture & Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Routing**: React Router 7 (`react-router-dom`) with protected routes and nested layouts
- **Styling**: Vanilla CSS design system with custom CSS variables, glassmorphism, responsive grid, and full Light/Dark theme support
- **State & Persistence**: LocalStorage-backed state machine with simulated asynchronous latency (`store.ts`, `fleetService.ts`, `seed.ts`)
- **Build & Quality**: Fully passes type-checking (`tsc -b`) and production bundling (`vite build`)

### 2. Completed Modules & Pages (17 Routes)
- **Authentication**: `LoginPage` with mock credentials, input validation, and instant one-click Demo Login.
- **Dashboard**: `DashboardPage` with KPI summary cards, active dispatches, quick actions, maintenance notices, and interactive SVG `FleetMap`.
- **Dispatch & Operations**: `DispatchPage` and `TripDetailPage` with multi-stop itineraries, driver assignment, cargo details, and status workflows.
- **Freight & Loads**: `LoadsPage` and `LoadDetailPage` with rate breakdown, weight/cube tracking, customer assignment, and lifecycle management.
- **Vehicles & Assets**: `VehiclesPage` and `VehicleDetailPage` with odometer, fuel level, VIN, telematics, and maintenance history.
- **Driver Management**: `DriversPage` and `DriverDetailPage` with license status, HOS (Hours of Service) logs, safety scores, and `DVIRModal` inspection creator.
- **Maintenance & Work Orders**: `MaintenancePage` with work order queues, cost tracking, urgency tags, and scheduling.
- **Fuel Logs**: `FuelPage` with gallon logs, total cost, MPG calculations, and vendor tagging.
- **Diagnostics & Alerts**: `AlertsPage` with severity filters, unread badge counters, dismiss actions, and alert simulation triggers.
- **Analytics & Reports**: `ReportsPage` with fleet performance statistics and CSV export.
- **Tools & Settings**: `SettingsPage` with company defaults, rate calculator modal (`RateCalculatorModal`), and `SearchPage` for global asset search.

---

## New Feature Requirement: Role-Based Access Control (RBAC) & Team Management 👥

> [!IMPORTANT]
> **Scope Note**: All user management and permission elevation outlined below will be implemented **in mock data / local state (`localStorage`)** before integrating a real backend or database.

### 1. User Roles & Hierarchy
The application will support role-based user accounts under the Fleet Operations Manager:
- **Fleet Admin / Operations Manager** (Full access): Can manage company settings, create/edit/delete all records, manage all team users, and elevate/demote privileges.
- **Dispatcher**: Access to dispatch, trips, loads, drivers, vehicles, and fleet map; restricted from company financial settings and user role elevation.
- **Safety & Compliance Officer**: Access to HOS logs, DVIR inspections, driver safety scores, and alerts; read-only access to dispatches and billing.
- **Maintenance Technician**: Focused access to work orders, vehicle service history, DVIR defect logs, and fuel records.
- **Driver**: Restricted self-service portal view (assigned active trips, personal HOS clock, DVIR submission).

### 2. User Authentication & Multi-Role Demo Switcher
- Allow logging in as different mock personas (Admin, Dispatcher, Safety Officer, Maintenance Tech, Driver).
- Provide quick persona switching in the demo login UI and header profile menu for easy testing.

### 3. Admin Privilege Elevation & User Management
- **User Management Screen / Section** in Settings or dedicated Admin panel.
- Ability for Fleet Admin to:
  - View all team members and their assigned roles/privilege levels.
  - Elevate or demote a user's role/privilege level (e.g., promote a Dispatcher to Fleet Admin).
  - Activate, suspend, or invite mock users.
  - Changes immediately persist to local mock state (`localStorage`).

---

## What Uses Mock Data (Local State)
- All CRUD operations for vehicles, drivers, trips, loads, maintenance orders, fuel logs, alerts, and team user accounts.
- Telemetry coordinates, map markers, and simulated alerts.
- Session authentication and role authorization checks.

---

## What Remains for Backend / Database Phase
1. **Authentication API**: Real OAuth/JWT authentication, password hashing, and session management.
2. **Database & ORM**: PostgreSQL/Firestore schemas for organizations, users, roles, fleet assets, and telemetry logs.
3. **Backend API Endpoints**: REST/GraphQL endpoints with server-side authorization middleware enforcing role permissions.
4. **Live Telematics & ELD Integrations**: Real-time WebSocket/MQTT feeds for vehicle GPS, engine diagnostics, and hardware ELD feeds.

---

## Next Immediate Steps
1. **Implement Mock User Management & Role Permissions**: Add user model with roles (`admin`, `dispatcher`, `safety`, `maintenance`, `driver`), permission gates on UI actions, role elevation controls for admins, and multi-role demo login switchers in mock state.
2. **Test & Verify**: Validate that restricted roles see appropriate UI states and admins can seamlessly elevate privileges.