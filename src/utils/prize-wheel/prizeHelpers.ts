import { DollarSign, Heart, Trophy } from 'lucide-react'

export const getPrizeIcon = (prize: string) => {
  if (prize.includes("GIFT CARD")) return DollarSign
  if (prize.includes("TRY AGAIN")) return Heart
  return Trophy
}

export const getPrizeValue = (prize: string) => {
  if (prize.includes("$5")) return "$5 Amazon Gift Card"
  if (prize.includes("$10")) return "$10 Amazon Gift Card"
  if (prize.includes("$20")) return "$20 Amazon Gift Card"
  if (prize.includes("TRY AGAIN")) return "Better luck next time!"
  return prize
}

export const isWinningPrize = (prize: string | null) => {
  return prize && !prize.includes("TRY AGAIN")
}

export const validateVTEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: "Email is required to claim your prize" }
  }
  
  if (!email.includes("@vt.edu") || !email.includes(".")) {
    return { isValid: false, error: "Please enter a valid VT email address" }
  }
  
  return { isValid: true }
}