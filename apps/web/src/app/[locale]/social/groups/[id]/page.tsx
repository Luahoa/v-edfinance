import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Users, Trophy, Zap, Calendar } from 'lucide-react';
import { BuddyAvatar } from '@/components/atoms/BuddyAvatar';
import type { BuddyGroup, BuddyMember, BuddyChallenge } from '@/types';

async function getGroupDetails(id: string): Promise<BuddyGroup | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/social/groups/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('Fetch group details error:', err);
    return null;
  }
}

export default async function GroupDetailsPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const { id, locale } = await params;
  const ts = await getTranslations('Social');
  const group = await getGroupDetails(id);

  if (!group) return <div className="p-10 text-center">{ts('error')}</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="mx-auto max-w-4xl">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border dark:border-zinc-800 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                {ts(`types.${group.type}`)}
              </span>
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <p className="text-zinc-500 mt-2">{group.description}</p>
            </div>
            
            <div className="flex gap-4">
               <div className="text-center bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl min-w-[100px]">
                 <p className="text-xs text-zinc-500 uppercase font-bold">{ts('streak')}</p>
                 <p className="text-2xl font-bold flex items-center justify-center gap-1 text-orange-500">
                   <Zap size={20} fill="currentColor" /> {group.streak}
                 </p>
               </div>
               <div className="text-center bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl min-w-[100px]">
                 <p className="text-xs text-zinc-500 uppercase font-bold">{ts('points')}</p>
                 <p className="text-2xl font-bold text-blue-600">{group.totalPoints}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border dark:border-zinc-800">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" /> {ts('challenges')}
              </h2>
              {group.challenges?.length > 0 ? (
                group.challenges.map((c: BuddyChallenge) => (
                  <div key={c.id} className="border dark:border-zinc-800 rounded-xl p-4 mb-4">
                    <h3 className="font-bold">{c.title[locale] || c.title.en}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                      <span className="flex items-center gap-1"><Zap size={14} /> {c.target} pts</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(c.expiresAt).toLocaleDateString(locale)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm text-center py-4">{ts('emptyFeed')}</p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border dark:border-zinc-800">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="text-blue-500" /> {ts('members')} ({(group.members || []).length})
                </h2>
                <div className="space-y-4">
                {(group.members || []).map((m: BuddyMember) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <BuddyAvatar displayName={m.user.metadata?.displayName || m.user.email} />
                    <div>
                      <p className="text-sm font-bold">{m.user.metadata?.displayName || m.user.email.split('@')[0]}</p>
                      <p className="text-xs text-zinc-500">{m.user.points} pts • {m.user.streaks?.currentStreak || 0} day streak</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
