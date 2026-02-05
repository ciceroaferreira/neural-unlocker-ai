import { useState, useCallback, useRef } from 'react';
import { Question, QuestionResponse, QuestionFlowState } from '@/types/questionFlow';
import { MANDATORY_QUESTIONS } from '@/constants/questions';

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

      setState(prev => {
        const newResponses = [...prev.responses, response];
        const nextIdx = prev.currentQuestionIndex + 1;
        const isComplete = nextIdx >= prev.questions.length;

        return {
          ...prev,
          currentQuestionIndex: nextIdx,
          responses: newResponses,
          isFlowComplete: isComplete,
        };
      });

      questionStartTime.current = Date.now();
    },
    [currentQuestion, state.isFlowComplete]
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
