import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, User, Edit, Trash2, Send, Phone, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(1000, "Comment must be less than 1000 characters"),
});

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [item, setItem] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    fetchItem();
    fetchComments();
  }, [id]);

  const fetchItem = async () => {
    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        categories(name),
        profiles(username, avatar_url, phone, full_name)
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
      setProfile(data.profiles);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles(username, avatar_url)
      `)
      .eq("item_id", id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to comment",
        variant: "destructive",
      });
      return;
    }

    // Validate comment
    try {
      commentSchema.parse({ content: newComment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase.from("comments").insert({
      item_id: id,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
      toast({
        title: "Success",
        description: "Comment added",
      });
    }
  };

  const handleDelete = async () => {
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
        description: "Item deleted",
      });
      navigate("/items");
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

  if (!item) return null;

  const isOwner = user?.id === item.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Image Section */}
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-3">
            <div className="text-base text-muted-foreground">
              Owned By: {profile?.full_name || profile?.username || "Anonymous"}
            </div>
            
            <h1 className="text-2xl font-semibold">{item.title}</h1>
            
            {item.categories && (
              <div className="text-base">
                Category: {item.categories.name}
              </div>
            )}
            
            <div className="text-xl font-semibold">
              {item.price === 0 ? "Free" : `₹${item.price}`}
            </div>

            <div className="text-base">
              {item.location || "Location not specified"}
            </div>

            {profile?.phone && (
              <div className="text-base">
                Contact: {profile.phone}
              </div>
            )}

            {item.description && (
              <div className="text-base text-muted-foreground pt-2 border-t">
                {item.description}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Badge
                className={
                  item.status === "available"
                    ? "bg-primary"
                    : item.status === "donated"
                    ? "bg-accent"
                    : ""
                }
              >
                {item.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Posted on {format(new Date(item.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {isOwner ? (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => navigate(`/items/${id}/edit`)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="default"
                  onClick={handleDelete}
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ) : (
              item.status === "available" && (
                <Button 
                  onClick={() => navigate(`/buy/${id}`)} 
                  size="lg" 
                  className="w-full mt-4"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Buy Now
                </Button>
              )
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>

          {user && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddComment}>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {comment.profiles?.username || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItemDetail;