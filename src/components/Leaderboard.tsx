'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getUserRankings } from '@/services/users';

export default function Leaderboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading rankings...');
        
        const rankings = await getUserRankings();
        console.log('Rankings loaded:', rankings);
        
        // Filter out admin users and sort by points
        const filteredRankings = rankings
          .filter(user => !user.isAdmin)
          .sort((a, b) => (b.points || 0) - (a.points || 0));
        
        setUsers(filteredRankings);
      } catch (err) {
        console.error('Error loading rankings:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="trophy-badge trophy-gold">1</span>;
    if (index === 1) return <span className="trophy-badge trophy-silver">2</span>;
    if (index === 2) return <span className="trophy-badge trophy-bronze">3</span>;
    return <span className="text-gray-400 font-semibold text-sm w-7 text-center inline-block">{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-shimmer mb-4">Leaderboard</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gfl-gold border-t-transparent mb-3"></div>
          <p className="text-gray-400 text-sm">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-shimmer mb-4">Leaderboard</h2>
        <div className="text-red-400 text-center py-4 bg-red-900/20 rounded-lg border border-red-800/30">
          {error}
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-shimmer mb-4">Leaderboard</h2>
        <div className="text-gray-400 text-center py-4">No rankings available</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">🏆</span>
        <h2 className="text-xl font-bold text-shimmer">Leaderboard</h2>
      </div>
      <div className="space-y-2">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
              index === 0
                ? 'bg-gradient-to-r from-gfl-gold/20 to-transparent border border-gfl-gold/30 shadow-glow-gold'
                : index === 1
                ? 'bg-gray-500/10 border border-gray-600/20'
                : index === 2
                ? 'bg-amber-900/10 border border-amber-800/20'
                : 'bg-gfl-navy/40 border border-gfl-border/30 hover:border-gfl-border/60'
            }`}
          >
            <div className="flex items-center gap-3">
              {getRankBadge(index)}
              <span className={`font-medium ${index === 0 ? 'text-gfl-gold-light' : 'text-gray-200'}`}>
                {user.username}
              </span>
            </div>
            <span className={`font-bold text-sm ${
              index === 0 ? 'text-gfl-gold' : 'text-gray-300'
            }`}>
              {user.points || 0} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
