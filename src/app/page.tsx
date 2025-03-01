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

const MOCK_MATCHES: Match[] = [
  {
    id: 'match1',
    team1: 'Pakistan',
    team2: 'New Zealand',
    team1Flag: '🇮🇳',
    team2Flag: '🇦🇺',
    dueDate: new Date('2025-02-19 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match1',
        matchId: 'match1',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match1',
        matchId: 'match1',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match1',
        matchId: 'match1',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match1',
        matchId: 'match1',
        type: 'totalScore',
        points: 5,
      }
    ]
  },
  {
    id: 'match2',
    team1: 'Bangladesh',
    team2: 'India',
    team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team2Flag: '🇿🇦',
    dueDate: new Date('2025-02-20 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match2',
        matchId: 'match2',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match2',
        matchId: 'match2',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match2',
        matchId: 'match2',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match2',
        matchId: 'match2',
        type: 'totalScore',
        points: 5,
      }
    ]
  },
  {
    id: 'match3',
    team1: 'Afghanistan',
    team2: 'South Africa',
    team1Flag: '🇵🇰',
    team2Flag: '🇳🇿',
    dueDate: new Date('2025-02-21 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match3',
        matchId: 'match3',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match3',
        matchId: 'match3',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match3',
        matchId: 'match3',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match3',
        matchId: 'match3',
        type: 'totalScore',
        points: 5,
      }
    ]
  },
  {
    id: 'match4',
    team1: 'England',
    team2: 'Australia',
    team1Flag: '🇧🇩',
    team2Flag: '🇱🇰',
    dueDate: new Date('2025-02-22 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match4',
        matchId: 'match4',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match4',
        matchId: 'match4',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match4',
        matchId: 'match4',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match4',
        matchId: 'match4',
        type: 'totalScore',
        points: 5,
      }
    ]
  }, 
  {
    id: 'match5',
    team1: 'Pakistan',
    team2: 'India',
    team1Flag: '🇵🇰',
    team2Flag: '🇧🇩',
    dueDate: new Date('2025-02-23 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match5',
        matchId: 'match5',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match5',
        matchId: 'match5',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match5',
        matchId: 'match5',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match5',
        matchId: 'match5',
        type: 'totalScore',
        points: 5,
     }
    ]
  },
  {
    id: 'match6',
    team1: 'New Zealand',
    team2: 'Bangladesh',
    team1Flag: '🇳🇿',
    team2Flag: '🇮🇳',
    dueDate: new Date('2025-02-24 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match6',
        matchId: 'match6',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match6',
        matchId: 'match6',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match6',
        matchId: 'match6',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match6',
        matchId: 'match6',
        type: 'totalScore',
        points: 5,
      },
    ],
  },
  {
    id: 'match7',
    team1: 'Australia',
    team2: 'South Africa',
    team1Flag: '🇦🇺',
    team2Flag: '🇿🇦',
    dueDate: new Date('2025-02-25 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match7',
        matchId: 'match7',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match7',
        matchId: 'match7',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match7',
        matchId: 'match7',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match7',
        matchId: 'match7',
        type: 'totalScore',
        points: 5,
        }
    ]
  },
  {
    id: 'match8',
    team1: 'England',
    team2: 'Afghanistan',
    team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team2Flag: '🇱🇰',
    dueDate: new Date('2025-02-26 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match8',
        matchId: 'match8',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match8',
        matchId: 'match8',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match8',
        matchId: 'match8',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match8',
        matchId: 'match8',
        type: 'totalScore',
        points: 5,
        }
    ]
  },
{
    id: 'match9',
    team1: 'Pakistan',
    team2: 'Bangladesh',
    team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team2Flag: '🇱🇰',
    dueDate: new Date('2025-02-27 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match9',
        matchId: 'match9',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match9',
        matchId: 'match9',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match9',
        matchId: 'match9',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match9',
        matchId: 'match9',
        type: 'totalScore',
        points: 5,
        }
    ]
  },
  {
    id: 'match10',
    team1: 'Afghanistan',
    team2: 'Australia',
    team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team2Flag: '🇱🇰',
    dueDate: new Date('2025-02-28 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match10',
        matchId: 'match10',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match10',
        matchId: 'match10',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match10',
        matchId: 'match10',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match10',
        matchId: 'match10',
        type: 'totalScore',
        points: 5,
        }
    ]
  },
 {
    id: 'match11',
    team1: 'England',
    team2: 'South Africa',
    team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team2Flag: '🇱🇰',
    dueDate: new Date('2025-03-01 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match11',
        matchId: 'match11',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match11',
        matchId: 'match11',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match11',
        matchId: 'match11',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match11',
        matchId: 'match11',
        type: 'totalScore',
        points: 5,
        }
    ]
  },
  {
    id: 'match12',
    team1: 'New Zealand',
    team2: 'India',
    team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team2Flag: '🇱🇰',
    dueDate: new Date('2025-03-02 13:29'),
    duration: MATCH_DURATIONS.ODI,
    format: 'ODI',
    questions: [
      {
        id: 'q1_match12',
        matchId: 'match12',
        type: 'winner',
        points: 1,
      },
      {
        id: 'q2_match12',
        matchId: 'match12',
        type: 'topScorer',
        points: 3,
      },
      {
        id: 'q3_match12',
        matchId: 'match12',
        type: 'topWicketTaker',
        points: 3,
      },
      {
        id: 'q4_match12',
        matchId: 'match12',
        type: 'totalScore',
        points: 5,
  }
    ]
  },
