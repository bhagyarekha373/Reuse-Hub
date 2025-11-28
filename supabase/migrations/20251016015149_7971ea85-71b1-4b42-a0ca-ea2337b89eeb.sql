-- Add buyer name and address columns to orders table
ALTER TABLE public.orders
ADD COLUMN buyer_name TEXT NOT NULL DEFAULT '',
ADD COLUMN buyer_address TEXT NOT NULL DEFAULT '';

-- Update existing orders to have empty strings instead of null
UPDATE public.orders
SET buyer_name = '', buyer_address = ''
WHERE buyer_name IS NULL OR buyer_address IS NULL;