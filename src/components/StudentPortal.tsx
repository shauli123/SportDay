import { useState, useEffect } from 'react'
import { supabase, type Team, type LeaderboardRow } from '../lib/supabase'
import { TrendingUp, History, Calendar, Search, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentPortal() {
    const [teams, setTeams] = useState<Team[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(localStorage.getItem('myTeamId'))
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
    const [myHistory, setMyHistory] = useState<any[]>([])

    useEffect(() => {
        fetchBaseData()
        // Subscribe to changes
        const teamsChannel = supabase.channel('public:teams')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
                fetchLeaderboard()
            })
            .subscribe()

        return () => { supabase.removeChannel(teamsChannel) }
    }, [])

    useEffect(() => {
        if (selectedTeamId) {
            localStorage.setItem('myTeamId', selectedTeamId)
            fetchTeamHistory(selectedTeamId)
        }
    }, [selectedTeamId])

    async function fetchBaseData() {
        const { data } = await supabase.from('teams').select('*').order('name')
        if (data) setTeams(data)
        await fetchLeaderboard()
    }

    async function fetchLeaderboard() {
        const { data } = await supabase.rpc('get_leaderboard')
        if (data) setLeaderboard(data)
    }

    async function fetchTeamHistory(teamId: string) {
        const { data } = await supabase
            .from('results')
            .select('*, stations(name, icon)')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false })
        if (data) setMyHistory(data)
    }

    const myTeam = teams.find(t => t.id === selectedTeamId)
    const myRankInfo = leaderboard.find(l => l.id === selectedTeamId)

    return (
        <div className="p-4 sm:p-8 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
            <header className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-glow">דאשבורד אישי</h1>
                <p className="text-white/60">עקוב אחר ההתקדמות שלך ושל הצוות שלך</p>
            </header>

            {/* Team Selection or Welcome */}
            <section className="glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl -ml-16 -mb-16 rounded-full"></div>

                {!selectedTeamId ? (
                    <div className="space-y-4 relative z-10">
                        <h3 className="font-bold flex items-center space-x-2 space-x-reverse">
                            <Search className="text-cyan-400" size={18} />
                            <span>בחר את הכיתה שלך:</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {teams.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTeamId(t.id)}
                                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-right font-medium"
                                >
                                    {t.name} ({t.grade})
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">הצוות שלי</div>
                            <h2 className="text-4xl font-black">{myTeam?.name}</h2>
                            <button
                                onClick={() => setSelectedTeamId(null)}
                                className="text-xs text-white/30 hover:text-white/60 mt-2 underline"
                            >
                                החלף כיתה
                            </button>
                        </div>
                        <div className="flex items-baseline space-x-2 space-x-reverse">
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                                {myTeam?.total_points || 0}
                            </span>
                            <span className="text-sm font-bold text-white/40">נק'</span>
                        </div>
                    </div>
                )}
            </section>

            {selectedTeamId && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 flex flex-col items-center justify-center space-y-2">
                        <TrendingUp size={24} className="text-purple-400" />
                        <div className="text-2xl font-black">#{myRankInfo?.rank || '-'}</div>
                        <div className="text-xs text-white/40 font-bold">דירוג נוכחי</div>
                    </div>
                    <div className="glass-card p-4 flex flex-col items-center justify-center space-y-2">
                        <Zap size={24} className="text-yellow-400" />
                        <div className="text-2xl font-black">{myHistory.length}</div>
                        <div className="text-xs text-white/40 font-bold">משחקים שבוצעו</div>
                    </div>
                </div>
            )}

            {/* History */}
            {selectedTeamId && (
                <section className="space-y-4">
                    <h3 className="font-bold flex items-center space-x-2 space-x-reverse">
                        <History size={20} className="text-purple-400" />
                        <span>היסטוריית משחקים</span>
                    </h3>
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {myHistory.map((h, i) => (
                                <motion.div
                                    key={h.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <span className="text-2xl">{h.stations?.icon}</span>
                                        <div>
                                            <div className="font-bold">{h.stations?.name}</div>
                                            <div className="text-xs text-white/40">{new Date(h.created_at).toLocaleTimeString('he-IL')}</div>
                                        </div>
                                    </div>
                                    <div className={`font-black ${h.is_winner ? 'text-green-400' : 'text-white/40'}`}>
                                        {h.is_winner ? '+' : ''}{h.points_earned}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {myHistory.length === 0 && (
                            <div className="text-center py-12 text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                                טרם נרשמו תוצאות לכיתה זו
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Live Schedule Placeholder */}
            <section className="glass-card p-6 border-cyan-500/20 bg-cyan-500/5">
                <h3 className="font-bold flex items-center space-x-2 space-x-reverse mb-4">
                    <Calendar size={18} className="text-cyan-400" />
                    <span>המשחקים הבאים</span>
                </h3>
                <p className="text-sm text-cyan-200/60 leading-relaxed">
                    לוח הצוותים מתעדכן בזמן אמת. הקפד להגיע לתחנה המיועדת 5 דקות לפני תחילת המשחק.
                </p>
            </section>
        </div>
    )
}
