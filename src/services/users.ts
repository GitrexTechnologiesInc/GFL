import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export async function signInUser(email: string, password: string): Promise<User> {
  try {
    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth error:', error);
      throw error;
    }

    console.log('Auth successful:', data);

    // Get the user profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
    }

    console.log('Profile fetched:', profile);

    return {
      id: profile.id,
      username: profile.username,
      isAdmin: profile.is_admin,
      points: profile.points
    };
  } catch (error) {
    console.error('SignIn error:', error);
    throw error;
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    return null;
  }
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    isAdmin: profile.is_admin,
    points: profile.points
  };
}

export async function getUserRankings(): Promise<User[]> {
  try {
    console.log('Fetching user rankings...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      console.error('Error fetching rankings:', error);
      throw error;
    }

    if (!data) {
      console.log('No users found');
      return [];
    }

    console.log('Fetched rankings:', data);

    return data.map(user => ({
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin,
      points: user.points || 0,
      password: '' // Add this to satisfy the User type
    }));
  } catch (error) {
    console.error('Error in getUserRankings:', error);
    throw error;
  }
} 