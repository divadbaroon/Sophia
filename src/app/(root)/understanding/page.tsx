'use client'

import React from 'react'
import UnderstandingMatrix from '@/components/UnderstandingMatrix'
import { ConversationManagerProvider } from '@/lib/context/ConversationManagerContext'
import { FileProvider } from '@/lib/context/FileContext'

const UnderstandingContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Understanding Matrix Generator</h1>
      <UnderstandingMatrix />
    </div>
  )
}

export default function UnderstandingPage() {
  return (
    <FileProvider>
      <ConversationManagerProvider>
        <UnderstandingContent />
      </ConversationManagerProvider>
    </FileProvider>
  )
} 