import { createClient } from 'npm:@supabase/supabase-js@2.119.2';

Deno.serve(async request => {
  const token = request.headers.get('x-roomora-cleanup-token') ?? '';
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  if (!/^[\da-f-]{72}$/.test(token)) return new Response(null, { status: 401 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: paths, error } = await admin.rpc('finance_cleanup_batch', { p_token: token });
  if (error) {
    if (error.code === 'PT401') return new Response(null, { status: 401 });
    console.error('Roommate ledger database cleanup failed', error.code);
    return new Response(null, { status: 500 });
  }

  if (paths.length) {
    const { error: storageError } = await admin.storage.from('finance-receipts').remove(paths);
    if (storageError) {
      console.error('Roommate receipt cleanup failed', storageError.name);
      return new Response(null, { status: 500 });
    }
  }

  return Response.json({ receiptsRemoved: paths.length });
});
