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

  // Load existing predictions when match or userPredictions changes
  useEffect(() => {
    if (!selectedMatch) return;
    
    // Filter predictions for current match and create a map
    const currentMatchPredictions = userPredictions
      .filter(p => p.matchId === selectedMatch.id)
      .reduce((acc, pred) => ({
        ...acc,
        [pred.questionId]: pred.answer
      }), {});

    console.log('Loading predictions for match:', selectedMatch.id, currentMatchPredictions);
    
    setPredictions(currentMatchPredictions);
    setSavedPredictions(
      userPredictions
        .filter(p => p.matchId === selectedMatch.id)
        .reduce((acc, pred) => ({
          ...acc,
          [pred.questionId]: {
            id: pred.id,
            questionId: pred.questionId,
            answer: pred.answer
          }
        }), {})
    );
    setUnsavedChanges(false);
  }, [selectedMatch, userPredictions]);

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

  const renderQuestion = (question: Question) => {
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) return null;

    const prediction = predictions[question.id];
    const isCorrect = match.status === 'completed' && 
      match.result && 
      prediction === match.result[question.type as keyof typeof match.result];

    const disabled = !canSubmitPrediction(match) || saving;

    const answerClass = match.status === 'completed'
      ? isCorrect
        ? 'bg-green-100 border-green-500'
        : 'bg-red-100 border-red-500'
      : 'bg-white';

    return (
      <div key={question.id} className="mb-4">
        <h3 className="font-medium mb-2">
          {getQuestionLabel(question.type)} ({question.points} pts)
        </h3>
        
        {question.type === 'winner' ? (
          <div className="flex gap-2">
            {[selectedMatch.team1, selectedMatch.team2].map(team => (
              <button
                key={team}
                onClick={() => handlePredictionChange(question.id, team)}
                disabled={disabled}
                className={`flex-1 px-4 py-2 rounded border ${
                  prediction === team ? 'bg-blue-500 text-white' : 'bg-gray-100'
                } ${!canSubmitPrediction(match) ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {team}
              </button>
            ))}
          </div>
        ) : question.type === 'totalScore' ? (
          <div>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Which team will bat first?</h3>
              <div className="flex gap-2 mb-4">
                {[selectedMatch.team1, selectedMatch.team2].map(team => (
                  <button
                    key={team}
                    onClick={() => setFirstInningsTeam(team)}
                    className={`flex-1 p-2 border rounded ${
                      firstInningsTeam === team 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100'
                    }`}
                    disabled={disabled}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Predict first innings score range (1 pt)</h3>
              <input
                type="text"
                value={prediction || ''}
                onChange={(e) => handlePredictionChange(question.id, e.target.value)}
                placeholder="e.g., 280-290"
                className="w-full p-2 border rounded"
                disabled={disabled || !firstInningsTeam}
              />
              <p className="text-sm text-gray-500 mt-1">
                Score range must be exactly 10 runs (e.g., 280-290)
              </p>
            </div>
          </div>
        ) : (
          <select
            value={prediction || ''}
            onChange={(e) => handlePredictionChange(question.id, e.target.value)}
            disabled={disabled}
            className={`w-full p-2 border rounded ${answerClass}`}
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
        )}

        {selectedMatch && selectedMatch.status === 'completed' && selectedMatch.result && (
          <div className="mt-2 text-sm">
            Correct answer: {selectedMatch.result[question.type as keyof typeof selectedMatch.result]}
          </div>
        )}

        {!canSubmitPrediction(match) && (
          <p className="text-sm text-red-500 mt-1">
            Predictions are closed for this match
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <label className="block mb-2 font-medium">Select Match</label>
        <select
          value={selectedMatchId}
          onChange={(e) => onMatchSelect(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a match</option>
          <optgroup label="Upcoming Matches">
            {matches
              .filter(m => m.status === 'upcoming')
              .slice(0, 3)
              .map((match) => (
                <option key={match.id} value={match.id}>
                  {match.team1} vs {match.team2} ({new Date(match.dueDate).toLocaleDateString()})
                </option>
              ))}
          </optgroup>
          <optgroup label="Past Matches">
            {matches
              .filter(m => m.status === 'completed')
              .map((match) => (
                <option key={match.id} value={match.id}>
                  {match.team1} vs {match.team2} ({new Date(match.dueDate).toLocaleDateString()}) (Past)
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {selectedMatch && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {selectedMatch.team1} vs {selectedMatch.team2}
              <span className="ml-2 text-gray-500">
                ({selectedMatch.status === 'upcoming' ? 'Upcoming' : 
                  selectedMatch.status === 'in_progress' ? 'In Progress' : 
                  'Past'})
              </span>
            </h2>
            <div className="text-sm text-gray-500">
              {new Date(selectedMatch.dueDate).toLocaleString()}
            </div>
          </div>

          {selectedMatch.questions.map(question => renderQuestion(question))}

          {unsavedChanges && canSubmitPrediction(selectedMatch) && (
            <div className="mt-6">
              {error && (
                <div className="text-red-500 mb-2">
                  {error}
                </div>
              )}
              <button
                onClick={handleSavePredictions}
                disabled={saving}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : Object.keys(savedPredictions).length > 0 ? 'Update Predictions' : 'Save Predictions'}
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
    case 'totalScore': return 'Predict total score (range)';
    default: return type;
  }
} 