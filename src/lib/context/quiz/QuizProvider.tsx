'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getQuizQuestions } from '@/lib/actions/quiz-actions';
import { useSession } from '../session/SessionProvider';

interface QuizContextType {
  // Quiz state
  quizLoading: boolean;
  quizData: any;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const { lessonId, sessionData } = useSession();

  // Quiz state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);

  // Load quiz questions when lesson data is ready
  useEffect(() => {
    const loadQuizQuestions = async () => {
      if (!lessonId || !sessionData) return;
      
      console.log("Loading quiz questions for lesson", lessonId);
      setQuizLoading(true);
      
      try {
        const { data: quizQuestions } = await getQuizQuestions(lessonId, 'post');
        
        if (quizQuestions && quizQuestions.length > 0) {
          // Format quiz data to match QuizModal expectations
          const formattedQuiz = {
            title: sessionData?.tasks[0]?.title || "Lesson Quiz", 
            questions: quizQuestions.map((question, index) => ({
              ...question,
              id: question.id || `question-${lessonId}-${index}` 
            }))
          };
          setQuizData(formattedQuiz);
          console.log("Quiz questions loaded successfully");
        } else {
          // Fallback to mock data if no quiz questions found
          console.warn('No quiz questions found for lesson:', lessonId);
          setQuizData({
            title: "Lesson Quiz",
            questions: [
              {
                id: "mock-1",
                question: "How would you rate your understanding of this lesson?",
                options: [
                  "I need more practice",
                  "I understand the basics", 
                  "I feel confident",
                  "I could teach this to someone else"
                ],
                correctAnswer: 2,
                explanation: "Great job completing this lesson! Continue practicing to build confidence."
              }
            ]
          });
        }
      } catch (error) {
        console.error('Error loading quiz questions:', error);
        // Fallback to mock data on error
        setQuizData({
          title: "Lesson Quiz",
          questions: [
            {
              id: "fallback-1",
              question: "You've completed all the tasks! How do you feel?",
              options: [
                "Ready for more challenges",
                "Need to review the concepts",
                "Confident in my understanding", 
                "Excited to continue learning"
              ],
              correctAnswer: 0,
              explanation: "Excellent work! Keep up the great progress."
            }
          ]
        });
      } finally {
        setQuizLoading(false);
      }
    };

    loadQuizQuestions();
  }, [lessonId, sessionData]);

  const value: QuizContextType = {
    quizLoading,
    quizData,
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};