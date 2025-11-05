"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, DollarSign, Trophy, Shield, Clock, TrendingUp, Award, Sparkles } from "lucide-react";
import PrivateVotingABI from "./contracts/zamahub.sol/PrivateVoting.json";
import MockUSDCABI from "./contracts/MockUSDC.sol/MockUSDC.json";


export default function ZamaVotingPage() {
  const [status, setStatus] = useState("Initializing...");
  const [instance, setInstance] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  
  // Voting contract state
  const [votingData, setVotingData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [votingLoading, setVotingLoading] = useState(false);

  // Deployed contract addresses
  const votingContractAddress = "0x8562B01A358E31a8B33fcFE961d25131a3c86428";
  const usdcContractAddress = "0xfc8cEFAC3fba65C97E385233d85c6D7f45585b7f";

  // === Initialize the Zama SDK ===
  useEffect(() => {
    const initZama = async () => {
      try {
        const response = await fetch(
          "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js"
        );
        const text = await response.text();

        const utf8Bytes = new TextEncoder().encode(text);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            utf8Bytes.subarray(i, i + chunkSize)
          );
        }
        const base64 = btoa(binary);

        const script = document.createElement("script");
        script.type = "module";
        script.textContent = `
          import * as ZamaSDK from 'data:text/javascript;base64,${base64}';
          window.ZamaSDK = ZamaSDK;
          window.dispatchEvent(new Event('zama-ready'));
        `;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Zama SDK load timeout")),
            10000
          );
          window.addEventListener("zama-ready", () => {
            clearTimeout(timeout);
            resolve();
          });
        });

        const { initSDK, createInstance, SepoliaConfig } = window.ZamaSDK || {};
        if (!initSDK) throw new Error("Zama SDK not loaded properly");

        await initSDK();

        if (!window.ethereum) throw new Error("MetaMask not detected");
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const userAddr = ethers.getAddress(accounts[0]);
        setUserAddress(userAddr);

        const config = { ...SepoliaConfig, network: window.ethereum };
        const instance = await createInstance(config);
        setInstance(instance);

        setStatus("✅ SDK initialized successfully");
      } catch (err) {
        console.error("❌ Zama Init Error:", err);
        setStatus(`❌ ${err.message}`);
      }
    };

    initZama();
  }, []);

  // === VOTING FUNCTIONS ===

  // Load voting contract data
  const loadVotingData = async () => {
    try {
      if (!userAddress) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const votingContract = new ethers.Contract(
        votingContractAddress,
        PrivateVotingABI.abi,
        provider
      );
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        MockUSDCABI.abi,
        provider
      );

      const [
        name,
        votingEndTime,
        totalVotingUSDC,
        hasVoted,
        hasClaimedReward,
        resultsRevealed,
        votingResolved,
        timeRemaining,
        usdcBal,
        voteDecrypted
      ] = await Promise.all([
        votingContract.name(),
        votingContract.votingEndTime(),
        votingContract.totalVotingUSDC(),
        votingContract.hasVoted(userAddress),
        votingContract.hasClaimedReward(userAddress),
        votingContract.resultsRevealed(),
        votingContract.votingResolved(),
        votingContract.timeUntilVotingEnds(),
        usdcContract.balanceOf(userAddress),
        votingContract.voteDecrypted(userAddress)
      ]);

      const data = {
        name,
        votingEndTime: Number(votingEndTime),
        totalVotingUSDC: ethers.formatUnits(totalVotingUSDC, 6),
        hasVoted,
        hasClaimedReward,
        resultsRevealed,
        votingResolved,
        timeRemaining: Number(timeRemaining),
        voteDecrypted
      };

      // Load vote counts and rankings if revealed
      if (resultsRevealed && votingResolved) {
        const [votesA, votesB, votesC, minorityOption, middleOption, majorityOption, minorityMultiplier, middleMultiplier, majorityMultiplier] = await Promise.all([
          votingContract.votesA(),
          votingContract.votesB(),
          votingContract.votesC(),
          votingContract.minorityOption(),
          votingContract.middleOption(),
          votingContract.majorityOption(),
          votingContract.minorityMultiplier(),
          votingContract.middleMultiplier(),
          votingContract.majorityMultiplier()
        ]);
        data.votesA = Number(votesA);
        data.votesB = Number(votesB);
        data.votesC = Number(votesC);
        data.minorityOption = Number(minorityOption);
        data.middleOption = Number(middleOption);
        data.majorityOption = Number(majorityOption);
        data.minorityMultiplier = Number(minorityMultiplier);
        data.middleMultiplier = Number(middleMultiplier);
        data.majorityMultiplier = Number(majorityMultiplier);
      }

      // Load user's decrypted vote if available
      if (voteDecrypted) {
        const decryptedVote = await votingContract.decryptedVotes(userAddress);
        data.userDecryptedVote = Number(decryptedVote);
        
        // Calculate user's reward amount if voting is resolved
        if (resultsRevealed && votingResolved) {
          const netDeposit = 9.8; // 10 USDC - 2% fee = 9.8 USDC
          let multiplier = 0;
          
          if (data.userDecryptedVote === data.minorityOption) {
            multiplier = data.minorityMultiplier;
          } else if (data.userDecryptedVote === data.middleOption) {
            multiplier = data.middleMultiplier;
          } else if (data.userDecryptedVote === data.majorityOption) {
            multiplier = data.majorityMultiplier;
          }
          
          data.userRewardAmount = (netDeposit * multiplier) / 100;
        }
      }

      setVotingData(data);
      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
      console.log("✅ Voting data loaded:", data);
    } catch (err) {
      console.error("❌ Failed to load voting data:", err);
    }
  };

  // Mint Mock USDC
  const handleMintUSDC = async () => {
    try {
      setVotingLoading(true);
      setStatus("Minting 1000 USDC...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        MockUSDCABI.abi,
        signer
      );

      const amount = ethers.parseUnits("1000", 6);
      const tx = await usdcContract.mint(userAddress, amount);
      
      setStatus(`⏳ Minting USDC: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Minted 1000 USDC successfully!");
      await loadVotingData();
    } catch (err) {
      console.error("❌ Mint Error:", err);
      setStatus(`❌ Mint failed: ${err.message || err.reason}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Vote with encrypted option
  const handleVote = async () => {
    try {
      if (!instance) throw new Error("SDK not ready");
      if (selectedOption === null) throw new Error("Select an option");

      setVotingLoading(true);
      
      if (parseFloat(usdcBalance) < 10) {
        throw new Error("Insufficient USDC balance. Mint some first!");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        MockUSDCABI.abi,
        signer
      );
      
      const allowance = await usdcContract.allowance(userAddress, votingContractAddress);
      const requiredAmount = ethers.parseUnits("10", 6);
      
      if (allowance < requiredAmount) {
        setStatus("Approving USDC...");
        const approveTx = await usdcContract.approve(votingContractAddress, requiredAmount);
        await approveTx.wait();
      }

      setStatus("Encrypting your vote...");
      const buffer = instance.createEncryptedInput(votingContractAddress, userAddress);
      buffer.add8(selectedOption);
      
      const ciphertexts = await buffer.encrypt();

      const votingContract = new ethers.Contract(
        votingContractAddress,
        PrivateVotingABI.abi,
        signer
      );

      setStatus("Submitting vote...");
      const tx = await votingContract.depositVote(
        ciphertexts.handles[0],
        ciphertexts.inputProof
      );

      setStatus(`⏳ Confirming vote: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Vote submitted successfully!");
      setSelectedOption(null);
      await loadVotingData();
    } catch (err) {
      console.error("❌ Vote Error:", err);
      setStatus(`❌ Vote failed: ${err.message || err.reason}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Request vote decryption - separate step before claiming
  const handleRequestDecryption = async () => {
    try {
      setVotingLoading(true);
      setStatus("🔐 Requesting vote decryption...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const votingContract = new ethers.Contract(
        votingContractAddress,
        PrivateVotingABI.abi,
        signer
      );

      // Call the separate requestUserVoteDecryption function
      const tx = await votingContract.requestUserVoteDecryption();
      setStatus(`⏳ Confirming decryption request: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Decryption requested! Waiting for oracle callback (10-30s)...");
      
      // Auto-check for decryption completion
      const checkInterval = setInterval(async () => {
        try {
          await loadVotingData();
          const isDecrypted = await votingContract.voteDecrypted(userAddress);
          if (isDecrypted) {
            clearInterval(checkInterval);
            setStatus("✅ Vote decrypted! Now you can claim your reward");
          }
        } catch (e) {
          console.error("Check interval error:", e);
        }
      }, 5000);
      
      setTimeout(() => clearInterval(checkInterval), 120000);
    } catch (err) {
      console.error("❌ Decryption request error:", err);
      const errorMessage = err.reason || err.message || '';
      setStatus(`❌ Decryption request failed: ${errorMessage}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Claim reward - only works after vote is decrypted
  const handleClaimReward = async () => {
    try {
      setVotingLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const votingContract = new ethers.Contract(
        votingContractAddress,
        PrivateVotingABI.abi,
        signer
      );

      // Check if vote is already decrypted
      const voteDecrypted = await votingContract.voteDecrypted(userAddress);
      
      if (!voteDecrypted) {
        setStatus("⚠️ Please request decryption first!");
        setVotingLoading(false);
        return;
      }

      setStatus("💰 Claiming your reward...");
      const tx = await votingContract.claimReward();
      setStatus(`⏳ Confirming transaction: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Reward claimed successfully!");
      await loadVotingData();
    } catch (err) {
      console.error("❌ Claim Error:", err);
      const errorMessage = err.reason || err.message || (err.revert && err.revert.args && err.revert.args[0]) || '';
      setStatus(`❌ Claim failed: ${errorMessage || 'Unknown error'}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Load voting data on mount
  useEffect(() => {
    if (userAddress && instance) {
      loadVotingData();
      const interval = setInterval(loadVotingData, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, instance]);

  // Helper functions
  const getOptionInfo = (option) => {
    const options = {
      0: { emoji: "🎯", label: "Option A", price: "$4,000", desc: "Moderate Growth" },
      1: { emoji: "🚀", label: "Option B", price: "$10,000", desc: "Moon Shot" },
      2: { emoji: "📉", label: "Option C", price: "$2,000", desc: "Bear Market" }
    };
    return options[option];
  };

  const getRankInfo = (option) => {
    if (!votingData) return null;
    if (option === votingData.minorityOption) return { label: "Winner (Minority)", color: "text-green-600", bgColor: "bg-green-500/10", emoji: "🏆" };
    if (option === votingData.middleOption) return { label: "Middle", color: "text-yellow-600", bgColor: "bg-yellow-500/10", emoji: "🥈" };
    if (option === votingData.majorityOption) return { label: "Majority (Lost)", color: "text-red-600", bgColor: "bg-red-500/10", emoji: "❌" };
    return null;
  };

  // === UI ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Vote className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Private Voting Game
            </h1>
          </div>
          <p className="text-xl font-semibold text-muted-foreground max-w-2xl mx-auto">
            What will Ethereum price be at the end of 2026?
          </p>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${instance ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <p className="text-sm font-medium">{status}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {instance ? (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Mint USDC Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-2 bg-gradient-to-br from-green-500/10 to-emerald-600/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Get Test USDC
                  </CardTitle>
                  <CardDescription>
                    Your USDC Balance: {usdcBalance} USDC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleMintUSDC}
                    disabled={votingLoading}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {votingLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Mint 1000 USDC (Test)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* PHASE 1: Voting Active */}
            <AnimatePresence mode="wait">
              {votingData && !votingData.resultsRevealed && (
                <motion.div
                  key="voting-phase"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  {/* Stats */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Total Pool
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                          {votingData.totalVotingUSDC} USDC
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time Remaining
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.floor(votingData.timeRemaining / 3600)}h {Math.floor((votingData.timeRemaining % 3600) / 60)}m
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          🔒 Active
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Voting UI */}
                  {!votingData.hasVoted ? (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Vote className="h-5 w-5" />
                          Cast Your Vote (10 USDC)
                        </CardTitle>
                        <CardDescription>
                          Select your prediction and deposit 10 USDC. Your vote is fully encrypted!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          {[0, 1, 2].map((option) => {
                            const info = getOptionInfo(option);
                            return (
                              <Card
                                key={option}
                                className={`border-2 cursor-pointer transition-all hover:scale-105 ${
                                  selectedOption === option
                                    ? "border-purple-600 bg-purple-500/10 shadow-lg"
                                    : "border-muted hover:border-purple-400"
                                }`}
                                onClick={() => setSelectedOption(option)}
                              >
                                <CardContent className="pt-6 text-center">
                                  <div className="text-4xl mb-2">{info.emoji}</div>
                                  <div className="text-xl font-bold mb-1">{info.label}</div>
                                  <div className="text-2xl font-bold text-purple-600 mb-1">{info.price}</div>
                                  <div className="text-sm text-muted-foreground">{info.desc}</div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        <Button
                          onClick={handleVote}
                          disabled={selectedOption === null || votingLoading}
                          size="lg"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {votingLoading ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Vote className="mr-2 h-4 w-4" />
                              Submit Encrypted Vote & Deposit 10 USDC
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <Card className="border-2 border-green-500 bg-green-500/10">
                        <CardContent className="pt-6 text-center py-12">
                          <div className="text-6xl mb-4">✅</div>
                          <h3 className="text-2xl font-bold mb-2">Vote Submitted!</h3>
                          <p className="text-muted-foreground">
                            Your vote is encrypted and will be revealed when voting ends
                          </p>
                          <div className="mt-4 text-sm text-muted-foreground">
                            ⏰ Voting ends in {Math.floor(votingData.timeRemaining / 3600)}h {Math.floor((votingData.timeRemaining % 3600) / 60)}m
                          </div>
                        </CardContent>
                      </Card>

                      {/* Show user's encrypted vote */}
                      <Card className="border-2 bg-gradient-to-br from-purple-500/10 to-pink-600/5">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            Your Encrypted Vote
                          </CardTitle>
                          <CardDescription>
                            Your vote is secured by FHE encryption. It will be revealed after voting ends.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="p-6 bg-muted/50 rounded-lg text-center space-y-4">
                            <div className="text-5xl">🔐</div>
                            <div>
                              <div className="text-lg font-bold mb-2">Vote Status: Encrypted</div>
                              <div className="text-sm text-muted-foreground">
                                Your selection has been recorded on-chain with full privacy protection
                              </div>
                            </div>
                            <div className="pt-4 border-t space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Deposit:</span>
                                <span className="font-bold">10 USDC</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="font-bold text-green-600">Confirmed</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Reveal Time:</span>
                                <span className="font-bold">{Math.floor(votingData.timeRemaining / 3600)}h {Math.floor((votingData.timeRemaining % 3600) / 60)}m</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Voting Instructions */}
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">What Happens Next?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">⏳</span>
                            <div>
                              <strong className="text-foreground">Wait for voting to end</strong>
                              <p>The voting period will close automatically after the timer expires</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-lg">🔓</span>
                            <div>
                              <strong className="text-foreground">Votes are revealed</strong>
                              <p>All votes will be decrypted and the results will be published on-chain</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-lg">🎁</span>
                            <div>
                              <strong className="text-foreground">Claim your reward</strong>
                              <p>Come back to this page to see if you won and claim your USDC reward</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              )}

              {/* PHASE 2: Results Revealed */}
              {votingData && votingData.resultsRevealed && votingData.votingResolved && (
                <motion.div
                  key="results-phase"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  {/* Results Header */}
                  <Card className="border-2 bg-gradient-to-br from-yellow-500/10 to-orange-600/5">
                    <CardContent className="pt-6 text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <h2 className="text-3xl font-bold mb-2">Voting Has Ended!</h2>
                      <p className="text-muted-foreground">
                        Results are now public. Check if you won!
                      </p>
                    </CardContent>
                  </Card>

                  {/* Vote Results */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Final Results
                      </CardTitle>
                      <CardDescription>
                        Total Pool: {votingData.totalVotingUSDC} USDC
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[0, 1, 2].map((option) => {
                        const info = getOptionInfo(option);
                        const rank = getRankInfo(option);
                        const votes = option === 0 ? votingData.votesA : option === 1 ? votingData.votesB : votingData.votesC;
                        
                        return (
                          <div
                            key={option}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 ${rank?.bgColor || 'bg-muted/50'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-4xl">{info.emoji}</div>
                              <div>
                                <div className="font-semibold text-lg">
                                  {info.label}: {info.price}
                                </div>
                                <div className="text-sm text-muted-foreground">{info.desc}</div>
                                {rank && (
                                  <div className={`text-sm font-bold ${rank.color} flex items-center gap-1 mt-1`}>
                                    <span>{rank.emoji}</span>
                                    <span>{rank.label}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-purple-600">
                                {votes}
                              </div>
                              <div className="text-sm text-muted-foreground">votes</div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Your Vote & Claim */}
                  {votingData.hasVoted && (
                    <Card className="border-2 bg-gradient-to-br from-purple-500/10 to-pink-600/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          Your Participation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {votingData.voteDecrypted && votingData.userDecryptedVote !== undefined && (
                          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <div className="text-sm text-muted-foreground">Your Vote:</div>
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{getOptionInfo(votingData.userDecryptedVote).emoji}</span>
                              <div>
                                <div className="font-bold text-lg">
                                  {getOptionInfo(votingData.userDecryptedVote).label} - {getOptionInfo(votingData.userDecryptedVote).price}
                                </div>
                                {getRankInfo(votingData.userDecryptedVote) && (
                                  <div className={`text-sm font-bold ${getRankInfo(votingData.userDecryptedVote).color}`}>
                                    {getRankInfo(votingData.userDecryptedVote).emoji} {getRankInfo(votingData.userDecryptedVote).label}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Reward Status */}
                            {votingData.userRewardAmount !== undefined && (
                              <div className="pt-3 border-t">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Your Reward:</span>
                                  <div className="text-right">
                                    {votingData.userRewardAmount === 0 ? (
                                      <div className="text-lg font-bold text-red-600">0 USDC 💔</div>
                                    ) : votingData.userRewardAmount === 9.8 ? (
                                      <div className="text-lg font-bold text-yellow-600">{votingData.userRewardAmount.toFixed(1)} USDC 🔄</div>
                                    ) : (
                                      <div className="text-lg font-bold text-green-600">{votingData.userRewardAmount.toFixed(1)} USDC 🎉</div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      {votingData.userRewardAmount === 0 && "Lost"}
                                      {votingData.userRewardAmount === 9.8 && "Refunded"}
                                      {votingData.userRewardAmount > 9.8 && `Won ${((votingData.userRewardAmount / 9.8) * 100).toFixed(0)}%!`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!votingData.hasClaimedReward ? (
                          <>
                            {votingData.userRewardAmount === 0 ? (
                              // No reward - show message instead of claim button
                              <Card className="border-2 border-red-500 bg-red-500/10">
                                <CardContent className="pt-6 text-center">
                                  <div className="text-5xl mb-3">😢</div>
                                  <p className="text-lg font-semibold text-red-600">
                                    No Reward Available
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    You voted with the majority and lost your deposit. Better luck next time!
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-3">
                                {!votingData.voteDecrypted ? (
                                  <Button
                                    onClick={handleRequestDecryption}
                                    disabled={votingLoading}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                  >
                                    {votingLoading ? (
                                      <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Step 1: Request Vote Decryption
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={handleClaimReward}
                                    disabled={votingLoading}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                                  >
                                    {votingLoading ? (
                                      <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <Trophy className="mr-2 h-4 w-4" />
                                        {votingData.userRewardAmount === 9.8 
                                          ? 'Step 2: Claim Refund (9.8 USDC)' 
                                          : `Step 2: Claim Reward (${votingData.userRewardAmount?.toFixed(1)} USDC)`
                                        }
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <Card className="border-2 border-green-500 bg-green-500/10">
                            <CardContent className="pt-6 text-center">
                              <div className="text-5xl mb-3">✅</div>
                              <p className="text-lg font-semibold text-green-600">
                                Reward Claimed!
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Thank you for participating!
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Game Rules Reminder */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Game Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <div>🏆 <strong>Minority (Fewest votes):</strong> Wins 2x their deposit</div>
                      <div>🥈 <strong>Middle:</strong> Gets their deposit back (1x)</div>
                      <div>❌ <strong>Majority (Most votes):</strong> Loses their deposit (0x)</div>
                      <div className="pt-2 border-t">
                        💡 <strong>Strategy:</strong> Pick the option you think OTHERS wont pick!
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p className="text-muted-foreground">Initializing secure connection...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
