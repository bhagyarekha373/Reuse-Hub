import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().min(1, "Description is required").max(5000, "Description must be less than 5000 characters"),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (e.g., +919876543210)").optional().or(z.literal("")),
  price: z.number().min(0, "Price cannot be negative").max(1000000, "Price too high"),
});

const CreateEditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchCategories();
    if (isEdit) {
      fetchItem();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please login to create or edit items",
        variant: "destructive",
      });
      navigate("/login");
    } else {
      setUser(session.user);
      // Fetch user profile to get phone number
      const { data: profileData } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", session.user.id)
        .single();
      
      if (profileData?.phone) {
        setPhone(profileData.phone);
      }
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const fetchItem = async () => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Item not found",
        variant: "destructive",
      });
      navigate("/items");
      return;
    }

    if (data.user_id !== user?.id) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own items",
        variant: "destructive",
      });
      navigate("/items");
      return;
    }

    setTitle(data.title);
    setDescription(data.description);
    setPrice(data.price.toString());
    setLocation(data.location || "");
    setCategoryId(data.category_id || "");
    setImageUrl(data.image_url || "");
    
    // Fetch seller's phone from profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", data.user_id)
      .single();
    
    if (profileData?.phone) {
      setPhone(profileData.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    try {
      itemSchema.parse({
        title,
        description,
        location: location || undefined,
        phone: phone || undefined,
        price: parseFloat(price) || 0,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    // Update user's phone number in profile
    if (phone) {
      await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", user.id);
    }

    let uploadedImageUrl = imageUrl;

    // Upload new image if selected
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("item-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("item-images")
        .getPublicUrl(fileName);

      uploadedImageUrl = publicUrl;
    }

    const itemData = {
      title,
      description,
      price: parseFloat(price) || 0,
      location,
      category_id: categoryId || null,
      image_url: uploadedImageUrl || null,
      user_id: user.id,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("items")
        .update(itemData)
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update item",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
        navigate(`/items/${id}`);
      }
    } else {
      const { data, error } = await supabase
        .from("items")
        .insert([itemData])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create item",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item created successfully",
        });
        navigate(`/items/${data.id}`);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEdit ? "Edit Item" : "List a New Item"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Vintage Wooden Chair"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0 for free"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown, City Name"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your contact number will be visible to interested buyers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Item Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5242880) {
                        toast({
                          title: "Error",
                          description: "Image must be less than 5MB",
                          variant: "destructive",
                        });
                        e.target.value = "";
                        return;
                      }
                      setImageFile(file);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image (max 5MB, jpg/png/webp/gif)
                </p>
                {imageUrl && !imageFile && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Current item"
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Saving..." : isEdit ? "Update Item" : "Create Item"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateEditItem;