import { HomeFeatures, HomeHero, FeaturedStory } from "@/components/home";
import { MainLayout } from "@/components/layout";

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen">
        <FeaturedStory />
        <HomeHero />
        <HomeFeatures />
      </div>
    </MainLayout>
  );
}
