import { useState } from 'react'
import { Monitor, UserCircle, Settings } from 'lucide-react'
import AdminView from './components/AdminView'
import StudentPortal from './components/StudentPortal'
import TVDashboard from './components/TVDashboard'

type View = 'admin' | 'student' | 'tv'

function App() {
  const [currentView, setCurrentView] = useState<View>('student')

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Navigation */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white animate-ping"></div>
                </div>
              </div>
              <span className="font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                OZONE<span className="text-white font-light">SPORTS</span>
              </span>
            </div>

            <div className="flex space-x-2 sm:space-x-4 space-x-reverse">
              <button
                onClick={() => setCurrentView('student')}
                className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 space-x-reverse text-sm font-medium ${currentView === 'student'
                  ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <UserCircle size={18} />
                <span className="hidden sm:inline">תלמיד</span>
              </button>
              <button
                onClick={() => setCurrentView('tv')}
                className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 space-x-reverse text-sm font-medium ${currentView === 'tv'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-white/60 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }`}
              >
                <Monitor size={18} />
                <span className="hidden sm:inline">לוח תוצאות (TV)</span>
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 space-x-reverse text-sm font-medium ${currentView === 'admin'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-white/60 hover:text-purple-400 hover:bg-purple-500/10'
                  }`}
              >
                <Settings size={18} />
                <span className="hidden sm:inline">ניהול</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col relative overflow-hidden">
        {currentView === 'admin' && <AdminView />}
        {currentView === 'student' && <StudentPortal />}
        {currentView === 'tv' && <TVDashboard />}
      </main>
    </div>
  )
}

export default App
