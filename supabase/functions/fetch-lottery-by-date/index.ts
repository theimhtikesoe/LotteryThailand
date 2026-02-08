import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const thaiMonths: Record<string, string> = {
  'มกราคม': '01',
  'กุมภาพันธ์': '02',
  'มีนาคม': '03',
  'เมษายน': '04',
  'พฤษภาคม': '05',
  'มิถุนายน': '06',
  'กรกฎาคม': '07',
  'สิงหาคม': '08',
  'กันยายน': '09',
  'ตุลาคม': '10',
  'พฤศจิกายน': '11',
  'ธันวาคม': '12',
};

function parseThaiDate(thaiDate: string): string {
  const parts = thaiDate.split(' ');
  if (parts.length !== 3) return '';
  
  const day = parts[0].padStart(2, '0');
  const month = thaiMonths[parts[1]] || '01';
  const buddhistYear = parseInt(parts[2]);
  const year = buddhistYear - 543;
  
  return `${year}-${month}-${day}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { date } = await req.json();
    
    if (!date) {
      return new Response(
        JSON.stringify({ success: false, error: 'Date is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // First check if we have this in our database
    const { data: cachedResult, error: cacheError } = await supabase
      .from('lottery_results')
      .select('*')
      .eq('draw_date', date)
      .maybeSingle();

    if (cachedResult && !cacheError) {
      return new Response(
        JSON.stringify({ success: true, data: cachedResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert date to Thai Buddhist Era format for API call
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const buddhistYear = dateObj.getFullYear() + 543;
    const dateStr = `${day}${month}${buddhistYear}`;

    console.log(`Fetching lottery data for date: ${dateStr}`);

    const response = await fetch(`https://lotto.api.rayriffy.com/lotto/${dateStr}`);
    
    if (!response.ok) {
      console.log(`API returned status ${response.status} for date ${dateStr}`);
      return new Response(
        JSON.stringify({ success: false, error: 'No results found for this date' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.status === 'error' || !data.response?.date) {
      return new Response(
        JSON.stringify({ success: false, error: 'No results found for this date' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract lottery numbers
    const prizes = data.response.prizes || [];
    const runningNumbers = data.response.runningNumbers || [];

    const first = prizes.find((p: { id: string }) => p.id === 'prizeFirst');
    const front3 = runningNumbers.find((r: { id: string }) => r.id === 'runningNumberFrontThree');
    const last3 = runningNumbers.find((r: { id: string }) => r.id === 'runningNumberBackThree');
    const last2 = runningNumbers.find((r: { id: string }) => r.id === 'runningNumberBackTwo');

    const parsedDate = parseThaiDate(data.response.date);
    
    const result = {
      draw_date: parsedDate || date,
      draw_date_thai: data.response.date,
      first_prize: first?.number?.[0] || '',
      front_3: front3?.number || [],
      last_3: last3?.number || [],
      last_2: last2?.number?.[0] || '',
      prizes: prizes,
      running_numbers: runningNumbers,
      is_latest: false,
      fetched_at: new Date().toISOString(),
    };

    // Cache the result in database
    const { error: insertError } = await supabase
      .from('lottery_results')
      .upsert(result, { onConflict: 'draw_date' });

    if (insertError) {
      console.error('Error caching result:', insertError);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-lottery-by-date:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
