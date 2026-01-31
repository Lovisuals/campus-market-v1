'use client';

import { useCallback, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Listing, ListingFilters, PaginatedResponse } from '@/lib/types';

export const useListings = (filters?: ListingFilters) => {
  const supabase = createClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchListings = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError, count } = await supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('is_approved', true)
        .eq('status', 'active')
        .range((page - 1) * 20, page * 20 - 1)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setListings(data || []);
      setPagination({
        page,
        limit: 20,
        total: count || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  return { listings, isLoading, error, pagination, fetchListings };
};

export const useCreateListing = () => {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createListing = useCallback(
    async (data: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: listing, error: insertError } = await supabase
          .from('listings')
          .insert([data])
          .select()
          .single();

        if (insertError) throw insertError;
        return listing;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create listing';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  return { createListing, isLoading, error };
};
