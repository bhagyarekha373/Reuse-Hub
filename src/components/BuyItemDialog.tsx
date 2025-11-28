import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Phone, MessageSquare } from "lucide-react";
import { z } from "zod";

const buyerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  address: z.string().trim().min(10, "Address must be at least 10 characters").max(500),
  contact: z.string().min(10, "Contact must be at least 10 characters").max(100),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

interface BuyItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  itemPrice: number;
  sellerId: string;
}

export function BuyItemDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  itemPrice,
  sellerId,
}: BuyItemDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = buyerSchema.parse({ name, address, contact, message });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to place an order",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      setIsSubmitting(true);

      const { error } = await supabase.from("orders").insert({
        item_id: itemId,
        buyer_id: user.id,
        seller_id: sellerId,
        buyer_name: validated.name,
        buyer_address: validated.address,
        buyer_contact: validated.contact,
        buyer_message: validated.message || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Order placed successfully!",
        description: "The seller will contact you soon.",
      });

      onOpenChange(false);
      setName("");
      setAddress("");
      setContact("");
      setMessage("");
      navigate("/orders");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to place order. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Buy Item
          </DialogTitle>
          <DialogDescription>
            Fill in your contact details to purchase "{itemTitle}" for ${itemPrice}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter your complete delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                required
                minLength={10}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact (Phone/Email) *
              </Label>
              <Input
                id="contact"
                placeholder="Enter your phone number or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                minLength={10}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message to Seller (Optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Any questions or special requests?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-semibold">Payment Method: Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">
                Pay in cash when you receive the item. The seller will contact you to arrange delivery.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
