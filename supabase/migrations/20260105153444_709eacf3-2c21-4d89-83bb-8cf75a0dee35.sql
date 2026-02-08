-- Create lottery_results table for caching API responses
CREATE TABLE public.lottery_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_date TEXT NOT NULL UNIQUE,
  draw_date_thai TEXT NOT NULL,
  first_prize TEXT NOT NULL,
  front_3 TEXT[] NOT NULL DEFAULT '{}',
  last_3 TEXT[] NOT NULL DEFAULT '{}',
  last_2 TEXT NOT NULL,
  prizes JSONB NOT NULL DEFAULT '[]',
  running_numbers JSONB NOT NULL DEFAULT '[]',
  is_latest BOOLEAN NOT NULL DEFAULT false,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read access)
ALTER TABLE public.lottery_results ENABLE ROW LEVEL SECURITY;

-- Allow public read access (lottery results are public data)
CREATE POLICY "Lottery results are publicly readable"
ON public.lottery_results
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_lottery_results_draw_date ON public.lottery_results(draw_date);
CREATE INDEX idx_lottery_results_is_latest ON public.lottery_results(is_latest);

-- Create index for fetched_at to help with cache expiry checks
CREATE INDEX idx_lottery_results_fetched_at ON public.lottery_results(fetched_at);