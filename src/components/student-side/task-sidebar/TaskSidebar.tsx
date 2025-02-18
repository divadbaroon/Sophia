import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

import type { TaskSidebarProps } from "@/types"

export default function TaskSidebar({title, description, examples }: TaskSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-background -mt-7">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Examples</h3>
            <div className="space-y-4">
              {examples.map((example, index) => (
                <Card key={index} className="p-4 shadow-none border border-border/60">
                  <h4 className="text-sm mb-2">Example {index + 1}:</h4>
                  <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto font-mono">
                    <code>{`Input: nums = [${example.input.nums.join(",")}], target = ${example.input.target}
Output: [${example.output.join(",")}]`}</code>
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
        </div>
      </ScrollArea>
    </div>
  )
}

