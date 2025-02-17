// src/auth.ts
export const users = [
  { id: 1, username: 'user1', password: 'pass1' },
  { id: 2, username: 'user2', password: 'pass2' },
  // Add more users
];

export function authenticate(username: string, password: string) {
  return users.find(user => user.username === username && user.password === password);
}