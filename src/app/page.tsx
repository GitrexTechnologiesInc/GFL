'use client';

import { useState, useEffect } from 'react';
import MatchPrediction from '@/components/MatchPrediction';
import AdminPanel from '@/components/AdminPanel';
import LoginForm from '@/components/LoginForm';
import { Match, User, Squad, Prediction } from '@/types';
import Leaderboard from '@/components/Leaderboard';
import { signInUser, signOutUser, getCurrentUser } from '@/services/users';
import { getUserPredictions } from '@/services/predictions';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin@1234'
};

// Simulated user data - in a real app, this would come from a database
const MOCK_USERS: { [key: string]: User } = {
  'admin': {
    id: 'admin',
    username: 'admin',
    password: 'admin@1234',
    isAdmin: true,
    points: 0
  },
  'johndoe': {
    id: 'johndoe',
    username: 'John Doe',
    password: 'test123',
    isAdmin: false,
    points: 15
  },
  'alice': {
    id: 'alice',
    username: 'Alice Smith',
    password: 'test123',
    isAdmin: false,
    points: 22
  },
  'bob': {
    id: 'bob',
    username: 'Bob Johnson',
    password: 'test123',
    isAdmin: false,
    points: 18
  },
  'charlie': {
    id: 'charlie',
    username: 'Charlie Brown',
    password: 'test123',
    isAdmin: false,
    points: 20
  }
};

// Match duration constants (in hours)
const MATCH_DURATIONS = {
  ODI: 8,
  T20: 4
} as const;

// Helper function to determine match status
const getMatchStatus = (dueDate: Date, duration: number): Match['status'] => {
  const now = new Date();
  const matchEndTime = new Date(dueDate.getTime() + duration * 60 * 60 * 1000);
  
  if (now < dueDate) {
    return 'upcoming';
  } else if (now >= dueDate && now < matchEndTime) {
    return 'in_progress';
  } else {
    return 'completed';
  }
};

// Update MOCK_MATCHES to remove hardcoded status
// const MOCK_MATCHES: Match[] = [
//   {
//     id: 'match1',
//     team1: 'India',
//     team2: 'Australia',
//     team1Flag: '🇮🇳',
//     team2Flag: '🇦🇺',
//     dueDate: new Date('2025-02-20 14:30'),
//     duration: MATCH_DURATIONS.ODI,
//     format: 'ODI',
//     questions: [
//       {
//         id: 'q1_match1',
//         matchId: 'match1',
//         type: 'winner',
//         points: 1,
//       },
//       {
//         id: 'q2_match1',
//         matchId: 'match1',
//         type: 'topScorer',
//         points: 3,
//       },
//       {
//         id: 'q3_match1',
//         matchId: 'match1',
//         type: 'topWicketTaker',
//         points: 3,
//       },
//       {
//         id: 'q4_match1',
//         matchId: 'match1',
//         type: 'totalScore',
//         points: 1,
//       }
//     ]
//   },
//   {
//     id: 'match2',
//     team1: 'England',
//     team2: 'South Africa',
//     team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
//     team2Flag: '🇿🇦',
//     dueDate: new Date('2025-02-18 15:00'),
//     duration: MATCH_DURATIONS.ODI,
//     format: 'ODI',
//     questions: [
//       {
//         id: 'q1_match2',
//         matchId: 'match2',
//         type: 'winner',
//         points: 1,
//       },
//       {
//         id: 'q2_match2',
//         matchId: 'match2',
//         type: 'topScorer',
//         points: 3,
//       },
//       {
//         id: 'q3_match2',
//         matchId: 'match2',
//         type: 'topWicketTaker',
//         points: 3,
//       },
//       {
//         id: 'q4_match2',
//         matchId: 'match2',
//         type: 'totalScore',
//         points: 1,
//       }
//     ]
//   },
//   {
//     id: 'match3',
//     team1: 'Pakistan',
//     team2: 'New Zealand',
//     team1Flag: '🇵🇰',
//     team2Flag: '🇳🇿',
//     dueDate: new Date('2025-02-16 13:00'),
//     duration: MATCH_DURATIONS.ODI,
//     format: 'ODI',
//     questions: [
//       {
//         id: 'q1_match3',
//         matchId: 'match3',
//         type: 'winner',
//         points: 1,
//       },
//       {
//         id: 'q2_match3',
//         matchId: 'match3',
//         type: 'topScorer',
//         points: 3,
//       },
//       {
//         id: 'q3_match3',
//         matchId: 'match3',
//         type: 'topWicketTaker',
//         points: 3,
//       },
//       {
//         id: 'q4_match3',
//         matchId: 'match3',
//         type: 'totalScore',
//         points: 1,
//       }
//     ]
//   },
//   {
//     id: 'match4',
//     team1: 'Bangladesh',
//     team2: 'Sri Lanka',
//     team1Flag: '🇧🇩',
//     team2Flag: '🇱🇰',
//     dueDate: new Date('2024-02-14 14:00'),
//     duration: MATCH_DURATIONS.ODI,
//     format: 'ODI',
//     questions: [
//       {
//         id: 'q1_match4',
//         matchId: 'match4',
//         type: 'winner',
//         points: 1,
//       },
//       {
//         id: 'q2_match4',
//         matchId: 'match4',
//         type: 'topScorer',
//         points: 3,
//       },
//       {
//         id: 'q3_match4',
//         matchId: 'match4',
//         type: 'topWicketTaker',
//         points: 3,
//       },
//       {
//         id: 'q4_match4',
//         matchId: 'match4',
//         type: 'totalScore',
//         points: 1,
//       }
//     ],
//     result: {
//       winner: 'Sri Lanka',
//       topScorer: 'Kusal Mendis',
//       topWicketTaker: 'Wanindu Hasaranga',
//       totalScore: '280-290'
//     }
//   }
// ];

// Helper to generate the 4 standard questions for a match
const makeQuestions = (matchId: string) => [
  { id: `q1_${matchId}`, matchId, type: 'winner' as const, points: 1 },
  { id: `q2_${matchId}`, matchId, type: 'topScorer' as const, points: 3 },
  { id: `q3_${matchId}`, matchId, type: 'topWicketTaker' as const, points: 3 },
  { id: `q4_${matchId}`, matchId, type: 'totalScore' as const, points: 5 },
];

