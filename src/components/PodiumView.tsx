import { useState, useEffect } from 'react'
import { supabase, type LeaderboardRow } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Star, Sparkles, Crown } from 'lucide-react'

// Confetti particle component
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
    const startX = Math.random() * 100
    const endX = startX + (Math.random() - 0.5) * 30
    return (
        <motion.div
            className="absolute w-2 h-2 rounded-sm opacity-0"
            style={{ left: `${startX}%`, top: '-10px', background: color }}
            animate={{
                y: ['0vh', '110vh'],
                x: [`${startX}%`, `${endX}%`],
                rotate: [0, Math.random() * 720 - 360],
                opacity: [0, 1, 1, 0],
            }}
            transition={{
                duration: 3 + Math.random() * 2,
                delay,
                repeat: Infinity,
                ease: 'linear',
            }}
        />
    )
}

function Confetti() {
    const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#7B68EE', '#32CD32', '#FF4500', '#DA70D6']
    const particles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: (i / 40) * 4,
        color: colors[i % colors.length],
    }))
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
            ))}
        </div>
    )
}

const MEDAL_CONFIG = [
    {
        place: 2,
        label: 'מקום 2nd',
        icon: Medal,
        podiumHeight: 'h-40',
        topOffset: 'mt-12',
        baseGradient: 'from-slate-400 via-gray-300 to-slate-500',
        glowColor: 'rgba(148,163,184,0.6)',
        textColor: 'text-slate-200',
        ringColor: 'ring-slate-400/60',
        platformBg: 'bg-gradient-to-b from-slate-600 to-slate-800',
        rank: '🥈',
        scale: 0.9,
    },
    {
        place: 1,
        label: 'מקום 1st',
        icon: Crown,
        podiumHeight: 'h-56',
        topOffset: 'mt-0',
        baseGradient: 'from-yellow-400 via-amber-300 to-yellow-600',
        glowColor: 'rgba(250,204,21,0.8)',
        textColor: 'text-yellow-200',
        ringColor: 'ring-yellow-400/70',
        platformBg: 'bg-gradient-to-b from-yellow-700 to-yellow-900',
        rank: '🥇',
        scale: 1,
    },
    {
        place: 3,
        label: 'מקום 3rd',
        icon: Medal,
        podiumHeight: 'h-28',
        topOffset: 'mt-20',
        baseGradient: 'from-amber-600 via-amber-500 to-amber-700',
        glowColor: 'rgba(217,119,6,0.6)',
        textColor: 'text-amber-200',
        ringColor: 'ring-amber-500/60',
        platformBg: 'bg-gradient-to-b from-amber-800 to-amber-950',
        rank: '🥉',
        scale: 0.82,
    },
]

interface PodiumSlotProps {
    config: typeof MEDAL_CONFIG[0]
    team: LeaderboardRow | undefined
    delay: number
}

