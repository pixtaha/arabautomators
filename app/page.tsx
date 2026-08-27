import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { StatsBar } from "@/components/home/StatsBar";
import { CourseToc } from "@/components/home/CourseToc";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <CourseToc />
      </main>
      <Footer />
    </div>
  );
}
