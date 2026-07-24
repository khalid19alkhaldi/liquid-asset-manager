# Implementation Plan - Data Restoration & UI Robustness

This plan fixes the empty "Facility" dropdown and ensures the system data is fully restored after the recent schema resets.

## Problem Analysis

The recent "Auth Rebirth" focused on account tables (`profiles`, `user_roles`) but likely left the business data tables (`buildings`, `facilities`, `price_catalog`) in an inconsistent state or completely empty. Without data in the `facilities` table linked to the current buildings, the dropdowns will appear empty.

## Proposed Changes

### 1. Unified Database Restoration

#### [MODIFY] [99999999999999_full_access.sql](file:///C:/Projects/liquid-asset-manager-main/supabase/migrations/99999999999999_full_access.sql)
- **Re-create all tables**: Ensure `buildings`, `facilities`, `price_catalog`, and `maintenance_requests` exist with correct structures.
- **Master Seed Data**:
    - Insert the 5 primary buildings.
    - **Crucial**: Automatically link a comprehensive set of facilities (AC, Elevators, Fire Systems, etc.) to **every** building.
    - Populate the `price_catalog` with standard maintenance rates.
- **Universal Access**: Re-apply the `Master_Access` policy to all tables to ensure no RLS blocking.

### 2. Frontend Dropdown Fixes

#### [MODIFY] [FacilityManagerView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/FacilityManagerView.tsx)
- Add a loading and empty state check for the facilities dropdown.
- Simplify the `select` rendering to ensure browser compatibility.

#### [MODIFY] [AdminView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/AdminView.tsx)
- Mirror the improvements in the `NewRequestForm` to ensure consistency.

## Verification Plan

### Manual Verification
1. **Run the new SQL script**: Copy and paste the updated master SQL into Supabase.
2. **Refresh the App**: Log in as a Facility Manager.
3. **Test "New Request"**:
    - Click "فتح بلاغ صيانة جديد".
    - Click the "المرفق" dropdown.
    - Verify that all facilities (التكييف، المصاعد، إلخ) are visible and selectable.
4. **Test "Price Calculation"**: Select a facility and verify that the "Estimated Cost" (التكلفة التقديرية) appears correctly based on the new seed data.
