import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/** Load published listings and the authenticated user's own items. */
export default function useMarketplaceItems(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!supabase) {
      setItems([]);
      setError('The marketplace connection is not configured.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const queries = [
        supabase.from('marketplace_items').select('*')
          .eq('status', 'published')
          .gt('expires_at', new Date().toISOString())
          .order('published_at', { ascending: false }),
      ];
      if (userId) {
        queries.push(
          supabase.from('marketplace_items').select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        );
      }

      const results = await Promise.all(queries);
      if (currentRequest !== requestId.current) return;
      const failed = results.find(result => result.error);
      if (failed) throw failed.error;
      const byId = new Map();
      results.forEach(({ data }) => (data || []).forEach(item => byId.set(item.id, item)));
      setItems([...byId.values()]);
    } catch (caught) {
      if (currentRequest === requestId.current) {
        setError(caught?.message || 'Could not load marketplace items.');
        setItems([]);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return { items, loading, error, reload, setItems };
}
