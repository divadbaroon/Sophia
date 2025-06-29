import React, { useState, useEffect, useRef } from "react";
import { Gift, X, Trophy, DollarSign, Coffee, Award, Heart, Star } from "lucide-react";
import { Wheel, WheelItem, WheelEvent } from "spin-wheel";

interface PrizeWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrizeWon: (prize: string) => void;
}

const PrizeWheelModal: React.FC<PrizeWheelModalProps> = ({ isOpen, onClose, onPrizeWon }) => {
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<Wheel | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Prize configuration with proper typing
  const prizes: WheelItem[] = [
    { label: "Try Again 😔", backgroundColor: "#EE4040", weight: 3 },
    { label: "$5 Gift Card 💰", backgroundColor: "#F0CF50", weight: 1 },
    { label: "$3 Coffee ☕", backgroundColor: "#815CD1", weight: 2 },
    { label: "Try Again 😔", backgroundColor: "#3DA5E0", weight: 3 },
    { label: "$10 Gift Card 🎉", backgroundColor: "#34A24F", weight: 1 },
    { label: "Sticker Pack ⭐", backgroundColor: "#F9AA1F", weight: 2 },
    { label: "Try Again 😔", backgroundColor: "#EC3F3F", weight: 3 },
    { label: "Badge 🏆", backgroundColor: "#FF9000", weight: 2 }
  ];

  useEffect(() => {
    if (isOpen && wheelContainerRef.current && !wheelRef.current) {
      // Initialize the wheel with proper typing
      try {
        wheelRef.current = new Wheel(wheelContainerRef.current, {
          items: prizes,
          radius: 0.9,
          itemLabelRadius: 0.7,
          itemLabelRadiusMax: 0.35,
          itemLabelRotation: 0,
          itemLabelAlign: 'center',
          itemLabelColors: ['#fff'],
          itemLabelFont: 'Helvetica, Arial, sans-serif',
          itemLabelFontSizeMax: 30,
          itemBackgroundColors: ['#fff'], // Will be overridden by individual item colors
          lineWidth: 3,
          lineColor: '#000',
          borderWidth: 5,
          borderColor: '#000',
          rotationResistance: -50,
          onRest: (event: WheelEvent) => {
            setIsSpinning(false);
            if (event.currentIndex !== undefined) {
              const winningItem = prizes[event.currentIndex];
              const winnerLabel = winningItem.label || "Unknown Prize";
              setWinner(winnerLabel);
              setShowResult(true);
              onPrizeWon(winnerLabel);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing wheel:', error);
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
  }, [isOpen]);

  const handleSpin = () => {
    if (!wheelRef.current || isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setWinner(null);

    try {
      // Spin with random speed between 100-300
      const randomSpeed = Math.random() * 200 + 100;
      wheelRef.current.spin(randomSpeed);
    } catch (error) {
      console.error('Error spinning wheel:', error);
      setIsSpinning(false);
    }
  };

  const handleClaim = () => {
    setShowResult(false);
    setWinner(null);
    onClose();
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setWinner(null);
    // Reset for another spin
  };

  const getPrizeIcon = (prize: string) => {
    if (prize.includes("Gift Card")) return <DollarSign className="w-6 h-6" />;
    if (prize.includes("Coffee")) return <Coffee className="w-6 h-6" />;
    if (prize.includes("Badge")) return <Award className="w-6 h-6" />;
    if (prize.includes("Sticker")) return <Star className="w-6 h-6" />;
    if (prize.includes("Try Again")) return <Heart className="w-6 h-6" />;
    return <Trophy className="w-6 h-6" />;
  };

  const getPrizeValue = (prize: string) => {
    if (prize.includes("$5")) return "$5 Amazon Gift Card";
    if (prize.includes("$10")) return "$10 Amazon Gift Card";
    if (prize.includes("$3")) return "$3 Coffee Shop Voucher";
    if (prize.includes("Badge")) return "Special Achievement Badge";
    if (prize.includes("Sticker")) return "Exclusive Sticker Pack";
    if (prize.includes("Try Again")) return "Better luck next time!";
    return prize;
  };

  const isWinningPrize = winner && !winner.includes("Try Again");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100 opacity-50"></div>
        
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
              <div className="mb-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Time to Spin!</h2>
                <p className="text-gray-600">Thank you for completing the survey. Now claim your reward!</p>
              </div>

              {/* Wheel Container */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                    <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-red-600 drop-shadow-lg"></div>
                  </div>
                  
                  {/* Wheel */}
                  <div 
                    ref={wheelContainerRef}
                    className="wheel-container"
                    style={{ width: '350px', height: '350px' }}
                  />
                </div>
              </div>

              {/* Spin Button */}
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className={`px-8 py-4 rounded-full text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
                  isSpinning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {isSpinning ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Spinning...
                  </div>
                ) : (
                  '🎰 SPIN THE WHEEL!'
                )}
              </button>

              <div className="text-sm text-gray-500 space-y-1 mt-6">
                <p>🎁 Possible prizes: Gift cards, vouchers, badges & more!</p>
                <p>💫 Don't worry if you get "Try Again" - you can spin again!</p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="text-6xl mb-4">
                  {isWinningPrize ? "🎉" : "😊"}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {isWinningPrize ? "Congratulations!" : "Don't Give Up!"}
                </h2>
                <p className="text-gray-600">
                  {isWinningPrize ? "You won an amazing prize:" : "Try spinning again for another chance!"}
                </p>
              </div>

              <div className={`rounded-2xl p-6 mb-6 border-2 ${
                isWinningPrize 
                  ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300'
                  : 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300'
              }`}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  {getPrizeIcon(winner || "")}
                  <h3 className="text-2xl font-bold text-gray-800">{winner}</h3>
                </div>
                <p className="text-lg text-gray-700">{getPrizeValue(winner || "")}</p>
              </div>

              <div className="space-y-3">
                {isWinningPrize ? (
                  <>
                    <button
                      onClick={handleClaim}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-full transition-all transform hover:scale-105"
                    >
                      🎁 Claim Prize & Continue
                    </button>
                    <p className="text-xs text-gray-500">
                      Prize details will be sent to your email within 24 hours!
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleTryAgain}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full transition-all transform hover:scale-105"
                    >
                      🎰 Spin Again!
                    </button>
                    <button
                      onClick={handleClaim}
                      className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-full transition-all"
                    >
                      Continue to Dashboard
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom CSS for the wheel */}
      <style jsx>{`
        .wheel-container {
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
        }
        
        .wheel-container canvas {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default PrizeWheelModal;