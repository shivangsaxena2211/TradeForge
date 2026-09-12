import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: {
    absolute: "DEFINN | Blockchain-Based Stock Trading Simulation Platform",
  },
  description:
    "DEFINN is an academic blockchain-powered stock trading simulation with realistic market data, virtual funds, smart-contract execution, and transparent on-chain transaction records.",
};

export default function Home() {
  return <LandingPage />;
}
