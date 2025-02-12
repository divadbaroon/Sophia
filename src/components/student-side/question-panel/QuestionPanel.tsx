'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

interface QuestionPanelProps {
  onBack: () => void
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ onBack }) => {
  const [isStarted, setIsStarted] = useState(false)

  if (!isStarted) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Audio Question Assistant</h2>
        </div>
        <div className="mt-4 h-[calc(100%-60px)]">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardDescription>
                This tool will help you formulate a clear and effective question
                about your coding problem using voice input.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <ol className="space-y-3 list-decimal pl-6">
                  <li>Start speaking when ready - the system listens automatically</li>
                  <li>Pause naturally when you finish a thought</li>
                  <li>The system will analyze your response and guide you</li>
                  <li>Continue until you've built a complete question</li>
                </ol>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <span className="font-medium">Tip:</span> Don't worry about getting
                  everything perfect in your first response.
                </p>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={() => setIsStarted(true)} size="lg">
                  Begin
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const rubric = [
    {
      title: 'Clear Description',
      description: 'Sufficient context about goals and clear task explanation',
      score: 0,
      maxScore: 5,
      key: 'description',
    },
    {
      title: 'Issue Details',
      description: 'Description of unexpected behavior and when it occurs',
      score: 0,
      maxScore: 5,
      key: 'details',
    },
    {
      title: 'Troubleshooting',
      description: 'Previous resolution attempts and hypotheses about causes',
      score: 0,
      maxScore: 5,
      key: 'troubleshooting',
    },
    {
      title: 'Clarity',
      description: 'Well-structured question with logical flow',
      score: 0,
      maxScore: 5,
      key: 'clarity',
    },
  ]

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mt-4 h-[calc(100%-60px)]">
        <Card className="h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Audio Question Assistant</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="question">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="question">Question</TabsTrigger>
                <TabsTrigger value="rubric">Rubric</TabsTrigger>
                <TabsTrigger value="conversation">Conversation History</TabsTrigger>
              </TabsList>

              <TabsContent value="question">
                <Card>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[200px]">
                      <div className="flex flex-col items-center space-y-4 px-4">
                        <div className="text-center space-y-4 py-8">
                          <p className="text-lg text-primary">
                            Listening for your question...
                          </p>
                        </div>
                        <Progress value={0} />
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rubric">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Criteria</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rubric.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">
                          {item.score}/{item.maxScore}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="conversation">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-4">
                    <div className="p-2 rounded bg-gray-100">
                      <strong>You: </strong>
                      Example conversation history will appear here
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default QuestionPanel