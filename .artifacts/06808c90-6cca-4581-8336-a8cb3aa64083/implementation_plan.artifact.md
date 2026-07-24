# Implementation Plan - Institutional Redesign (HQ Jubail Style)

This plan will transform the platform from a "Glassmorphism" look to a professional, institutional design inspired by the official **HQ Jubail** website. We will shift towards a Deep Green and Gold palette with a clean, grid-based layout.

## User Review Required

> [!IMPORTANT]
> This change will replace the current semi-transparent "Glass" effect with solid, high-contrast institutional colors (Deep Green, Gold, and White) to match the HQ Jubail identity.

## Proposed Changes

### 1. Visual Identity & Theme

#### [MODIFY] [styles.css](file:///C:/Projects/liquid-asset-manager-main/src/styles.css)
- Update CSS variables to use:
    - **Primary**: Deep Forest Green (`#005a34`)
    - **Secondary**: Light Institutional Grey (`#f4f7f5`)
    - **Accent**: Warm Gold/Bronze (`#c5a059`)
    - **Text**: Dark Charcoal for readability.
- Replace `glass-card` and `glass-panel` utilities with `inst-card` and `inst-panel` (clean white backgrounds, subtle shadows, crisp borders).

### 2. Core Layout Structure

#### [NEW] [DashboardLayout.tsx](file:///C:/Projects/liquid-asset-manager-main/src/components/layouts/DashboardLayout.tsx)
- Create a modern Sidebar-based layout.
- **Sidebar**: Fixed on the right (RTL), Deep Green background, containing navigation links (Overview, Requests, Staff, Reports).
- **Header**: Integrated into the content area, showing the page title and basic breadcrumbs.

### 3. Dashboard Components Overhaul

#### [MODIFY] [AdminView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/AdminView.tsx)
- Re-style the stat cards using the new institutional grid system.
- Replace the tab switcher with the Sidebar navigation.
- Implement **Recharts** with the new Green/Gold color scheme for budget visualization.
- Redesign the maintenance request list into a clean, professional Data Table.

#### [MODIFY] [AppHeader.tsx](file:///C:/Projects/liquid-asset-manager-main/src/components/AppHeader.tsx)
- Update the logo and header styling to match the sidebar-centric approach.

### 4. Navigation & Routes

#### [MODIFY] [_authenticated/dashboard.tsx](file:///C:/Projects/liquid-asset-manager-main/src/routes/_authenticated/dashboard.tsx)
- Wrap the dashboard content with the new `DashboardLayout`.

## Verification Plan

### Manual Verification
1. Compare the color palette and icons against `hqjubail.org.sa`.
2. Test the responsive Sidebar on mobile (collapsible drawer).
3. Verify that all functional buttons (Add Request, Delete User) are clearly visible and styled with the new Green/Gold theme.
4. Check Dark Mode support with the new color tokens.
