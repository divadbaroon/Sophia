'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X } from 'lucide-react'
import VoiceCircle from '../question-panel/VoiceCircle'
import { SophiaWrapperProps } from './types/SophiaBrainType'

const SophiaWrapper: React.FC<SophiaWrapperProps> = ({
  onClose,
  transcript,
  isTranscribing,
  error,
}) => {
  const currentState = isTranscribing ? 'listening' : 'initializing'

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Sophia</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">Current</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <div className="rounded-md border p-4 min-h-[200px]">
            <div className="space-y-4">
              {/* State indicator */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {currentState === 'listening' ? (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">
                        Listening
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-gray-500 rounded-full" />
                      <span className="text-sm text-muted-foreground">
                        Ready
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Voice Circle Animation */}
              <div className="flex justify-center items-center mb-6">
                <div className="h-28 w-28">
                  <VoiceCircle state={currentState} />
                </div>
              </div>

              {/* Transcript display */}
              {transcript && (
                <div className="mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg min-h-[50px] flex items-center">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground">{transcript}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="rounded-md border p-4 min-h-[200px] max-h-96 overflow-auto">
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Conversation history will appear here
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SophiaWrapper
