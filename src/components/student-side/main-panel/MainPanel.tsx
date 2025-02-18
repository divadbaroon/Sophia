'use client'

import React from 'react'
import dynamic from 'next/dist/shared/lib/dynamic'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { VideoChatProvider } from '@/components/context/VideoChatContext'
import { DeepgramContextProvider } from '@/components/audio/DeepgramContextProvider'
import { DeepgramInitializer } from '@/components/audio/DeepgramInitializer'
import { ElevenLabsProvider } from '@/components/audio/ElevenLabsProvider';

type PanelType = 'question' | 'none'

interface MainPanelProps {
  isVisible?: boolean;
}

const MainPanel: React.FC<MainPanelProps> = ({ isVisible = true }) => {
  const [panelType, setPanelType] = React.useState<PanelType>('question')

  const renderPanel = () => {
    switch (panelType) {
      case 'question': {
        const QuestionPanel = dynamic(() => import('@/components/student-side/question-panel/QuestionPanel'), {
          ssr: false,
        })
        return <QuestionPanel onBack={() => setPanelType('none')} isVisible={isVisible} />
      }
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
        <DeepgramContextProvider>
          <DeepgramInitializer>
            <div className="h-full">{renderPanel()}</div>
          </DeepgramInitializer>
        </DeepgramContextProvider>
      </ElevenLabsProvider>
    </VideoChatProvider>
  )
}

export default MainPanel