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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
        <div className="text-center py-4">Loading rankings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
        <div className="text-red-500 text-center py-4">{error}</div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
        <div className="text-center py-4">No rankings available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2">RANK</th>
              <th className="pb-2">PLAYER</th>
              <th className="pb-2 text-right">POINTS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr 
                key={user.id}
                className={`border-b last:border-0 ${index === 0 ? 'bg-yellow-50' : ''}`}
              >
                <td className="py-3">{index + 1}</td>
                <td className="py-3">
                  {user.username} {index === 0 ? '👑' : ''}
                </td>
                <td className="py-3 text-right">{user.points || 0} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 