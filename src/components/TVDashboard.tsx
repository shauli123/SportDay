import { useState, useEffect } from 'react'
import { supabase, type LeaderboardRow, type Result } from '../lib/supabase'
import { Trophy, Activity, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TVDashboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
    const [latestResults, setLatestResults] = useState<Result[]>([])

    useEffect(() => {
        fetchData()

        // Listen for anything
        const channel = supabase.channel('tv_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => {
                fetchData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
                fetchLeaderboard()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    async function fetchData() {
        await Promise.all([fetchLeaderboard(), fetchLatestResults()])
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

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="grid grid-cols-12 flex-1 p-6 gap-6">

                {/* Left Column: Leaderboard */}
                <section className="col-span-8 flex flex-col space-y-4">
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
                                        className={`grid grid-cols-12 p-5 rounded-2xl items-center transition-all ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30' :
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
                </section>

                {/* Right Column: Ticker & QR */}
                <section className="col-span-4 flex flex-col gap-6">
                    {/* Recent Ticker */}
                    <div className="glass-card flex-1 p-6 flex flex-col">
                        <h3 className="text-xl font-bold mb-6 pb-4 border-b border-white/10 flex justify-between items-center">
                            <span>עדכונים אחרונים</span>
                            <span className="text-xs font-normal text-white/40">התקבלו הרגע</span>
                        </h3>
                        <div className="space-y-4 flex-1">
                            <AnimatePresence>
                                {latestResults.map((r) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="p-4 rounded-xl bg-white/5 border-l-4 border-cyan-500 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold">{(r as any).teams?.name}</div>
                                            <div className="text-xs text-white/50">תחנה: {(r as any).stations?.name}</div>
                                        </div>
                                        <div className={`text-xl font-black ${r.is_winner ? 'text-green-400' : 'text-cyan-400'}`}>
                                            +{r.points_earned}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="glass-card p-6 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-white/20">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                <QrCode size={120} className="text-black" />
                            </div>
                            <div>
                                <h4 className="font-black text-xl">הדף האישי שלך</h4>
                                <p className="text-sm text-white/60">סרוק כדי לראות את הניקוד והדירוג של הכיתה שלך</p>
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
