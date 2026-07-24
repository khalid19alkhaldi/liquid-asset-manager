# Implementation Plan - Interaction Fixes (Sidebar & Dropdowns)

This plan fixes the two issues reported by the user: the unresponsive Sidebar menus and the broken "Select Facility" dropdown.

## Problem Analysis

1. **Sidebar Navigation**: The sidebar links point to `/dashboard` but don't update the internal tab state (Stats/Requests/Users) of the `AdminView`.
2. **Facility Dropdown**: The dropdown in the "New Request" form is failing to show items or react to clicks, likely due to a Z-index conflict or an issue with the facility fetching logic after the schema reset.

## Proposed Changes

### 1. Unified State Management (Sidebar)

#### [MODIFY] [DashboardLayout.tsx](file:///C:/Projects/liquid-asset-manager-main/src/components/layouts/DashboardLayout.tsx)
- Add `activeTab` and `onTabChange` props.
- Update nav items to call `onTabChange` instead of just being dead links.

#### [MODIFY] [dashboard.tsx](file:///C:/Projects/liquid-asset-manager-main/src/routes/_authenticated/dashboard.tsx)
- Manage the `activeTab` state here and pass it down to `DashboardLayout` and `AdminView`.

### 2. UI & Logic Fixes (Dropdowns)

#### [MODIFY] [AdminView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/AdminView.tsx)
- **NewRequestForm Dropdown**: Fix the `select` styling and ensure the `facilities` query is executing correctly.
- Remove redundant tab navigation from `AdminView` since it's now in the Sidebar.

#### [MODIFY] [styles.css](file:///C:/Projects/liquid-asset-manager-main/src/styles.css)
- Refine the `glass-input` (select) styling to ensure proper visibility of options and remove any overlapping backdrop-blur that might be intercepting clicks.

## Verification Plan

### Manual Verification
1. Click on "بلاغات الصيانة" in the sidebar and verify the view changes.
2. Click on "إدارة الموظفين" and verify it switches.
3. Open a "New Request" form, click the facility dropdown, and verify that buildings' facilities are listed and selectable.
