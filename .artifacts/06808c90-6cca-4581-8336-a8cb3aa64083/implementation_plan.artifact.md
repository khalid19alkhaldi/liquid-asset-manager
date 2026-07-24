# Implementation Plan - Operation Audit Log System

This plan establishes a comprehensive auditing system to track every critical change within the platform, specifically focusing on pricing updates and maintenance request approvals.

## Proposed Changes

### 1. Database Infrastructure (Logging Engine)

#### [MODIFY] [99999999999999_full_access.sql](file:///C:/Projects/liquid-asset-manager-main/supabase/migrations/99999999999999_full_access.sql)
- **New Table**: `public.audit_logs`
    - `id` (UUID)
    - `performer_id` (UUID, refs profiles)
    - `performer_name` (Text, for quick reference)
    - `action_type` (Text: e.g., 'PRICE_UPDATE', 'STATUS_CHANGE')
    - `entity_type` (Text: e.g., 'maintenance_requests', 'price_catalog')
    - `entity_id` (UUID)
    - `old_values` (JSONB)
    - `new_values` (JSONB)
    - `created_at` (TIMESTAMPTZ)
- **Audit Function**: A Postgres function `public.log_operation()` that automatically detects changes in specific tables and records them.
- **Triggers**:
    - Trigger on `maintenance_requests` (log when status or actual_cost changes).
    - Trigger on `price_catalog` (log when standard_price changes).

### 2. Frontend - Audit Management Interface

#### [MODIFY] [AdminView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/AdminView.tsx)
- **New Tab**: "سجل التدقيق" (Audit Log).
- **Audit Feed**: A chronological list of all system actions.
- **Detail View**: Visual comparison between "Old Data" and "New Data" (e.g., "السعر القديم: 150 -> السعر الجديد: 200").

### 3. Layout Integration

#### [MODIFY] [DashboardLayout.tsx](file:///C:/Projects/liquid-asset-manager-main/src/components/layouts/DashboardLayout.tsx)
- Add "سجل العمليات" (Audit Logs) to the sidebar for Admins.

## Verification Plan

### Manual Verification
1. Log in as an Admin.
2. Change the status of a maintenance request to "Approved".
3. Update the price of a service in the catalog (if a UI exists) or via SQL.
4. Open the "Audit Log" tab.
5. Verify that both actions appear with:
    - Your name.
    - The exact time.
    - What was changed (Old vs New).
