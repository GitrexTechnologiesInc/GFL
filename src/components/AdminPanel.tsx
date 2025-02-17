'use client';

import { useState, useEffect } from 'react';
import { Match, User, Squad } from '@/types';
import { saveMatchResult, getMatchResult } from '@/services/predictions';

interface AdminPanelProps {
  matches: Match[];
  users: User[];
  squads: { [key: string]: Squad };
  onUpdateResult: (matchId: string, result: any) => Promise<void>;
  user: User;
}

interface ResultState {
  winner: string;
  topScorer: string;
  topWicketTaker: string;
  firstInningsTeam: string;
  totalScore: string;
}

export default function AdminPanel({ matches, users, squads, onUpdateResult, user }: AdminPanelProps) {
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [result, setResult] = useState<ResultState>({
    winner: '',
    topScorer: '',
    topWicketTaker: '',
    firstInningsTeam: '',
    totalScore: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // Load existing result when match is selected
  useEffect(() => {
    const loadMatchResult = async () => {
      if (!selectedMatch) return;

      try {
        setLoading(true);
        const existingResult = await getMatchResult(selectedMatch.id);
        
        if (existingResult) {
          setResult({
            winner: existingResult.winner || '',
            topScorer: existingResult.topScorer || '',
            topWicketTaker: existingResult.topWicketTaker || '',
            firstInningsTeam: existingResult.firstInningsTeam || '',
            totalScore: existingResult.totalScore || ''
          });
        } else {
          setResult({
            winner: '',
            topScorer: '',
            topWicketTaker: '',
            firstInningsTeam: '',
            totalScore: ''
          });
        }
      } catch (err) {
        console.error('Error loading match result:', err);
        setError('Failed to load match result');
      } finally {
        setLoading(false);
      }
    };

    loadMatchResult();
  }, [selectedMatchId, selectedMatch]);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    setError(null);
  };

  const handleResultChange = (field: string, value: string) => {
    setResult(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScoreChange = (value: string) => {
    // Allow only numbers for admin's actual score input
    const numberPattern = /^\d*$/;
    if (!value || numberPattern.test(value)) {
      handleResultChange('totalScore', value);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMatch) {
      setError('Please select a match');
      return;
    }

    if (!result.firstInningsTeam) {
      setError('Please select which team batted first');
      return;
    }

    if (!result.totalScore) {
      setError('Please enter the first innings score');
      return;
    }

    // Validate score is a valid number
    const score = Number(result.totalScore);
    if (isNaN(score) || !Number.isInteger(score) || score < 0) {
      setError('Please enter a valid score (e.g., 235)');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await saveMatchResult(
        selectedMatch.id,
        {
          winner: result.winner,
          topScorer: result.topScorer,
          topWicketTaker: result.topWicketTaker,
          firstInningsTeam: result.firstInningsTeam,
          totalScore: result.totalScore
        },
        user.id
      );

      await onUpdateResult(selectedMatch.id, {
        winner: result.winner,
        topScorer: result.topScorer,
        topWicketTaker: result.topWicketTaker,
        firstInningsTeam: result.firstInningsTeam,
        totalScore: result.totalScore,
        status: 'completed'
      });

      // Show success message
      setError(null);
    } catch (err) {
      setError('Failed to update result. Please try again.');
      console.error('Update result error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Select Match</label>
        <select
          value={selectedMatchId}
          onChange={(e) => handleMatchSelect(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
        >
          <option value="">Select a match</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.team1} vs {match.team2} ({new Date(match.dueDate).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading match result...</div>
      ) : selectedMatch && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            {selectedMatch.team1} vs {selectedMatch.team2}
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Who will win? (1 pts)</h3>
              <div className="flex gap-2">
                {[selectedMatch.team1, selectedMatch.team2].map(team => (
                  <button
                    key={team}
                    onClick={() => handleResultChange('winner', team)}
                    className={`flex-1 px-4 py-2 rounded border ${
                      result.winner === team ? 'bg-blue-500 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Who will be the top scorer? (3 pts)</h3>
              <select
                value={result.topScorer}
                onChange={(e) => handleResultChange('topScorer', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select player</option>
                {Object.values(squads)
                  .filter(squad => [selectedMatch.team1, selectedMatch.team2].includes(squad.teamId))
                  .map(squad => squad.players)
                  .flat()
                  .map(player => (
                    <option key={player.id} value={player.name}>
                      {player.name} ({player.role})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <h3 className="font-medium mb-2">Who will take most wickets? (3 pts)</h3>
              <select
                value={result.topWicketTaker}
                onChange={(e) => handleResultChange('topWicketTaker', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select player</option>
                {Object.values(squads)
                  .filter(squad => [selectedMatch.team1, selectedMatch.team2].includes(squad.teamId))
                  .map(squad => squad.players)
                  .flat()
                  .map(player => (
                    <option key={player.id} value={player.name}>
                      {player.name} ({player.role})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <h3 className="font-medium mb-2">First Innings Score (1 pts)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Team that batted first</label>
                  <div className="flex gap-2 mb-4">
                    {[selectedMatch.team1, selectedMatch.team2].map(team => (
                      <button
                        key={team}
                        onClick={() => handleResultChange('firstInningsTeam', team)}
                        className={`flex-1 px-4 py-2 rounded border ${
                          result.firstInningsTeam === team ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        }`}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    First Innings Score for {result.firstInningsTeam || 'batting team'}
                  </label>
                  <input
                    type="text"
                    placeholder="235"
                    value={result.totalScore}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the actual score (e.g., 235)
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Result'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 