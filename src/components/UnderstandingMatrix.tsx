'use client'

import { useState, useEffect } from 'react'
import { useConversationManagerContext } from '@/lib/context/ConversationManagerContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type UnderstandingMatrixType = {
  categories: {
    [category: string]: {
      [subcategory: string]: number
    }
  }
}

export default function UnderstandingMatrix() {
  const [problemDescription, setProblemDescription] = useState(
    `Description
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

Examples
Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]
Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]`
  )
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [matrix, setMatrix] = useState<UnderstandingMatrixType | null>(null)
  
  let conversationManager: any = null
  
  try {
    conversationManager = useConversationManagerContext()
  } catch (e) {
    if (!error) {
      setError('shit something went wrong')
    }
  }

  const handleGenerateMatrix = async () => {
    if (!problemDescription.trim()) return
    
    setIsProcessing(true)
    setMatrix(null)
    
    try {
      if (conversationManager?.createUnderstandingMatrix) {
        const result = await conversationManager.createUnderstandingMatrix(problemDescription)
        console.log('Matrix result:', result)
        setMatrix(result)
      } else {
        setError('Something went wrong in the understanding matrix')
      }
    } catch (e) {
      setError('Error generating understanding matrix: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  // If error message is displayed, provide a button to reload the page
  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Reload Page
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generate Understanding Matrix</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Problem Description</label>
          <Textarea
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            rows={10}
            className="w-full p-2 border rounded-md"
            placeholder="Enter problem description here..."
          />
        </div>
        <Button 
          onClick={handleGenerateMatrix}
          disabled={(conversationManager?.isProcessing || isProcessing) || !problemDescription.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {(conversationManager?.isProcessing || isProcessing) ? 'Generating...' : 'Generate Understanding Matrix'}
        </Button>

        {matrix && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Understanding Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(matrix.categories).map(([category, subcategories]) => (
                <Card key={category} className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {Object.keys(subcategories).map(subcategory => (
                        <li key={subcategory} className="text-sm">
                          • {subcategory}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 