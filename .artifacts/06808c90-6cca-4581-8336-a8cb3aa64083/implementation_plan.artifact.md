# Implementation Plan - The "SHQ Jubail" Total Rebuild

This plan overhauls the entire platform to match the features, design, and structure of the reference model `shqjubail.lovable.app`. This includes a complete UI redesign and the activation of two primary gateways: the **Employee Portal** and the **Contractors Portal**.

## Key Objectives
1.  **Identity Alignment**: Adopt the professional Forest Green, Gold, and White palette with a clean SaaS aesthetic.
2.  **Dual Gateway Architecture**: Separate workflows for internal staff and external contractors.
3.  **Enhanced Functionality**: Add Preventive Maintenance, Before/After documentation, and Invoice tracking.

## Proposed Changes

### 1. Database Schema Expansion

#### [MODIFY] [99999999999999_full_access.sql](file:///C:/Projects/liquid-asset-manager-main/supabase/migrations/99999999999999_full_access.sql)
- **Portal Roles**: Update `app_role` to include `contractor`.
- **Media & Documentation**: New `request_media` table for Before/After photos.
- **Contractor Profiles**: New `contractors` table (Company name, CR, rating).
- **Financials**: New `invoices` table linked to maintenance requests.
- **Scheduling**: New `preventive_maintenance` table for recurring tasks.

### 2. Branding & Design System

#### [MODIFY] [styles.css](file:///C:/Projects/liquid-asset-manager-main/src/styles.css)
- Implement the "SHQ Jubail" look: ultra-clean white backgrounds, sharp topography, and subtle institutional green accents.
- Add components for "Steppers" (01-04 workflow) and "KPI Cards."

### 3. Frontend Architecture

#### [NEW] [EmployeePortal.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/portals/EmployeePortal.tsx)
- Unified dashboard for Admin and Facility Managers.
- Features: Preventive maintenance calendar, field visit scheduling, and audit logs.

#### [NEW] [ContractorPortal.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/portals/ContractorPortal.tsx)
- Dashboard for external companies.
- Features: Assigned task list, Photo upload (Before/After), and payment status tracking.

#### [MODIFY] [Landing.tsx](file:///C:/Projects/liquid-asset-manager-main/src/routes/index.tsx)
- Rebuild to include: Hero (Efficiency), Stats Counters, Workflow (01-04), and Portal Selectors.

### 4. Logic & Hooks

#### [MODIFY] [useAuth.ts](file:///C:/Projects/liquid-asset-manager-main/src/hooks/useAuth.ts)
- Update session logic to detect and redirect based on the specific portal (Employee vs. Contractor).

## Verification Plan

### Automated Tests
- Check RLS policies: Ensure contractors cannot see general building budgets, only their assigned tasks.

### Manual Verification
1. **Signup as Contractor**: Verify the specialized profile is created.
2. **Assign Task to Contractor**: As an Admin, verify the task appears in the Contractor Portal.
3. **Documentation Flow**: Upload a "Before" photo as a contractor and verify it's visible in the Audit Log.
4. **Preventive Maintenance**: Schedule a task and check if it triggers a notification.
