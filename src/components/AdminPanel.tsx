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
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-2xl font-bold text-shimmer">Admin Panel</h1>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-semibold text-gray-300">Select Match</label>
        <select
          value={selectedMatchId}
          onChange={(e) => handleMatchSelect(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gfl-dark border-gfl-border text-gray-200 focus:border-gfl-gold transition-all"
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
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gfl-gold border-t-transparent mb-3"></div>
          <p className="text-gray-400 text-sm">Loading match result...</p>
        </div>
      ) : selectedMatch && (
        <div>
          <h2 className="text-xl font-bold text-white mb-5">
            {selectedMatch.team1} <span className="text-gfl-gold">vs</span> {selectedMatch.team2}
          </h2>

          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-gfl-navy/50 border border-gfl-border/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-200">Who will win?</h3>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gfl-gold/20 text-gfl-gold border border-gfl-gold/30">1 pts</span>
              </div>
              <div className="flex gap-3">
                {[selectedMatch.team1, selectedMatch.team2].map(team => (
                  <button
                    key={team}
                    onClick={() => handleResultChange('winner', team)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 border ${
                      result.winner === team
                        ? 'bg-gfl-gold/20 text-gfl-gold border-gfl-gold shadow-glow-gold'
                        : 'bg-gfl-dark border-gfl-border text-gray-300 hover:border-gfl-gold/40'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gfl-navy/50 border border-gfl-border/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-200">Who will be the top scorer?</h3>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gfl-gold/20 text-gfl-gold border border-gfl-gold/30">3 pts</span>
              </div>
              <select
                value={result.topScorer}
                onChange={(e) => handleResultChange('topScorer', e.target.value)}
                className="w-full p-3 border rounded-xl bg-gfl-dark border-gfl-border text-gray-200 focus:border-gfl-gold transition-all"
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

            <div className="p-4 rounded-xl bg-gfl-navy/50 border border-gfl-border/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-200">Who will take most wickets?</h3>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gfl-gold/20 text-gfl-gold border border-gfl-gold/30">3 pts</span>
              </div>
              <select
                value={result.topWicketTaker}
                onChange={(e) => handleResultChange('topWicketTaker', e.target.value)}
                className="w-full p-3 border rounded-xl bg-gfl-dark border-gfl-border text-gray-200 focus:border-gfl-gold transition-all"
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

            <div className="p-4 rounded-xl bg-gfl-navy/50 border border-gfl-border/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-200">First Innings Score</h3>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gfl-gold/20 text-gfl-gold border border-gfl-gold/30">1 pts</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Team that batted first:</p>
                  <div className="flex gap-3">
                    {[selectedMatch.team1, selectedMatch.team2].map(team => (
                      <button
                        key={team}
                        onClick={() => handleResultChange('firstInningsTeam', team)}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 border ${
                          result.firstInningsTeam === team
                            ? 'bg-gfl-gold/20 text-gfl-gold border-gfl-gold shadow-glow-gold'
                            : 'bg-gfl-dark border-gfl-border text-gray-300 hover:border-gfl-gold/40'
                        }`}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    First Innings Score for {result.firstInningsTeam || 'batting team'}
                  </p>
                  <input
                    type="text"
                    placeholder="235"
                    value={result.totalScore}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-gfl-dark border-gfl-border text-white placeholder-gray-500 focus:border-gfl-gold focus:ring-2 focus:ring-gfl-gold/30 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the actual score (e.g., 235)
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-gradient-gold text-gfl-navy font-bold py-3 px-4 rounded-xl hover:shadow-glow-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Updating...
                </span>
              ) : 'Update Result'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
