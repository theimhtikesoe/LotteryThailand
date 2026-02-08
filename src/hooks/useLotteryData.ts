import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LotteryResult, PreviousDraw } from '@/types/lottery';
import { format } from 'date-fns';

interface PrizeItem {
  id: string;
  name: string;
  reward: string;
  amount: number;
  number: string[];
}

interface LotteryApiResult {
  id: string;
  draw_date: string;
  draw_date_thai: string;
  first_prize: string;
  front_3: string[];
  last_3: string[];
  last_2: string;
  prizes: PrizeItem[];
  running_numbers: PrizeItem[];
  is_latest: boolean;
  fetched_at: string;
}

function formatEnglishDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function formatPrizeAmount(amount: string): string {
  return parseInt(amount).toLocaleString();
}

function transformToLotteryResult(data: LotteryApiResult): LotteryResult {
  // Transform prizes from API format to our format, keeping the ID
  const prizes = data.prizes.map(p => ({
    id: p.id,
    name: p.name,
    numbers: p.number,
    amount: formatPrizeAmount(p.reward)
  }));

  // Check if the result is for the current expected draw date
  const resultDate = new Date(data.draw_date);
  const now = new Date();
  const currentExpectedDraw = getExpectedDrawDate(now);
  
  // Results are considered "waiting" if we're past the expected draw date
  // but don't have results for it yet
  const isResultCurrent = resultDate.getTime() >= currentExpectedDraw.getTime();
  const status = isResultCurrent ? 'updated' : 'waiting';

  return {
    drawDate: formatEnglishDate(data.draw_date),
    drawTime: '15:00',
    isLatest: data.is_latest,
    status: status as 'waiting' | 'updated',
    firstPrize: data.first_prize,
    front3: data.front_3,
    last3: data.last_3,
    last2: data.last_2,
    prizes,
    fetchedAt: data.fetched_at
  };
}

// Get the expected draw date (1st or 16th of current/previous month)
function getExpectedDrawDate(now: Date): Date {
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  if (day >= 16) {
    // We expect results from the 16th
    return new Date(year, month, 16);
  } else if (day >= 1) {
    // We expect results from the 1st
    return new Date(year, month, 1);
  }
  
  // Fallback to previous month's 16th
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return new Date(prevYear, prevMonth, 16);
}

function transformToPreviousDraw(data: LotteryApiResult): PreviousDraw {
  const prizes = data.prizes.map(p => ({
    id: p.id,
    name: p.name,
    numbers: p.number,
    amount: formatPrizeAmount(p.reward)
  }));

  return {
    drawDate: formatEnglishDate(data.draw_date),
    firstPrize: data.first_prize,
    front3: data.front_3,
    last3: data.last_3,
    last2: data.last_2,
    prizes
  };
}

export function useLatestLotteryResult() {
  const queryClient = useQueryClient();

  // Set up real-time subscription for automatic updates
  useEffect(() => {
    const channel = supabase
      .channel('lottery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lottery_results',
        },
        (payload) => {
          console.log('Lottery results updated:', payload);
          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ['lottery'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['lottery', 'latest'],
    queryFn: async (): Promise<LotteryResult> => {
      // First try to get from cache
      const { data: cachedData, error: cacheError } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('is_latest', true)
        .maybeSingle();

      // If we have recent cached data, use it
      if (cachedData && !cacheError) {
        const fetchedAt = new Date(cachedData.fetched_at);
        const now = new Date();
        const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);
        
        // Use cache if less than 6 hours old
        if (hoursSinceFetch < 6) {
          return transformToLotteryResult(cachedData as unknown as LotteryApiResult);
        }
      }

      // Fetch fresh data from edge function
      const { data, error } = await supabase.functions.invoke('fetch-lottery');
      
      if (error) {
        console.error('Error fetching lottery data:', error);
        // Return cached data as fallback
        if (cachedData) {
          return transformToLotteryResult(cachedData as unknown as LotteryApiResult);
        }
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch lottery data');
      }

      return transformToLotteryResult(data.data);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // Also poll every 5 minutes on draw days as backup
  });
}

export function usePreviousDraws(limit: number = 5) {
  return useQuery({
    queryKey: ['lottery', 'previous', limit],
    queryFn: async (): Promise<PreviousDraw[]> => {
      // First try to get from cache
      const { data: cachedDraws, error: cacheError } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('is_latest', false)
        .order('draw_date', { ascending: false })
        .limit(limit);

      // If we have enough cached draws, use them
      if (cachedDraws && cachedDraws.length >= limit && !cacheError) {
        return cachedDraws.map(d => transformToPreviousDraw(d as unknown as LotteryApiResult));
      }

      // Fetch from edge function
      const { data, error } = await supabase.functions.invoke('fetch-previous-draws', {
        body: { limit }
      });

      if (error) {
        console.error('Error fetching previous draws:', error);
        // Return whatever cached data we have
        if (cachedDraws && cachedDraws.length > 0) {
          return cachedDraws.map(d => transformToPreviousDraw(d as unknown as LotteryApiResult));
        }
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch previous draws');
      }

      return data.data.map((d: LotteryApiResult) => transformToPreviousDraw(d));
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useSearchLotteryByDate() {
  return useMutation({
    mutationFn: async (date: Date): Promise<PreviousDraw | null> => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // First try to find in local cache/database
      const { data: cachedResult, error: cacheError } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('draw_date', dateStr)
        .maybeSingle();

      if (cachedResult && !cacheError) {
        return transformToPreviousDraw(cachedResult as unknown as LotteryApiResult);
      }

      // If not in cache, try to fetch from edge function
      const { data, error } = await supabase.functions.invoke('fetch-lottery-by-date', {
        body: { date: dateStr }
      });

      if (error) {
        console.error('Error searching lottery by date:', error);
        return null;
      }

      if (!data.success || !data.data) {
        return null;
      }

      return transformToPreviousDraw(data.data);
    },
  });
}
