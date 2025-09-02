import { MainLayout } from "@/components/layout";
import { HomeHero, HomeStats, HomeFeatures } from "@/components/home";

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen">
        <HomeHero />
        <HomeStats />
        <HomeFeatures />
      </div>
    </MainLayout>
  );
}