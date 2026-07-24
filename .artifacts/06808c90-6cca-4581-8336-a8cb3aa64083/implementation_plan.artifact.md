# Implementation Plan - Facility Manager Dashboard Upgrade

This plan overhauls the **Facility Manager View** (مسؤول المنشأة) to match the new high-end SaaS aesthetic (Glassmorphism 2.0) used in the Admin View.

## Proposed Changes

### 1. Visual Identity & Components

#### [MODIFY] [FacilityManagerView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/FacilityManagerView.tsx)
- **Executive Metrics**: Add SaaS-style metric cards (Active Tickets, Completion Rate, Budget Usage).
- **Building Identity**: Redesign the building info card to be more prominent and professional.
- **Modern Request Feed**: Transform the maintenance request list into a clean "Activity Feed" with status badges and relative time.
- **SaaS Layout**: Align spacing and typography with the new `DashboardLayout`.

### 2. Interactive Forms

#### [MODIFY] `NewRequestForm` in `FacilityManagerView.tsx`
- Redesign the "New Request" form as a modern, high-contrast modal or clean card.
- Improve input styling (Select, Textarea) to match the new system.
- Add better visual feedback for the "Estimated Cost" calculation.

### 3. Data Visualization

#### [MODIFY] [FacilityManagerView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/FacilityManagerView.tsx)
- Enhance the budget progress bar with trend indicators and high-contrast labels.
- (Optional) Add a simple area chart for recent maintenance activity in that specific building.

## Verification Plan

### Manual Verification
1. Login as a **Facility Manager**.
2. Verify that the dashboard feels like a premium SaaS tool.
3. Open the "New Request" form and ensure the dropdowns and inputs are responsive and look professional.
4. Check that the budget calculations and progress bars are accurate and clearly legible.
