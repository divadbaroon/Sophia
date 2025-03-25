import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Hash, Database } from "lucide-react"

import type { TaskSidebarProps } from "@/types"

const conceptIcons: Record<string, { icon: any; className: string }> = {
  Array: {
    icon: Database,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  "Hash Table": {
    icon: Hash,
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  },
}

export default function TaskSidebar({title, difficulty, description, examples, constraints }: TaskSidebarProps) {
  const concepts = ["Array", "Hash Table"]
  return (
    <div className="h-full flex flex-col bg-background -mt-7">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {concepts.map((concept) => {
              const conceptInfo = conceptIcons[concept]
              const Icon = conceptInfo?.icon
              return (
                <Badge
                  key={concept}
                  variant="outline"
                  className={`text-xs font-normal flex items-center gap-1 ${conceptInfo?.className}`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {concept}
                </Badge>
              )
            })}
          </div>
        </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Examples</h3>
            <div className="space-y-4">
              {examples.map((example, index) => (
                <Card key={index} className="p-4 shadow-none border border-border/60 bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Example {index + 1}:</h4>
                  <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto font-mono">
                  <code>
  {example.input.nums && Array.isArray(example.input.nums) 
    ? `Input: nums = [${example.input.nums.join(",")}], target = ${example.input.target}
       Output: [${Array.isArray(example.output) ? example.output.join(",") : example.output}]` 
    : `Input: sequence = "${example.input.sequence}", word = "${example.input.word}"
       Output: ${example.output}`}
</code>
                  </pre>
                  {example.explanation && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      <span className="font-medium">Explanation:</span> {example.explanation}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {constraints && constraints.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Constraints</h3>
                <ul className="text-sm text-muted-foreground/90 space-y-1 list-disc pl-5">
                  {constraints.map((constraint, index) => (
                    <li key={index}>{constraint}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
