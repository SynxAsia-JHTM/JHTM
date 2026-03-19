import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

type MemberGender = 'Male' | 'Female' | 'Other';
type MemberCategory = 'Youth' | 'Pastor' | 'Leader' | 'Member' | 'Guest';
type MemberStatus = 'Active' | 'Pending' | 'Inactive';

type Member = {
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

const ministries = [
  'Worship',
  'Youth',
  'Media',
  'Children',
  'Ushering',
  'Hospitality',
  'Outreach',
] as const;

const defaultMembers: Member[] = [
  {
    id: 'm1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 010-1200',
    gender: 'Male',
    category: 'Member',
    birthdate: '1990-03-11',
    ministry: 'Worship',
    status: 'Active',
  },
  {
    id: 'm2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1 (555) 010-7741',
    gender: 'Female',
    category: 'Youth',
    birthdate: '2006-08-19',
    ministry: 'Youth',
    status: 'Pending',
  },
  {
    id: 'm3',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+1 (555) 010-3344',
    gender: 'Male',
    category: 'Leader',
    birthdate: '1985-11-02',
    ministry: 'Media',
    status: 'Active',
  },
  {
    id: 'm4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+1 (555) 010-9021',
    gender: 'Female',
    category: 'Member',
    birthdate: '1994-05-24',
    ministry: 'Children',
    status: 'Active',
  },
  {
    id: 'm5',
    name: 'David Johnson',
    email: 'david.johnson@example.com',
    phone: '+1 (555) 010-4811',
    gender: 'Male',
    category: 'Guest',
    birthdate: '1998-01-13',
    ministry: 'Ushering',
    status: 'Inactive',
  },
  {
    id: 'm6',
    name: 'Grace Thompson',
    email: 'grace.thompson@example.com',
    phone: '+1 (555) 010-6672',
    gender: 'Female',
    category: 'Pastor',
    birthdate: '1978-09-09',
    ministry: 'Hospitality',
    status: 'Active',
  },
];

type SortDirection = 'asc' | 'desc';
type SortKey = keyof Pick<
  Member,
  'name' | 'email' | 'phone' | 'gender' | 'category' | 'birthdate' | 'ministry' | 'status'
>;

const memberStorageKey = 'jhtm.members.v1';

function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(memberStorageKey);
    if (!raw) return defaultMembers;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultMembers;
    return parsed as Member[];
  } catch {
    return defaultMembers;
  }
}

function saveMembers(members: Member[]) {
  try {
    localStorage.setItem(memberStorageKey, JSON.stringify(members));
  } catch {
    return;
  }
}

function createMemberId() {
  const maybeCrypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  const filteredAndSorted = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? members.filter((m) => {
          const haystack = [
            m.name,
            m.email,
            m.phone,
            m.gender,
            m.category,
            m.birthdate,
            m.ministry,
            m.status,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        })
      : members;

    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (sortKey === 'birthdate') {
        const aTime = Date.parse(aValue);
        const bTime = Date.parse(bValue);
        return (aTime - bTime) * directionMultiplier;
      }

      return compareStrings(String(aValue), String(bValue)) * directionMultiplier;
    });

    return sorted;
  }, [members, query, sortDirection, sortKey]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const SortIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

  const persistMembers = (next: Member[]) => {
    setMembers(next);
    saveMembers(next);
  };

  const onMemberAdded = (member: Omit<Member, 'id'>) => {
    const next = [{ id: createMemberId(), ...member }, ...members];
    persistMembers(next);
  };

  const onMemberEdited = (id: string, updates: Omit<Member, 'id'>) => {
    const next = members.map((m) => (m.id === id ? { ...m, ...updates } : m));
    persistMembers(next);
  };

  const onMemberDeleted = (id: string) => {
    const next = members.filter((m) => m.id !== id);
    persistMembers(next);
  };

  const editingMember = useMemo(() => {
    if (!editMemberId) return null;
    return members.find((m) => m.id === editMemberId) ?? null;
  }, [editMemberId, members]);

  const deletingMember = useMemo(() => {
    if (!deleteMemberId) return null;
    return members.find((m) => m.id === deleteMemberId) ?? null;
  }, [deleteMemberId, members]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          <p className="mt-1 text-slate-500">View and manage member records</p>
        </div>
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
        >
          <Plus size={18} aria-hidden="true" />
          Add Member
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All Members</h2>
            <p className="mt-1 text-sm text-slate-500">Search and sort member records</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="search"
              placeholder="Search by name, email, phone, ministry..."
              aria-label="Search members"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <SortableTh label="Name" sortKey="name" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'name' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Email" sortKey="email" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'email' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Phone" sortKey="phone" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'phone' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Gender" sortKey="gender" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'gender' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Category" sortKey="category" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'category' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh
                  label="Birthdate"
                  sortKey="birthdate"
                  activeKey={sortKey}
                  onSort={onSort}
                >
                  {sortKey === 'birthdate' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Ministry" sortKey="ministry" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'ministry' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'status' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={9}>
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{m.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{m.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{m.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{m.gender}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{m.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{m.birthdate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{m.ministry}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          statusPill(m.status)
                        )}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditMemberId(m.id);
                            setIsEditOpen(true);
                          }}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
                          aria-label={`Edit ${m.name}`}
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteMemberId(m.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
                          aria-label={`Delete ${m.name}`}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMemberModal
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            window.setTimeout(() => addButtonRef.current?.focus(), 0);
          }
        }}
        ministries={ministries as unknown as string[]}
        onSave={(payload) => {
          onMemberAdded(payload);
          setIsAddOpen(false);
        }}
      />

      <EditMemberModal
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditMemberId(null);
          }
        }}
        member={editingMember}
        ministries={ministries as unknown as string[]}
        onSave={(updates) => {
          if (!editMemberId) return;
          onMemberEdited(editMemberId, updates);
          setIsEditOpen(false);
          setEditMemberId(null);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteMemberId)}
        onOpenChange={(open) => {
          if (!open) setDeleteMemberId(null);
        }}
        memberName={deletingMember?.name ?? 'this member'}
        onConfirm={() => {
          if (!deleteMemberId) return;
          onMemberDeleted(deleteMemberId);
          setDeleteMemberId(null);
        }}
      />
    </div>
  );
}

