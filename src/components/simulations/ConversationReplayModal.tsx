import { Badge } from "@/components/ui/badge";
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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {selectedSession ? `Conversation Replay: ${selectedSession.studentName}` : "Conversation Replay"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {selectedSession ? (
            <>
              {selectedSession.status === "running" && (
                <p className="text-blue-500 text-center py-8">
                  <span className="animate-pulse">Simulation in progress...</span>
                </p>
              )}
              
              {selectedSession.status === "pending" && (
                <p className="text-gray-500 text-center py-8">
                  Simulation not run yet. Click "Run Simulations" to start.
                </p>
              )}
              
              {selectedSession.status === "error" && (
                <p className="text-red-500 text-center py-8">
                  Simulation failed. Please try again.
                </p>
              )}

              {selectedSession.status === "completed" && selectedSession.simulationResult && (
                <>
                  {/* Analysis Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2">Analysis Summary</h4>
                    <p className="text-sm text-gray-600">
                      {selectedSession.simulationResult.analysis.transcriptSummary}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
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
                  </div>

                  {/* Conversation Messages */}
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
                </>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No session selected.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}