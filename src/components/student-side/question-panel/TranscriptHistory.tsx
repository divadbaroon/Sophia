import React from 'react'
import { TranscriptHistoryProps } from '@/types'

/**
 * TranscriptHistory - Displays the conversation history
 * Shows formatted messages from user and assistant
 */
const TranscriptHistory: React.FC<TranscriptHistoryProps> = ({
  conversationHistory
}) => {
  return (
    <div className="rounded-md border p-4 h-96 overflow-auto">
      <div className="space-y-4">
        {conversationHistory && conversationHistory.length > 0 ? (
          conversationHistory.map((message, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                message.role === 'user' ? 'bg-muted' : 'bg-primary/10'
              }`}
            >
              <strong className={message.role === 'user' ? 'text-primary' : 'text-black-500'}>
                {message.role === 'user' ? 'You: ' : 'Assistant: '}
              </strong>
              {message.content}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Conversation history will appear here
          </div>
        )}
      </div>
    </div>
  )
}

export default TranscriptHistory