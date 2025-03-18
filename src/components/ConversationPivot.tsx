'use client'

import { useState } from 'react'
import { useConversationManagerContext } from '@/lib/context/ConversationManagerContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function ConversationPivot() {
  const { createPivot, isProcessing } = useConversationManagerContext()
  const [pivot, setPivot] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // THis is a sample matrix I made for testing 
  const [understandingMatrix, setUnderstandingMatrix] = useState({
    categories: {
      "Array Manipulation": {
        "Two-pointer Technique": 0.2,
        "Linear Search": 0.7,
        "Indexing": 0.8,
        "Element Comparison": 0.6
      },
      "Data Structures": {
        "Hash Map": 0.3,
        "Array": 0.8,
        "Key-Value Pair": 0.4,
        "Lookup Table": 0.2
      },
      "Algorithm Design": {
        "Time Complexity": 0.2,
        "Space Complexity": 0.3,
        "Edge Cases": 0.1,
        "Brute Force vs Optimal": 0.4
      }
    }
  })
  
  const [matrixJson, setMatrixJson] = useState(
    JSON.stringify(understandingMatrix, null, 2)
  )
  
  const handleJsonChange = (value: string) => {
    setMatrixJson(value)
    try {
      const parsed = JSON.parse(value)
      setUnderstandingMatrix(parsed)
      setError(null)
    } catch (e) {
      setError('Invalid JSON format')
    }
  }

  const handleGeneratePivot = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setPivot(null)
      
      if (!understandingMatrix) {
        setError('Inavid Matrix')
        return
      }
      
      const result = await createPivot(understandingMatrix)
      setPivot(result)
    } catch (e) {
      setError('Error generating pivot: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generate Conversation Pivot</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="matrix">Understanding Matrix (JSON)</Label>
          <Textarea
            id="matrix"
            value={matrixJson}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="mt-1 font-mono text-sm"
            rows={15}
          />
        </div>
        
        <Button
          onClick={handleGeneratePivot}
          disabled={isProcessing || isGenerating || !!error}
          className="w-full"
        >
          {isProcessing || isGenerating ? 'Generating Pivot...' : 'Generate Conversation Pivot'}
        </Button>
        
        {pivot && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Conversation Pivot Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-gray-800">{pivot}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 