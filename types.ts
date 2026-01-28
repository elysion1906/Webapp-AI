export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}

export interface QuizConfig {
  numberOfQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  ERROR = 'ERROR'
}
