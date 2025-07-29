"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

import { Session } from "@/types";
import { sessionConfigs } from "@/lib/simulations/data/sessionConfigs";
import { runAllSimulations } from "@/lib/simulations/simulationApi";
import { ConversationReplayModal } from "@/components/simulations/ConversationReplayModal";
import { SessionCard } from "@/components/simulations/SessionCard";
import { CompetencyFilter } from "@/components/simulations/CompetencyFilter";
import { EvaluationCriteriaModal, EvaluationCriterion } from "@/components/simulations/EvaluationCriteriaModal";
import { VoiceSettingsModal } from "@/components/simulations/VoiceSettingsModal";

// Default evaluation criteria
const defaultCriteria: EvaluationCriterion[] = [
  {
    id: "teaching_effectiveness",
    name: "Teaching Effectiveness",
    conversationGoalPrompt: "The teacher effectively explained the concepts and helped the student understand."
  }
];

export default function SimulationReplayDashboard() {
  const [sessions, setSessions] = useState<Session[]>(
    sessionConfigs.map(config => ({ ...config, status: "pending" }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [competencyFilter, setCompetencyFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  
  // Evaluation Criteria State
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriterion[]>(defaultCriteria);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);

  // Voice Settings State
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  console.log("🔄 Component rendered with sessions:", sessions.map(s => ({ id: s.id, status: s.status })));

  const getDifficultyColor = (difficulty: Session["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSessions = sessions.filter(session => {
    const competencyMatch = competencyFilter === "all" || session.difficulty === competencyFilter;
    return competencyMatch;
  });

  const handleRunAllSimulations = () => {
    runAllSimulations(sessions, setSessions, setIsRunning, evaluationCriteria);
  };

  const handleSessionClick = (session: Session) => {
    console.log("🖱️ Session selected:", {
      id: session.id,
      studentName: session.studentName,
      status: session.status,
      hasResult: !!session.simulationResult
    });
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCriteriaSave = (newCriteria: EvaluationCriterion[]) => {
    setEvaluationCriteria(newCriteria);
    console.log("📊 Evaluation criteria updated:", newCriteria.map(c => c.name));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm mt-16">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Conversation Simulations
              </h1>
              <p className="text-sm text-gray-500">
                AI teacher-student conversation replays using ElevenLabs Simulation API
              </p>
            </div>
            <Button
              onClick={handleRunAllSimulations}
              disabled={isRunning}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Simulations...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Run Simulations
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          {/* Sessions List */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Simulation Sessions</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsVoiceSettingsOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5 12a5 5 0 007.54.54l3-3a5 5 0 00-7.54-.54z" />
                    </svg>
                    Voice Settings
                  </Button>
                  <Button
                    onClick={() => setIsCriteriaModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Evaluation Criteria
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Options */}
              <CompetencyFilter 
                competencyFilter={competencyFilter}
                setCompetencyFilter={setCompetencyFilter}
              />

              {/* Sessions */}
              {filteredSessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No sessions match the current filters.
                </p>
              ) : (
                filteredSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onSessionClick={handleSessionClick}
                    getDifficultyColor={getDifficultyColor}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversation Replay Modal */}
        <ConversationReplayModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          selectedSession={selectedSession}
        />

        {/* Voice Settings Modal */}
        <VoiceSettingsModal
          isOpen={isVoiceSettingsOpen}
          onOpenChange={setIsVoiceSettingsOpen}
        />

        {/* Evaluation Criteria Modal */}
        <EvaluationCriteriaModal
          isOpen={isCriteriaModalOpen}
          onOpenChange={setIsCriteriaModalOpen}
          criteria={evaluationCriteria}
          onSave={handleCriteriaSave}
        />
      </div>
    </div>
  );
}