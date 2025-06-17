"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"

interface AddClassModalProps {
  isOpen: boolean
  onClose: () => void
  onAddClass: (classData: ClassData) => void
}

interface ClassData {
  name: string
  code: string
  description: string
  subject: string
  semester: string
  year: string
}

export function AddClassModal({ isOpen, onClose, onAddClass }: AddClassModalProps) {
  const [formData, setFormData] = useState<ClassData>({
    name: "",
    code: "",
    description: "",
    subject: "",
    semester: "",
    year: new Date().getFullYear().toString(),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof ClassData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.code || !formData.subject) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onAddClass(formData)

    // Reset form
    setFormData({
      name: "",
      code: "",
      description: "",
      subject: "",
      semester: "",
      year: new Date().getFullYear().toString(),
    })

    setIsSubmitting(false)
    onClose()
  }

  const isFormValid = formData.name && formData.code && formData.subject

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-2 border-black">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-black">Add New Class</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2 -mt-3">
            <Label htmlFor="code">Class Code *</Label>
            <Input
              id="code"
              type="text"
              placeholder="e.g., CS101"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              className="border-2 border-gray-200 focus:border-black transition-colors"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-2 border-gray-200 hover:border-black transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add Class
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
