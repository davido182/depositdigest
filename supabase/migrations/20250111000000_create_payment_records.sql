-- Create payment_records table
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  paid BOOLEAN NOT NULL DEFAULT false,
  amount DECIMAL(10, 2) DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Unique constraint: one record per tenant per month per year
  UNIQUE(tenant_id, year, month)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_records_landlord ON public.payment_records(landlord_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_tenant ON public.payment_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_year_month ON public.payment_records(year, month);

-- Enable Row Level Security
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment records"
  ON public.payment_records
  FOR SELECT
  USING (landlord_id = auth.uid());

CREATE POLICY "Users can insert their own payment records"
  ON public.payment_records
  FOR INSERT
  WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Users can update their own payment records"
  ON public.payment_records
  FOR UPDATE
  USING (landlord_id = auth.uid())
  WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Users can delete their own payment records"
  ON public.payment_records
  FOR DELETE
  USING (landlord_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.payment_records IS 'Stores monthly payment records for each tenant';
