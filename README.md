# Autopilot • Premium Property Management

Autopilot is a state-of-the-art, multi-tenant Property Management platform designed for enterprise-grade facility oversight. It combines sleek design aesthetics with powerful automation to manage large-scale commercial and residential properties.

---

## 🚀 Key Features

### 1. Intelligent Request Management
- **Visual Evidence**: Native support for "Before" and "After" site photo uploads with WebP optimization.
- **SLA Tracking**: Real-time monitoring of Service Level Agreements with automated "Breached" or "Risk" alerts.
- **Resolver Load Map**: Visual intelligence for property admins to track Maintenance Staff (MST) workload and assign tasks efficiently.

### 2. Visitor Management System (VMS)
- **Digital Guestbook**: Seamless check-in/check-out for visitors with real-time status tracking.
- **Admin SPOC View**: Dedicated interface for security and admin personnel to manage campus arrivals.

### 3. Energy & Facility Analytics
- **Diesel Sphere**: Interactive 3D/glassmorphism visualization of fuel levels.
- **Consumption Tracking**: Automated logging of diesel intake and usage for generator sets.
- **Occupancy Metrics**: Real-time property occupancy and tenant health tracking.

### 4. Admin Intelligence
- **Role-Based Dashboards**: Tailored experiences for Master Admins, Org Super Admins, Property Managers, and MST.
- **Recent Intelligence**: A live feed of all property activities, providing instant oversight of campus operations.
- **Revenue tracking**: Specialized modules for Cafeteria and Vendor revenue management.

---

## 🛡️ User Roles & Permissions

- **Master Admin**: Full system access across all organizations.
- **Org Super Admin**: Complete oversight of all properties within a specific organization.
- **Property Admin**: Daily management of a specific building or site.
- **MST (Maintenance Staff)**: Task execution, ticket resolution, and status updates.
- **Tenant**: Raising requests, tracking progress, and communicating with management.
- **Security/Staff**: Handling VMS and physical site presence.

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js 14+](https://nextjs.org/) (App Router), React, [Framer Motion](https://www.framer.com/motion/) (Animations).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom Glassmorphism/Premium design system.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + PostgREST).
- **Security**: Granular PostgreSQL Row Level Security (RLS) for multi-tenant isolation.
- **Storage**: Supabase Storage for high-performance image hosting.

---

## 📈 Recent Enhancements
- ✅ **Dynamic Stats**: Real-time database counts for Active Tenants and Open Tickets.
- ✅ **Integrated Creation**: "New Request" modal accessible directly from the dashboard.
- ✅ **MST Heartbeat**: Automatic availability tracking for maintenance staff upon login.
- ✅ **Secure Deletion**: Full CRUD capabilities for admins with RLS protection.

---

## 🎨 Design Philosophy
The app uses a **Premium Mode** aesthetic. Key elements include:
- **Depth**: Soft shadows and layered cards.
- **Vibrancy**: Careful use of HSL colors (Emerald, Amber, Rose) to denote status.
- **Smoothness**: Strategic 200ms transitions for all interactive components.

---

Developed by the Autopilot Development Team.
