import { Question, QuestionCategory } from '@/types/questionFlow';

export const MANDATORY_QUESTIONS: Question[] = [
  {
    id: 'q-heranca-familiar',
    text: 'O que você viu, ouviu e sentiu ao longo de sua vida no relacionamento com seus pais e avós?',
    category: 'heranca-familiar',
    isMandatory: true,
    order: 0,
    followUpPrompt: 'Explore mais sobre a herança familiar do usuário: crenças, frases repetidas, comportamentos observados na infância.',
  },
  {
    id: 'q-experiencias-marcantes',
    text: 'Você sentiu ou viveu algo mais que te marcou?',
    category: 'experiencias-marcantes',
    isMandatory: true,
    order: 1,
    followUpPrompt: 'Aprofunde nas experiências marcantes: traumas, momentos de ruptura, eventos que moldaram crenças sobre si mesmo.',
  },
  {
    id: 'q-gatilhos-atuais',
    text: 'O que você lembra que te afeta nos dias de hoje?',
    category: 'gatilhos-atuais',
    isMandatory: true,
    order: 2,
    followUpPrompt: 'Investigue os gatilhos atuais: situações, pessoas ou contextos que reativam padrões emocionais antigos.',
  },
];

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  'heranca-familiar': 'Herança Familiar',
  'experiencias-marcantes': 'Experiências Marcantes',
  'gatilhos-atuais': 'Gatilhos Atuais',
};
