import { useState, useEffect } from 'react'
import { supabase, type LeaderboardRow } from '../lib/supabase'
import { Trophy, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

export default function TVDashboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
    const [currentSchedule, setCurrentSchedule] = useState<any[]>([])
    const [allSchedule, setAllSchedule] = useState<any[]>([])
    const [activeTeamIndex, setActiveTeamIndex] = useState(0)
    const [currentTime, setCurrentTime] = useState(new Date())

    const portalUrl = import.meta.env.VITE_PORTAL_URL || window.location.origin

    useEffect(() => {
        fetchData()
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000)
        const rotationInterval = setInterval(() => {
            setActiveTeamIndex((prev) => (prev + 1))
        }, 10000)

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
            clearInterval(clockInterval)
            clearInterval(rotationInterval)
        }
    }, [])

    useEffect(() => {
        if (leaderboard.length > 0) {
            setActiveTeamIndex(0)
        }
    }, [leaderboard])

    async function fetchData() {
        await Promise.all([fetchLeaderboard(), fetchSchedule()])
    }

    async function fetchLeaderboard() {
        const { data } = await supabase.rpc('get_leaderboard')
        if (data) setLeaderboard(data)
    }

    // Removal of fetchLatestResults

    async function fetchSchedule() {
        const now = new Date()

        const { data } = await supabase
            .from('schedule')
            .select('*, teams:team_id(name), opponents:opponent_id(name), stations(name, icon)')
            .order('start_time', { ascending: true })

        if (data) {
            setAllSchedule(data)

            // Filter current games: either matching current time window OR if no games are now, show the closest upcoming ones
            let current = data.filter(s => {
                const start = new Date(s.start_time)
                const diff = (now.getTime() - start.getTime()) / (1000 * 60)
                return diff >= 0 && diff < 25
            })

            if (current.length === 0) {
                const upcoming = data.filter(s => new Date(s.start_time) > now)
                if (upcoming.length > 0) {
                    const nextStartTime = upcoming[0].start_time
                    current = upcoming.filter(s => s.start_time === nextStartTime)
                }
            }

            setCurrentSchedule(current)
        }
    }

    const leftColumn = leaderboard.slice(0, Math.ceil(leaderboard.length / 2))
    const rightColumn = leaderboard.slice(Math.ceil(leaderboard.length / 2))

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-background text-white rtl overflow-hidden">
            {/* Top Section: Leaderboard + Stats */}
            <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">

                {/* Right Column (Wide): Multi-column Leaderboard */}
                <section className="col-span-12 lg:col-span-9 flex flex-col min-h-0 space-y-3">
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black text-glow flex items-center space-x-3 space-x-reverse">
                                <Trophy className="text-yellow-400" size={32} />
                                <span>טבלת מובילים</span>
                            </h2>
                            <div className="text-cyan-400 font-mono text-xl font-black mt-1">
                                {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                            <Activity size={16} className="animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Live</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4 min-h-0">
                        {/* Leaderboard Part 1 */}
                        <div className="glass-card flex flex-col min-h-0 overflow-hidden">
                            <div className="grid grid-cols-12 p-3 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 shrink-0">
                                <div className="col-span-2">דירוג</div>
                                <div className="col-span-7">כיתה</div>
                                <div className="col-span-3 text-left">נקודות</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {leftColumn.map((row, idx) => (
                                    <LeaderboardItem key={row.id} row={row} idx={idx} />
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard Part 2 */}
                        <div className="glass-card flex flex-col min-h-0 overflow-hidden">
                            <div className="grid grid-cols-12 p-3 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 shrink-0">
                                <div className="col-span-2">דירוג</div>
                                <div className="col-span-7">כיתה</div>
                                <div className="col-span-3 text-left">נקודות</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {rightColumn.map((row, idx) => (
                                    <LeaderboardItem key={row.id} row={row} idx={idx + leftColumn.length} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Current Round Matches (Horizontal) */}
                    <div className="h-24 glass-card p-3 border-cyan-500/20 flex flex-col shrink-0 overflow-hidden">
                        <h3 className="text-[10px] font-bold mb-2 text-cyan-400 uppercase tracking-widest flex items-center space-x-2 space-x-reverse">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                            <span>משחקים כעת</span>
                        </h3>
                        <div className="flex-1 grid grid-cols-4 gap-3">
                            {currentSchedule.slice(0, 4).map((s) => (
                                <div key={s.id} className="p-2 rounded-lg bg-cyan-400/5 border border-cyan-400/10 flex flex-col justify-center">
                                    <div className="text-[10px] font-bold text-white/40 truncate">{s.stations?.name}</div>
                                    <div className="font-black text-sm truncate">
                                        {s.teams?.name} <span className="text-cyan-500 text-[10px]">נגד</span> {s.opponents?.name || '---'}
                                    </div>
                                </div>
                            ))}
                            {currentSchedule.length === 0 && <div className="col-span-4 flex items-center justify-center text-white/20 text-xs italic">אין משחקים פעילים</div>}
                        </div>
                    </div>
                </section>

                {/* Left Column (Narrow): Rotating Team Schedule & QR */}
                <section className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">
                    <div className="glass-card flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
                        {leaderboard.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 shrink-0">
                                    <h3 className="text-sm font-bold text-cyan-400 truncate">
                                        לו"ז עבור: {leaderboard[activeTeamIndex % leaderboard.length]?.name}
                                    </h3>
                                    <div className="text-[8px] bg-white/10 px-2 py-0.5 rounded uppercase tracking-tighter">צוות {activeTeamIndex % leaderboard.length + 1}</div>
                                </div>
                                <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '100%' }}>
                                    {[...allSchedule]
                                        .filter(s => s.team_id === leaderboard[activeTeamIndex % leaderboard.length]?.id || s.opponent_id === leaderboard[activeTeamIndex % leaderboard.length]?.id)
                                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                        .map((s: any) => {
                                            const teamId = leaderboard[activeTeamIndex % leaderboard.length]?.id;
                                            const vsTeam = s.team_id === teamId ? s.opponents?.name : s.teams?.name;
                                            const isPast = new Date(s.start_time).getTime() + (25 * 60 * 1000) < currentTime.getTime();
                                            const isNow = new Date(s.start_time) <= currentTime && currentTime.getTime() <= new Date(s.start_time).getTime() + (25 * 60 * 1000);

                                            return (
                                                <div key={s.id} className={`p-2 rounded-lg border flex flex-col transition-colors ${isNow ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' :
                                                    isPast ? 'bg-white/5 border-white/5 opacity-40' :
                                                        'bg-white/5 border-white/10'
                                                    }`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-white/40">
                                                            {new Date(s.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isNow && <span className="text-[8px] font-black uppercase text-cyan-400 animate-pulse">עכשיו!</span>}
                                                    </div>
                                                    <div className="font-bold text-xs truncate">{s.stations?.name}</div>
                                                    <div className="text-[10px] text-white/60 truncate italic">
                                                        נגד: {vsTeam || '---'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {allSchedule.filter(s => s.team_id === leaderboard[activeTeamIndex % leaderboard.length]?.id || s.opponent_id === leaderboard[activeTeamIndex % leaderboard.length]?.id).length === 0 && (
                                        <div className="text-center py-8 text-white/20 text-xs italic">אין משחקים מתוזמנים</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="glass-card p-3 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-white/20 shrink-0 text-center">
                        <div className="inline-block p-2 bg-white rounded-lg mb-2">
                            {portalUrl && <QRCodeSVG value={portalUrl} size={60} level="H" />}
                        </div>
                        <h4 className="font-black text-sm">הדף האישי</h4>
                        <p className="text-[9px] text-white/60">סרוק ללו"ז וניקוד אישי</p>
                    </div>
                </section>
            </div>

            {/* Ticker Footer */}
            <footer className="h-10 bg-white/5 border-t border-white/10 flex items-center overflow-hidden shrink-0">
                <div className="whitespace-nowrap flex animate-[marquee_20s_linear_infinite]">
                    {leaderboard.map(t => (
                        <span key={t.id} className="inline-flex items-center mx-6 text-xs font-bold">
                            {t.name}: <span className="text-cyan-400 mr-1">{t.total_points}</span>
                        </span>
                    ))}
                    {leaderboard.map(t => (
                        <span key={`dup-${t.id}`} className="inline-flex items-center mx-6 text-xs font-bold">
                            {t.name}: <span className="text-cyan-400 mr-1">{t.total_points}</span>
                        </span>
                    ))}
                </div>
            </footer>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(100%); } }
            `}</style>
        </div>
    )
}

function LeaderboardItem({ row, idx }: { row: LeaderboardRow, idx: number }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`grid grid-cols-12 p-2 rounded-lg items-center text-sm ${idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                idx === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                    idx === 2 ? 'bg-amber-700/10 border border-amber-700/20' :
                        'bg-white/5 border border-white/5'
                }`}
        >
            <div className="col-span-2 text-center font-black">#{idx + 1}</div>
            <div className="col-span-7 pr-2 truncate font-bold">{row.name}</div>
            <div className="col-span-3 text-left font-black tabular-nums">{row.total_points}</div>
        </motion.div>
    )
}