const MOCK_MATCHES: Match[] = [
  // ==================== GROUP STAGE ====================

  // --- Sat, 07 Feb 2026 ---
  { id: 'match1', team1: 'Netherlands', team2: 'Pakistan', team1Flag: '🇳🇱', team2Flag: '🇵🇰', dueDate: new Date('2026-02-07 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match1') },
  { id: 'match2', team1: 'Scotland', team2: 'West Indies', team1Flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', team2Flag: '🌴', dueDate: new Date('2026-02-07 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match2') },
  { id: 'match3', team1: 'India', team2: 'United States', team1Flag: '🇮🇳', team2Flag: '🇺🇸', dueDate: new Date('2026-02-07 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match3') },

  // --- Sun, 08 Feb 2026 ---
  { id: 'match4', team1: 'Afghanistan', team2: 'New Zealand', team1Flag: '🇦🇫', team2Flag: '🇳🇿', dueDate: new Date('2026-02-08 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match4') },
  { id: 'match5', team1: 'England', team2: 'Nepal', team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team2Flag: '🇳🇵', dueDate: new Date('2026-02-08 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match5') },
  { id: 'match6', team1: 'Sri Lanka', team2: 'Ireland', team1Flag: '🇱🇰', team2Flag: '🇮🇪', dueDate: new Date('2026-02-08 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match6') },

  // --- Mon, 09 Feb 2026 ---
  { id: 'match7', team1: 'Italy', team2: 'Scotland', team1Flag: '🇮🇹', team2Flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', dueDate: new Date('2026-02-09 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match7') },
  { id: 'match8', team1: 'Oman', team2: 'Zimbabwe', team1Flag: '🇴🇲', team2Flag: '🇿🇼', dueDate: new Date('2026-02-09 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match8') },
  { id: 'match9', team1: 'Canada', team2: 'South Africa', team1Flag: '🇨🇦', team2Flag: '🇿🇦', dueDate: new Date('2026-02-09 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match9') },

  // --- Tue, 10 Feb 2026 ---
  { id: 'match10', team1: 'Namibia', team2: 'Netherlands', team1Flag: '🇳🇦', team2Flag: '🇳🇱', dueDate: new Date('2026-02-10 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match10') },
  { id: 'match11', team1: 'New Zealand', team2: 'UAE', team1Flag: '🇳🇿', team2Flag: '🇦🇪', dueDate: new Date('2026-02-10 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match11') },
  { id: 'match12', team1: 'Pakistan', team2: 'United States', team1Flag: '🇵🇰', team2Flag: '🇺🇸', dueDate: new Date('2026-02-10 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match12') },

  // --- Wed, 11 Feb 2026 ---
  { id: 'match13', team1: 'Afghanistan', team2: 'South Africa', team1Flag: '🇦🇫', team2Flag: '🇿🇦', dueDate: new Date('2026-02-11 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match13') },
  { id: 'match14', team1: 'Australia', team2: 'Ireland', team1Flag: '🇦🇺', team2Flag: '🇮🇪', dueDate: new Date('2026-02-14 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match14') },
  { id: 'match15', team1: 'England', team2: 'West Indies', team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team2Flag: '🌴', dueDate: new Date('2026-02-11 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match15') },

  // --- Thu, 12 Feb 2026 ---
  { id: 'match16', team1: 'Sri Lanka', team2: 'Oman', team1Flag: '🇱🇰', team2Flag: '🇴🇲', dueDate: new Date('2026-02-12 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match16') },
  { id: 'match17', team1: 'Italy', team2: 'Nepal', team1Flag: '🇮🇹', team2Flag: '🇳🇵', dueDate: new Date('2026-02-12 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match17') },
  { id: 'match18', team1: 'India', team2: 'Namibia', team1Flag: '🇮🇳', team2Flag: '🇳🇦', dueDate: new Date('2026-02-12 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match18') },

  // --- Fri, 13 Feb 2026 ---
  { id: 'match19', team1: 'Australia', team2: 'Zimbabwe', team1Flag: '🇦🇺', team2Flag: '🇿🇼', dueDate: new Date('2026-02-13 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match19') },
  { id: 'match20', team1: 'Canada', team2: 'UAE', team1Flag: '🇨🇦', team2Flag: '🇦🇪', dueDate: new Date('2026-02-13 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match20') },
  { id: 'match21', team1: 'Netherlands', team2: 'United States', team1Flag: '🇳🇱', team2Flag: '🇺🇸', dueDate: new Date('2026-02-13 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match21') },

  // --- Sat, 14 Feb 2026 ---
  { id: 'match22', team1: 'Ireland', team2: 'Oman', team1Flag: '🇮🇪', team2Flag: '🇴🇲', dueDate: new Date('2026-02-14 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match22') },
  { id: 'match23', team1: 'England', team2: 'Scotland', team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team2Flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', dueDate: new Date('2026-02-14 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match23') },
  { id: 'match24', team1: 'New Zealand', team2: 'South Africa', team1Flag: '🇳🇿', team2Flag: '🇿🇦', dueDate: new Date('2026-02-14 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match24') },

  // --- Sun, 15 Feb 2026 ---
  { id: 'match25', team1: 'Nepal', team2: 'West Indies', team1Flag: '🇳🇵', team2Flag: '🌴', dueDate: new Date('2026-02-15 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match25') },
  { id: 'match26', team1: 'Namibia', team2: 'United States', team1Flag: '🇳🇦', team2Flag: '🇺🇸', dueDate: new Date('2026-02-15 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match26') },
  { id: 'match27', team1: 'India', team2: 'Pakistan', team1Flag: '🇮🇳', team2Flag: '🇵🇰', dueDate: new Date('2026-02-15 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match27') },

  // --- Mon, 16 Feb 2026 ---
  { id: 'match28', team1: 'Afghanistan', team2: 'UAE', team1Flag: '🇦🇫', team2Flag: '🇦🇪', dueDate: new Date('2026-02-16 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match28') },
  { id: 'match29', team1: 'England', team2: 'Italy', team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team2Flag: '🇮🇹', dueDate: new Date('2026-02-16 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match29') },
  { id: 'match30', team1: 'Australia', team2: 'Sri Lanka', team1Flag: '🇦🇺', team2Flag: '🇱🇰', dueDate: new Date('2026-02-16 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match30') },

  // --- Tue, 17 Feb 2026 ---
  { id: 'match31', team1: 'Canada', team2: 'New Zealand', team1Flag: '🇨🇦', team2Flag: '🇳🇿', dueDate: new Date('2026-02-17 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match31') },
  { id: 'match32', team1: 'Ireland', team2: 'Zimbabwe', team1Flag: '🇮🇪', team2Flag: '🇿🇼', dueDate: new Date('2026-02-17 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match32') },
  { id: 'match33', team1: 'Nepal', team2: 'Scotland', team1Flag: '🇳🇵', team2Flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', dueDate: new Date('2026-02-17 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match33') },

  // --- Wed, 18 Feb 2026 ---
  { id: 'match34', team1: 'South Africa', team2: 'UAE', team1Flag: '🇿🇦', team2Flag: '🇦🇪', dueDate: new Date('2026-02-18 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match34') },
  { id: 'match35', team1: 'Namibia', team2: 'Pakistan', team1Flag: '🇳🇦', team2Flag: '🇵🇰', dueDate: new Date('2026-02-18 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match35') },
  { id: 'match36', team1: 'India', team2: 'Netherlands', team1Flag: '🇮🇳', team2Flag: '🇳🇱', dueDate: new Date('2026-02-18 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match36') },

  // --- Thu, 19 Feb 2026 ---
  { id: 'match37', team1: 'Italy', team2: 'West Indies', team1Flag: '🇮🇹', team2Flag: '🌴', dueDate: new Date('2026-02-19 10:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match37') },
  { id: 'match38', team1: 'Sri Lanka', team2: 'Zimbabwe', team1Flag: '🇱🇰', team2Flag: '🇿🇼', dueDate: new Date('2026-02-19 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match38') },
  { id: 'match39', team1: 'Afghanistan', team2: 'Canada', team1Flag: '🇦🇫', team2Flag: '🇨🇦', dueDate: new Date('2026-02-19 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match39') },

  // --- Fri, 20 Feb 2026 ---
  { id: 'match40', team1: 'Australia', team2: 'Oman', team1Flag: '🇦🇺', team2Flag: '🇴🇲', dueDate: new Date('2026-02-20 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match40') },

  // ==================== SUPER EIGHTS ====================

  // --- Sat, 21 Feb 2026 ---
  { id: 'match41', team1: 'TBA (Y2)', team2: 'TBA (Y3)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-21 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match41') },

  // --- Sun, 22 Feb 2026 ---
  { id: 'match42', team1: 'TBA (Y1)', team2: 'TBA (Y4)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-22 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match42') },
  { id: 'match43', team1: 'TBA (X1)', team2: 'TBA (X4)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-22 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match43') },

  // --- Mon, 23 Feb 2026 ---
  { id: 'match44', team1: 'TBA (X2)', team2: 'TBA (X3)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-23 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match44') },

  // --- Tue, 24 Feb 2026 ---
  { id: 'match45', team1: 'TBA (Y1)', team2: 'TBA (Y3)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-24 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match45') },

  // --- Wed, 25 Feb 2026 ---
  { id: 'match46', team1: 'TBA (Y2)', team2: 'TBA (Y4)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-25 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match46') },

  // --- Thu, 26 Feb 2026 ---
  { id: 'match47', team1: 'TBA (X3)', team2: 'TBA (X4)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-26 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match47') },
  { id: 'match48', team1: 'TBA (X1)', team2: 'TBA (X2)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-26 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match48') },

  // --- Fri, 27 Feb 2026 ---
  { id: 'match49', team1: 'TBA (Y1)', team2: 'TBA (Y2)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-27 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match49') },

  // --- Sat, 28 Feb 2026 ---
  { id: 'match50', team1: 'TBA (Y3)', team2: 'TBA (Y4)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-02-28 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match50') },

  // --- Sun, 01 Mar 2026 ---
  { id: 'match51', team1: 'TBA (X2)', team2: 'TBA (X4)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-03-01 14:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match51') },
  { id: 'match52', team1: 'TBA (X1)', team2: 'TBA (X3)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-03-01 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match52') },

  // ==================== KNOCKOUTS ====================

  // --- Wed, 04 Mar 2026 ---
  { id: 'match53', team1: 'TBA (SF1)', team2: 'TBA (SF1)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-03-04 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match53') },

  // --- Thu, 05 Mar 2026 ---
  { id: 'match54', team1: 'TBA (SF2)', team2: 'TBA (SF2)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-03-05 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match54') },

  // --- Sun, 08 Mar 2026 ---
  { id: 'match55', team1: 'TBA (Final)', team2: 'TBA (Final)', team1Flag: '🏏', team2Flag: '🏏', dueDate: new Date('2026-03-08 18:30'), duration: MATCH_DURATIONS.T20, format: 'T20', questions: makeQuestions('match55') },
];

