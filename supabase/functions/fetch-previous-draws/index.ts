import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOTTERY_API_BASE = 'https://lotto.api.rayriffy.com';

// Thai months mapping
const thaiMonths: Record<string, string> = {
  'มกราคม': '01', 'กุมภาพันธ์': '02', 'มีนาคม': '03', 'เมษายน': '04',
  'พฤษภาคม': '05', 'มิถุนายน': '06', 'กรกฎาคม': '07', 'สิงหาคม': '08',
  'กันยายน': '09', 'ตุลาคม': '10', 'พฤศจิกายน': '11', 'ธันวาคม': '12'
};

function parseThaiDate(thaiDate: string): string {
  const parts = thaiDate.split(' ');
  if (parts.length !== 3) return thaiDate;
  
  const day = parts[0].padStart(2, '0');
  const month = thaiMonths[parts[1]] || '01';
  const year = (parseInt(parts[2]) - 543).toString();
  
  return `${year}-${month}-${day}`;
}

// Generate draw date strings in Buddhist Era format (DDMMYYYY)
function getRecentDrawDates(count: number = 5): string[] {
  const dates: string[] = [];
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  // Skip the current/latest draw and go backwards
  while (dates.length < count) {
    // Calculate previous draw date
    if (day > 16) {
      day = 16;
    } else if (day > 1) {
      day = 1;
    } else {
      // Move to previous month
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
      day = 16;
    }

    const drawDate = new Date(year, month, day);
    
    // Only add dates in the past (not today or future)
    if (drawDate < now) {
      // Format as DDMMYYYY in Buddhist Era
      const buddhistYear = year + 543;
      const dateStr = `${day.toString().padStart(2, '0')}${(month + 1).toString().padStart(2, '0')}${buddhistYear}`;
      dates.push(dateStr);
    }

    // Move to previous draw slot
    if (day === 16) {
      day = 1;
    } else {
      day = 16;
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    }
  }

  return dates;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // First, check if we have enough cached draws (excluding current)
    const { data: cachedDraws } = await supabase
      .from('lottery_results')
      .select('*')
      .eq('is_latest', false)
      .order('draw_date', { ascending: false })
      .limit(limit);

    if (cachedDraws && cachedDraws.length >= limit) {
      console.log('Returning cached previous draws:', cachedDraws.length);
      return new Response(JSON.stringify({
        success: true,
        data: cachedDraws,
        cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch historical draws from API
    const drawDates = getRecentDrawDates(limit + 1); // Get extra in case some fail
    const results: any[] = cachedDraws ? [...cachedDraws] : [];
    const existingDates = new Set(results.map(r => r.draw_date));

    console.log('Fetching historical draws:', drawDates);

    for (const dateStr of drawDates) {
      if (results.length >= limit) break;

      try {
        // Fetch from API using /lotto/{id} endpoint
        console.log(`Fetching draw: ${dateStr}`);
        const response = await fetch(`${LOTTERY_API_BASE}/lotto/${dateStr}`);
        
        if (!response.ok) {
          console.log(`Failed to fetch ${dateStr}: ${response.status}`);
          continue;
        }

        const apiData = await response.json();
        
        if (apiData.status !== 'success' || !apiData.response) {
          console.log(`Invalid response for ${dateStr}`);
          continue;
        }

        const { response: lotteryData } = apiData;
        const isoDate = parseThaiDate(lotteryData.date);

        // Skip if we already have this date
        if (existingDates.has(isoDate)) {
          continue;
        }

        const firstPrize = lotteryData.prizes.find((p: any) => p.id === 'prizeFirst')?.number[0] || '';
        const front3 = lotteryData.runningNumbers.find((p: any) => p.id === 'runningNumberFrontThree')?.number || [];
        const last3 = lotteryData.runningNumbers.find((p: any) => p.id === 'runningNumberBackThree')?.number || [];
        const last2 = lotteryData.runningNumbers.find((p: any) => p.id === 'runningNumberBackTwo')?.number[0] || '';

        const record = {
          draw_date: isoDate,
          draw_date_thai: lotteryData.date,
          first_prize: firstPrize,
          front_3: front3,
          last_3: last3,
          last_2: last2,
          prizes: lotteryData.prizes,
          running_numbers: lotteryData.runningNumbers,
          is_latest: false,
          fetched_at: new Date().toISOString()
        };

        // Cache the result
        const { data: savedData, error } = await supabase
          .from('lottery_results')
          .upsert(record, { onConflict: 'draw_date' })
          .select()
          .single();

        if (error) {
          console.error(`Error saving ${dateStr}:`, error);
          results.push(record);
        } else {
          results.push(savedData);
          console.log(`Cached draw: ${lotteryData.date}`);
        }

        existingDates.add(isoDate);
      } catch (err) {
        console.error(`Error fetching ${dateStr}:`, err);
      }
    }

    // Sort by date descending and limit
    results.sort((a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime());
    const limitedResults = results.slice(0, limit);

    return new Response(JSON.stringify({
      success: true,
      data: limitedResults,
      cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-previous-draws:', error);
    
    // Try to return whatever cached data we have
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: cachedDraws } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('is_latest', false)
        .order('draw_date', { ascending: false })
        .limit(5);
      
      if (cachedDraws && cachedDraws.length > 0) {
        return new Response(JSON.stringify({
          success: true,
          data: cachedDraws,
          cached: true,
          fallback: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (cacheError) {
      console.error('Error fetching fallback data:', cacheError);
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
