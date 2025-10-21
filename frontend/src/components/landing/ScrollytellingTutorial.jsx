"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";

const SCENES = [
  { 
    id: 0, 
    title: "How cross-perp funding arbitrage works (60-second tour)", 
    body: "Scroll to see it. Not financial advice.", 
    img: "/landing/scene-0-hook.svg", 
    alt: "Clean dashboard teaser" 
  },
  { 
    id: 1, 
    title: "Choose two perp DEXs", 
    body: "Hyperliquid, Aster, Lighter, Paradex, Extended.", 
    img: "/landing/scene-1-venues.svg", 
    alt: "Logos orbiting two slots A/B" 
  },
  { 
    id: 2, 
    title: "Long one, short the other", 
    body: "Hedge price risk; track the funding gap.", 
    img: null, 
    alt: "Balance scale centering with long/short badges" 
  },
  { 
    id: 3, 
    title: "Funding pays one side, charges the other", 
    body: "Illustrative PnL/day = (FA − FB) × Notional / 100 − Fees.", 
    img: null, 
    alt: "PNL bar filling with tiny ticks" 
  },
  { 
    id: 4, 
    title: "Fees, slippage, drift", 
    body: "Toggle assumptions to see impact.", 
    img: null, 
    alt: "Icons shrinking the PNL bar" 
  },
  { 
    id: 5, 
    title: "Arbitrage for everyone", 
    body: "Type an idea → get a structured plan. Open the app.", 
    img: null, 
    alt: "Flow: idea → legs → monitor → simulate" 
  },
];

const venues = ["Hyperliquid", "Aster", "Lighter", "Paradex", "Extended"];

