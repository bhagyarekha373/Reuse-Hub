import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  location?: string;
  status: string;
  createdAt: string;
  categoryName?: string;
  userId?: string;
  currentUserId?: string;
  onDelete?: () => void;
}

const ItemCard = ({
  id,
  title,
  description,
  price,
  imageUrl,
  location,
  status,
  createdAt,
  categoryName,
  userId,
  currentUserId,
  onDelete,
}: ItemCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const isOwner = currentUserId && userId && currentUserId === userId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      onDelete?.();
    }
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/buy/${id}`);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-[var(--shadow-hover)] group"
      onClick={() => navigate(`/items/${id}`)}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {status === "available" && (
            <Badge className="bg-primary text-primary-foreground">
              Available
            </Badge>
          )}
          {status === "sold" && (
            <Badge variant="secondary">Sold</Badge>
          )}
          {status === "donated" && (
            <Badge className="bg-accent text-accent-foreground">
              Donated
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="text-lg font-bold text-primary whitespace-nowrap">
            {price === 0 ? "Free" : `₹${price}`}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{location || "Location not set"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(createdAt), "MMM d")}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {categoryName && (
            <Badge variant="outline" className="text-xs">
              {categoryName}
            </Badge>
          )}
          {isOwner ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="ml-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            status === "available" && (
              <Button
                size="sm"
                onClick={handleBuyClick}
                className="ml-auto"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemCard;