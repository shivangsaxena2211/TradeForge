import { LandingAbout } from "./landing-about";
import { LandingContact } from "./landing-contact";
import { LandingFeatures } from "./landing-features";
import { LandingFooter } from "./landing-footer";
import { LandingHero } from "./landing-hero";
import { LandingNavbar } from "./landing-navbar";
import { LandingTerms } from "./landing-terms";
import { ParticleBackground } from "./particle-background";

export function LandingPage() {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-[#050505] text-foreground scroll-smooth">
      <ParticleBackground />

      <div
        className="pointer-events-none fixed top-0 left-1/2 z-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[150px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed right-0 bottom-0 z-0 h-[600px] w-[600px] rounded-full bg-emerald-600/5 blur-[150px]"
        aria-hidden="true"
      />

      <LandingNavbar />
      <main className="relative z-10">
        <LandingHero />
        <LandingFeatures />
        <LandingAbout />
        <LandingTerms />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}
