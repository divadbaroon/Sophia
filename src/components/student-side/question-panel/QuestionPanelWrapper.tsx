'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { VideoChatProvider } from '@/components/context/VideoChatContext'
import { ElevenLabsProvider } from '@/components/audio/ElevenLabsProvider'
import { DeepgramProvider } from '@/components/audio/DeepgramContext'
import QuestionPanel from '@/components/student-side/question-panel/QuestionPanel'

type PanelType = 'question' | 'none'

const QuestionPanelWrapper = () => {
  const [panelType, setPanelType] = React.useState<PanelType>('question')

  const renderPanel = () => {
    switch (panelType) {
      case 'question':
        return <QuestionPanel onBack={() => setPanelType('none')} />
      default:
        return (
          <div className="flex flex-col justify-center items-center gap-4 h-full">
            <Button
              className="w-32 flex justify-start items-center relative"
              onClick={() => setPanelType('question')}>
              <HelpCircle className="h-4 w-4 absolute left-2" />
              <span className="ml-4">Ask Question</span>
            </Button>
          </div>
        )
    }
  }

  return (
    <VideoChatProvider>
      <ElevenLabsProvider>
        <DeepgramProvider>
          <div className="h-full">{renderPanel()}</div>
        </DeepgramProvider>
      </ElevenLabsProvider>
    </VideoChatProvider>
  )
}

export default QuestionPanelWrapper