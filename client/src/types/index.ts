export type Priority = 'high' | 'medium' | 'low';

export type Category = 'Work' | 'Personal' | 'Shopping' | 'Health';

export type Mood = 'great' | 'okay' | 'bad';

export interface AITaskSuggestion {
  title: string;
  steps: Array<{
    title: string;
    estimatedTime: number;
  }>;
  recommendation: string;
}

export interface AILearningPrompt {
  question: string;
  options: string[];
  correctOption: number;
  hint: string;
}
