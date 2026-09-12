export function LandingTerms() {
  return (
    <section
      id="terms"
      className="relative z-10 scroll-mt-24 border-y border-white/5 bg-black/40 py-20 backdrop-blur-sm sm:py-24"
      aria-labelledby="terms-heading"
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 id="terms-heading" className="text-2xl font-bold sm:text-3xl">
          Terms & Conditions
        </h2>
        <div className="mt-6 space-y-4 text-left text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            DEFINN is a simulated trading environment intended for educational
            and demonstration purposes only.
          </p>
          <p>
            No real monetary transactions take place on this platform. Virtual
            cash, portfolio values, and trade outcomes are simulated and have no
            real-world financial value.
          </p>
          <p>
            No orders are submitted to NSE, BSE, or any real brokerage or
            exchange. The displayed stocks represent simulated trading
            instruments based on the project&apos;s market and reference data.
          </p>
          <p>
            Blockchain transaction records demonstrate traceability within the
            local simulation environment. They do not constitute real securities
            settlement or custody.
          </p>
          <p>
            By creating an account, you acknowledge that DEFINN is an academic
            prototype and agree to use it only for learning and demonstration.
          </p>
        </div>
      </div>
    </section>
  );
}
