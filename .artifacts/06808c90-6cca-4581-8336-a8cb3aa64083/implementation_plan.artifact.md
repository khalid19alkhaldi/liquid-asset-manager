# Implementation Plan - Admin User Management (Delete Functionality)

This plan adds the ability for the General Manager (Admin) to view all registered accounts and delete them directly from the application. This ensures that when an employee leaves, their access can be revoked completely.

## Proposed Changes

### Database Logic

#### [MODIFY] [99999999999999_full_access.sql](file:///C:/Projects/liquid-asset-manager-main/supabase/migrations/99999999999999_full_access.sql)
- **Add Admin Delete Function**: Create a Postgres function `delete_user_by_admin(target_user_id UUID)` marked as `SECURITY DEFINER`.
    - This function allows an authorized Admin to delete a user from the `auth.users` table.
    - Since `profiles` and `user_roles` have `ON DELETE CASCADE`, all associated data will be wiped automatically.

### Admin Interface

#### [MODIFY] [AdminView.tsx](file:///C:/Projects/liquid-asset-manager-main/src/features/dashboards/AdminView.tsx)
- **Add Delete Button**: Add a "Delete User" (حذف الحساب) button to each user card in the "Users Management" tab.
- **Confirmation Logic**: Implement a `window.confirm` check to ensure the Admin actually wants to delete the account.
- **RPC Call**: Use `supabase.rpc('delete_user_by_admin', ...)` to trigger the deletion.

## Verification Plan

### Manual Verification
1. Sign in as the primary Admin.
2. Go to the **إدارة الموظفين** (Users Management) tab.
3. Identify a test account.
4. Click the "Delete" icon/button.
5. Confirm that the user disappears from the list and can no longer log in.
