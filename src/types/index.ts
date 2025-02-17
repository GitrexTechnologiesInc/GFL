export type User = {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  points: number;
}

export type Match = {
  id: string;
  team1: string;
  team2: string;
  team1Flag: string;
  team2Flag: string;
  dueDate: Date;
  status: 'upcoming' | 'live' | 'completed';
  questions: Question[];
  result?: MatchResult;
}

export type Question = {
  id: string;
  matchId: string;
  type: 'winner' | 'topScorer' | 'topWicketTaker' | 'totalScore';
  points: number;
  options?: string[];
  correctAnswer?: string;
}

export type Prediction = {
  id: string;
  userId: string;
  matchId: string;
  questionId: string;
  answer: string;
  timestamp: Date;
}

export type MatchResult = {
  winningTeam: string;
  topScorer: string;
  topWicketTaker: string;
  firstInningsScore: string;
}

export type Squad = {
  teamId: string;
  players: Player[];
}

export type Player = {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'allRounder' | 'wicketKeeper';
} 