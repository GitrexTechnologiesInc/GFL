import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL!;

// Medal emojis for top 3
const MEDALS = ['🥇', '🥈', '🥉'];

// Question type labels and emojis
const QUESTION_LABELS: { [key: string]: { label: string; emoji: string } } = {
  '1': { label: 'Match Winner', emoji: '🏆' },
  '2': { label: 'Top Scorer', emoji: '🏏' },
  '3': { label: 'Top Wicket Taker', emoji: '🎯' },
  '4': { label: 'First Innings Score', emoji: '📊' },
};

// Points per question type
const QUESTION_POINTS: { [key: string]: number } = {
  '1': 1,
  '2': 3,
  '3': 3,
  '4': 5,
};

export async function GET(request: Request) {
  // Verify the cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all users (excluding admin) with current points
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, points, is_admin')
      .eq('is_admin', false)
      .order('points', { ascending: false });

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found' });
    }

    // 2. Get the latest snapshot to calculate daily changes
    const { data: snapshots, error: snapError } = await supabase
      .from('daily_point_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(users.length);

    // Get previous points and snapshot date
    const previousPoints: { [userId: string]: number } = {};
    let lastSnapshotDate: string | null = null;
    if (snapshots && !snapError && snapshots.length > 0) {
      lastSnapshotDate = snapshots[0]?.snapshot_date;
      if (lastSnapshotDate) {
        snapshots
          .filter(s => s.snapshot_date === lastSnapshotDate)
          .forEach(s => {
            previousPoints[s.user_id] = s.points;
          });
      }
    }

    // 3. Get recently evaluated correct predictions (since last snapshot)
    // These are predictions that earned points and were updated after the last snapshot
    const { data: recentPredictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .gt('points_earned', 0)
      .order('updated_at', { ascending: false });

    // Build a map of user_id -> array of correct predictions (only recent ones)
    const userCorrectPredictions: { [userId: string]: Array<{ questionType: string; answer: string; points: number }> } = {};

    if (recentPredictions && !predError) {
      for (const pred of recentPredictions) {
        const userId = pred.user_id;
        const prevPts = previousPoints[userId] ?? 0;
        const currentUser = users.find(u => u.id === userId);
        const pointsGained = (currentUser?.points ?? 0) - prevPts;

        // Only include predictions for users who actually gained points since last snapshot
        if (pointsGained <= 0) continue;

        // Check if this prediction was updated after the last snapshot
        if (lastSnapshotDate && new Date(pred.updated_at) <= new Date(lastSnapshotDate + 'T00:00:00Z')) {
          continue;
        }

        const questionType = pred.question_id.split('_')[0].replace('q', '');
        let displayAnswer = pred.answer;

        // For score predictions, format nicely (remove team prefix)
        if (questionType === '4' && pred.answer.includes('|')) {
          const [team, range] = pred.answer.split('|');
          displayAnswer = `${team} — ${range}`;
        }

        if (!userCorrectPredictions[userId]) {
          userCorrectPredictions[userId] = [];
        }

        userCorrectPredictions[userId].push({
          questionType,
          answer: displayAnswer,
          points: pred.points_earned,
        });
      }
    }

    // 4. Calculate point changes and build summary
    const playerSummaries = users.map((user, index) => {
      const prevPoints = previousPoints[user.id] ?? 0;
      const pointsGained = user.points - prevPoints;
      const rank = index + 1;
      const medal = rank <= 3 ? MEDALS[rank - 1] : `${rank}.`;

      return {
        id: user.id,
        username: user.username,
        points: user.points,
        pointsGained,
        rank,
        medal,
      };
    });

    // Check if any points changed today
    const hasChanges = playerSummaries.some(p => p.pointsGained !== 0);

    if (!hasChanges) {
      await saveSnapshot(users);
      return NextResponse.json({ message: 'No point changes today, skipping Slack post' });
    }

    // 5. Build the Slack message
    const today = new Date().toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Karachi',
    });

    // Header
    let message = `🏏 *GFL 2026 - Daily Update* 🏏\n📅 ${today}\n\n`;

    // Detailed breakdown per player
    const gainers = playerSummaries
      .filter(p => p.pointsGained > 0)
      .sort((a, b) => b.pointsGained - a.pointsGained);

    if (gainers.length > 0) {
      message += `🔥 *Today's Top Performers:*\n\n`;

      // Show detailed breakdown for top 3 gainers only
      gainers.slice(0, 3).forEach(p => {
        message += `*${p.username}* gained *+${p.pointsGained} pts* 🚀\n`;

        // Show which questions they got correct
        const correctPreds = userCorrectPredictions[p.id];
        if (correctPreds && correctPreds.length > 0) {
          correctPreds.forEach(pred => {
            const qInfo = QUESTION_LABELS[pred.questionType] || { label: 'Unknown', emoji: '❓' };
            message += `  ${qInfo.emoji} ${qInfo.label}: _${pred.answer}_ → *+${pred.points} pts* ✅\n`;
          });
        }

        message += '\n';
      });
    }

    // Leaderboard section
    message += `🏆 *Leaderboard:*\n`;
    message += '```\n';
    message += 'Rank  Player                 Pts\n';
    message += '────  ─────────────────────  ───\n';

    playerSummaries.forEach(p => {
      const rankStr = p.medal.padEnd(6);
      const nameStr = p.username.padEnd(23);
      const ptsStr = String(p.points);
      const change = p.pointsGained > 0 ? ` (+${p.pointsGained})` : '';
      message += `${rankStr}${nameStr}${ptsStr}${change}\n`;
    });

    message += '```\n';

    // Footer
    message += '\n_Play at gfl2k25.vercel.app_ ⚡';

    // 6. Post to Slack
    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      throw new Error(`Slack webhook failed: ${errorText}`);
    }

    // 7. Save today's snapshot for tomorrow's comparison
    await saveSnapshot(users);

    return NextResponse.json({
      success: true,
      message: 'Daily summary posted to Slack',
    });
  } catch (error) {
    console.error('Error in daily summary cron:', error);
    return NextResponse.json(
      { error: 'Failed to post daily summary', details: String(error) },
      { status: 500 }
    );
  }
}

async function saveSnapshot(users: { id: string; points: number }[]) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Upsert snapshots for all users
  const snapshots = users.map(user => ({
    user_id: user.id,
    points: user.points,
    snapshot_date: today,
  }));

  const { error } = await supabase
    .from('daily_point_snapshots')
    .upsert(snapshots, { onConflict: 'user_id,snapshot_date' });

  if (error) {
    console.error('Error saving snapshots:', error);
  }
}
