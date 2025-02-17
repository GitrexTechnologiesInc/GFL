import { supabase } from '@/lib/supabase';
import { Prediction, Match } from '@/types';

export async function savePrediction(
  userId: string,
  matchId: string,
  questionId: string,
  answer: string,
  firstInningsTeam?: string
): Promise<Prediction> {
  // For q4, combine first innings team and score range
  const finalAnswer = questionId.startsWith('q4') 
    ? `${firstInningsTeam}|${answer}`
    : answer;

  const { data, error } = await supabase
    .from('predictions')
    .upsert({
      user_id: userId,
      match_id: matchId,
      question_id: questionId,
      answer: finalAnswer,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,match_id,question_id'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    matchId: data.match_id,
    questionId: data.question_id,
    answer: data.answer,
    isCorrect: data.is_correct,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  // Transform the data to match our Prediction type
  return data.map(pred => ({
    id: pred.id,
    userId: pred.user_id,
    matchId: pred.match_id,
    questionId: pred.question_id,
    answer: pred.answer,
    isCorrect: pred.is_correct,
    createdAt: new Date(pred.created_at),
    updatedAt: new Date(pred.updated_at)
  }));
}

export async function saveMatchResult(
  matchId: string,
  result: Match['result'],
  adminId: string
): Promise<void> {
  try {
    if (!result || !result.firstInningsTeam) {
      throw new Error('First innings team is required');
    }

    console.log('Saving match result:', { matchId, result });

    // Update match status to completed
    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'completed' })
      .eq('id', matchId);

    if (matchError) {
      throw new Error(`Failed to update match status: ${matchError.message}`);
    }

    // Save the match result
    const { error: resultError } = await supabase
      .from('match_results')
      .upsert({
        match_id: matchId,
        winner: result.winner,
        top_scorer: result.topScorer,
        top_wicket_taker: result.topWicketTaker,
        first_innings_team: result.firstInningsTeam,
        total_score: result.totalScore,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'match_id'
      });

    if (resultError) {
      throw new Error(`Failed to save match result: ${resultError.message}`);
    }

    // Get all predictions for this match
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId);

    if (predError) throw predError;

    console.log('Processing predictions:', predictions);

    // Process each prediction
    for (const prediction of predictions || []) {
      const questionType = prediction.question_id.split('_')[0].replace('q', '');
      let isCorrect = false;
      let points = 0;

      // Calculate points for all predictions
      switch (questionType) {
        case '1': // winner
          isCorrect = prediction.answer === result.winner;
          points = isCorrect ? 1 : 0;
          break;

        case '2': // topScorer
          isCorrect = prediction.answer === result.topScorer;
          points = isCorrect ? 3 : 0;
          break;

        case '3': // topWicketTaker
          isCorrect = prediction.answer === result.topWicketTaker;
          points = isCorrect ? 3 : 0;
          break;

        case '4': // totalScore
          if (prediction.answer && result.totalScore && result.firstInningsTeam) {
            // Split the answer into team and score range
            const [predictedTeam, scoreRange] = prediction.answer.split('|');
            
            // First check if the batting team prediction is correct
            if (predictedTeam === result.firstInningsTeam) {
              // Then check the score range
              const [predMin, predMax] = scoreRange.split('-').map(Number);
              const actualScore = Number(result.totalScore);
              isCorrect = !isNaN(actualScore) && actualScore >= predMin && actualScore <= predMax;
              points = isCorrect ? 1 : 0;
            } else {
              isCorrect = false;
              points = 0;
            }

            console.log('Total Score prediction check:', {
              predictedTeam,
              actualTeam: result.firstInningsTeam,
              scoreRange,
              actualScore: result.totalScore,
              isCorrect,
              points
            });
          }
          break;
      }

      console.log('Prediction evaluation:', {
        id: prediction.id,
        questionType,
        answer: prediction.answer,
        expected: result[questionType === '4' ? 'totalScore' : 
                       questionType === '2' ? 'topScorer' : 
                       questionType === '3' ? 'topWicketTaker' : 'winner'],
        isCorrect,
        points
      });

      // Update prediction with correctness and points
      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          is_correct: isCorrect,
          points_earned: points,
          updated_at: new Date().toISOString()
        })
        .eq('id', prediction.id);

      if (updateError) {
        console.error('Error updating prediction:', updateError);
        continue;
      }

      // Update user points if prediction is correct
      if (points > 0) {
        try {
          const { error: userError } = await supabase.rpc('increment_user_points', {
            user_id: prediction.user_id,
            points_to_add: points
          });

          if (userError) {
            console.error('Error updating user points:', {
              error: userError,
              userId: prediction.user_id,
              points
            });
          } else {
            console.log(`Successfully awarded ${points} points to user ${prediction.user_id}`);
          }
        } catch (error) {
          console.error('Error in increment_user_points:', error);
        }
      }
    }

    console.log('Successfully updated all predictions and points');

  } catch (error) {
    console.error('Error saving match result and updating points:', error);
    throw error;
  }
}

export async function getMatchResult(matchId: string): Promise<Match['result'] | null> {
  const { data, error } = await supabase
    .from('match_results')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw error;
  }

  return {
    winner: data.winner,
    topScorer: data.top_scorer,
    topWicketTaker: data.top_wicket_taker,
    firstInningsTeam: data.first_innings_team,
    totalScore: data.total_score
  };
} 