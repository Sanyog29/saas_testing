# [FIX] Diesel & Electricity Analytics for Super Admin

The Super Admin (Org Admin) is unable to see Diesel and Electricity analytics when "All Properties" is selected. This is due to:
1.  Dashboards attempting to fetch data using a `propertyId` of `undefined`.
2.  Missing organization-level API endpoints for generators, electricity meters, and readings.
3.  Frontend crashes when API calls return non-array results (500 errors).

## Proposed Changes

### Backend (API)
Implement organization-level endpoints to aggregate data across all properties:

#### [NEW] [generators/route.ts](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/app/api/organizations/[orgId]/generators/route.ts)
- Returns all generators belonging to any property within the organization.

#### [NEW] [electricity-meters/route.ts](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/app/api/organizations/[orgId]/electricity-meters/route.ts)
- Returns all electricity meters across all properties in the organization.

#### [NEW] [diesel-readings/route.ts](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/app/api/organizations/[orgId]/diesel-readings/route.ts)
- Returns diesel readings for all properties in the organization within a date range.

#### [NEW] [electricity-readings/route.ts](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/app/api/organizations/[orgId]/electricity-readings/route.ts)
- Returns electricity readings for all properties in the organization within a date range.

### Frontend (Components)

#### [MODIFY] [DieselAnalyticsDashboard.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/frontend/components/diesel/DieselAnalyticsDashboard.tsx)
- Handle cases where `propertyId` is missing but `orgId` is present.
- Use organization-level endpoints when in "All Properties" mode.
- Prevent requests to `/api/properties/undefined/...`.
- Add safety checks for API responses (ensure they are arrays before filtering).

#### [MODIFY] [ElectricityAnalyticsDashboard.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one/frontend/components/electricity/ElectricityAnalyticsDashboard.tsx)
- Similarly handle missing `propertyId`.
- Use organization-level endpoints.
- Add safety checks for API responses.

## Verification Plan

### Automated Tests
- N/A (Manual verification required)

### Manual Verification
1.  Log in as a Super Admin.
    -   Navigate to `Diesel Analytics` with "All Properties" selected. Verify it shows aggregated data and does not crash.
    -   Select a specific property. Verify it shows data for that property.
    -   Navigate to `Electricity Analytics` and verify the same behaviors.
2.  Inspect Network tab to ensure no calls are made to `/api/properties/undefined/...`.
