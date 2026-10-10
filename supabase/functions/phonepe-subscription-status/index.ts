import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getServiceClient } from "../_shared/phonepe.ts";

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "GET" && req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sign in to view your subscription" }, { status: 401, headers });
    const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("Supabase auth is not configured");
    const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401, headers });
    const service = getServiceClient();
    const { data, error } = await service.from("user_subscriptions")
      .select("id,status,current_period_start,current_period_end,cancel_at_period_end,phonepe_merchant_subscription_id,billing_provider,subscription_plans(name,monthly_price,token_allowance,monthly_bonus_tokens)")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return Response.json({ subscription: data || null }, { headers });
  } catch (_error) {
    return Response.json({ error: "Unable to load subscription status" }, { status: 500, headers });
  }
});