//   {
//     id: 'match13',
//     team1: 'India',
//     team2: 'South Africa',
//     team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
//     team2Flag: '🇱🇰',
//     dueDate: new Date('2025-03-04 13:29'),
//     duration: MATCH_DURATIONS.ODI,
//     format: 'ODI',
//     questions: [
//       {
//         id: 'q1_match12',
//         matchId: 'match12',
//         type: 'winner',
//         points: 1,
//       },
//       {
//         id: 'q2_match12',
//         matchId: 'match12',
//         type: 'topScorer',
//         points: 3,
//       },
//       {
//         id: 'q3_match12',
//         matchId: 'match12',
//         type: 'topWicketTaker',
//         points: 3,
//       },
//       {
//         id: 'q4_match12',
//         matchId: 'match12',
//         type: 'totalScore',
//         points: 5,
//   },
//     ]
//   },
//   {
//     id: 'match14',
//     team1: 'Australia',
//     team2: 'New Zealand',
//     team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
//     team2Flag: '🇱🇰',
//     dueDate: new Date('2025-03-05 13:29'),
//     duration: MATCH_DURATIONS.ODI,
//     format: 'ODI',
//     questions: [
//       {
//         id: 'q1_match12',
//         matchId: 'match12',
//         type: 'winner',
//         points: 1,
//       },
//       {
//         id: 'q2_match12',
//         matchId: 'match12',
//         type: 'topScorer',
//         points: 3,
//       },
//       {
//         id: 'q3_match12',
//         matchId: 'match12',
//         type: 'topWicketTaker',
//         points: 3,
//       },
//       {
//         id: 'q4_match12',
//         matchId: 'match12',
//         type: 'totalScore',
//         points: 5,
//   }
// ]
//   },
//   {
//     id: 'match15',
//     team1: 'India',
//     team2: 'Australia',
//     team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
//     team2Flag: '🇱🇰',
//     dueDate: new Date('2025-03-05 13:29'),
//     duration: MATCH_DURATIONS.ODI,
//     format: 'ODI',
//     questions: [
//       {
//         id: 'q1_match12',
//         matchId: 'match12',
//         type: 'winner',
//         points: 1,
//       },
//       {
//         id: 'q2_match12',
//         matchId: 'match12',
//         type: 'topScorer',
//         points: 3,
//       },
//       {
//         id: 'q3_match12',
//         matchId: 'match12',
//         type: 'topWicketTaker',
//         points: 3,
//       },
//       {
//         id: 'q4_match12',
//         matchId: 'match12',
//         type: 'totalScore',
//         points: 5,
//   }
// ]
//   },
];

