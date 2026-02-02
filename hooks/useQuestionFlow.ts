import { useState, useCallback, useRef } from 'react';
import { Question, QuestionResponse, QuestionFlowState } from '@/types/questionFlow';
import { MANDATORY_QUESTIONS } from '@/constants/questions';
import { generateFollowUpQuestion } from '@/services/questionFlowService';

export function useQuestionFlow() {
  const [state, setState] = useState<QuestionFlowState>({
    currentQuestionIndex: 0,
    questions: [...MANDATORY_QUESTIONS],
    responses: [],
    isFlowComplete: false,
    isGeneratingFollowUp: false,
  });

  const questionStartTime = useRef<number>(Date.now());

  const currentQuestion: Question | null =
    state.currentQuestionIndex < state.questions.length
      ? state.questions[state.currentQuestionIndex]
      : null;

  const totalQuestions = state.questions.length;
  const answeredQuestions = state.responses.length;

  const initFlow = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      questions: [...MANDATORY_QUESTIONS],
      responses: [],
      isFlowComplete: false,
      isGeneratingFollowUp: false,
    });
    questionStartTime.current = Date.now();
  }, []);

  const addUserResponse = useCallback(
    async (transcribedText: string) => {
      if (!currentQuestion || state.isFlowComplete) return;

      const response: QuestionResponse = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        userResponse: transcribedText,
        category: currentQuestion.category,
        timestamp: Date.now(),
      };

      // Try generating a follow-up question
      setState(prev => ({ ...prev, isGeneratingFollowUp: true }));

      let followUp: Question | null = null;
      if (currentQuestion.followUpPrompt && transcribedText.trim().length > 20) {
        followUp = await generateFollowUpQuestion(
          currentQuestion,
          transcribedText,
          [...state.responses, response]
        );
      }

      setState(prev => {
        const newResponses = [...prev.responses, response];
        let newQuestions = [...prev.questions];

        // Insert follow-up after current question if generated
        if (followUp) {
          const insertIdx = prev.currentQuestionIndex + 1;
          newQuestions.splice(insertIdx, 0, followUp);
        }

        const nextIdx = prev.currentQuestionIndex + 1;
        const isComplete = nextIdx >= newQuestions.length;

        return {
          currentQuestionIndex: nextIdx,
          questions: newQuestions,
          responses: newResponses,
          isFlowComplete: isComplete,
          isGeneratingFollowUp: false,
        };
      });

      questionStartTime.current = Date.now();
    },
    [currentQuestion, state.isFlowComplete, state.responses]
  );

  const skipQuestion = useCallback(() => {
    setState(prev => {
      const nextIdx = prev.currentQuestionIndex + 1;
      return {
        ...prev,
        currentQuestionIndex: nextIdx,
        isFlowComplete: nextIdx >= prev.questions.length,
      };
    });
    questionStartTime.current = Date.now();
  }, []);

  return {
    state,
    currentQuestion,
    totalQuestions,
    answeredQuestions,
    questionStartTime,
    initFlow,
    addUserResponse,
    skipQuestion,
  };
}
