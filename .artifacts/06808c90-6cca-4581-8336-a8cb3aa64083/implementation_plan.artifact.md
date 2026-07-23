# Implementation Plan - Accounts System Rebuild

The user requested to "delete everything related to accounts and rebuild them from scratch" because the previous "Full Access" fixes didn't result in a working Admin dashboard for them.

This plan provides a clean-slate approach to ensure that:
1. Every user has a `profile`.
2. Every user is automatically assigned the `admin` role (for now, to ensure full access).
3. The database is the "Single Source of Truth" for these assignments.

## User Action Required

> [!IMPORTANT]
> This is a destructive operation for metadata (profiles/roles), but it is necessary to fix the "No Role" issue permanently.

1. **Run the Reconstruction SQL**: I will provide a script that drops the old `profiles` and `user_roles` tables and re-creates them perfectly.
2. **Refresh and Sign In**: After running the script, simply refresh the app. Your existing account will be automatically "re-linked" and assigned an Admin role by the script.

## Proposed Changes

### Database Reconstruction

#### [MODIFY] [99999999999999_full_access.sql](file:///C:/Projects/liquid-asset-manager-main/supabase/migrations/99999999999999_full_access.sql)
- **DROP** existing `user_roles` and `profiles` tables.
- **RE-CREATE** them with clean definitions.
- **MIGRATE** all existing `auth.users` into the new tables immediately.
- **RE-ESTABLISH** a robust "Auto-Admin" trigger for all future signups.
- **FORCE** RLS to be completely open for testing purposes.

### Frontend Logic

#### [MODIFY] [useSession.ts](file:///C:/Projects/liquid-asset-manager-main/src/hooks/useSession.ts)
- Add extra safety checks to ensure the role is correctly parsed even if the database returns an array.

## Verification Plan

### Manual Verification
- Run the SQL script.
- Check the `public.user_roles` table in Supabase to see if your user ID is present with the 'admin' role.
- Refresh the app. The dashboard should now show the Admin View.
