import { Badge } from "@/components/ui/badge";
import { Session } from "@/types";

interface SessionCardProps {
  session: Session;
  onSessionClick: (session: Session) => void;
  getDifficultyColor: (difficulty: Session["difficulty"]) => string;
}

export function SessionCard({ session, onSessionClick, getDifficultyColor }: SessionCardProps) {
  return (
    <div
      key={session.id}
      onClick={() => onSessionClick(session)}
      className="p-6 rounded-lg border cursor-pointer transition-all duration-200 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{session.studentName}</h3>
          <p className="text-sm text-gray-600 mb-2">{session.subject}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{session.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "pending" && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              Pending
            </Badge>
          )}
          {session.status === "running" && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-600 animate-pulse">
              Simulating...
            </Badge>
          )}
          {session.status === "completed" && (
            <Badge variant="secondary" className="bg-green-100 text-green-600">
              Completed
            </Badge>
          )}
          {session.status === "error" && (
            <Badge variant="secondary" className="bg-red-100 text-red-600">
              Error
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-5">
        <Badge className={getDifficultyColor(session.difficulty)}>
          {session.difficulty}
        </Badge>
        {session.simulationResult && (
          <span className="text-xs text-gray-500">
            {session.simulationResult.simulatedConversation.length} messages
          </span>
        )}
      </div>
    </div>
  );
}