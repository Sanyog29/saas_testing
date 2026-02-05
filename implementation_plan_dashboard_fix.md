# Implementation Plan - Fix PropertyAdminDashboard.tsx Layout and Syntax

## Goal Description
Fix layout issues, restore mobile responsiveness to the header, and resolve syntax/nesting errors in `PropertyAdminDashboard.tsx`.

## Proposed Changes

### [dashboard]

#### [MODIFY] [PropertyAdminDashboard.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/frontend/components/dashboard/PropertyAdminDashboard.tsx)
- Fix component nesting and closing tags.
- Restore `OverviewTab` layout:
  - Add `p-4 md:p-8 lg:p-12` back to the main content area of the `OverviewTab`.
  - Fix the header styling (restore it to standard dark theme styling if it was accidentally changed to a plain color).
- Ensure `TicketsView` is correctly integrated and using standard components.
- Fix any remaining linting errors regarding component declarations and usage.

## Verification Plan

### Manual Verification
- Test switch between all tabs (Overview, Requests, Vendors, etc.) to ensure they render correctly.
- Test mobile view responsiveness for the Overview header and main layout.
- Verify "New Request" button opens the modal correctly.
