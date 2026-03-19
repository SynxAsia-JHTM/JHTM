import { loadMembers } from '@/lib/memberData';

type StoredUser = { email?: string };

export function getCurrentMemberId(): string {
  if (typeof window === 'undefined') return 'member';
  try {
    const raw = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    if (!raw) return 'member';
    const parsed = JSON.parse(raw) as StoredUser;
    const email = parsed.email?.trim();
    if (!email) return 'member';

    const members = loadMembers();
    const match = members.find((m) => m.email?.trim().toLowerCase() === email.toLowerCase());
    return match?.id ?? email;
  } catch {
    return 'member';
  }
}
