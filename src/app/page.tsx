import { HomeFeatures, HomeHero, HomeStatsClient } from "@/components/home";
import { MainLayout } from "@/components/layout";

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen">
        <HomeHero />
        <HomeStatsClient />
        <HomeFeatures />
      </div>
    </MainLayout>
  );
}
