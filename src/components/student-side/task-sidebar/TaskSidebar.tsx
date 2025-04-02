import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useFile } from '@/lib/context/FileContext';

import { conceptIcons } from "@/lib/data/student_tasks";

export default function TaskSidebar() {
  const { 
    sessionData, 
    currentMethodIndex, 
    goToNextMethod, 
    goToPrevMethod
  } = useFile();

  // Show loading state if sessionData not ready
  if (!sessionData || !sessionData.tasks) {
    return <div className="p-6">Loading task information...</div>;
  }

  const currentTask = sessionData.tasks[currentMethodIndex];
  const concepts = sessionData.conceptMappings[currentMethodIndex] || [];

  return (
    <div className="h-full flex flex-col bg-background -mt-7 relative">
      <ScrollArea className="flex-1 pb-16"> 
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{currentTask.title}</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {concepts.map((concept) => {
                const conceptInfo = conceptIcons[concept];
                const Icon = conceptInfo?.icon;
                return (
                  <Badge
                    key={concept}
                    variant="outline"
                    className={`text-xs font-normal flex items-center gap-1 ${conceptInfo?.className}`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {concept}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground/90 leading-relaxed">{currentTask.description}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Examples</h3>
            <div className="space-y-4">
              {currentTask.examples.map((example, index) => (
                <Card key={index} className="p-4 shadow-none border border-border/60 bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Example {index + 1}:</h4>
                  <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto font-mono">
                    <code>
                      {Object.entries(example.input).map(([key, value]) => {
                        return typeof value === 'string' 
                          ? `Input: ${key} = "${value}"\n`
                          : `Input: ${key} = ${JSON.stringify(value)}\n`;
                      })}
                      Output: {example.output}
                    </code>
                  </pre>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background flex justify-between items-center">
        <button
          onClick={goToPrevMethod}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
            currentMethodIndex === 0
              ? "text-muted-foreground opacity-50 cursor-not-allowed"
              : "hover:bg-muted text-foreground"
          }`}
          disabled={currentMethodIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        
        <div className="text-sm text-muted-foreground">
          {currentMethodIndex + 1} of {sessionData.tasks.length}
        </div>
        
        <button
          onClick={goToNextMethod}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
            currentMethodIndex === sessionData.tasks.length - 1
              ? "text-muted-foreground opacity-50 cursor-not-allowed"
              : "hover:bg-muted text-foreground"
          }`}
          disabled={currentMethodIndex === sessionData.tasks.length - 1}
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}