function PodiumSlot({ config, team, delay }: PodiumSlotProps) {

    return (
        <motion.div
            className={`flex flex-col items-center ${config.topOffset}`}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay, ease: 'backOut' }}
        >
            {/* Avatar / Trophy area */}
            <div className="flex flex-col items-center mb-3" style={{ gap: '8px' }}>
                {/* Floating icon */}
                <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
                    className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${config.baseGradient} flex items-center justify-center ring-4 ${config.ringColor} shadow-2xl`}
                    style={{ boxShadow: `0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor}40` }}
                >
                    <span className="text-3xl">{config.rank}</span>
                    {config.place === 1 && (
                        <motion.div
                            className="absolute -top-3 left-1/2 -translate-x-1/2"
                            animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Crown size={20} className="text-yellow-300 drop-shadow-lg" />
                        </motion.div>
                    )}
                </motion.div>

                {/* Team name */}
                <div className="text-center max-w-[150px]">
                    <p className={`font-black text-lg leading-tight truncate ${config.textColor}`}>
                        {team?.name ?? '—'}
                    </p>
                    <motion.p
                        className="font-mono font-black text-white text-xl mt-0.5"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
                    >
                        {team?.total_points ?? 0}
                        <span className="text-[10px] font-normal text-white/50 mr-1">נק׳</span>
                    </motion.p>
                </div>
            </div>

            {/* Podium block */}
            <motion.div
                className={`w-36 ${config.podiumHeight} ${config.platformBg} rounded-t-lg flex items-center justify-center relative overflow-hidden`}
                style={{ boxShadow: `0 -8px 40px ${config.glowColor}40`, transformOrigin: 'bottom' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, delay: delay + 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
                {/* Sheen effect */}
                <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{ background: 'linear-gradient(135deg, white 0%, transparent 60%)' }}
                    animate={{ opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay }}
                />
                <span className={`text-5xl font-black ${config.textColor} opacity-20 select-none`}>
                    {config.place}
                </span>
            </motion.div>
        </motion.div>
    )
}

export default function PodiumView() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboard()
        const channel = supabase.channel('podium_view')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, fetchLeaderboard)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchLeaderboard)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    async function fetchLeaderboard() {
        setLoading(true)
        const { data } = await supabase.rpc('get_leaderboard')
        if (data) setLeaderboard(data)
        setLoading(false)
    }

    const top3 = MEDAL_CONFIG.map(c => ({
        config: c,
        team: leaderboard[c.place - 1],
    }))

    const rest = leaderboard.slice(3)

    return (
        <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center bg-background text-white rtl overflow-y-auto relative">
            <Confetti />

            {/* Header */}
            <motion.div
                className="text-center pt-10 pb-6 z-10"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Sparkles className="text-yellow-400 animate-pulse" size={28} />
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-600">
                        פודיום אלופים
                    </h1>
                    <Sparkles className="text-yellow-400 animate-pulse" size={28} />
                </div>
                <p className="text-white/50 text-sm tracking-widest uppercase">Sport Day Championship</p>
            </motion.div>

            {/* Podium Stage */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Trophy className="text-yellow-400" size={48} />
                    </motion.div>
                </div>
            ) : (
                <AnimatePresence>
                    <div className="relative z-10 flex items-end justify-center gap-2 md:gap-4 px-4 w-full max-w-2xl">
                        {top3.map(({ config, team }, i) => (
                            <PodiumSlot key={config.place} config={config} team={team} delay={i * 0.15} />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Ground shadow */}
            <div className="relative z-0 w-full max-w-2xl h-6 mt-0"
                style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(250,204,21,0.15) 0%, transparent 80%)' }}
            />

            {/* Scoreboard for remaining teams */}
            {rest.length > 0 && (
                <motion.div
                    className="w-full max-w-xl px-4 mt-8 pb-12 z-10"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <h2 className="text-center text-white/40 text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                        <Star size={12} />
                        <span>דירוג המשתתפים</span>
                        <Star size={12} />
                    </h2>
                    <div className="space-y-2">
                        {rest.map((row, i) => (
                            <motion.div
                                key={row.id}
                                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + i * 0.06 }}
                            >
                                <span className="text-white/30 font-black text-sm w-8 text-center">#{i + 4}</span>
                                <span className="flex-1 font-bold text-white/80">{row.name}</span>
                                <span className="font-mono font-black text-cyan-400">{row.total_points}</span>
                                <span className="text-white/30 text-xs">נק׳</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Empty state */}
            {!loading && leaderboard.length === 0 && (
                <motion.div
                    className="flex flex-col items-center justify-center h-64 text-center z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Trophy size={64} className="text-white/10 mb-4" />
                    <p className="text-white/30 text-lg font-bold">אין נתונים עדיין</p>
                    <p className="text-white/20 text-sm mt-1">ניקוד יופיע לאחר תחילת המשחקים</p>
                </motion.div>
            )}
        </div>
    )
}
