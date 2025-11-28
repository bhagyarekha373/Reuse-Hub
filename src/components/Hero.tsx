import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Recycle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Hero Background with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Community sharing and reusing items"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/80" />
      </div>

      {/* Hero Content */}
      <div className="container relative z-10 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white">
            <Recycle className="h-4 w-4" />
            Empowering Communities through Sustainability
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Give Your Items a{" "}
            <span className="text-secondary">Second Life</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Connect with your community to donate, sell, or exchange unused items.
            Reduce waste, save money, and make a positive environmental impact.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate("/items")}
              className="bg-white text-primary hover:bg-white/90 group"
            >
              Browse Items
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/signup")}
              className="bg-transparent border-2 border-white text-white hover:bg-white/10"
            >
              Get Started Free
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-sm text-white/80">Active Users</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Recycle className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">5000+</div>
              <div className="text-sm text-white/80">Items Reused</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm text-white/80">Free to Use</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;