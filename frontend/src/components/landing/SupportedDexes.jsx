'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

function formatCurrency(amount) {
  if (amount >= 1e9) {
    return `$${(amount / 1e9).toFixed(2)}B`;
  } else if (amount >= 1e6) {
    return `$${(amount / 1e6).toFixed(0)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

const staticDexes = [
  {
    name: 'Hyperliquid',
    logo: '/hyprliquid.png',
    description: 'High-performance perpetual DEX',
    chains: ['Hyperliquid L1'],
    status: 'active',
    apiName: 'Hyperliquid Perps'
  },
  {
    name: 'EdgeX',
    logo: '/edgex.png',
    description: 'Advanced derivatives platform',
    chains: ['Arbitrum'],
    status: 'active',
    apiName: 'edgeX Perps'
  },
  {
    name: 'Extended',
    logo: '/extended.png',
    description: 'Innovative derivatives exchange',
    chains: ['Arbitrum'],
    status: 'active',
    apiName: 'Extended'
  },
  {
    name: 'Hibachi',
    logo: '/hibachi.png',
    description: 'High-yield perpetual DEX',
    chains: ['Arbitrum'],
    status: 'active',
    apiName: 'Hibachi'
  }
];

const comingSoonDexes = [
  {
    name: 'Jupiter Perps',
    description: 'Solana-based perpetual exchange',
    chains: ['Solana'],
    expectedVolume: '$860M+'
  },
  {
    name: 'Drift Trade',
    description: 'High-yield perpetual DEX',
    chains: ['Solana'],
    expectedVolume: '$480M+'
  },
  {
    name: 'Orderly',
    description: 'Cross-chain orderbook DEX',
    chains: ['NEAR', 'Ethereum'],
    expectedVolume: '$440M+'
  },
  {
    name: 'dYdX V4',
    description: 'Leading derivatives exchange',
    chains: ['dYdX Chain'],
    expectedVolume: '$220M+'
  },
  {
    name: 'Paradex',
    description: 'StarkNet derivatives platform',
    chains: ['StarkNet'],
    expectedVolume: '$210M+'
  }
];

const chains = [
  { name: 'Hyperliquid L1', icon: '/hyprliquid.png', color: 'from-blue-400 to-purple-600' },
  { name: 'Arbitrum', icon: '/chain-icons/arb.svg', color: 'from-blue-500 to-cyan-400' },
  { name: 'StarkNet', icon: '/chain-icons/eth.svg', color: 'from-purple-500 to-purple-700' },
  { name: 'dYdX Chain', icon: '/chain-icons/eth.svg', color: 'from-gray-600 to-gray-800' },
  { name: 'NEAR', icon: '/chain-icons/eth.svg', color: 'from-green-400 to-green-600' },
  { name: 'Ethereum', icon: '/chain-icons/eth.svg', color: 'from-blue-400 to-blue-600' }
];

export function SupportedDexes() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const [dexes, setDexes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDexData() {
      try {
        // Import the DefiLlamaAPI dynamically to avoid SSR issues
        const { DefiLlamaAPI } = await import('@/lib/defilamaAPI');
        const data = await DefiLlamaAPI.getAllProtocolsData();
        
        // Map static dex info with live volume data
        const updatedDexes = staticDexes.map(dex => {
          const apiData = data.allProtocols.find(protocol => 
            protocol.name === dex.apiName || protocol.name.includes(dex.name)
          );
          
          return {
            ...dex,
            volume24h: apiData ? formatCurrency(apiData.volume24h) : 'N/A',
            change24h: apiData ? apiData.change24h : 0,
            rawVolume: apiData ? apiData.volume24h : 0
          };
        });
        
        // Sort by volume (highest first)
        updatedDexes.sort((a, b) => b.rawVolume - a.rawVolume);
        
        setDexes(updatedDexes);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching DEX data:', err);
        // Fallback to static data
        setDexes(staticDexes.map(dex => ({
          ...dex,
          volume24h: 'Loading...',
          change24h: 0,
          rawVolume: 0
        })));
        setLoading(false);
      }
    }

    fetchDexData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const chainVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "backOut"
      }
    }
  };

  return (
    <section className="w-full px-4 py-16 md:py-24 bg-muted/30 relative overflow-hidden" ref={ref}>
      {/* Background animation */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(103, 232, 249, 0.1) 0%, transparent 50%)'
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div 
        className="relative mx-auto max-w-7xl"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <motion.div 
          className="text-center space-y-4 mb-16"
          variants={cardVariants}
        >
          <h2 className="text-3xl md:text-5xl font-bold section-title">
            Supported Exchanges
          </h2>
          <p className="text-xl section-description max-w-3xl mx-auto">
            Compare funding rates across leading decentralized exchanges with more integrations coming soon
          </p>
        </motion.div>

        {/* Supported Chains */}
        <motion.div 
          className="mb-12"
          variants={cardVariants}
        >
          <h3 className="text-center text-lg font-semibold mb-6 text-muted-foreground">
            Multi-Chain Support
          </h3>
          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            variants={containerVariants}
          >
            {chains.map((chain, index) => (
              <motion.div
                key={chain.name}
                variants={chainVariants}
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                  transition: { duration: 0.3 }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-muted/50 hover:border-muted transition-all duration-300"
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center`}>
                  <Image 
                    src={chain.icon} 
                    alt={chain.name}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                </div>
                <span className="text-sm font-medium">{chain.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Active DEX Grid */}
        <motion.div 
          className="mb-16"
          variants={cardVariants}
        >
          <h3 className="text-center text-xl font-semibold mb-8 text-foreground">
            🟢 Currently Supported
          </h3>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
          >
            {dexes.map((dex, index) => (
              <motion.div
                key={dex.name}
                variants={cardVariants}
                whileHover={{ 
                  y: -5,
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                <div className="h-full p-6 rounded-xl bg-background/80 backdrop-blur-sm border-2 border-green-500/30 hover:border-green-500/50 transition-all duration-300 space-y-4">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>

                  {/* Logo and Name */}
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Image 
                        src={dex.logo} 
                        alt={dex.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                      />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-green-600 transition-colors">
                        {dex.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {dex.description}
                      </p>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">24h Volume</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                        {loading ? (
                          <div className="w-16 h-6 bg-muted animate-pulse rounded"></div>
                        ) : (
                          dex.volume24h
                        )}
                      </div>
                      {!loading && dex.change24h > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          +{dex.change24h.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supported Chains */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Chains</div>
                    <div className="flex flex-wrap gap-1">
                      {dex.chains.map((chainName) => (
                        <span 
                          key={chainName}
                          className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 font-medium"
                        >
                          {chainName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hover effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Coming Soon DEX Grid */}
        <motion.div 
          className="mb-12"
          variants={cardVariants}
        >
          <h3 className="text-center text-xl font-semibold mb-8 text-foreground">
            🚀 Coming Soon
          </h3>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {comingSoonDexes.map((dex, index) => (
              <motion.div
                key={dex.name}
                variants={cardVariants}
                whileHover={{ 
                  y: -3,
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                <div className="h-full p-6 rounded-xl bg-background/60 backdrop-blur-sm border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 space-y-4">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                      Soon
                    </span>
                  </div>

                  {/* Logo placeholder and Name */}
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-300/20 flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-cyan-300 rounded opacity-60" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                        {dex.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {dex.description}
                      </p>
                    </div>
                  </div>

                  {/* Expected Volume */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Expected Volume</div>
                    <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                      {dex.expectedVolume}
                    </div>
                  </div>

                  {/* Supported Chains */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Chains</div>
                    <div className="flex flex-wrap gap-1">
                      {dex.chains.map((chainName) => (
                        <span 
                          key={chainName}
                          className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-medium"
                        >
                          {chainName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hover effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 to-cyan-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-12"
          variants={cardVariants}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400/20 to-cyan-300/20 backdrop-blur-sm border border-muted/50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className="text-sm font-medium">Expanding to 7+ new exchanges in Q4 2025</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
