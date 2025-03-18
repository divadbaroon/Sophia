'use client'

import { useState } from 'react'
import { useConversationManagerContext } from '@/lib/context/ConversationManagerContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function UpdateCategoryUnderstanding() {
  const { updateCategory, isProcessing } = useConversationManagerContext()
  const [category, setCategory] = useState('Data Structures')
  const [subcategories, setSubcategories] = useState({
    "Hash Maps": 0,
    "Lists": 0,
    "Tuples": 0,
    "Sets": 0
  })
  const [updatedSubcategories, setUpdatedSubcategories] = useState<{[key: string]: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleAddSubcategory = () => {
    setSubcategories({
      ...subcategories,
      ['New Subcategory']: 0
    })
  }

  const handleRemoveSubcategory = (subcategory: string) => {
    const newSubcategories = { ...subcategories }
    delete newSubcategories[subcategory]
    setSubcategories(newSubcategories)
  }

  const handleUpdateSubcategory = (subcategory: string, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0 || numValue > 1) return
    
    setSubcategories({
      ...subcategories,
      [subcategory]: numValue
    })
  }

  const handleRenameSubcategory = (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return
    
    const newSubcategories = { ...subcategories }
    const value = newSubcategories[oldName]
    delete newSubcategories[oldName]
    newSubcategories[newName] = value
    
    setSubcategories(newSubcategories)
  }

  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      setError(null)
      setUpdatedSubcategories(null)
      
      const result = await updateCategory(category, subcategories)
      setUpdatedSubcategories(result)
    } catch (e) {
      setError('Error updating category: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Update Category Understanding</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="category">Category Name</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Subcategories</span>
              <Button onClick={handleAddSubcategory}>Add Subcategory</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {Object.entries(subcategories).map(([subcat, value]) => (
                <li key={subcat} className="flex items-center gap-2">
                  <Input 
                    value={subcat}
                    onChange={(e) => handleRenameSubcategory(subcat, e.target.value)}
                    className="flex-grow"
                  />
                  <div className="flex items-center gap-2 w-32">
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={value}
                      onChange={(e) => handleUpdateSubcategory(subcat, e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveSubcategory(subcat)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Button
          onClick={handleUpdate}
          disabled={isProcessing || isUpdating}
          className="mt-4"
        >
          {isProcessing || isUpdating ? 'Updating...' : 'Update Category Understanding'}
        </Button>
        
        {updatedSubcategories && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Updated Understanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(updatedSubcategories).map(([subcat, value]) => (
                  <div key={subcat} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="font-medium">{subcat}</span>
                    <span className="text-blue-600 font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 