import { useState, useEffect } from 'react'
import { supabase, type Team, type Station, type Result } from '../lib/supabase'
import { Trophy, Save, Trash2, Search, Loader2 } from 'lucide-react'

export default function AdminView() {
    const [teams, setTeams] = useState<Team[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form State
    const [selectedTeam, setSelectedTeam] = useState('')
    const [selectedStation, setSelectedStation] = useState('')
    const [selectedOpponent, setSelectedOpponent] = useState('')
    const [points, setPoints] = useState('0')
    const [isWinner, setIsWinner] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (selectedStation) {
            suggestMatch()
        }
    }, [selectedStation])

    async function suggestMatch() {
        const now = new Date()
        // Find the match for this station that starts before or at 'now' and ends after
        // Rounds are 20 mins long. 
        const { data } = await supabase
            .from('schedule')
            .select('*')
            .eq('station_id', selectedStation)
            .lte('start_time', now.toISOString())
            .order('start_time', { ascending: false })
            .limit(1)

        if (data && data[0]) {
            const match = data[0]
            // Only suggest if the match is still "current" (within 25 mins of start)
            const startTime = new Date(match.start_time)
            const diffMins = (now.getTime() - startTime.getTime()) / (1000 * 60)

            if (diffMins >= 0 && diffMins < 25) {
                setSelectedTeam(match.team_id)
                setSelectedOpponent(match.opponent_id || '')
            }
        }
    }

    async function fetchData() {
        setLoading(true)
        const [teamsRes, stationsRes, resultsRes] = await Promise.all([
            supabase.from('teams').select('*').order('name'),
            supabase.from('stations').select('*').order('name'),
            supabase.from('results').select('*, teams(name), stations(name)').order('created_at', { ascending: false }).limit(10)
        ])

        if (teamsRes.data) setTeams(teamsRes.data)
        if (stationsRes.data) setStations(stationsRes.data)
        if (resultsRes.data) setResults(resultsRes.data as any)
        setLoading(false)
    }

    async function handleRecordMatch(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedTeam || !selectedStation) return

        setSaving(true)
        try {
            const { error } = await supabase.rpc('record_match_result', {
                p_team_id: selectedTeam,
                p_station_id: selectedStation,
                p_opponent_id: selectedOpponent || null,
                p_is_winner: isWinner,
                p_points: parseInt(points) || 0,
                p_recorded_by: 'מנהל'
            })

            if (error) throw error

            // Reset form (except station for faster entry)
            setSelectedTeam('')
            setSelectedOpponent('')
            setPoints('0')
            setIsWinner(false)
            fetchData()
        } catch (err) {
            console.error(err)
            alert('שגיאה בתיעוד התוצאה')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('האם אתה בטוח שברצונך למחוק תוצאה זו?')) return

        try {
            const { error } = await supabase.rpc('delete_match_result', { p_result_id: id })
            if (error) throw error
            fetchData()
        } catch (err) {
            alert('שגיאה במחיקה')
        }
    }

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-cyan-400" size={48} />
        </div>
    )

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-glow">תיעוד תוצאות</h1>
                    <p className="text-white/60">הזן תוצאות משחקים בזמן אמת</p>
                </div>
            </header>

            {/* Recording Form */}
            <section className="glass-card p-6">
                <form onSubmit={handleRecordMatch} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">תחנה</label>
                        <select
                            value={selectedStation}
                            onChange={(e) => setSelectedStation(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                            required
                        >
                            <option value="" className="bg-background">בחר תחנה...</option>
                            {stations.map(s => <option key={s.id} value={s.id} className="bg-background">{s.icon} {s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">צוות / כיתה</label>
                        <select
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                            required
                        >
                            <option value="" className="bg-background">בחר כיתה...</option>
                            {teams.map(t => <option key={t.id} value={t.id} className="bg-background">{t.name} ({t.grade})</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">יריב (אופציונלי)</label>
                        <select
                            value={selectedOpponent}
                            onChange={(e) => setSelectedOpponent(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="" className="bg-background">ללא יריב...</option>
                            {teams.map(t => t.id !== selectedTeam && <option key={t.id} value={t.id} className="bg-background">{t.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">ניקוד</label>
                        <div className="flex space-x-4 space-x-reverse">
                            <input
                                type="number"
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                                min="0"
                            />
                            <button
                                type="button"
                                onClick={() => setIsWinner(!isWinner)}
                                className={`px-4 py-2 rounded-lg border transition-all ${isWinner ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-white/40'
                                    }`}
                            >
                                ניצחון?
                            </button>
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <button
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            <span>שמור תוצאה</span>
                        </button>
                    </div>
                </form>
            </section>

            {/* Recent Results */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center space-x-2 space-x-reverse">
                    <Search size={20} className="text-cyan-400" />
                    <span>תוצאות אחרונות</span>
                </h2>

                <div className="space-y-3">
                    {results.map(r => (
                        <div key={r.id} className="glass-card p-4 flex items-center justify-between group">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <div className="p-2 rounded-full bg-white/5">
                                    <Trophy size={18} className={r.is_winner ? 'text-yellow-400' : 'text-white/20'} />
                                </div>
                                <div>
                                    <div className="font-bold">
                                        {(r as any).teams?.name} ב{(r as any).stations?.name}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        {r.points_earned} נקודות • {new Date(r.created_at).toLocaleTimeString('he-IL')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-2 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {results.length === 0 && <p className="text-center text-white/20 py-8">טרם הוזנו תוצאות</p>}
                </div>
            </section>
        </div>
    )
}