function statusPill(status: MemberStatus) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Pending') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-200 text-slate-700';
}

function SortableTh({
  label,
  sortKey,
  activeKey,
  onSort,
  children,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  onSort: (key: SortKey) => void;
  children?: React.ReactNode;
}) {
  const isActive = activeKey === sortKey;

  return (
    <th className="px-6 py-0 text-xs font-bold uppercase tracking-wider text-slate-500">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex h-11 w-full items-center justify-between gap-2 py-3 text-left transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2',
          isActive && 'text-slate-700'
        )}
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        <span className={cn('text-slate-400', isActive && 'text-slate-600')}>{children}</span>
      </button>
    </th>
  );
}

function InputField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function AddMemberModal({
  open,
  onOpenChange,
  onSave,
  ministries,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (member: Omit<Member, 'id'>) => void;
  ministries: string[];
}) {
  const nameRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<Omit<Member, 'id'>>({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    category: 'Member',
    birthdate: '',
    ministry: ministries[0] ?? 'Worship',
    status: 'Active',
  });

  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      gender: 'Male',
      category: 'Member',
      birthdate: '',
      ministry: ministries[0] ?? 'Worship',
      status: 'Active',
    });
  };

  const close = () => {
    onOpenChange(false);
    window.setTimeout(() => reset(), 0);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required.');
      nameRef.current?.focus();
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!form.phone.trim()) {
      setError('Phone is required.');
      return;
    }

    if (!form.birthdate.trim()) {
      setError('Birthdate is required.');
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(true);
      }}
      title="Add Member"
      description="Create a new member record."
      initialFocusRef={nameRef}
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Name" required>
            <input
              ref={nameRef}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="text"
              required
              autoComplete="name"
            />
          </InputField>
          <InputField label="Email" required>
            <input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="email"
              required
              autoComplete="email"
            />
          </InputField>

          <InputField label="Phone" required>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="tel"
              required
              autoComplete="tel"
            />
          </InputField>

          <InputField label="Gender" required>
            <select
              value={form.gender}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, gender: e.target.value as MemberGender }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </InputField>

          <InputField label="Category" required>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value as MemberCategory }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              <option value="Youth">Youth</option>
              <option value="Pastor">Pastor</option>
              <option value="Leader">Leader</option>
              <option value="Member">Member</option>
              <option value="Guest">Guest</option>
            </select>
          </InputField>

          <InputField label="Birthdate" required>
            <input
              value={form.birthdate}
              onChange={(e) => setForm((prev) => ({ ...prev, birthdate: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="date"
              required
              autoComplete="bday"
            />
          </InputField>

          <InputField label="Ministry" required>
            <select
              value={form.ministry}
              onChange={(e) => setForm((prev) => ({ ...prev, ministry: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              {ministries.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </InputField>

          <InputField label="Status" required>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value as MemberStatus }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </InputField>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditMemberModal({
  open,
  onOpenChange,
  onSave,
  ministries,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (member: Omit<Member, 'id'>) => void;
  ministries: string[];
  member: Member | null;
}) {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Member, 'id'>>({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    category: 'Member',
    birthdate: '',
    ministry: ministries[0] ?? 'Worship',
    status: 'Active',
  });

  useEffect(() => {
    if (!open) return;
    if (!member) return;
    setError(null);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      category: member.category,
      birthdate: member.birthdate,
      ministry: member.ministry,
      status: member.status,
    });
  }, [member, open]);

  const close = () => {
    setError(null);
    onOpenChange(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required.');
      nameRef.current?.focus();
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!form.phone.trim()) {
      setError('Phone is required.');
      return;
    }

    if (!form.birthdate.trim()) {
      setError('Birthdate is required.');
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(true);
      }}
      title="Edit Member"
      description="Update the member record."
      initialFocusRef={nameRef}
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Name" required>
            <input
              ref={nameRef}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="text"
              required
              autoComplete="name"
            />
          </InputField>
          <InputField label="Email" required>
            <input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="email"
              required
              autoComplete="email"
            />
          </InputField>

          <InputField label="Phone" required>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="tel"
              required
              autoComplete="tel"
            />
          </InputField>

          <InputField label="Gender" required>
            <select
              value={form.gender}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, gender: e.target.value as MemberGender }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </InputField>

          <InputField label="Category" required>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value as MemberCategory }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              <option value="Youth">Youth</option>
              <option value="Pastor">Pastor</option>
              <option value="Leader">Leader</option>
              <option value="Member">Member</option>
              <option value="Guest">Guest</option>
            </select>
          </InputField>

          <InputField label="Birthdate" required>
            <input
              value={form.birthdate}
              onChange={(e) => setForm((prev) => ({ ...prev, birthdate: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="date"
              required
              autoComplete="bday"
            />
          </InputField>

          <InputField label="Ministry" required>
            <select
              value={form.ministry}
              onChange={(e) => setForm((prev) => ({ ...prev, ministry: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              {ministries.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </InputField>

          <InputField label="Status" required>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value as MemberStatus }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </InputField>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  memberName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  memberName: string;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete member"
      description="This action cannot be undone."
      className="max-w-lg"
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-700">
          Are you sure you want to delete <span className="font-semibold">{memberName}</span>?
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
