import { useState, useEffect } from 'react'
import { supabase, type LeaderboardRow, type Result } from '../lib/supabase'
import { Trophy, Activity, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TVDashboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
    const [latestResults, setLatestResults] = useState<Result[]>([])
    const [currentSchedule, setCurrentSchedule] = useState<any[]>([])
    const [nextRoundSchedule, setNextRoundSchedule] = useState<any[]>([])

    useEffect(() => {
        fetchData()

        const channel = supabase.channel('tv_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => {
                fetchData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
                fetchLeaderboard()
            })
            .subscribe()

        // Refresh schedule alignment every minute
        const timer = setInterval(() => fetchSchedule(), 60000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(timer)
        }
    }, [])

    async function fetchData() {
        await Promise.all([fetchLeaderboard(), fetchLatestResults(), fetchSchedule()])
    }

    async function fetchLeaderboard() {
        const { data } = await supabase.rpc('get_leaderboard')
        if (data) setLeaderboard(data)
    }

    async function fetchLatestResults() {
        const { data } = await supabase
            .from('results')
            .select('*, teams(name), stations(name)')
            .order('created_at', { ascending: false })
            .limit(6)
        if (data) setLatestResults(data as any)
    }

    async function fetchSchedule() {
        const now = new Date()

        // Fetch ALL schedule entries for current and next rounds
        const { data } = await supabase
            .from('schedule')
            .select('*, teams:team_id(name), opponents:opponent_id(name), stations(name, icon)')
            .order('start_time', { ascending: true })

        if (data) {
            const current = data.filter(s => {
                const start = new Date(s.start_time)
                const diff = (now.getTime() - start.getTime()) / (1000 * 60)
                return diff >= 0 && diff < 20
            })

            const next = data.filter(s => {
                const start = new Date(s.start_time)
                const diff = (start.getTime() - now.getTime()) / (1000 * 60)
                return diff >= 0 && diff < 30 // Preview matches starting in next 30 mins
            }).slice(0, 6)

            setCurrentSchedule(current)
            setNextRoundSchedule(next)
        }
    }

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="grid grid-cols-12 flex-1 p-6 gap-6">

                {/* Left Column: Leaderboard & Current Matches */}
                <section className="col-span-8 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-4xl font-black text-glow flex items-center space-x-4 space-x-reverse">
                            <Trophy className="text-yellow-400" size={40} />
                            <span>טבלת מובילים בזמן אמת</span>
                        </h2>
                        <div className="flex items-center space-x-2 space-x-reverse text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20">
                            <Activity size={18} className="animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>

                    <div className="flex-1 glass-card overflow-hidden flex flex-col">
                        <div className="grid grid-cols-12 p-6 border-b border-white/10 text-xs font-black uppercase tracking-widest text-white/40">
                            <div className="col-span-1">דירוג</div>
                            <div className="col-span-6 text-right">כיתה</div>
                            <div className="col-span-2 text-center">מגמה</div>
                            <div className="col-span-3 text-left">ניקוד מצטבר</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <AnimatePresence mode="popLayout">
                                {leaderboard.map((row, idx) => (
                                    <motion.div
                                        key={row.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className={`grid grid-cols-12 p-5 rounded-2xl items-center transition-all ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' :
                                            idx === 1 ? 'bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20' :
                                                idx === 2 ? 'bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/20' :
                                                    'bg-white/5 border border-white/5'
                                            }`}
                                    >
                                        <div className="col-span-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl ${idx < 3 ? 'text-white' : 'text-white/40'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="col-span-6 text-right">
                                            <div className="text-2xl font-black">{row.name}</div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <div className="text-sm font-bold px-3 py-1 rounded-full bg-white/5 inline-block text-white/60">
                                                כיתה {row.grade}
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-left">
                                            <div className="text-3xl font-black tabular-nums">{row.total_points}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Current Round Matches */}
                    <div className="h-48 glass-card p-6 border-cyan-500/20 flex flex-col">
                        <h3 className="text-sm font-bold mb-4 text-cyan-400 uppercase tracking-widest flex items-center space-x-2 space-x-reverse">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                            <span>משחקים שמתקיימים כעת</span>
                        </h3>
                        <div className="flex-1 grid grid-cols-3 gap-4">
                            {currentSchedule.map((s) => (
                                <div key={s.id} className="p-3 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex flex-col justify-center">
                                    <div className="text-xs font-bold text-white/40 mb-1">{s.stations?.name}</div>
                                    <div className="font-black text-lg truncate">
                                        {s.teams?.name} <span className="text-cyan-500 mx-1">VS</span> {s.opponents?.name || '---'}
                                    </div>
                                </div>
                            ))}
                            {currentSchedule.length === 0 && (
                                <div className="col-span-3 flex items-center justify-center text-white/20 italic">
                                    אין משחקים פעילים כרגע
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Right Column: Ticker & Status */}
                <section className="col-span-4 flex flex-col gap-6">
                    {/* Recent Ticker with Next Preview */}
                    <div className="glass-card flex-1 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <h3 className="text-xl font-bold">עדכונים אחרונים</h3>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                            <AnimatePresence>
                                {latestResults.map((r: Result) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="p-4 rounded-xl bg-white/5 border-l-4 border-cyan-500 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold">{r.teams?.name}</div>
                                            <div className="text-xs text-white/50">תחנה: {r.stations?.name}</div>
                                        </div>
                                        <div className={`text-xl font-black ${r.is_winner ? 'text-green-400' : 'text-cyan-400'}`}>
                                            +{r.points_earned}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Next Round Preview */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">בקרוב...</h4>
                            <div className="space-y-2">
                                {nextRoundSchedule.map((s) => (
                                    <div key={s.id} className="text-sm flex justify-between items-center bg-white/5 rounded-lg p-2">
                                        <span className="text-white/60">{s.stations?.name}</span>
                                        <span className="font-bold">{s.teams?.name} vs {s.opponents?.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="glass-card p-6 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-white/20">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                <QrCode size={100} className="text-black" />
                            </div>
                            <div>
                                <h4 className="font-black text-xl">הדף האישי שלך</h4>
                                <p className="text-sm text-white/60">סרוק לראות ניקוד ולו"ז אישי</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Ticker Footer */}
            <footer className="h-12 bg-white/5 border-t border-white/10 flex items-center overflow-hidden">
                <div className="whitespace-nowrap flex animate-[marquee_30s_linear_infinite] hover:pause">
                    {leaderboard.map(t => (
                        <span key={t.id} className="inline-flex items-center mx-8 text-sm font-bold">
                            {t.name}: <span className="text-cyan-400 mr-1">{t.total_points}</span>
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {leaderboard.map(t => (
                        <span key={`dup-${t.id}`} className="inline-flex items-center mx-8 text-sm font-bold">
                            {t.name}: <span className="text-cyan-400 mr-1">{t.total_points}</span>
                        </span>
                    ))}
                </div>
            </footer>

            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    )
}
