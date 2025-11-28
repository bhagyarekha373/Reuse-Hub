import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ItemCard from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Items = () => {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    fetchCategories();
    fetchItems();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from("items")
      .select(`
        *,
        categories(name)
      `)
      .order("created_at", { ascending: false });

    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  const handleSearch = () => {
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 space-y-8">
        {/* Search Section */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Browse Items</h1>
            <p className="text-muted-foreground">
              Find sustainable treasures in your community
            </p>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Add Item Button */}
        {user && (
          <div className="flex justify-center">
            <Button onClick={() => navigate("/items/new")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              List a New Item
            </Button>
          </div>
        )}

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
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
                userId={item.user_id}
                currentUserId={user?.id}
                onDelete={fetchItems}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Items;