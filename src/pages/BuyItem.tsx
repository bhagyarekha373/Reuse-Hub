import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Phone, MessageSquare, ArrowLeft, Package } from "lucide-react";
import Header from "@/components/Header";
import { z } from "zod";

const buyerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  address: z.string().trim().min(10, "Address must be at least 10 characters").max(500),
  contact: z.string().min(10, "Contact must be at least 10 characters").max(100),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

export default function BuyItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        categories(name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Item not found",
        variant: "destructive",
      });
      navigate("/items");
    } else {
      setItem(data);
    }
    setLoading(false);
  };

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

      if (!item) return;

      setIsSubmitting(true);

      const { error } = await supabase.from("orders").insert({
        item_id: item.id,
        buyer_id: user.id,
        seller_id: item.user_id,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Item Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-2xl font-bold text-primary">
                  {item.price === 0 ? "Free" : `₹${item.price}`}
                </span>
              </div>
              {item.location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm">{item.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Buyer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    maxLength={500}
                  />
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm font-semibold">Payment Method: Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Pay in cash when you receive the item. The seller will contact you to arrange delivery.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
