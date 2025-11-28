-- Create orders table for tracking purchases
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  buyer_message TEXT,
  buyer_contact TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = buyer_id);

-- Sellers can view orders for their items
CREATE POLICY "Sellers can view orders for their items"
ON public.orders
FOR SELECT
USING (auth.uid() = seller_id);

-- Authenticated users can create orders
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update order status
CREATE POLICY "Sellers can update order status"
ON public.orders
FOR UPDATE
USING (auth.uid() = seller_id);

-- Buyers can cancel their orders
CREATE POLICY "Buyers can cancel orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = buyer_id AND status = 'pending');

-- Create reviews table for buyer feedback
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  item_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are viewable by everyone
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews
FOR SELECT
USING (true);

-- Only buyers can create reviews for their completed orders
CREATE POLICY "Buyers can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own reviews
CREATE POLICY "Buyers can update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = buyer_id);

-- Add trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();