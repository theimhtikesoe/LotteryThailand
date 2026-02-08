import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOTTERY_API_BASE = 'https://lotto.api.rayriffy.com';

interface LotteryApiResponse {
  status: string;
  response: {
    date: string;
    endpoint: string;
    prizes: Array<{
      id: string;
      name: string;
      reward: string;
      amount: number;
      number: string[];
    }>;
    runningNumbers: Array<{
      id: string;
      name: string;
      reward: string;
      amount: number;
      number: string[];
    }>;
  };
}

function parseThaiDate(thaiDate: string): string {
  // Convert Thai date format "2 มกราคม 2569" to ISO format "2026-01-02"
  const thaiMonths: Record<string, string> = {
    'มกราคม': '01', 'กุมภาพันธ์': '02', 'มีนาคม': '03', 'เมษายน': '04',
    'พฤษภาคม': '05', 'มิถุนายน': '06', 'กรกฎาคม': '07', 'สิงหาคม': '08',
    'กันยายน': '09', 'ตุลาคม': '10', 'พฤศจิกายน': '11', 'ธันวาคม': '12'
  };
  
  const parts = thaiDate.split(' ');
  if (parts.length !== 3) return thaiDate;
  
  const day = parts[0].padStart(2, '0');
  const month = thaiMonths[parts[1]] || '01';
  // Convert Buddhist Era to Gregorian (subtract 543)
  const year = (parseInt(parts[2]) - 543).toString();
  
  return `${year}-${month}-${day}`;
}

function formatEnglishDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const drawDate = url.searchParams.get('date'); // Optional: specific date to fetch

    // Check if we have cached data that's recent (less than 1 hour old on draw days, 24 hours otherwise)
    if (!forceRefresh && !drawDate) {
      const { data: cachedData } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('is_latest', true)
        .single();

      if (cachedData) {
        const fetchedAt = new Date(cachedData.fetched_at);
        const now = new Date();
        const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);
        
        // On draw days (1st and 16th), cache for 1 hour during draw time
        const isDrawDay = now.getDate() === 1 || now.getDate() === 16;
        const isDrawTime = now.getHours() >= 14 && now.getHours() <= 17; // 2 PM - 5 PM Bangkok
        const cacheHours = (isDrawDay && isDrawTime) ? 0.5 : 6; // 30 mins on draw time, 6 hours otherwise

        if (hoursSinceFetch < cacheHours) {
          console.log('Returning cached data, fetched', hoursSinceFetch.toFixed(2), 'hours ago');
          return new Response(JSON.stringify({
            success: true,
            data: cachedData,
            cached: true,
            cachedAt: cachedData.fetched_at
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Fetch from external API
    const apiUrl = drawDate 
      ? `${LOTTERY_API_BASE}/${drawDate}` 
      : `${LOTTERY_API_BASE}/latest`;
    
    console.log('Fetching from API:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiData: LotteryApiResponse = await response.json();
    
    if (apiData.status !== 'success') {
      throw new Error('API returned unsuccessful status');
    }

    const { response: lotteryData } = apiData;

    // Extract data from API response
    const firstPrize = lotteryData.prizes.find(p => p.id === 'prizeFirst')?.number[0] || '';
    const front3 = lotteryData.runningNumbers.find(p => p.id === 'runningNumberFrontThree')?.number || [];
    const last3 = lotteryData.runningNumbers.find(p => p.id === 'runningNumberBackThree')?.number || [];
    const last2 = lotteryData.runningNumbers.find(p => p.id === 'runningNumberBackTwo')?.number[0] || '';

    const isoDate = parseThaiDate(lotteryData.date);
    const englishDate = formatEnglishDate(isoDate);

    // Prepare record for database
    const record = {
      draw_date: isoDate,
      draw_date_thai: lotteryData.date,
      first_prize: firstPrize,
      front_3: front3,
      last_3: last3,
      last_2: last2,
      prizes: lotteryData.prizes,
      running_numbers: lotteryData.runningNumbers,
      is_latest: !drawDate, // Only mark as latest if fetching latest
      fetched_at: new Date().toISOString()
    };

    // Update is_latest flag for other records if this is the latest
    if (!drawDate) {
      await supabase
        .from('lottery_results')
        .update({ is_latest: false })
        .eq('is_latest', true);
    }

    // Upsert the record (insert or update based on draw_date)
    const { data: savedData, error: saveError } = await supabase
      .from('lottery_results')
      .upsert(record, { onConflict: 'draw_date' })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving to database:', saveError);
      // Still return the fetched data even if caching fails
    }

    console.log('Successfully fetched and cached lottery results for:', englishDate);

    return new Response(JSON.stringify({
      success: true,
      data: savedData || { ...record, english_date: englishDate },
      cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-lottery function:', error);
    
    // On error, try to return cached data if available
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: cachedData } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('is_latest', true)
        .single();
      
      if (cachedData) {
        return new Response(JSON.stringify({
          success: true,
          data: cachedData,
          cached: true,
          fallback: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (cacheError) {
      console.error('Error fetching cached data:', cacheError);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
