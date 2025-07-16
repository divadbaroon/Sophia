import React, { useState, useEffect, useRef } from "react";
import { X, Trophy, DollarSign, Heart, Loader2, AlertCircle } from "lucide-react";
import { Wheel, WheelItem, WheelEvent } from "spin-wheel";
import { checkPrizeSpinEligibility, savePrizeSpin } from "@/lib/actions/prize-wheel-actions";

interface PrizeWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrizeWon: (prize: string) => void;
  sessionId?: string;
  lessonId?: string;
}

const PrizeWheelModal: React.FC<PrizeWheelModalProps> = ({ 
  isOpen, 
  onClose, 
  onPrizeWon,
  sessionId,
  lessonId 
}) => {
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<Wheel | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [hasSavedSpin, setHasSavedSpin] = useState(false); // Track if we've already saved
  
  // New states for eligibility and saving
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [previousPrize, setPreviousPrize] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const prizes: WheelItem[] = [
    { label: "TRY AGAIN", weight: 15 },      // 15% 
    { label: "$10 GIFT CARD", weight: 2.5 }, // 2.5%
    { label: "TRY AGAIN", weight: 15 },      // 15%
    { label: "$10 GIFT CARD", weight: 2.5 }, // 2.5%
    { label: "TRY AGAIN", weight: 15 },      // 15%
    { label: "$20 GIFT CARD", weight: 1 },   // 1%
    { label: "TRY AGAIN", weight: 15 },      // 15%
    { label: "$10 GIFT CARD", weight: 2.5 }, // 2.5%
    { label: "TRY AGAIN", weight: 15 },      // 15%
    { label: "$5 GIFT CARD", weight: 3 },    // 3%
    { label: "TRY AGAIN", weight: 13 },      // 13%
    { label: "$10 GIFT CARD", weight: 2.5 }  // 2.5%
  ];

  // Check eligibility when modal opens
  useEffect(() => {
    // Reset states when modal closes
    if (!isOpen) {
      setIsCheckingEligibility(true);
      setIsEligible(false);
      setEligibilityError(null);
      setPreviousPrize(null);
      setShowResult(false);
      setWinner(null);
      setUserEmail("");
      setEmailError("");
      setSaveError(null);
      setHasSavedSpin(false);
      return;
    }

    const checkEligibility = async () => {
      if (!lessonId) {
        console.log('🔍 No lessonId provided');
        setIsCheckingEligibility(false);
        return;
      }

      setIsCheckingEligibility(true);
      setEligibilityError(null);

      try {
        console.log('🔍 Checking prize eligibility for lesson:', lessonId);
        const result = await checkPrizeSpinEligibility(lessonId);
        console.log('🔍 Eligibility result:', result);
        
        if (result.error && result.error !== "Not authenticated") {
          setEligibilityError(result.error);
          setIsEligible(false);
        } else if (result.alreadySpun && result.previousSpin) {
          setIsEligible(false);
          setPreviousPrize(result.previousSpin.prize);
        } else if (result.eligible) {
          setIsEligible(true);
        } else {
          setIsEligible(false);
          setEligibilityError("Unable to verify eligibility");
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setEligibilityError("Failed to check eligibility");
        setIsEligible(false);
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [isOpen, lessonId]);

  // Load overlay image from public folder
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOverlayImage(img);
    img.onerror = () => {
      console.warn('Could not load overlay image, wheel will work without it');
      setOverlayImage(null);
    };
    img.src = '/images/prizeWheel/wheel-overlay.svg';
  }, []);

  useEffect(() => {
    if (isOpen && isEligible && !showResult && wheelContainerRef.current && !wheelRef.current) {
      try {
        wheelRef.current = new Wheel(wheelContainerRef.current, {
          items: prizes,
          radius: 0.84,
          itemLabelRadius: 0.93,
          itemLabelRadiusMax: 0.35,
          itemLabelRotation: 180,
          itemLabelAlign: 'left',
          itemLabelColors: ['#fff'],
          itemLabelBaselineOffset: -0.07,
          itemLabelFont: 'Arial Black, Arial, sans-serif',
          itemLabelFontSizeMax: 28,
          itemBackgroundColors: [
            '#ffc93c', '#66bfbf', '#a2d5f2', '#515070', 
            '#43658b', '#ed6663', '#d54062'
          ],
          rotationSpeedMax: 500,
          rotationResistance: -100,
          lineWidth: 1,
          lineColor: '#fff',
          borderWidth: 3,
          borderColor: '#000',
          overlayImage: overlayImage || undefined,
          pointerAngle: 90,
          onRest: async (event: WheelEvent) => {
            setIsSpinning(false);
            if (event.currentIndex !== undefined) {
              const winningItem = prizes[event.currentIndex];
              const winnerLabel = winningItem.label || "Unknown Prize";
              setWinner(winnerLabel);
              
              // Save non-winning prizes immediately
              if (sessionId && lessonId && winnerLabel.includes("TRY AGAIN") && !hasSavedSpin) {
                const saved = await savePrizeSpinResult(winnerLabel);
                if (saved) {
                  setHasSavedSpin(true);
                }
              }
              
              setShowResult(true);
              onPrizeWon(winnerLabel);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing wheel:', error);
      }
    }

    // Clean up wheel when showing results or modal closes
    if (showResult || !isOpen || !isEligible) {
      if (wheelRef.current) {
        try {
          wheelRef.current.remove();
          wheelRef.current = null;
        } catch (error) {
          console.error('Error removing wheel:', error);
        }
      }
    }

    return () => {
      if (wheelRef.current) {
        try {
          wheelRef.current.remove();
          wheelRef.current = null;
        } catch (error) {
          console.error('Error removing wheel:', error);
        }
      }
    };
  }, [isOpen, isEligible, showResult, overlayImage, sessionId, lessonId]);

  const savePrizeSpinResult = async (prize: string, email?: string) => {
    if (!sessionId || !lessonId) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await savePrizeSpin(sessionId, lessonId, prize, email);
      
      if (!result.success) {
        setSaveError(result.error || "Failed to save prize");
        return false;
      }
      
      console.log('✅ Prize spin saved successfully!', result.data);
      return true;
    } catch (error) {
      console.error('Error saving prize spin:', error);
      setSaveError("An unexpected error occurred");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpin = () => {
    if (!wheelRef.current || isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setWinner(null);
    setSaveError(null);

    try {
      const duration = 3000;
      const randomRotation = Math.random() * 360 + 360 * 3;
      wheelRef.current.spinTo(randomRotation, duration);
    } catch (error) {
      console.error('Error spinning wheel:', error);
      setIsSpinning(false);
    }
  };

  const handleClaim = async () => {
    if (isWinningPrize && sessionId && lessonId) {
      // Validate email for winning prizes
      if (!userEmail.trim()) {
        setEmailError("Email is required to claim your prize");
        return;
      }
      
      if (!userEmail.includes("@vt.edu") || !userEmail.includes(".")) {
        setEmailError("Please enter a valid VT email address");
        return;
      }
      
      // Clear any previous errors
      setEmailError("");
      
      // Save the winning prize with email (only if not already saved)
      if (!hasSavedSpin) {
        const success = await savePrizeSpinResult(winner!, userEmail);
        if (!success) {
          return; // Don't close if save failed
        }
        setHasSavedSpin(true);
      }
      
      console.log("Prize claimed:", { email: userEmail, prize: winner });
    } else if (!isWinningPrize && sessionId && lessonId && !hasSavedSpin) {
      // For non-winning prizes, ensure it's saved
      const success = await savePrizeSpinResult(winner!);
      if (!success) {
        return; // Don't close if save failed
      }
      setHasSavedSpin(true);
    }
    
    // Reset state
    setShowResult(false);
    setWinner(null);
    setUserEmail("");
    setEmailError("");
    setHasSavedSpin(false);
    onClose();
  };

  const handleGoBack = () => {
    window.location.href = "/concepts";
  };

  const getPrizeIcon = (prize: string) => {
    if (prize.includes("GIFT CARD")) return <DollarSign className="w-6 h-6" />;
    if (prize.includes("TRY AGAIN")) return <Heart className="w-6 h-6" />;
    return <Trophy className="w-6 h-6" />;
  };

  const getPrizeValue = (prize: string) => {
    if (prize.includes("$5")) return "$5 Amazon Gift Card";
    if (prize.includes("$10")) return "$10 Amazon Gift Card";
    if (prize.includes("$20")) return "$20 Amazon Gift Card";
    if (prize.includes("TRY AGAIN")) return "Better luck next time!";
    return prize;
  };

  const isWinningPrize = winner && !winner.includes("TRY AGAIN");

  if (!isOpen) return null;

  // Loading state
  if (isCheckingEligibility) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">Checking prize wheel eligibility...</h3>
          <p className="text-sm text-gray-600 mt-2">Just a moment while we verify your spin.</p>
        </div>
      </div>
    );
  }

  // Already spun state
  if (!isEligible && previousPrize) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-blue-100 rounded-3xl p-8 max-w-lg w-full text-center relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative z-10">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-3xl font-black text-gray-800 mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                ALREADY SPUN!
              </h2>
              <p className="text-gray-700 font-semibold">
                You&apos;ve already spun the wheel for this lesson
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleGoBack}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-xl transition-all transform hover:scale-105 border-4 border-blue-700 text-lg"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
              >
                📚 GO BACK TO CONCEPTS
              </button>

              <p className="text-xs text-gray-600 font-semibold bg-blue-50 border border-blue-200 rounded-lg p-3">
                🎓 <strong>Want another spin?</strong> 
                <br />
                Complete another lesson to earn your next chance at the prize wheel!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!isEligible && eligibilityError) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Access Prize Wheel</h3>
          <p className="text-sm text-gray-600 mb-4">{eligibilityError}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Main wheel content (only shown if eligible)
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-blue-100 rounded-3xl p-8 max-w-2xl w-full text-center relative overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative z-10">
          {!showResult ? (
            <>
              <div className="mb-5">
                <div className="text-6xl mb-4">🎁</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">TIME TO SPIN!</h2>
                <p className="text-gray-600 font-semibold">Thank you for your participation. Now claim your free spin!</p>
              </div>

              {/* Wheel Container */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div 
                    ref={wheelContainerRef}
                    className="wheel-container prize-wheel"
                    style={{ width: '400px', height: '400px' }}
                  />
                </div>
              </div>

              {/* Spin Button */}
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className={`px-10 py-5 rounded-xl text-white font-black text-xl transition-all transform hover:scale-105 shadow-xl border-4 -mt-4 ${
                  isSpinning 
                    ? 'bg-gray-400 border-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-orange-600'
                }`}
                style={{ 
                  fontFamily: 'Arial Black, Arial, sans-serif',
                  letterSpacing: '1px'
                }}
              >
                {isSpinning ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    SPINNING...
                  </div>
                ) : (
                  '🎯 SPIN!'
                )}
              </button>

              <div className="text-sm text-gray-600 space-y-2 mt-8 font-semibold">
                <p>🏆 PRIZES: GIFT CARDS & MORE!</p>
              </div>
            </>
          ) : (
            <>
              {/* RESULTS PAGE */}
              <div className="mb-6">
                <div className="text-6xl mb-4">
                  {isWinningPrize ? "🏆" : "💪"}
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                  {isWinningPrize ? "WINNER!" : "TRY AGAIN!"}
                </h2>
                <p className="text-gray-700 font-semibold">
                  {isWinningPrize ? "YOU WON AN AWESOME PRIZE:" : "Complete another lesson for another free spin!"}
                </p>
              </div>

              {/* Error Display */}
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-semibold">⚠️ {saveError}</p>
                </div>
              )}

              <div className="space-y-4">
                {isWinningPrize ? (
                  <>
                    {/* Prize Display Card */}
                    <div className="rounded-2xl p-6 border-4 bg-gradient-to-r from-yellow-200 to-orange-200 border-orange-400">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        {getPrizeIcon(winner || "")}
                        <h3 className="text-2xl font-black text-gray-800" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                          {winner}
                        </h3>
                      </div>
                      <p className="text-lg text-gray-700 font-semibold">{getPrizeValue(winner || "")}</p>
                    </div>

                    {/* Email input for prize winners */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 text-left">
                        📧 Enter your email to claim your prize (must be a valid VT email):
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => {
                          setUserEmail(e.target.value);
                          setEmailError(""); // Clear error when typing
                        }}
                        placeholder="example@vt.edu"
                        className={`w-full px-4 py-3 border-2 rounded-lg font-medium text-gray-800 ${
                          emailError 
                            ? 'border-red-400 bg-red-50' 
                            : 'border-gray-300 bg-white focus:border-blue-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors`}
                      />
                      {emailError && (
                        <p className="text-red-600 text-sm font-semibold text-left">⚠️ {emailError}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={handleClaim}
                      disabled={isSaving}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black rounded-xl transition-all transform hover:scale-105 border-4 border-green-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                    >
                      {isSaving ? (
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          SAVING...
                        </div>
                      ) : (
                        '🎁 CLAIM PRIZE!'
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-600 font-semibold bg-blue-50 border border-blue-200 rounded-lg p-3">
                      💌 <strong>We will reach out to you via email for your compensation.</strong> 
                      <br />
                      Please check your inbox within 24-48 hours for prize details and next steps.
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleClaim}
                      disabled={isSaving}
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-xl transition-all transform hover:scale-105 border-4 border-blue-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                    >
                      {isSaving ? (
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          SAVING...
                        </div>
                      ) : (
                        '📚 GO BACK TO CONCEPTS'
                      )}
                    </button>
                    <p className="text-xs text-gray-600 font-semibold bg-blue-50 border border-blue-200 rounded-lg p-3">
                      🎓 <strong>Earn more spins by completing lessons!</strong> 
                      <br />
                      Each completed lesson gives you another chance at the prize wheel.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .wheel-container.prize-wheel {
          filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.3));
        }
        
        .wheel-container.prize-wheel canvas {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default PrizeWheelModal;