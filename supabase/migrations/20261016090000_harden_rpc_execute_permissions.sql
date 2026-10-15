-- Security hardening identified during the read-only RoomOra audit.
-- Apply only after reviewing the current production grants and signup/admin flows.
-- No production database has been changed by this branch commit.

begin;

-- User-facing SECURITY DEFINER RPCs must not be callable by anonymous sessions.
revoke all on function public.admin_grant_tokens(uuid, integer, text) from public, anon;
grant execute on function public.admin_grant_tokens(uuid, integer, text) to authenticated;

revoke all on function public.create_advertisement(text, text) from public, anon;
grant execute on function public.create_advertisement(text, text) to authenticated;

revoke all on function public.create_marketplace_inquiry(uuid, text) from public, anon;
grant execute on function public.create_marketplace_inquiry(uuid, text) to authenticated;

-- This routine accepts an arbitrary user ID and has no auth.uid() ownership check.
-- Keep it out of the exposed client API; only trusted backend/service-role code may call it.
revoke all on function public.ensure_free_allocation(uuid) from public, anon, authenticated;
grant execute on function public.ensure_free_allocation(uuid) to service_role;

-- Maintenance routine should be invoked by trusted scheduled/backend work, not clients.
revoke all on function public.expire_items() from public, anon, authenticated;
grant execute on function public.expire_items() to service_role;

revoke all on function public.get_my_token_balance() from public, anon;
grant execute on function public.get_my_token_balance() to authenticated;

revoke all on function public.publish_item(text, text, text, numeric, text, text, text) from public, anon;
grant execute on function public.publish_item(text, text, text, numeric, text, text, text) to authenticated;

revoke all on function public.publish_item(text, text, text, numeric, text, text, text, text[]) from public, anon;
grant execute on function public.publish_item(text, text, text, numeric, text, text, text, text[]) to authenticated;

revoke all on function public.set_initial_profile(boolean, boolean, boolean) from public, anon;
grant execute on function public.set_initial_profile(boolean, boolean, boolean) to authenticated;

revoke all on function public.unlock_owner_contact(uuid, uuid, integer) from public, anon;
grant execute on function public.unlock_owner_contact(uuid, uuid, integer) to authenticated;

commit;
