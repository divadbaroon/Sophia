'use client'

import React from 'react'
import ConversationPivot from '@/components/ConversationPivot'
import { ConversationManagerProvider } from '@/lib/context/ConversationManagerContext'
import { FileProvider } from '@/lib/context/FileContext'

const PivotContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Conversation Pivot Generator</h1>
      <ConversationPivot />
    </div>
  )
}

export default function PivotPage() {
  return (
    <FileProvider>
      <ConversationManagerProvider>
        <PivotContent />
      </ConversationManagerProvider>
    </FileProvider>
  )
} 