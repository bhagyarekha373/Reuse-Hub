import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import Header from "@/components/Header";
import ItemCard from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Edit, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(50, "Username must be less than 50 characters"),
  full_name: z.string().trim().max(100, "Full name must be less than 100 characters").optional(),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
  bio: z.string().trim().max(500, "Bio must be less than 500 characters").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (e.g., +919876543210)").optional().or(z.literal("")),
});

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please login to view your profile",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setUser(session.user);
    fetchProfile(session.user.id);
    fetchMyItems(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setUsername(data.username || "");
      setFullName(data.full_name || "");
      setLocation(data.location || "");
      setBio(data.bio || "");
      setPhone(data.phone || "");
    }
  };

  const fetchMyItems = async (userId: string) => {
    const { data } = await supabase
      .from("items")
      .select(`
        *,
        categories(name)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setMyItems(data || []);
  };

  const handleSaveProfile = async () => {
    // Validate inputs
    try {
      profileSchema.parse({
        username,
        full_name: fullName || undefined,
        location: location || undefined,
        bio: bio || undefined,
        phone: phone || undefined,
      });
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

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        full_name: fullName,
        location,
        bio,
        phone,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      fetchProfile(user.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 space-y-8">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{profile?.username || "User"}</CardTitle>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your contact number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.full_name && (
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p>{profile.full_name}</p>
                  </div>
                )}
                {profile?.location && (
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p>{profile.location}</p>
                  </div>
                )}
                {profile?.phone && (
                  <div>
                    <Label className="text-muted-foreground">Phone Number</Label>
                    <p>{profile.phone}</p>
                  </div>
                )}
                {profile?.bio && (
                  <div>
                    <Label className="text-muted-foreground">Bio</Label>
                    <p className="whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Items */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="sold">Sold/Donated</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {myItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't listed any items yet</p>
                <Button onClick={() => navigate("/items/new")}>
                  List Your First Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    price={item.price}
                    imageUrl={item.image_url}
                    location={item.location}
                    status={item.status}
                    createdAt={item.created_at}
                    categoryName={item.categories?.name}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myItems
                .filter((item) => item.status === "available")
                .map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    price={item.price}
                    imageUrl={item.image_url}
                    location={item.location}
                    status={item.status}
                    createdAt={item.created_at}
                    categoryName={item.categories?.name}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="sold" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myItems
                .filter((item) => item.status !== "available")
                .map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    price={item.price}
                    imageUrl={item.image_url}
                    location={item.location}
                    status={item.status}
                    createdAt={item.created_at}
                    categoryName={item.categories?.name}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;