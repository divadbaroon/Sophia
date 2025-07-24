import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Session } from "@/types";

interface ConversationReplayModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSession: Session | null;
}

export function ConversationReplayModal({
  isOpen,
  onOpenChange,
  selectedSession
}: ConversationReplayModalProps) {
  const [activeTab, setActiveTab] = useState<"conversation" | "analysis">("conversation");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {selectedSession ? `Conversation Replay: ${selectedSession.studentName}` : "Conversation Replay"}
          </DialogTitle>
        </DialogHeader>

        {selectedSession ? (
          <>
            {selectedSession.status === "running" && (
              <div className="text-blue-500 text-center py-8">
                <span className="animate-pulse">Simulation in progress...</span>
              </div>
            )}
            
            {selectedSession.status === "pending" && (
              <div className="text-gray-500 text-center py-8">
                Simulation not run yet. Click "Run Simulations" to start.
              </div>
            )}
            
            {selectedSession.status === "error" && (
              <div className="text-red-500 text-center py-8">
                Simulation failed. Please try again.
              </div>
            )}

            {selectedSession.status === "completed" && selectedSession.simulationResult && (
              <>
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                  <Button
                    variant={activeTab === "conversation" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("conversation")}
                    className="flex-1 h-8"
                  >
                    Conversation
                  </Button>
                  <Button
                    variant={activeTab === "analysis" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("analysis")}
                    className="flex-1 h-8"
                  >
                    Analysis
                  </Button>
                </div>

                {/* Tab Content */}
                <div className="overflow-y-auto max-h-[55vh]">
                  {activeTab === "conversation" && (
                    <div className="space-y-3">
                      {selectedSession.simulationResult.simulatedConversation
                        .filter(turn => turn.message && turn.message !== "==! END_CALL!==")
                        .map((turn, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 ${
                            turn.role === "user" ? "" : "flex-row-reverse"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                              turn.role === "user" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {turn.role === "user" ? "👨‍🎓" : "🤖"}
                          </div>
                          <div
                            className={`max-w-md p-3 rounded-lg ${
                              turn.role === "user"
                                ? "bg-green-50 border border-green-200"
                                : "bg-blue-50 border border-blue-200"
                            }`}
                          >
                            <div className="font-medium text-xs mb-1 text-gray-600">
                              {turn.role === "user" ? "Student" : "Teacher"}
                            </div>
                            <div className="text-sm text-gray-900">{turn.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "analysis" && (
                    <div className="space-y-4">
                      {/* Overall Status */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Overall Assessment</h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge 
                            className={
                              selectedSession.simulationResult.analysis.callSuccessful === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {selectedSession.simulationResult.analysis.callSuccessful}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedSession.simulationResult.analysis.transcriptSummary}
                        </p>
                      </div>

                      {/* Evaluation Criteria */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3">Evaluation Results</h4>
                        <div className="space-y-3">
                          {Object.entries(selectedSession.simulationResult.analysis.evaluationCriteriaResults).map(([key, result]) => (
                            <div key={key} className="border-l-4 border-gray-300 pl-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{result.name || key}</span>
                                <Badge 
                                  variant="secondary"
                                  className={
                                    result.result === "success" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {result.result}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">{result.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conversation Stats */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3">Conversation Statistics</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Messages:</span>
                            <span className="ml-2 font-medium">
                              {selectedSession.simulationResult.simulatedConversation
                                .filter(turn => turn.message && turn.message !== "==! END_CALL!==").length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Student Messages:</span>
                            <span className="ml-2 font-medium">
                              {selectedSession.simulationResult.simulatedConversation
                                .filter(turn => turn.role === "user" && turn.message && turn.message !== "==! END_CALL!==").length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Teacher Messages:</span>
                            <span className="ml-2 font-medium">
                              {selectedSession.simulationResult.simulatedConversation
                                .filter(turn => turn.role === "agent" && turn.message && turn.message !== "==! END_CALL!==").length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Competency Level:</span>
                            <span className="ml-2 font-medium capitalize">{selectedSession.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No session selected.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}