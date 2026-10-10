import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Professionals from "@/components/landing/Professionals";
import Safety from "@/components/landing/Safety";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf9ff] text-[#17151f]">
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Professionals />
        <Safety />
      </main>

      <Footer />
    </div>
  );
}