export default function ScrollytellingTutorial() {
  const [active, setActive] = useState(0);
  const [perpA, setPerpA] = useState("Hyperliquid");
  const [perpB, setPerpB] = useState("Paradex");
  const [fa, setFa] = useState(0.05);
  const [fb, setFb] = useState(-0.02);
  const [notional, setNotional] = useState(10000);
  const [fees, setFees] = useState(2);
  const [addFees, setAddFees] = useState(false);
  const [addSlip, setAddSlip] = useState(false);
  const [addDrift, setAddDrift] = useState(false);
  const prefersReduced = useReducedMotion();

  const sectionsRef = useRef([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.3) {
            const idx = Number(e.target.dataset.step);
            if (!isNaN(idx)) setActive(idx);
          }
        }
      },
      { root: null, threshold: [0.3, 0.7] }
    );
    sectionsRef.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const pnlBase = useMemo(() => ((fa - fb) * notional) / 100 - fees, [fa, fb, notional, fees]);
  const pnlAdjusted = useMemo(() => {
    let p = pnlBase;
    if (addFees) p -= 2;
    if (addSlip) p -= notional * 0.0005;
    if (addDrift) p -= notional * 0.002;
    return p;
  }, [pnlBase, addFees, addSlip, addDrift, notional]);

  const swap = () => { 
    setPerpA(perpB); 
    setPerpB(perpA); 
    setFa(fb); 
    setFb(fa); 
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setActive(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setActive(prev => Math.min(SCENES.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section id="how-it-works" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Steps */}
        <div className="lg:col-span-5 space-y-24 py-10">
          {SCENES.map((s, i) => (
            <section
              key={s.id}
              data-step={i}
              ref={el => (sectionsRef.current[i] = el)}
              className="min-h-[80vh] flex items-center"
            >
              <div className="w-full">
                <div className="mb-3 flex flex-wrap gap-2">
                  {i === 0 && (
                    <>
                      <span className="text-xs rounded-full border border-border/50 bg-background/80 px-3 py-1.5 text-muted-foreground">
                        Non-custodial exploration
                      </span>
                      <span className="text-xs rounded-full border border-border/50 bg-background/80 px-3 py-1.5 text-muted-foreground">
                        No API keys to start
                      </span>
                    </>
                  )}
                  <span className="text-xs rounded-full bg-primary/10 text-primary px-3 py-1.5 font-medium">
                    Step {i + 1} of {SCENES.length}
                  </span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">{s.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{s.body}</p>
                
                {/* Scene 3 Calculator */}
                {i === 3 && (
                  <div className="mt-6 p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select value={perpA} onChange={v => setPerpA(v)} label="Perp A" options={venues}/>
                        <Number label="Funding A (%/day)" value={fa} onChange={setFa}/>
                        <Select value={perpB} onChange={v => setPerpB(v)} label="Perp B" options={venues}/>
                        <Number label="Funding B (%/day)" value={fb} onChange={setFb}/>
                        <Number label="Notional ($)" value={notional} onChange={setNotional}/>
                        <Number label="Fees ($/day)" value={fees} onChange={setFees}/>
                      </div>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={swap} 
                          className="rounded-xl border border-border/50 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                        >
                          Swap legs
                        </button>
                        <div aria-live="polite" className="text-right">
                          <div className="text-sm text-muted-foreground">PnL/day</div>
                          <div className={clsx("text-xl font-bold font-mono", 
                            pnlAdjusted >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {pnlAdjusted >= 0 ? '+' : ''}${pnlAdjusted.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Illustrative only; ignores slippage/borrow; NFA.
                      </p>
                    </div>
                  </div>
                )}

                {/* Scene 4 Toggles */}
                {i === 4 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <Toggle label="Add fees (+$2/day)" checked={addFees} onChange={setAddFees}/>
                      <Toggle label="Add 0.05% slippage" checked={addSlip} onChange={setAddSlip}/>
                      <Toggle label="Leg divergence 0.2%" checked={addDrift} onChange={setAddDrift}/>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="text-sm text-muted-foreground mb-2">Adjusted PnL/day</div>
                      <div className={clsx("text-lg font-bold font-mono", 
                        pnlAdjusted >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {pnlAdjusted >= 0 ? '+' : ''}${pnlAdjusted.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Sticky Graphic */}
        <div className="lg:col-span-7">
          <div className="sticky top-[10vh] h-[80vh] rounded-3xl bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20 overflow-hidden flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ 
                  opacity: prefersReduced ? 1 : 0, 
                  scale: prefersReduced ? 1 : 0.95,
                  rotateY: prefersReduced ? 0 : 15 
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotateY: 0 
                }}
                exit={{ 
                  opacity: prefersReduced ? 1 : 0, 
                  scale: prefersReduced ? 1 : 1.05,
                  rotateY: prefersReduced ? 0 : -15 
                }}
                transition={{ 
                  duration: prefersReduced ? 0 : 0.8, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  scale: { duration: prefersReduced ? 0 : 0.6 },
                  rotateY: { duration: prefersReduced ? 0 : 0.8 }
                }}
                className="relative w-full h-full"
                style={{ perspective: '1000px' }}
              >
                {/* Dynamic Background Elements */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{
                    background: [
                      `radial-gradient(circle at ${20 + active * 15}% ${30 + active * 10}%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`,
                      `radial-gradient(circle at ${80 - active * 10}% ${70 - active * 15}%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
                      `radial-gradient(circle at ${40 + active * 20}% ${50 + active * 5}%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)`
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                />

                {/* Floating Particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`particle-${active}-${i}`}
                    className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: `${15 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, 10, 0],
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}

                {/* Scene Visual or Placeholder */}
                {SCENES[active].img ? (
                  <motion.div
                    className="relative w-full h-full flex items-center justify-center"
                    animate={{ 
                      y: [0, -5, 0],
                      rotateX: [0, 2, 0] 
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  >
                    <Image
                      src={SCENES[active].img}
                      alt={SCENES[active].alt}
                      fill
                      priority={active === 0}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-contain drop-shadow-2xl"
                      onError={() => console.log(`Image failed to load: ${SCENES[active].img}`)}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    className="w-full h-full flex items-center justify-center"
                    animate={{ 
                      rotateY: [0, 5, 0],
                      scale: [1, 1.02, 1] 
                    }}
                    transition={{ 
                      duration: 6, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  >
                    <div className="text-center space-y-6 p-8 relative">
                      {/* Morphing Shape */}
                      <motion.div
                        className="w-32 h-32 mx-auto relative"
                        animate={{
                          borderRadius: [
                            "60% 40% 30% 70%/60% 30% 70% 40%",
                            "30% 60% 70% 40%/50% 60% 30% 60%",
                            "60% 40% 30% 70%/60% 30% 70% 40%"
                          ]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 opacity-80"></div>
                        <div className="absolute inset-2 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                          <motion.div 
                            className="text-3xl font-bold text-white"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, 0] 
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              delay: active * 0.2 
                            }}
                          >
                            {active + 1}
                          </motion.div>
                        </div>
                      </motion.div>
                      
                      {/* Glowing rings */}
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-48 h-48 border border-white/30 rounded-full"></div>
                      </motion.div>
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-64 h-64 border border-purple-300/20 rounded-full"></div>
                      </motion.div>

                      <div className="relative z-10 space-y-3">
                        <motion.div 
                          className="text-xl font-bold text-foreground"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          Scene {active + 1}
                        </motion.div>
                        <motion.div 
                          className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {SCENES[active].alt}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Scene 3 Overlay */}
                {active === 3 && (
                  <motion.div
                    className="absolute bottom-6 left-6 right-6 rounded-xl border border-border/50 bg-background/90 backdrop-blur-md p-4 shadow-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-sm text-muted-foreground mb-2">Live PnL Calculation</div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={clsx("h-3 rounded-full", 
                          pnlAdjusted >= 0 ? "bg-green-500" : "bg-red-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min(Math.max((Math.abs(pnlAdjusted) / 200) * 100, 5), 100)}%` 
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Formula: (FA - FB) × Notional / 100 - Fees
                    </div>
                  </motion.div>
                )}

                {/* Scene 4 Risk Overlay */}
                {active === 4 && (
                  <motion.div
                    className="absolute top-6 left-6 right-6 rounded-xl border border-border/50 bg-background/90 backdrop-blur-md p-4 shadow-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-sm font-medium mb-3">Risk Factors Impact</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Base PnL:</span>
                        <span className="text-sm font-mono">${pnlBase.toFixed(2)}</span>
                      </div>
                      {addFees && (
                        <div className="flex justify-between items-center text-red-600">
                          <span className="text-xs">Extra fees:</span>
                          <span className="text-sm font-mono">-$2.00</span>
                        </div>
                      )}
                      {addSlip && (
                        <div className="flex justify-between items-center text-red-600">
                          <span className="text-xs">Slippage:</span>
                          <span className="text-sm font-mono">-${(notional * 0.0005).toFixed(2)}</span>
                        </div>
                      )}
                      {addDrift && (
                        <div className="flex justify-between items-center text-red-600">
                          <span className="text-xs">Divergence:</span>
                          <span className="text-sm font-mono">-${(notional * 0.002).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-border/50 pt-2 flex justify-between items-center font-medium">
                        <span className="text-sm">Adjusted PnL:</span>
                        <span className={clsx("text-sm font-mono", 
                          pnlAdjusted >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          ${pnlAdjusted.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-30">
        <div className="bg-background/90 backdrop-blur-md rounded-full border border-border/50 p-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-1 bg-primary rounded-full"
              style={{ width: `${((active + 1) / SCENES.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground mt-1">
            {active + 1} of {SCENES.length}
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      <motion.a
        href="/app/funding-comparison"
        className="fixed z-40 bottom-5 right-5 lg:right-8 rounded-2xl shadow-lg px-6 py-3 bg-foreground text-background font-medium hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Open the App
      </motion.a>
    </section>
  );
}

// UI Helper Components
function Select({ label, value, onChange, options }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select 
        className="w-full rounded-xl border border-border/50 px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary" 
        value={value} 
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Number({ label, value, onChange }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        className="w-full rounded-xl border border-border/50 px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        step="0.01"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        "rounded-xl border border-border/50 px-4 py-2 text-sm transition-all duration-200",
        checked 
          ? "bg-foreground text-background border-foreground" 
          : "bg-background hover:bg-muted/50"
      )}
      aria-pressed={checked}
    >
      {label}
    </button>
  );
}