import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ItemCard from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Users, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    const { data } = await supabase
      .from("items")
      .select(`
        *,
        categories(name)
      `)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(8);

    setFeaturedItems(data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      {/* Featured Items Section */}
      <section className="container py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Featured Items</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover amazing items shared by our community members
          </p>
        </div>

        {featuredItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
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
            <div className="text-center">
              <Button onClick={() => navigate("/items")} size="lg">
                View All Items
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items available yet. Be the first to list an item!</p>
            <Button onClick={() => navigate("/signup")} className="mt-4">
              Get Started
            </Button>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="container space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">Simple steps to start reusing and sharing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Sign Up Free</h3>
              <p className="text-muted-foreground">
                Create your account in seconds and join our sustainable community
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Recycle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">List or Browse</h3>
              <p className="text-muted-foreground">
                Post items you want to donate or find what you need from others
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Connect & Share</h3>
              <p className="text-muted-foreground">
                Meet locally, exchange items, and make a positive impact together
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of people giving items a second life and building a more sustainable future
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/signup")}
              className="bg-white text-primary hover:bg-white/90"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/items")}
              className="bg-transparent border-2 border-white text-white hover:bg-white/10"
            >
              Browse Items
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 Reuse Hub. Empowering communities through sustainability.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
