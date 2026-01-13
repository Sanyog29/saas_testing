# Implementation Plan - Enhancing Property Management & Assignment Flow

The goal is to improve the Property Admin experience by making requests more accessible, allowing assignment to MSTs, and enabling full CRUD on requests.

## Proposed Changes

### [Dashboard] Property Admin Dashboard
#### [MODIFY] [PropertyAdminDashboard.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one_v4/saas_one/components/dashboard/PropertyAdminDashboard.tsx)
- Update `ActivityItem` to accept an `onClick` prop.
- Wrap `ActivityItem` calls in `OverviewTab` to navigate to `/tickets/[id]`.
- Replace `TenantTicketingDashboard` with `TicketsView` in the `Requests` tab for Property Admins.
- Ensure `propertyId` is passed correctly to `TicketsView`.

### [Dashboard] Tickets View
#### [MODIFY] [TicketsView.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one_v4/saas_one/components/dashboard/TicketsView.tsx)
- Add `propertyId` to `TicketsViewProps`.
- Update `fetchTickets` to use the `propertyId` prop if provided.
- Add a "Delete" button for each ticket (only if user has admin permissions).
- Implement `handleDeleteTicket` function.

### [API] Tickets
#### [MODIFY] [route.ts](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one_v4/saas_one/app/api/tickets/%5Bid%5D/route.ts)
- Implement `DELETE` method to allow admins to remove tickets.

### [User Management] MST Assignment
#### [MODIFY] [page.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one_v4/saas_one/app/tickets/%5BticketId%5D/page.tsx)
- Ensure the assignment modal filters and displays MST/Staff correctly.
- (Optional) Add a "Mark as Resolver" action in User Management or a login trigger.

## Verification Plan
### Manual Verification
- Log in as Property Admin.
- Click a request in "Recent Intelligence" and verify it opens the detail page.
- Go to "Requests" tab and verify it shows all property tickets.
- Delete a test ticket and verify it's removed from the list.
- Open a ticket and verify the "Reassign" button shows available MSTs.
