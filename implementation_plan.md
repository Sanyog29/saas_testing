# Implementation Plan - Super Admin Management Enhancements

This plan outlines the enhancements to the Super Admin (Organization Admin) dashboard to include comprehensive user and property management features.

## Proposed Changes

### Dashboard Component Enhancements
#### [MODIFY] [OrgAdminDashboard.tsx](file:///c:/Users/harsh/OneDrive/Desktop/autopilot/saas_one_v1/saas_one/components/dashboard/OrgAdminDashboard.tsx)
- **Data Fetching**:
    - Update `fetchOrgUsers` to aggregate users from both `organization_memberships` and `property_memberships` associated with the organization.
    - Add user data to include property associations.
- **State Management**:
    - Add state for managing selected user/property for editing.
    - Add state for various modals (Create/Edit User, Edit Property).
- **CRUD Operations**:
    - `handleUpdateUser`: Update user metadata (full name, phone) and role.
    - `handleDeleteUser`: Remove membership from organization/properties.
    - `handleCreateUser`: (Optional/Mock) Logic for adding a new user to the organization.
    - `handleUpdateProperty`: Update property details (name, code, address).
    - `handleDeleteProperty`: Remove property (and its memberships).
- **UI Components**:
    - Refine `PropertiesTab` with Action buttons (Edit, Delete).
    - Refine `UsersTab` with Action buttons (Edit, Delete).
    - Implement `UpdatePropertyModal`.
    - Implement `UserManagementModal` (for creating/editing users and their roles/property assignments).

## Verification Plan

### Automated Tests
- N/A (Manual verification preferred for UI components)

### Manual Verification
- Log in as a Super Admin and navigate to the dashboard.
- **Properties**:
    - Create a new property and verify it appears in the list.
    - Edit an existing property and verify changes persist.
    - Delete a property and verify it is removed.
- **Users**:
    - Verify the user list shows users assigned to the organization and its properties.
    - Edit a user's role and verify the update.
    - Remove a user from the organization and verify they no longer appear in the list.
