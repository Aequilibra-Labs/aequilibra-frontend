// Landing page copy constants
export const COPY = {
  hero: {
    headline: "Arbitrage for everyone",
    subhead: "Build delta-neutral strategies and optimize them—without wiring exchange APIs or smart contracts. Simply input your idea.",
    primaryCTA: "Open the App",
    secondaryCTA: "How it works",
    microNotes: [
      "Non-custodial exploration",
      "No API keys to start"
    ],
    heroImageTitle: "hero-arbitrage-for-everyone",
    heroImageAlt: "Clean dashboard mock of retail-friendly arbitrage tools"
  },

  explainerArb101: {
    title: "Arbitrage 101",
    toggles: {
      what: {
        question: "What is arbitrage?",
        answer: "Buy where it's cheaper, sell where it's pricier—at essentially the same time—to capture the difference."
      },
      why: {
        question: "Why usually institutional?",
        answer: "Latency, capital, connectivity, and tooling barriers."
      },
      change: {
        question: "What we change",
        answer: "Idea-first. Prototype strategies without exchange integrations or smart contracts."
      }
    },
    comparison: {
      retail: [
        "Retail today: manual, scattered tools, hard to backtest.",
        "With Aequilibra: consolidate, simulate, compare.",
        "Goal: lower tooling friction, keep you in control."
      ]
    },
    imageTitle: "explainer-arb-101-diagram",
    imageAlt: "Simple two-venue price spread sketch"
  },

  explainerFunding: {
    title: "Cross-Perp Funding Explorer",
    perps: ["Hyperliquid", "Aster", "Lighter", "Paradex", "Extended"],
    defaults: {
      perpA: "Hyperliquid",
      fundingA: 0.05,
      perpB: "Paradex", 
      fundingB: -0.02,
      notional: 10000,
      fees: 2
    },
    disclaimer: "Illustrative only. Funding varies. Not financial advice.",
    assumptions: "No slippage, instant fills, symmetric legs, ignores borrow costs, for demo only.",
    imageTitle: "funding-basis-curves",
    imageAlt: "Two funding rate lines over time"
  },

  explainerStrategy: {
    title: "Strategy Builder Teaser",
    placeholder: "Describe your idea…",
    template: {
      objective: "Extract funding differential",
      legs: "Long HL perp / Short Paradex perp",
      hedge: "Delta-neutral, rebalance threshold 0.5%",
      monitors: "Funding drift, fees, divergence",
      nextStep: "Open in Strategy Builder"
    },
    imageTitle: "strategy-flow-diagram",
    imageAlt: "Flow from idea → legs → monitor → simulate"
  },

  supportedPerps: {
    title: "Supported Perps",
    perps: [
      { name: "Hyperliquid", label: "Perp DEX" },
      { name: "Aster", label: "Perp DEX" },
      { name: "Lighter", label: "Perp DEX" },
      { name: "Paradex", label: "Perp DEX" },
      { name: "Extended", label: "Perp DEX" }
    ],
    note: "List is illustrative. Coverage evolves.",
    imageTitle: "perp-dex-mosaic",
    imageAlt: "Mosaic of supported DEX logos"
  },

  trustNotes: {
    title: "Trust & Notes",
    points: [
      { title: "Non-custodial exploration", desc: "keep your keys; start without API access" },
      { title: "Idea-first tooling", desc: "design strategies before integrations" },
      { title: "Transparent math", desc: "simple demo calculators, editable inputs" },
      { title: "Disclaimer", desc: "For education only. Not financial advice." }
    ],
    imageTitle: "security-non-custodial",
    imageAlt: "Shield icon with wallet"
  },

  faq: {
    title: "FAQ",
    questions: [
      {
        q: "What is cross-perp funding arbitrage?",
        a: "A delta-neutral long/short across two perp venues to capture funding differences."
      },
      {
        q: "Do I need exchange API keys?",
        a: "Not to explore ideas. You can prototype first."
      },
      {
        q: "Does this place trades?",
        a: "No. The landing demo is educational. The app guides strategy design and comparison."
      },
      {
        q: "Is profit guaranteed?",
        a: "No. Markets move. Fees, slippage, and execution matter."
      }
    ]
  },

  footerCTA: {
    text: "Ready to experiment?",
    button: "Open the App"
  }
};