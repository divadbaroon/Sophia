'use client'

import React from 'react'
import UpdateCategoryUnderstanding from '@/components/UpdateCategoryUnderstanding'
import { ConversationManagerProvider } from '@/lib/context/ConversationManagerContext'
import { FileProvider } from '@/lib/context/FileContext'

const UpdateUnderstandingContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Update Category Understanding</h1>
      <UpdateCategoryUnderstanding />
    </div>
  )
}

export default function UpdateUnderstandingPage() {
  return (
    <FileProvider>
      <ConversationManagerProvider>
        <UpdateUnderstandingContent />
      </ConversationManagerProvider>
    </FileProvider>
  )
} 