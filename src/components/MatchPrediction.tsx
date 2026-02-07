'use client';

import { useState, useEffect } from 'react';
import { Match, Question, Squad, User, Prediction } from '@/types';
import { savePrediction } from '@/services/predictions';

interface MatchPredictionProps {
  matches: Match[];
  selectedMatchId: string;
  onMatchSelect: (matchId: string) => void;
  squads: { [key: string]: Squad };
  user: User;
  userPredictions?: Prediction[];
  onSubmitPrediction: (predictions: Prediction[]) => void;
}

interface SavedPrediction {
  id: string;
  questionId: string;
  answer: string;
}

export default function MatchPrediction({ 
  matches,
  selectedMatchId,
  onMatchSelect,
  squads, 
  user, 
  userPredictions = [],
  onSubmitPrediction 
}: MatchPredictionProps) {
  const [predictions, setPredictions] = useState<{ [key: string]: string }>({});
  const [savedPredictions, setSavedPredictions] = useState<{ [key: string]: SavedPrediction }>({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstInningsTeam, setFirstInningsTeam] = useState<string>('');

  const selectedMatch = matches.find(m => m.id === selectedMatchId);
  const isPastMatch = selectedMatch ? new Date(selectedMatch.dueDate) < new Date() : false;

  // Load existing predictions when match selection or saved predictions change
  useEffect(() => {
    if (!selectedMatchId) return;
    
    // Filter predictions for current match and create a map
    const currentMatchPredictions = userPredictions
      .filter(p => p.matchId === selectedMatchId)
      .reduce((acc, pred) => ({
        ...acc,
        [pred.questionId]: pred.answer
      }), {});

    console.log('Loading predictions for match:', selectedMatchId, currentMatchPredictions);
    
    setPredictions(currentMatchPredictions);
    setSavedPredictions(
      userPredictions
        .filter(p => p.matchId === selectedMatchId)
        .reduce((acc, pred) => ({
          ...acc,
          [pred.questionId]: {
            id: pred.id,
            questionId: pred.questionId,
            answer: pred.answer
          }
        }), {})
    );
    setFirstInningsTeam('');
    setUnsavedChanges(false);
  }, [selectedMatchId, userPredictions]);

  const handlePredictionChange = (questionId: string, answer: string) => {
    setPredictions(prev => {
      const newPredictions = {
        ...prev,
        [questionId]: answer
      };

      // Check if any predictions have changed from their saved state
      const hasChanges = Object.entries(newPredictions).some(([qId, ans]) => {
        const savedPred = savedPredictions[qId];
        return !savedPred || savedPred.answer !== ans;
      });

      setUnsavedChanges(hasChanges);
      return newPredictions;
    });
    setError(null);
  };

  const handleScoreChange = (questionId: string, value: string) => {
    // Always update the state to allow typing
    handlePredictionChange(questionId, value);

    // Skip validation for incomplete input
    if (!value || value === '-' || !value.includes('-')) {
      return;
    }

    // Check format
    const scorePattern = /^\d+-\d+$/;
    if (!scorePattern.test(value)) {
      return;
    }

    const [minScore, maxScore] = value.split('-').map(Number);
    
    // Validation will be shown through error messages, but allow any input
    // This allows typing while still showing validation errors
  };

  const handleSavePredictions = async () => {
    if (!selectedMatch || !user || !unsavedChanges) return;

    // Validate score range predictions
    const scoreRangePredictions = Object.entries(predictions).filter(([qId]) => 
      selectedMatch.questions.find(q => q.id === qId)?.type === 'totalScore'
    );

    for (const [questionId, value] of scoreRangePredictions) {
      // Skip empty predictions
      if (!value) continue;

      // Validate format
      const scorePattern = /^\d+-\d+$/;
      if (!scorePattern.test(value)) {
        setError('Score range must be in format: XXX-XXX (e.g., 280-290)');
        return;
      }

      // Validate 10 runs difference
      const [minScore, maxScore] = value.split('-').map(Number);
      if (maxScore - minScore !== 10) {
        setError('Score range must be exactly 10 runs (e.g., 280-290)');
        return;
      }

      // Ensure min score is less than max score
      if (minScore >= maxScore) {
        setError('First number must be less than second number');
        return;
      }

      // Validate first innings team is selected
      if (!firstInningsTeam) {
        setError('Please select which team will bat first');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      // Save all predictions for the current match
      const savedPredictions = await Promise.all(
        Object.entries(predictions).map(async ([questionId, answer]) => {
          // Check if this is a total score prediction
          const isScorePrediction = selectedMatch.questions.find(
            q => q.id === questionId
          )?.type === 'totalScore';

          const saved = await savePrediction(
            user.id,
            selectedMatch.id,
            questionId,
            answer,
            isScorePrediction ? firstInningsTeam : undefined // Pass firstInningsTeam only for score predictions
          );
          return saved;
        })
      );

      // Update parent component's state with new predictions
      onSubmitPrediction(savedPredictions);

      // Update local state
      setSavedPredictions(
        savedPredictions.reduce((acc, pred) => ({
          ...acc,
          [pred.questionId]: {
            id: pred.id,
            questionId: pred.questionId,
            answer: pred.answer
          }
        }), {})
      );

      setUnsavedChanges(false);
    } catch (err) {
      setError('Failed to save predictions. Please try again.');
      console.error('Save predictions error:', err);
    } finally {
      setSaving(false);
    }
  };

  const canSubmitPrediction = (match: Match) => {
    return match.status === 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/40 text-emerald-400 border border-emerald-700/40">Upcoming</span>;
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-400 border border-amber-700/40 animate-pulse">In Progress</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-800/40 text-gray-400 border border-gray-700/40">Completed</span>;
    }
  };

  const renderQuestion = (question: Question) => {
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) return null;

    const prediction = predictions[question.id];
    const isCorrect = match.status === 'completed' && 
      match.result && 
      prediction === match.result[question.type as keyof typeof match.result];

    const disabled = !canSubmitPrediction(match) || saving;

    return (
      <div key={question.id} className="mb-5 p-4 rounded-xl bg-gfl-navy/50 border border-gfl-border/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-200">
            {getQuestionLabel(question.type)}
          </h3>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-gfl-gold/20 text-gfl-gold border border-gfl-gold/30">
            {question.points} pts
          </span>
        </div>
        
        {question.type === 'winner' ? (
          <div className="flex gap-3">
            {selectedMatch && [selectedMatch.team1, selectedMatch.team2].map(team => (
              <button
                key={team}
                onClick={() => handlePredictionChange(question.id, team)}
                disabled={disabled}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 border ${
                  prediction === team
                    ? 'bg-gfl-gold/20 text-gfl-gold border-gfl-gold shadow-glow-gold'
                    : 'bg-gfl-dark border-gfl-border text-gray-300 hover:border-gfl-gold/40 hover:text-gray-100'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {team}
              </button>
            ))}
          </div>
        ) : question.type === 'totalScore' ? (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Select batting first team:</p>
              <div className="flex gap-3">
                {selectedMatch && [selectedMatch.team1, selectedMatch.team2].map(team => (
                  <button
                    key={team}
                    onClick={() => setFirstInningsTeam(team)}
                    className={`flex-1 p-3 border rounded-xl font-medium transition-all duration-200 ${
                      firstInningsTeam === team 
                        ? 'bg-gfl-gold/20 text-gfl-gold border-gfl-gold shadow-glow-gold' 
                        : 'bg-gfl-dark border-gfl-border text-gray-300 hover:border-gfl-gold/40'
                    }`}
                    disabled={disabled}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <input
                type="text"
                value={prediction || ''}
                onChange={(e) => handlePredictionChange(question.id, e.target.value)}
                placeholder="e.g., 140-150"
                className="w-full p-3 border rounded-xl bg-gfl-dark border-gfl-border text-white placeholder-gray-500 focus:border-gfl-gold focus:ring-2 focus:ring-gfl-gold/30 transition-all"
                disabled={disabled || !firstInningsTeam}
              />
              <p className="text-xs text-gray-500 mt-2">
                Score range must be exactly 10 runs (e.g., 140-150)
              </p>
            </div>
          </div>
        ) : (
          <select
            value={prediction || ''}
            onChange={(e) => handlePredictionChange(question.id, e.target.value)}
            disabled={disabled}
            className={`w-full p-3 border rounded-xl bg-gfl-dark border-gfl-border text-gray-200 focus:border-gfl-gold transition-all ${
              match.status === 'completed'
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-900/20'
                  : prediction
                  ? 'border-red-500 bg-red-900/20'
                  : ''
                : ''
            }`}
          >
            <option value="">Select player</option>
            {Object.values(squads)
              .filter(squad => selectedMatch && [selectedMatch.team1, selectedMatch.team2].includes(squad.teamId))
              .map(squad => squad.players)
              .flat()
              .map(player => (
                <option key={player.id} value={player.name}>
                  {player.name} ({player.role})
                </option>
              ))}
          </select>
        )}

        {selectedMatch && selectedMatch.status === 'completed' && selectedMatch.result && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
            isCorrect
              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/40'
              : 'bg-red-900/30 text-red-400 border border-red-700/40'
          }`}>
            {isCorrect ? '✓' : '✗'} Correct answer: {selectedMatch.result[question.type as keyof typeof selectedMatch.result]}
          </div>
        )}

        {!canSubmitPrediction(match) && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
            Predictions are locked for this match
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <label className="block mb-2 text-sm font-semibold text-gray-300">Select Match</label>
        <select
          value={selectedMatchId}
          onChange={(e) => onMatchSelect(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gfl-dark border-gfl-border text-gray-200 focus:border-gfl-gold transition-all"
        >
          <option value="">Select a match</option>
          <optgroup label="🟢 Upcoming Matches">
            {matches
              .filter(m => m.status === 'upcoming')
              .slice(0, 6)
              .map((match) => (
                <option key={match.id} value={match.id}>
                  {match.team1} vs {match.team2} ({new Date(match.dueDate).toLocaleDateString()})
                </option>
              ))}
          </optgroup>
          <optgroup label="⏳ Past Matches">
            {matches
              .filter(m => m.status === 'completed')
              .map((match) => (
                <option key={match.id} value={match.id}>
                  {match.team1} vs {match.team2} ({new Date(match.dueDate).toLocaleDateString()})
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {selectedMatch && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedMatch.team1} <span className="text-gfl-gold">vs</span> {selectedMatch.team2}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(selectedMatch.dueDate).toLocaleString()}
              </p>
            </div>
            {getStatusBadge(selectedMatch.status)}
          </div>

          {selectedMatch.questions.map(question => renderQuestion(question))}

          {unsavedChanges && canSubmitPrediction(selectedMatch) && (
            <div className="mt-6">
              {error && (
                <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm px-4 py-3 rounded-lg mb-3">
                  {error}
                </div>
              )}
              <button
                onClick={handleSavePredictions}
                disabled={saving}
                className="w-full bg-gradient-gold text-gfl-navy font-bold py-3 px-4 rounded-xl hover:shadow-glow-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Saving...
                  </span>
                ) : Object.keys(savedPredictions).length > 0 ? 'Update Predictions' : 'Save Predictions'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getQuestionLabel(type: string): string {
  switch (type) {
    case 'winner': return 'Who will win?';
    case 'topScorer': return 'Who will be the top scorer?';
    case 'topWicketTaker': return 'Who will take most wickets?';
    case 'totalScore': return 'Predict total score (range) for the team batting first';
    default: return type;
  }
}
