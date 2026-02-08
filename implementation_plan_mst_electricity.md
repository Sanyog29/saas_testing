# Implementation Plan - Electricity Logger for MST

Grant MST accounts access to the electricity logger, consistent with Property Admin and Staff roles.

## Proposed Changes

### [MstDashboard.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/frontend/components/dashboard/MstDashboard.tsx)

#### [MODIFY] [MstDashboard.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/frontend/components/dashboard/MstDashboard.tsx)
- Update `Tab` type to include `electricity`.
- Import `ElectricityStaffDashboard` from `@/frontend/components/electricity/ElectricityStaffDashboard`.
- Import `Zap` icon from `lucide-react`.
- Add `ELECTRICITY_LOGGER_ROLES` constant and `canAccessElectricityLogger` helper function.
- Add "Electricity Logger" to the sidebar navigation under "Operations".
- Add the `electricity` case to the main content `AnimatePresence` to render `ElectricityStaffDashboard`.

## Verification Plan

### Manual Verification
- Log in as an MST account.
- Verify the "Electricity Logger" tab appears in the sidebar.
- Click the tab and verify the `ElectricityStaffDashboard` loads correctly.
- Verify the readings can be entered and saved.
- Ensure the layout is consistent with other dashboards.
