import { Search, PlusCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

import { SearchHeaderProps } from "@/types"

export default function SearchHeader({
  title,
  description,
  showNewButton = false,
  onNewClick,
  filterOptions
}: SearchHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{title}</h1>
          <p className="text-lg text-gray-600">{description}</p>
        </div>
        {showNewButton && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={onNewClick}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Session
          </Button>
        )}
      </div>

      <div className="flex justify-end gap-4 mb-8">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search sessions" 
            className="pl-10" 
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}