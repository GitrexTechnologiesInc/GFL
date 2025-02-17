export interface Prediction {
  id: string;
  userId: string;
  questionId: string;
  matchId: string;
  answer: string;
  isCorrect?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  team1: string;
  team2: string;
  team1Flag: string;
  team2Flag: string;
  dueDate: Date;
  duration: number; // Duration in hours
  format: 'ODI' | 'T20'; // Added format type
  status: 'upcoming' | 'in_progress' | 'completed';
  result?: {
    winner?: string;
    topScorer?: string;
    topWicketTaker?: string;
    firstInningsTeam: string;
    totalScore?: string; // For admin: actual score (e.g., "235")
  };
  questions: Question[];
} 