// Mock squad data with organized player roles
const MOCK_SQUADS: { [key: string]: Squad } = {
  'India': {
    teamId: 'India',
    players: [
      // Batsmen
      { id: 'ind_bat_1', name: 'Rohit Sharma', role: 'batsman' },
      { id: 'ind_bat_2', name: 'Shubman Gill', role: 'batsman' },
      { id: 'ind_bat_3', name: 'Virat Kohli', role: 'batsman' },
      { id: 'ind_bat_4', name: 'Shreyas Iyer', role: 'batsman' },
      // Wicket Keepers
      { id: 'ind_wk_1', name: 'KL Rahul', role: 'wicketKeeper' },
      { id: 'ind_wk_2', name: 'Rishabh Pant', role: 'wicketKeeper' },
      // All Rounders
      { id: 'ind_ar_1', name: 'Hardik Pandya', role: 'allRounder' },
      { id: 'ind_ar_2', name: 'Axar Patel', role: 'allRounder' },
      { id: 'ind_ar_3', name: 'Washington Sundar', role: 'allRounder' },
      { id: 'ind_ar_4', name: 'Ravindra Jadeja', role: 'allRounder' },
      // Bowlers
      { id: 'ind_bowl_1', name: 'Mohammed Shami', role: 'bowler' },
      { id: 'ind_bowl_2', name: 'Arshdeep Singh', role: 'bowler' },
      { id: 'ind_bowl_3', name: 'Kuldeep Yadav', role: 'bowler' },
      { id: 'ind_bowl_4', name: 'Varun Chakaravarthy', role: 'bowler' },
      { id: 'ind_bowl_5', name: 'Harshit Rana', role: 'bowler' }
    ]
  },
  
  'Australia': {
    teamId: 'Australia',
    players: [
      // Batsmen
      { id: 'aus_bat_1', name: 'Steve Smith', role: 'batsman' },
      { id: 'aus_bat_2', name: 'Travis Head', role: 'batsman' },
      { id: 'aus_bat_3', name: 'Marnus Labuschagne', role: 'batsman' },
      { id: 'aus_bat_4', name: 'Matthew Short', role: 'batsman' },
      { id: 'aus_bat_5', name: 'Jake Fraser-McGurk', role: 'batsman' },
      // Wicket Keepers
      { id: 'aus_wk_1', name: 'Alex Carey', role: 'wicketKeeper' },
      { id: 'aus_wk_2', name: 'Josh Inglis', role: 'wicketKeeper' },
      // All Rounders
      { id: 'aus_ar_1', name: 'Glenn Maxwell', role: 'allRounder' },
      { id: 'aus_ar_2', name: 'Sean Abbott', role: 'allRounder' },
      { id: 'aus_ar_3', name: 'Aaron Hardie', role: 'allRounder' },
      // Bowlers
      { id: 'aus_bowl_1', name: 'Adam Zampa', role: 'bowler' },
      { id: 'aus_bowl_2', name: 'Tanveer Sangha', role: 'bowler' },
      { id: 'aus_bowl_3', name: 'Nathan Ellis', role: 'bowler' },
      { id: 'aus_bowl_4', name: 'Ben Dwarshuis', role: 'bowler' },
      { id: 'aus_bowl_5', name: 'Spencer Johnson', role: 'bowler' }
    ]
  },
  
    'Pakistan': {
    teamId: 'Pakistan',
    players: [
      // Batsmen
      { id: 'pak_bat_1', name: 'Babar Azam', role: 'batsman' },
      { id: 'pak_bat_2', name: 'Fakhar Zaman', role: 'batsman' },
      { id: 'pak_bat_3', name: 'Salman Ali Agha', role: 'batsman' },
      { id: 'pak_bat_4', name: 'Saud Shakeel', role: 'batsman' },
      { id: 'pak_bat_5', name: 'Tayyab Tahir', role: 'batsman' },
      // Wicket Keepers
      { id: 'pak_wk_1', name: 'Mohammad Rizwan', role: 'wicketKeeper' },
      { id: 'pak_wk_2', name: 'Usman Khan', role: 'wicketKeeper' },
      // All Rounders
      { id: 'pak_ar_1', name: 'Faheem Ashraf', role: 'allRounder' },
      { id: 'pak_ar_2', name: 'Khushdil Shah', role: 'allRounder' },
      { id: 'pak_ar_3', name: 'Kamran Ghulam', role: 'allRounder' },
      // Bowlers
      { id: 'pak_bowl_1', name: 'Shaheen Afridi', role: 'bowler' },
      { id: 'pak_bowl_2', name: 'Haris Rauf', role: 'bowler' },
      { id: 'pak_bowl_3', name: 'Naseem Shah', role: 'bowler' },
      { id: 'pak_bowl_4', name: 'Mohammad Hasnain', role: 'bowler' },
      { id: 'pak_bowl_5', name: 'Abrar Ahmed', role: 'bowler' }
    ]
  },
  'Afghanistan': {
    teamId: 'Afghanistan',
    players: [
      // Batsmen
      { id: 'afg_bat_1', name: 'Rahmat Shah', role: 'batsman' },
      { id: 'afg_bat_2', name: 'Ibrahim Zadran', role: 'batsman' },
      { id: 'afg_bat_3', name: 'Sediqullah Atal', role: 'batsman' },
      { id: 'afg_bat_4', name: 'Nangialai Kharoti', role: 'batsman' },
      { id: 'afg_bat_5', name: 'Hashmatullah Shahidi', role: 'batsman' },
      // Wicket Keepers
      { id: 'afg_wk_1', name: 'Rahmanullah Gurbaz', role: 'wicketKeeper' },
      { id: 'afg_wk_2', name: 'Ikram Alikhil', role: 'wicketKeeper' },
      // All Rounders
      { id: 'afg_ar_1', name: 'Mohammad Nabi', role: 'allRounder' },
      { id: 'afg_ar_2', name: 'Gulbadin Naib', role: 'allRounder' },
      { id: 'afg_ar_3', name: 'Azmatullah Omarzai', role: 'allRounder' },
      // Bowlers
      { id: 'afg_bowl_1', name: 'Rashid Khan', role: 'bowler' },
      { id: 'afg_bowl_2', name: 'Fazalhaq Farooqi', role: 'bowler' },
      { id: 'afg_bowl_3', name: 'Fareed Ahmad', role: 'bowler' },
      { id: 'afg_bowl_4', name: 'Noor Ahmad', role: 'bowler' },
      { id: 'afg_bowl_5', name: 'Naveed Zadran', role: 'bowler' }
    ]
  },
  'Bangladesh': {
    teamId: 'Bangladesh',
    players: [
      // Batsmen
      { id: 'ban_bat_1', name: 'Najmul Hossain Shanto', role: 'batsman' },
      { id: 'ban_bat_2', name: 'Tanzid Hasan', role: 'batsman' },
      { id: 'ban_bat_3', name: 'Towhid Hridoy', role: 'batsman' },
      { id: 'ban_bat_4', name: 'Soumya Sarkar', role: 'batsman' },
      // Wicket Keepers
      { id: 'ban_wk_1', name: 'Mushfiqur Rahim', role: 'wicketKeeper' },
      { id: 'ban_wk_2', name: 'Jaker Ali', role: 'wicketKeeper' },
      { id: 'ban_wk_3', name: 'Parvez Hossain Emon', role: 'wicketKeeper' },
      // All Rounders
      { id: 'ban_ar_1', name: 'Mahmudullah', role: 'allRounder' },
      { id: 'ban_ar_2', name: 'Mehidy Hasan Miraz', role: 'allRounder' },
      // Bowlers
      { id: 'ban_bowl_1', name: 'Taskin Ahmed', role: 'bowler' },
      { id: 'ban_bowl_2', name: 'Mustafizur Rahman', role: 'bowler' },
      { id: 'ban_bowl_3', name: 'Nasum Ahmed', role: 'bowler' },
      { id: 'ban_bowl_4', name: 'Nahid Rana', role: 'bowler' },
      { id: 'ban_bowl_5', name: 'Tanzim Hasan Sakib', role: 'bowler' }
    ]
  },
  'England': {
    teamId: 'England',
    players: [
      // Batsmen
      { id: 'eng_bat_1', name: 'Joe Root', role: 'batsman' },
      { id: 'eng_bat_2', name: 'Harry Brook', role: 'batsman' },
      { id: 'eng_bat_3', name: 'Ben Duckett', role: 'batsman' },
      { id: 'eng_bat_4', name: 'Liam Livingstone', role: 'batsman' },
      // Wicket Keepers
      { id: 'eng_wk_1', name: 'Jos Buttler', role: 'wicketKeeper' },
      { id: 'eng_wk_2', name: 'Phil Salt', role: 'wicketKeeper' },
      { id: 'eng_wk_3', name: 'Jamie Smith', role: 'wicketKeeper' },
      { id: 'eng_wk_43', name: 'Tom Banton', role: 'wicketKeeper' },
      // All Rounders
      { id: 'eng_ar_1', name: 'Brydon Carse', role: 'allRounder' },
      { id: 'eng_ar_2', name: 'Jamie Overton', role: 'allRounder' },
      // Bowlers
      { id: 'eng_bowl_1', name: 'Jofra Archer', role: 'bowler' },
      { id: 'eng_bowl_2', name: 'Mark Wood', role: 'bowler' },
      { id: 'eng_bowl_3', name: 'Adil Rashid', role: 'bowler' },
      { id: 'eng_bowl_4', name: 'Gus Atkinson', role: 'bowler' },
      { id: 'eng_bowl_5', name: 'Saqib Mahmood', role: 'bowler' }
    ]
  },
  'New Zealand': {
    teamId: 'New Zealand',
    players: [
      // Batsmen
      { id: 'nz_bat_1', name: 'Kane Williamson', role: 'batsman' },
      { id: 'nz_bat_2', name: 'Devon Conway', role: 'batsman' },
      { id: 'nz_bat_3', name: 'Will Young', role: 'batsman' },
      { id: 'nz_bat_4', name: 'Mark Chapman', role: 'batsman' },
      // Wicket Keepers
      { id: 'nz_wk_1', name: 'Tom Latham', role: 'wicketKeeper' },
      { id: 'nz_wk_2', name: 'Glenn Phillips', role: 'wicketKeeper' },
      // All Rounders
      { id: 'nz_ar_1', name: 'Mitchell Santner', role: 'allRounder' },
      { id: 'nz_ar_2', name: 'Michael Bracewell', role: 'allRounder' },
      { id: 'nz_ar_3', name: 'Daryl Mitchell', role: 'allRounder' },
      { id: 'nz_ar_4', name: 'Rachin Ravindra', role: 'bowler' },
      { id: 'nz_ar_5', name: 'Nathan Smith', role: 'bowler' },
      // Bowlers
      { id: 'nz_bowl_1', name: 'Lockie Ferguson', role: 'bowler' },
      { id: 'nz_bowl_2', name: 'Matt Henry', role: 'bowler' },
      { id: 'nz_bowl_3', name: 'Ben Sears', role: 'bowler' },
      { id: 'nz_bowl_4', name: 'William O\'Rourke', role: 'bowler' }
    ]
  },
  'South Africa': {
    teamId: 'South Africa',
    players: [
      // Batsmen
      { id: 'sa_bat_1', name: 'Temba Bavuma', role: 'batsman' },
      { id: 'sa_bat_2', name: 'Aiden Markram', role: 'batsman' },
      { id: 'sa_bat_3', name: 'David Miller', role: 'batsman' },
      { id: 'sa_bat_4', name: 'Rassie van der Dussen', role: 'batsman' },
      { id: 'sa_bat_5', name: 'Tristan Stubbs', role: 'batsman' },
      { id: 'sa_bat_6', name: 'Tony de Zorzi', role: 'batsman' },
      // Wicket Keepers
      { id: 'sa_wk_1', name: 'Heinrich Klaasen', role: 'wicketKeeper' },
      { id: 'sa_wk_2', name: 'Ryan Rickelton', role: 'wicketKeeper' },
      // All Rounders
      { id: 'sa_ar_1', name: 'Marco Jansen', role: 'allRounder' },
      { id: 'sa_ar_2', name: 'Wiaan Mulder', role: 'allRounder' },
      { id: 'sa_ar_3', name: 'Corbin Bosch', role: 'allRounder' },
      // Bowlers
      { id: 'sa_bowl_1', name: 'Kagiso Rabada', role: 'bowler' },
      { id: 'sa_bowl_2', name: 'Lungi Ngidi', role: 'bowler' },
      { id: 'sa_bowl_3', name: 'Keshav Maharaj', role: 'bowler' },
      { id: 'sa_bowl_4', name: 'Tabraiz Shamsi', role: 'bowler' },
    ]
  }
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
  ).slice(0, 3); // Only show next 3 matches

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Login to Gitrex Fantasy League</h2>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gitrex Fantasy League</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
    </div>
  );
}
