import React, { useState, useEffect } from 'react'
import { RecognitionSettingsProps, SpeakToOption, ScenarioOption } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/**
 * RecognitionSettings - Dialog for adjusting speech recognition settings
 */
const RecognitionSettings: React.FC<RecognitionSettingsProps> = ({
  isOpen,
  onOpenChange,
  speakTo,
  scenario,
  onSave
}) => {
  // Local state for settings that will be updated when saved
  const [localSpeakTo, setLocalSpeakTo] = useState<SpeakToOption>(speakTo)
  const [localScenario, setLocalScenario] = useState<ScenarioOption>(scenario)

  // Update local state when props change
  useEffect(() => {
    setLocalSpeakTo(speakTo)
    setLocalScenario(scenario)
  }, [speakTo, scenario])

  // Save settings
  const handleSave = () => {
    onSave(localSpeakTo, localScenario)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recognition Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Who would you like to speak to?</h3>
              <RadioGroup 
                value={localSpeakTo}
                onValueChange={(value: string) => setLocalSpeakTo(value as SpeakToOption)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="speaking-student" />
                  <Label htmlFor="speaking-student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ta" id="speaking-ta" />
                  <Label htmlFor="speaking-ta">TA</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Scenario</h3>
              <RadioGroup 
                value={localScenario}
                onValueChange={(value: string) => setLocalScenario(value as ScenarioOption)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-on-one" id="scenario-one" />
                  <Label htmlFor="scenario-one">1 on 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="scenario-group" />
                  <Label htmlFor="scenario-group">Group</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RecognitionSettings