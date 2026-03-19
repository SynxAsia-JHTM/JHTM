export type MemberGender = 'Male' | 'Female' | 'Other';
export type MemberCategory = 'Youth' | 'Pastor' | 'Leader' | 'Member' | 'Guest';
export type MemberStatus = 'Active' | 'Pending' | 'Inactive';

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: MemberGender;
  category: MemberCategory;
  birthdate: string;
  ministry: string;
  status: MemberStatus;
};

const memberStorageKey = 'jhtm.members.v1';

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(memberStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Member[];
  } catch {
    return [];
  }
}