// T20 World Cup 2026 — Official squads (all 20 teams)
const MOCK_SQUADS: { [key: string]: Squad } = {
  // ==================== GROUP A ====================
  'India': {
    teamId: 'India',
    players: [
      { id: 'ind_1', name: 'Suryakumar Yadav', role: 'batsman' },
      { id: 'ind_2', name: 'Abhishek Sharma', role: 'batsman' },
      { id: 'ind_3', name: 'Tilak Varma', role: 'batsman' },
      { id: 'ind_4', name: 'Rinku Singh', role: 'batsman' },
      { id: 'ind_5', name: 'Shivam Dube', role: 'batsman' },
      { id: 'ind_6', name: 'Sanju Samson', role: 'wicketKeeper' },
      { id: 'ind_7', name: 'Ishan Kishan', role: 'wicketKeeper' },
      { id: 'ind_8', name: 'Hardik Pandya', role: 'allRounder' },
      { id: 'ind_9', name: 'Axar Patel', role: 'allRounder' },
      { id: 'ind_10', name: 'Washington Sundar', role: 'allRounder' },
      { id: 'ind_11', name: 'Jasprit Bumrah', role: 'bowler' },
      { id: 'ind_12', name: 'Arshdeep Singh', role: 'bowler' },
      { id: 'ind_13', name: 'Harshit Rana', role: 'bowler' },
      { id: 'ind_14', name: 'Varun Chakaravarthy', role: 'bowler' },
      { id: 'ind_15', name: 'Kuldeep Yadav', role: 'bowler' },
    ]
  },
  'Pakistan': {
    teamId: 'Pakistan',
    players: [
      { id: 'pak_1', name: 'Babar Azam', role: 'batsman' },
      { id: 'pak_2', name: 'Fakhar Zaman', role: 'batsman' },
      { id: 'pak_3', name: 'Saim Ayub', role: 'batsman' },
      { id: 'pak_4', name: 'Salman Ali Agha', role: 'batsman' },
      { id: 'pak_5', name: 'Khawaja Mohammad Nafay', role: 'wicketKeeper' },
      { id: 'pak_6', name: 'Sahibzada Farhan', role: 'wicketKeeper' },
      { id: 'pak_7', name: 'Faheem Ashraf', role: 'allRounder' },
      { id: 'pak_8', name: 'Mohammad Nawaz', role: 'allRounder' },
      { id: 'pak_9', name: 'Shadab Khan', role: 'allRounder' },
      { id: 'pak_10', name: 'Usman Khan', role: 'allRounder' },
      { id: 'pak_11', name: 'Shaheen Shah Afridi', role: 'bowler' },
      { id: 'pak_12', name: 'Naseem Shah', role: 'bowler' },
      { id: 'pak_13', name: 'Abrar Ahmed', role: 'bowler' },
      { id: 'pak_14', name: 'Mohammad Salman Mirza', role: 'bowler' },
      { id: 'pak_15', name: 'Usman Tariq', role: 'bowler' },
    ]
  },
  'Netherlands': {
    teamId: 'Netherlands',
    players: [
      { id: 'ned_1', name: 'Max O\'Dowd', role: 'batsman' },
      { id: 'ned_2', name: 'Noah Croes', role: 'batsman' },
      { id: 'ned_3', name: 'Zach Lion-Cachet', role: 'batsman' },
      { id: 'ned_4', name: 'Colin Ackermann', role: 'allRounder' },
      { id: 'ned_5', name: 'Scott Edwards', role: 'wicketKeeper' },
      { id: 'ned_6', name: 'Bas de Leede', role: 'allRounder' },
      { id: 'ned_7', name: 'Roelof van der Merwe', role: 'allRounder' },
      { id: 'ned_8', name: 'Logan van Beek', role: 'allRounder' },
      { id: 'ned_9', name: 'Saqib Zulfiqar', role: 'bowler' },
      { id: 'ned_10', name: 'Fred Klaassen', role: 'bowler' },
      { id: 'ned_11', name: 'Kyle Klein', role: 'bowler' },
      { id: 'ned_12', name: 'Timm van der Gugten', role: 'bowler' },
      { id: 'ned_13', name: 'Paul van Meekeren', role: 'bowler' },
      { id: 'ned_14', name: 'Michael Levitt', role: 'bowler' },
      { id: 'ned_15', name: 'Aryan Dutt', role: 'bowler' },
    ]
  },
  'Namibia': {
    teamId: 'Namibia',
    players: [
      { id: 'nam_1', name: 'Gerhard Erasmus', role: 'allRounder' },
      { id: 'nam_2', name: 'Nicol Loftie-Eaton', role: 'batsman' },
      { id: 'nam_3', name: 'Malan Kruger', role: 'batsman' },
      { id: 'nam_4', name: 'Louren Steenkamp', role: 'allRounder' },
      { id: 'nam_5', name: 'Zane Green', role: 'wicketKeeper' },
      { id: 'nam_6', name: 'JJ Smit', role: 'allRounder' },
      { id: 'nam_7', name: 'Jan Frylinck', role: 'allRounder' },
      { id: 'nam_8', name: 'JC Balt', role: 'bowler' },
      { id: 'nam_9', name: 'Bernard Scholtz', role: 'bowler' },
      { id: 'nam_10', name: 'Ruben Trumpelmann', role: 'bowler' },
      { id: 'nam_11', name: 'Ben Shikongo', role: 'bowler' },
      { id: 'nam_12', name: 'Dylan Leicher', role: 'bowler' },
      { id: 'nam_13', name: 'WP Myburgh', role: 'bowler' },
      { id: 'nam_14', name: 'Jack Brassell', role: 'bowler' },
      { id: 'nam_15', name: 'Max Heingo', role: 'bowler' },
    ]
  },
  'United States': {
    teamId: 'United States',
    players: [
      { id: 'usa_1', name: 'Monank Patel', role: 'wicketKeeper' },
      { id: 'usa_2', name: 'Andries Gous', role: 'wicketKeeper' },
      { id: 'usa_3', name: 'Shehan Jayasuriya', role: 'allRounder' },
      { id: 'usa_4', name: 'Milind Kumar', role: 'batsman' },
      { id: 'usa_5', name: 'Shayan Jahangir', role: 'batsman' },
      { id: 'usa_6', name: 'Saiteja Mukkamala', role: 'batsman' },
      { id: 'usa_7', name: 'Jessy Singh', role: 'allRounder' },
      { id: 'usa_8', name: 'Harmeet Singh', role: 'allRounder' },
      { id: 'usa_9', name: 'Sanjay Krishnamurthi', role: 'bowler' },
      { id: 'usa_10', name: 'Nosthush Kenjige', role: 'bowler' },
      { id: 'usa_11', name: 'Saurabh Netravalkar', role: 'bowler' },
      { id: 'usa_12', name: 'Ali Khan', role: 'bowler' },
      { id: 'usa_13', name: 'Shadley Van Schalkwyk', role: 'bowler' },
      { id: 'usa_14', name: 'Mohammad Mohsin', role: 'bowler' },
      { id: 'usa_15', name: 'Shubham Ranjane', role: 'allRounder' },
    ]
  },

  // ==================== GROUP B ====================
  'Australia': {
    teamId: 'Australia',
    players: [
      { id: 'aus_1', name: 'Travis Head', role: 'batsman' },
      { id: 'aus_2', name: 'Matt Renshaw', role: 'batsman' },
      { id: 'aus_3', name: 'Tim David', role: 'batsman' },
      { id: 'aus_4', name: 'Josh Inglis', role: 'wicketKeeper' },
      { id: 'aus_5', name: 'Mitchell Marsh', role: 'allRounder' },
      { id: 'aus_6', name: 'Glenn Maxwell', role: 'allRounder' },
      { id: 'aus_7', name: 'Marcus Stoinis', role: 'allRounder' },
      { id: 'aus_8', name: 'Cameron Green', role: 'allRounder' },
      { id: 'aus_9', name: 'Cooper Connolly', role: 'allRounder' },
      { id: 'aus_10', name: 'Ben Dwarshuis', role: 'bowler' },
      { id: 'aus_11', name: 'Josh Hazlewood', role: 'bowler' },
      { id: 'aus_12', name: 'Adam Zampa', role: 'bowler' },
      { id: 'aus_13', name: 'Nathan Ellis', role: 'bowler' },
      { id: 'aus_14', name: 'Xavier Bartlett', role: 'bowler' },
      { id: 'aus_15', name: 'Matthew Kuhnemann', role: 'bowler' },
    ]
  },
  'Sri Lanka': {
    teamId: 'Sri Lanka',
    players: [
      { id: 'sl_1', name: 'Pathum Nissanka', role: 'batsman' },
      { id: 'sl_2', name: 'Kusal Mendis', role: 'wicketKeeper' },
      { id: 'sl_3', name: 'Charith Asalanka', role: 'batsman' },
      { id: 'sl_4', name: 'Kusal Perera', role: 'batsman' },
      { id: 'sl_5', name: 'Kamindu Mendis', role: 'allRounder' },
      { id: 'sl_6', name: 'Dasun Shanaka', role: 'allRounder' },
      { id: 'sl_7', name: 'Dhananjaya de Silva', role: 'allRounder' },
      { id: 'sl_8', name: 'Dushan Hemantha', role: 'allRounder' },
      { id: 'sl_9', name: 'Dunith Wellalage', role: 'allRounder' },
      { id: 'sl_10', name: 'Maheesh Theekshana', role: 'bowler' },
      { id: 'sl_11', name: 'Matheesha Pathirana', role: 'bowler' },
      { id: 'sl_12', name: 'Dushmantha Chameera', role: 'bowler' },
      { id: 'sl_13', name: 'Nuwan Thushara', role: 'bowler' },
      { id: 'sl_14', name: 'Dilshan Madushanka', role: 'bowler' },
      { id: 'sl_15', name: 'Niroshan Dickwella', role: 'wicketKeeper' },
    ]
  },
  'Ireland': {
    teamId: 'Ireland',
    players: [
      { id: 'ire_1', name: 'Paul Stirling', role: 'batsman' },
      { id: 'ire_2', name: 'Ross Adair', role: 'batsman' },
      { id: 'ire_3', name: 'Harry Tector', role: 'batsman' },
      { id: 'ire_4', name: 'Tim Tector', role: 'batsman' },
      { id: 'ire_5', name: 'Lorcan Tucker', role: 'wicketKeeper' },
      { id: 'ire_6', name: 'Curtis Campher', role: 'allRounder' },
      { id: 'ire_7', name: 'Gareth Delany', role: 'allRounder' },
      { id: 'ire_8', name: 'George Dockrell', role: 'allRounder' },
      { id: 'ire_9', name: 'Ben Calitz', role: 'allRounder' },
      { id: 'ire_10', name: 'Mark Adair', role: 'bowler' },
      { id: 'ire_11', name: 'Josh Little', role: 'bowler' },
      { id: 'ire_12', name: 'Barry McCarthy', role: 'bowler' },
      { id: 'ire_13', name: 'Craig Young', role: 'bowler' },
      { id: 'ire_14', name: 'Matthew Humphreys', role: 'bowler' },
      { id: 'ire_15', name: 'Ben White', role: 'bowler' },
    ]
  },
  'Oman': {
    teamId: 'Oman',
    players: [
      { id: 'omn_1', name: 'Jatinder Singh', role: 'batsman' },
      { id: 'omn_2', name: 'Sufyan Mehmood', role: 'batsman' },
      { id: 'omn_3', name: 'Jay Odedra', role: 'allRounder' },
      { id: 'omn_4', name: 'Karan Sonavale', role: 'allRounder' },
      { id: 'omn_5', name: 'Hammad Mirza', role: 'wicketKeeper' },
      { id: 'omn_6', name: 'Vinayak Shukla', role: 'wicketKeeper' },
      { id: 'omn_7', name: 'Jiten Ramanandi', role: 'allRounder' },
      { id: 'omn_8', name: 'Mohammad Nadeem', role: 'bowler' },
      { id: 'omn_9', name: 'Shakeel Ahmed', role: 'bowler' },
      { id: 'omn_10', name: 'Wasim Ali', role: 'bowler' },
      { id: 'omn_11', name: 'Shah Faisal', role: 'bowler' },
      { id: 'omn_12', name: 'Nadeem Khan', role: 'bowler' },
      { id: 'omn_13', name: 'Ashish Odedara', role: 'bowler' },
      { id: 'omn_14', name: 'Shafiq Jan', role: 'bowler' },
      { id: 'omn_15', name: 'Hasnain Ali Shah', role: 'bowler' },
    ]
  },
  'Zimbabwe': {
    teamId: 'Zimbabwe',
    players: [
      { id: 'zim_1', name: 'Sikandar Raza', role: 'allRounder' },
      { id: 'zim_2', name: 'Brian Bennett', role: 'batsman' },
      { id: 'zim_3', name: 'Dion Myers', role: 'batsman' },
      { id: 'zim_4', name: 'Brendan Taylor', role: 'wicketKeeper' },
      { id: 'zim_5', name: 'Tadiwanashe Marumani', role: 'wicketKeeper' },
      { id: 'zim_6', name: 'Clive Madande', role: 'wicketKeeper' },
      { id: 'zim_7', name: 'Ryan Burl', role: 'allRounder' },
      { id: 'zim_8', name: 'Tony Munyonga', role: 'allRounder' },
      { id: 'zim_9', name: 'Wellington Masakadza', role: 'bowler' },
      { id: 'zim_10', name: 'Graeme Cremer', role: 'bowler' },
      { id: 'zim_11', name: 'Blessing Muzarabani', role: 'bowler' },
      { id: 'zim_12', name: 'Richard Ngarava', role: 'bowler' },
      { id: 'zim_13', name: 'Brad Evans', role: 'bowler' },
      { id: 'zim_14', name: 'Tinotenda Maposa', role: 'bowler' },
      { id: 'zim_15', name: 'Tashinga Musekiwa', role: 'allRounder' },
    ]
  },

  // ==================== GROUP C ====================
  'England': {
    teamId: 'England',
    players: [
      { id: 'eng_1', name: 'Harry Brook', role: 'batsman' },
      { id: 'eng_2', name: 'Ben Duckett', role: 'batsman' },
      { id: 'eng_3', name: 'Phil Salt', role: 'wicketKeeper' },
      { id: 'eng_4', name: 'Jos Buttler', role: 'wicketKeeper' },
      { id: 'eng_5', name: 'Tom Banton', role: 'wicketKeeper' },
      { id: 'eng_6', name: 'Jacob Bethell', role: 'allRounder' },
      { id: 'eng_7', name: 'Will Jacks', role: 'allRounder' },
      { id: 'eng_8', name: 'Sam Curran', role: 'allRounder' },
      { id: 'eng_9', name: 'Liam Dawson', role: 'allRounder' },
      { id: 'eng_10', name: 'Jamie Overton', role: 'allRounder' },
      { id: 'eng_11', name: 'Jofra Archer', role: 'bowler' },
      { id: 'eng_12', name: 'Adil Rashid', role: 'bowler' },
      { id: 'eng_13', name: 'Rehan Ahmed', role: 'bowler' },
      { id: 'eng_14', name: 'Josh Tongue', role: 'bowler' },
      { id: 'eng_15', name: 'Luke Wood', role: 'bowler' },
    ]
  },
  'West Indies': {
    teamId: 'West Indies',
    players: [
      { id: 'wi_1', name: 'Shai Hope', role: 'wicketKeeper' },
      { id: 'wi_2', name: 'Brandon King', role: 'batsman' },
      { id: 'wi_3', name: 'Johnson Charles', role: 'batsman' },
      { id: 'wi_4', name: 'Shimron Hetmyer', role: 'batsman' },
      { id: 'wi_5', name: 'Rovman Powell', role: 'batsman' },
      { id: 'wi_6', name: 'Sherfane Rutherford', role: 'batsman' },
      { id: 'wi_7', name: 'Roston Chase', role: 'allRounder' },
      { id: 'wi_8', name: 'Jason Holder', role: 'allRounder' },
      { id: 'wi_9', name: 'Romario Shepherd', role: 'allRounder' },
      { id: 'wi_10', name: 'Akeal Hosein', role: 'bowler' },
      { id: 'wi_11', name: 'Gudakesh Motie', role: 'bowler' },
      { id: 'wi_12', name: 'Shamar Joseph', role: 'bowler' },
      { id: 'wi_13', name: 'Jayden Seales', role: 'bowler' },
      { id: 'wi_14', name: 'Quentin Sampson', role: 'bowler' },
      { id: 'wi_15', name: 'Matthew Forde', role: 'bowler' },
    ]
  },
  'Scotland': {
    teamId: 'Scotland',
    players: [
      { id: 'sco_1', name: 'Richie Berrington', role: 'batsman' },
      { id: 'sco_2', name: 'George Munsey', role: 'batsman' },
      { id: 'sco_3', name: 'Brandon McMullen', role: 'batsman' },
      { id: 'sco_4', name: 'Michael Jones', role: 'batsman' },
      { id: 'sco_5', name: 'Matthew Cross', role: 'wicketKeeper' },
      { id: 'sco_6', name: 'Tom Bruce', role: 'batsman' },
      { id: 'sco_7', name: 'Chris Greaves', role: 'allRounder' },
      { id: 'sco_8', name: 'Michael Leask', role: 'allRounder' },
      { id: 'sco_9', name: 'Oliver Davidson', role: 'allRounder' },
      { id: 'sco_10', name: 'Mark Watt', role: 'bowler' },
      { id: 'sco_11', name: 'Safyaan Sharif', role: 'bowler' },
      { id: 'sco_12', name: 'Bradley Wheal', role: 'bowler' },
      { id: 'sco_13', name: 'Bradley Currie', role: 'bowler' },
      { id: 'sco_14', name: 'Zainullah Ihsan', role: 'bowler' },
      { id: 'sco_15', name: 'Finlay McCreath', role: 'bowler' },
    ]
  },
  'Italy': {
    teamId: 'Italy',
    players: [
      { id: 'ita_1', name: 'Wayne Madsen', role: 'batsman' },
      { id: 'ita_2', name: 'Anthony Mosca', role: 'batsman' },
      { id: 'ita_3', name: 'Justin Mosca', role: 'batsman' },
      { id: 'ita_4', name: 'Zain Ali', role: 'batsman' },
      { id: 'ita_5', name: 'Gian Piero Meade', role: 'wicketKeeper' },
      { id: 'ita_6', name: 'JJ Smuts', role: 'allRounder' },
      { id: 'ita_7', name: 'Marcus Campopiano', role: 'allRounder' },
      { id: 'ita_8', name: 'Thomas Draca', role: 'allRounder' },
      { id: 'ita_9', name: 'Grant Stewart', role: 'bowler' },
      { id: 'ita_10', name: 'Syed Naqvi', role: 'bowler' },
      { id: 'ita_11', name: 'Harry Manenti', role: 'bowler' },
      { id: 'ita_12', name: 'Benjamin Manenti', role: 'bowler' },
      { id: 'ita_13', name: 'Ali Hasan', role: 'bowler' },
      { id: 'ita_14', name: 'Jaspreet Singh', role: 'bowler' },
      { id: 'ita_15', name: 'Crishan Kalugamage', role: 'bowler' },
    ]
  },
  'Nepal': {
    teamId: 'Nepal',
    players: [
      { id: 'nep_1', name: 'Rohit Paudel', role: 'batsman' },
      { id: 'nep_2', name: 'Kushal Bhurtel', role: 'batsman' },
      { id: 'nep_3', name: 'Sundeep Jora', role: 'batsman' },
      { id: 'nep_4', name: 'Sher Malla', role: 'batsman' },
      { id: 'nep_5', name: 'Aasif Sheikh', role: 'wicketKeeper' },
      { id: 'nep_6', name: 'Dipendra Singh Airee', role: 'allRounder' },
      { id: 'nep_7', name: 'Lokesh Bam', role: 'allRounder' },
      { id: 'nep_8', name: 'Aarif Sheikh', role: 'allRounder' },
      { id: 'nep_9', name: 'Sandeep Lamichhane', role: 'bowler' },
      { id: 'nep_10', name: 'Sompal Kami', role: 'bowler' },
      { id: 'nep_11', name: 'Karan KC', role: 'bowler' },
      { id: 'nep_12', name: 'Nandan Yadav', role: 'bowler' },
      { id: 'nep_13', name: 'Gulshan Jha', role: 'bowler' },
      { id: 'nep_14', name: 'Lalit Rajbanshi', role: 'bowler' },
      { id: 'nep_15', name: 'Basir Ahamad', role: 'bowler' },
    ]
  },

  // ==================== GROUP D ====================
  'Afghanistan': {
    teamId: 'Afghanistan',
    players: [
      { id: 'afg_1', name: 'Ibrahim Zadran', role: 'batsman' },
      { id: 'afg_2', name: 'Sediqullah Atal', role: 'batsman' },
      { id: 'afg_3', name: 'Darwish Rasooli', role: 'batsman' },
      { id: 'afg_4', name: 'Rahmanullah Gurbaz', role: 'wicketKeeper' },
      { id: 'afg_5', name: 'Mohammad Ishaq', role: 'wicketKeeper' },
      { id: 'afg_6', name: 'Mohammad Nabi', role: 'allRounder' },
      { id: 'afg_7', name: 'Gulbadin Naib', role: 'allRounder' },
      { id: 'afg_8', name: 'Azmatullah Omarzai', role: 'allRounder' },
      { id: 'afg_9', name: 'Rashid Khan', role: 'bowler' },
      { id: 'afg_10', name: 'Fazalhaq Farooqi', role: 'bowler' },
      { id: 'afg_11', name: 'Noor Ahmad', role: 'bowler' },
      { id: 'afg_12', name: 'Mujeeb Ur Rahman', role: 'bowler' },
      { id: 'afg_13', name: 'Abdullah Ahmadzai', role: 'bowler' },
      { id: 'afg_14', name: 'Ziaur Rahman', role: 'bowler' },
      { id: 'afg_15', name: 'Shahidullah', role: 'bowler' },
    ]
  },
  'New Zealand': {
    teamId: 'New Zealand',
    players: [
      { id: 'nz_1', name: 'Devon Conway', role: 'wicketKeeper' },
      { id: 'nz_2', name: 'Finn Allen', role: 'wicketKeeper' },
      { id: 'nz_3', name: 'Daryl Mitchell', role: 'batsman' },
      { id: 'nz_4', name: 'Mark Chapman', role: 'batsman' },
      { id: 'nz_5', name: 'Glenn Phillips', role: 'wicketKeeper' },
      { id: 'nz_6', name: 'Tim Seifert', role: 'wicketKeeper' },
      { id: 'nz_7', name: 'Mitchell Santner', role: 'allRounder' },
      { id: 'nz_8', name: 'Michael Bracewell', role: 'allRounder' },
      { id: 'nz_9', name: 'James Neesham', role: 'allRounder' },
      { id: 'nz_10', name: 'Rachin Ravindra', role: 'allRounder' },
      { id: 'nz_11', name: 'Lockie Ferguson', role: 'bowler' },
      { id: 'nz_12', name: 'Matt Henry', role: 'bowler' },
      { id: 'nz_13', name: 'Adam Milne', role: 'bowler' },
      { id: 'nz_14', name: 'Ish Sodhi', role: 'bowler' },
      { id: 'nz_15', name: 'Jacob Duffy', role: 'bowler' },
    ]
  },
  'South Africa': {
    teamId: 'South Africa',
    players: [
      { id: 'sa_1', name: 'Aiden Markram', role: 'batsman' },
      { id: 'sa_2', name: 'Tony de Zorzi', role: 'batsman' },
      { id: 'sa_3', name: 'Dewald Brevis', role: 'batsman' },
      { id: 'sa_4', name: 'David Miller', role: 'batsman' },
      { id: 'sa_5', name: 'Quinton de Kock', role: 'wicketKeeper' },
      { id: 'sa_6', name: 'Donovan Ferreira', role: 'wicketKeeper' },
      { id: 'sa_7', name: 'Marco Jansen', role: 'allRounder' },
      { id: 'sa_8', name: 'Corbin Bosch', role: 'allRounder' },
      { id: 'sa_9', name: 'George Linde', role: 'allRounder' },
      { id: 'sa_10', name: 'Jason Smith', role: 'allRounder' },
      { id: 'sa_11', name: 'Kagiso Rabada', role: 'bowler' },
      { id: 'sa_12', name: 'Anrich Nortje', role: 'bowler' },
      { id: 'sa_13', name: 'Lungi Ngidi', role: 'bowler' },
      { id: 'sa_14', name: 'Keshav Maharaj', role: 'bowler' },
      { id: 'sa_15', name: 'Kwena Maphaka', role: 'bowler' },
    ]
  },
  'Canada': {
    teamId: 'Canada',
    players: [
      { id: 'can_1', name: 'Dilpreet Bajwa', role: 'allRounder' },
      { id: 'can_2', name: 'Nicholas Kirton', role: 'batsman' },
      { id: 'can_3', name: 'Navneet Dhaliwal', role: 'batsman' },
      { id: 'can_4', name: 'Ajayveer Hundal', role: 'batsman' },
      { id: 'can_5', name: 'Shreyas Movva', role: 'wicketKeeper' },
      { id: 'can_6', name: 'Kanwarpal Tathgur', role: 'wicketKeeper' },
      { id: 'can_7', name: 'Harsh Thaker', role: 'allRounder' },
      { id: 'can_8', name: 'Saad Bin Zafar', role: 'allRounder' },
      { id: 'can_9', name: 'Kaleem Sana', role: 'bowler' },
      { id: 'can_10', name: 'Dilon Heyliger', role: 'bowler' },
      { id: 'can_11', name: 'Ravinderpal Singh', role: 'bowler' },
      { id: 'can_12', name: 'Ansh Patel', role: 'bowler' },
      { id: 'can_13', name: 'Shivam Sharma', role: 'bowler' },
      { id: 'can_14', name: 'Yuvraj Samra', role: 'batsman' },
      { id: 'can_15', name: 'Jaskarandeep Buttar', role: 'bowler' },
    ]
  },
  'UAE': {
    teamId: 'UAE',
    players: [
      { id: 'uae_1', name: 'Muhammad Waseem', role: 'batsman' },
      { id: 'uae_2', name: 'Alishan Sharafu', role: 'batsman' },
      { id: 'uae_3', name: 'Mayank Kumar', role: 'batsman' },
      { id: 'uae_4', name: 'Aryansh Sharma', role: 'wicketKeeper' },
      { id: 'uae_5', name: 'Simranjeet Singh', role: 'allRounder' },
      { id: 'uae_6', name: 'Haider Ali', role: 'allRounder' },
      { id: 'uae_7', name: 'Junaid Siddique', role: 'allRounder' },
      { id: 'uae_8', name: 'Muhammad Farooq', role: 'bowler' },
      { id: 'uae_9', name: 'Muhammad Jawadullah', role: 'bowler' },
      { id: 'uae_10', name: 'Rohid Khan', role: 'bowler' },
      { id: 'uae_11', name: 'Sohaib Khan', role: 'bowler' },
      { id: 'uae_12', name: 'Dhruv Parashar', role: 'bowler' },
      { id: 'uae_13', name: 'Harshit Kaushik', role: 'bowler' },
      { id: 'uae_14', name: 'Muhammad Arfan', role: 'bowler' },
      { id: 'uae_15', name: 'Muhammad Zohaib', role: 'bowler' },
    ]
  },
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>(() => 
    MOCK_MATCHES.map(match => ({
      ...match,
      status: getMatchStatus(new Date(match.dueDate), match.duration)
    }))
  );
  const [squads, setSquads] = useState<{ [key: string]: Squad }>(MOCK_SQUADS);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [savingPrediction, setSavingPrediction] = useState(false);
  
  // Get the latest upcoming match ID
  const getLatestUpcomingMatchId = () => {
    const now = new Date();
    return matches
      .filter(m => new Date(m.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.id || '';
  };

  // Initialize selectedMatchId with the latest upcoming match
  const [selectedMatchId, setSelectedMatchId] = useState<string>(getLatestUpcomingMatchId());

  // Update selectedMatchId when matches change
  useEffect(() => {
    if (!selectedMatchId) {
      setSelectedMatchId(getLatestUpcomingMatchId());
    }
  }, [matches]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };
    checkSession();
  }, []);

  // Update match statuses periodically
  useEffect(() => {
    const updateMatchStatuses = () => {
      setMatches(prevMatches => 
        prevMatches.map(match => ({
          ...match,
          status: getMatchStatus(new Date(match.dueDate), match.duration)
        }))
      );
    };

    // Update initially
    updateMatchStatuses();

    // Update every minute
    const interval = setInterval(updateMatchStatuses, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load user predictions on mount and after updates
  useEffect(() => {
    const loadPredictions = async () => {
      if (!user) return;
      try {
        const predictions = await getUserPredictions(user.id);
        console.log('Loaded predictions:', predictions);
        setUserPredictions(predictions);
      } catch (error) {
        console.error('Error loading predictions:', error);
      }
    };

    loadPredictions();
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await signInUser(email, password);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update the handlePrediction function
  const handlePrediction = (newPredictions: Prediction[]) => {
    // Update the userPredictions state with new predictions
    setUserPredictions(prev => {
      const updated = [...prev];
      
      newPredictions.forEach(newPred => {
        const existingIndex = updated.findIndex(p => 
          p.matchId === newPred.matchId && p.questionId === newPred.questionId
        );
        
        if (existingIndex >= 0) {
          updated[existingIndex] = newPred;
        } else {
          updated.push(newPred);
        }
      });
      
      return updated;
    });
  };

  // Update the handleResultUpdate function
  const handleResultUpdate = async (matchId: string, result: any) => {
    try {
      // Update local state
      setMatches(prev => prev.map(match => 
        match.id === matchId
          ? { ...match, result }
          : match
      ));
    } catch (error) {
      console.error('Error updating result:', error);
      throw error;
    }
  };

  // Sort matches by date and filter upcoming ones
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const upcomingMatches = sortedMatches.filter(
    m => new Date(m.dueDate) > new Date()
  ).slice(0, 6); // Only show next 6 matches

  const pastMatches = sortedMatches.filter(
    m => new Date(m.dueDate) <= new Date()
  );

  // Helper function to get match status for display
  const getMatchDisplayStatus = (match: Match) => {
    const now = new Date();
    const matchDate = new Date(match.dueDate);
    const matchEndTime = new Date(matchDate.getTime() + match.duration * 60 * 60 * 1000);

    if (now < matchDate) {
      return 'Upcoming';
    } else if (now >= matchDate && now < matchEndTime) {
      return 'In Progress';
    } else {
      return 'Past';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gfl-navy relative overflow-hidden">
        {/* Background poster with overlay */}
        <div className="absolute inset-0">
          <img
            src="/gfl26-poster.png"
            alt="GFL 2026"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gfl-navy via-gfl-navy/80 to-gfl-navy/40" />
        </div>
        
        {/* Login card */}
        <div className="relative z-10 max-w-md w-full mx-4 animate-slide-up">
          <div className="text-center mb-8">
            <img
              src="/gfl26-poster.png"
              alt="GFL 2026"
              className="w-32 h-32 mx-auto rounded-2xl shadow-glow-gold object-cover mb-4 border-2 border-gfl-gold/30"
            />
            <h1 className="text-3xl font-bold text-shimmer">GFL 2026</h1>
            <p className="text-gray-400 mt-1">T20 World Cup Cricket Fantasy League</p>
          </div>
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold mb-6 text-center text-white">Sign in to your account</h2>
            <LoginForm onLogin={handleLogin} />
          </div>
          <p className="text-center text-gray-600 text-xs mt-6">Powered by Gitrex</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gfl-navy">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-gfl-border/50">
        <div className="absolute inset-0">
          <img
            src="/gfl26-poster.png"
            alt=""
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gfl-navy via-gfl-navy/95 to-gfl-navy" />
        </div>
        <div className="relative max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/gfl26-poster.png"
              alt="GFL 2026"
              className="w-10 h-10 rounded-lg object-cover border border-gfl-gold/30"
            />
            <div>
              <h1 className="text-xl font-bold text-shimmer leading-tight">GFL 2026</h1>
              <p className="text-xs text-gray-500">T20 World Cup</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gfl-card/60 rounded-full px-4 py-2 border border-gfl-border/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-gray-300 text-sm">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gfl-red/20 text-red-400 px-4 py-2 rounded-lg hover:bg-gfl-red/30 border border-red-800/40 transition-all duration-200 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {user.isAdmin ? (
              <AdminPanel
                matches={matches}
                users={Object.values(MOCK_USERS)}
                squads={squads}
                onUpdateResult={handleResultUpdate}
                user={user}
              />
            ) : (
              <MatchPrediction
                matches={matches}
                selectedMatchId={selectedMatchId}
                onMatchSelect={setSelectedMatchId}
                squads={squads}
                user={user}
                userPredictions={userPredictions}
                onSubmitPrediction={handlePrediction}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gfl-border/30 mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 text-center text-gray-600 text-xs">
          GFL 2026 - Gitrex Fantasy League | T20 World Cup Edition
        </div>
      </footer>
    </div>
  );
}
