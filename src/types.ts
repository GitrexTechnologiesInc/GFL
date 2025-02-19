export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  points: number;
}

export interface Question {
  id: string;
  type: 'winner' | 'topScorer' | 'topWicketTaker' | 'totalScore';
  points: number;
}

export interface Match {
  id: string;
  team1: string;
  team2: string;
  team1Flag: string;
  team2Flag: string;
  dueDate: Date;
  status: 'upcoming' | 'live' | 'completed';
  format: string;
  duration: number;
  questions: Question[];
  result?: {
    winner?: string;
    topScorer?: string;
    topWicketTaker?: string;
    firstInningsTeam?: string;
    totalScore?: string;
  };
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  points_earned?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Squad {
  teamId: string;
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  role: string;
} 