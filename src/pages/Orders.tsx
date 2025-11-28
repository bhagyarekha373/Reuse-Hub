import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Package, CheckCircle, XCircle, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  buyer_name: string;
  buyer_address: string;
  buyer_message: string | null;
  buyer_contact: string;
  created_at: string;
}

export default function Orders() {
  const [user, setUser] = useState<any>(null);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);
    fetchOrders(user.id);
  };

  const fetchOrders = async (userId: string) => {
    setLoading(true);

    const { data: buyerData } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    const { data: sellerData } = await supabase
      .from("orders")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    setBuyerOrders(buyerData || []);
    setSellerOrders(sellerData || []);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Status updated",
      description: `Order status changed to ${status}`,
    });

    if (user) fetchOrders(user.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <Package className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "confirmed":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const OrderCard = ({ order, isSeller }: { order: Order; isSeller: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(order.status) as any} className="flex items-center gap-1">
            {getStatusIcon(order.status)}
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Buyer Name:</p>
          <p className="font-medium">{order.buyer_name}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Delivery Address:</p>
          <p className="font-medium">{order.buyer_address}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Contact:</p>
          <p className="font-medium">{order.buyer_contact}</p>
        </div>

        {order.buyer_message && (
          <div>
            <p className="text-sm text-muted-foreground">Message:</p>
            <p className="text-sm">{order.buyer_message}</p>
          </div>
        )}

        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-semibold">Payment: Cash on Delivery</p>
        </div>

        <Separator />

        {isSeller && order.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => updateOrderStatus(order.id, "confirmed")}
              className="flex-1"
            >
              Confirm Order
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateOrderStatus(order.id, "cancelled")}
            >
              Cancel
            </Button>
          </div>
        )}

        {isSeller && order.status === "confirmed" && (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, "completed")}
            className="w-full"
          >
            Mark as Completed
          </Button>
        )}

        {!isSeller && order.status === "completed" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => navigate(`/items/${order.item_id}?review=true`)}
          >
            <Star className="h-4 w-4" />
            Leave Review
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Loading orders...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8" />
            My Orders
          </h1>
          <p className="text-muted-foreground">
            Track your purchases and manage your sales
          </p>
        </div>

        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="purchases">
              My Purchases ({buyerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="sales">
              My Sales ({sellerOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="mt-6">
            {buyerOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No purchases yet</p>
                  <Button className="mt-4" onClick={() => navigate("/items")}>
                    Browse Items
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {buyerOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isSeller={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            {sellerOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No sales yet</p>
                  <Button className="mt-4" onClick={() => navigate("/items/new")}>
                    List an Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {sellerOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isSeller={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
