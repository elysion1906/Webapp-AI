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
  preventDuplicates: boolean;
  excludedContent?: string; // Content from uploaded files to avoid
  excludedFileName?: string; // Name of the uploaded exclusion file
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  ERROR = 'ERROR'
}

export interface Source {
  id: string;
  type: 'file' | 'url' | 'text';
  name: string;
  content: string; // The extracted text or the URL string itself
  icon?: any;
}