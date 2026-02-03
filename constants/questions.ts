import { Question } from '@/types/questionFlow';

export const MANDATORY_QUESTIONS: Question[] = [
  {
    id: 'q-childhood',
    text: 'O que você viu, ouviu e sentiu durante a infância que te impactou mais e como era o seu relacionamento com seus pais, avós e tios?',
    category: 'childhood',
    isMandatory: true,
    order: 0,
    followUpPrompt: 'Baseado na resposta do usuário sobre a infância, gere UMA pergunta profunda em PT-BR explorando padrões emocionais da infância que podem ter se tornado bloqueios subconscientes.',
  },
  {
    id: 'q-self-image',
    text: 'Como você se vê hoje? Quais adjetivos usaria para descrever a si mesmo(a) e de onde você acha que essa imagem veio?',
    category: 'self-image',
    isMandatory: true,
    order: 1,
    followUpPrompt: 'Baseado na descrição de autoimagem do usuário, gere UMA pergunta em PT-BR que explore a lacuna entre quem a pessoa é e quem ela gostaria de ser.',
  },
  {
    id: 'q-relationships',
    text: 'Qual é o padrão que se repete nos seus relacionamentos amorosos ou de amizade? O que você sente que sempre dá errado?',
    category: 'relationships',
    isMandatory: true,
    order: 2,
    followUpPrompt: 'Baseado nos padrões de relacionamento descritos, gere UMA pergunta em PT-BR explorando se esses padrões espelham dinâmicas da família de origem.',
  },
  {
    id: 'q-emotions',
    text: 'Qual emoção você mais evita sentir? Raiva, tristeza, medo, vergonha? E o que acontece quando ela aparece?',
    category: 'emotions',
    isMandatory: true,
    order: 3,
    followUpPrompt: 'Baseado no padrão de evitação emocional, gere UMA pergunta em PT-BR explorando o que o usuário está se protegendo ao evitar essa emoção.',
  },
  {
    id: 'q-future',
    text: 'Se você pudesse se libertar de um único bloqueio agora, qual seria? E como você imagina sua vida sem ele?',
    category: 'future',
    isMandatory: true,
    order: 4,
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  childhood: 'Infância',
  family: 'Família',
  'self-image': 'Autoimagem',
  relationships: 'Relacionamentos',
  emotions: 'Emoções',
  future: 'Futuro',
};
