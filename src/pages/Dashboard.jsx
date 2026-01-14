import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const AVATAR_COLORS = [
  { bg: '#FFB3BA', text: '#4A4A4A' },
  { bg: '#BAE1FF', text: '#4A4A4A' },
  { bg: '#FFFACD', text: '#4A4A4A' },
  { bg: '#E6D7F0', text: '#4A4A4A' },
  { bg: '#D4A5F5', text: 'white' },
  { bg: '#B3E5D0', text: '#4A4A4A' },
  { bg: '#FFD4A3', text: '#4A4A4A' },
  { bg: '#C7CEEA', text: '#4A4A4A' },
  { bg: '#FFB6C1', text: '#4A4A4A' },
  { bg: '#E0BBE4', text: '#4A4A4A' },
]

function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [overallProgress, setOverallProgress] = useState({ completed: 0, total: 0, percentage: 0 })

  useEffect(() => {
    if (user) {
      loadProfile()
      loadBets()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const loadBets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setBets(data || [])
      
      // Calculate overall progress
      await calculateOverallProgress(data || [])
    } catch (err) {
      console.error('Error loading bets:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallProgress = async (betsData) => {
    try {
      let totalCompleted = 0
      let totalDays = 0

      for (const bet of betsData) {
        if (bet.status === 'pending' && bet.start_date && bet.target_date) {
          const start = new Date(bet.start_date)
          const end = new Date(bet.target_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const betTotalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
          const endDate = end < today ? end : today
          const daysElapsed = Math.max(0, Math.ceil((endDate - start) / (1000 * 60 * 60 * 24)) + 1)

          const { data: checkIns } = await supabase
            .from('check_ins')
            .select('*')
            .eq('bet_id', bet.id)
            .eq('user_id', user.id)
            .eq('completed', true)

          const completed = (checkIns || []).length
          totalCompleted += completed
          totalDays += daysElapsed
        } else if (bet.status === 'won') {
          totalCompleted += 1
          totalDays += 1
        }
      }

      const percentage = totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0
      setOverallProgress({ completed: totalCompleted, total: totalDays, percentage })
    } catch (err) {
      console.error('Error calculating overall progress:', err)
    }
  }

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name
    if (user?.email) {
      const name = user.email.split('@')[0]
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    return 'User'
  }

  const getUsername = () => {
    if (user?.email) {
      return '@' + user.email.split('@')[0].substring(0, 10)
    }
    return '@user'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2 className="handwritten">Loading...</h2>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div style={{ 
              width: '32px', 
              height: '32px', 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#FF6B6B" stroke="#fff" strokeWidth="2"/>
                <circle cx="16" cy="16" r="8" fill="#4A90E2" stroke="#fff" strokeWidth="1.5"/>
                <circle cx="16" cy="16" r="3" fill="#fff"/>
                <path d="M16 8 L16 24 M8 16 L24 16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="handwritten" style={{ margin: 0 }}>HaBet Dashboard</h1>
          </div>
          <button 
            onClick={signOut}
            style={{
              backgroundColor: 'var(--pastel-pink)',
              color: '#FF6B6B',
              borderRadius: '12px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Welcome Card */}
        <div className="card mb-6" style={{ borderRadius: '24px', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          <div className="flex items-center gap-4">
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: profile?.avatar_color_index !== undefined 
                ? AVATAR_COLORS[profile.avatar_color_index]?.bg || 'var(--pastel-purple)'
                : 'var(--pastel-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '600',
              color: profile?.avatar_color_index !== undefined
                ? (AVATAR_COLORS[profile.avatar_color_index]?.text || 'white')
                : 'white',
              flexShrink: 0
            }}>
              {(profile?.nickname || getDisplayName()).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 className="handwritten" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                Welcome, {profile?.nickname || getDisplayName()}
              </h2>
              <p className="handwritten" style={{ 
                fontSize: '1.2rem', 
                color: 'var(--pastel-purple)', 
                marginBottom: '0.25rem',
                marginTop: '0.5rem'
              }}>
                {getUsername()}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                {user?.email}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                Tap to edit profile
              </p>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        {overallProgress.total > 0 && (
          <div className="card mb-6" style={{ borderRadius: '24px' }}>
            <h3 className="handwritten" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Overall Progress</h3>
            <div style={{
              width: '100%',
              height: '50px',
              backgroundColor: '#E8E8E8',
              borderRadius: '25px',
              overflow: 'hidden',
              position: 'relative',
              border: '2px solid #D0D0D0',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                width: `${Math.max(overallProgress.percentage, 2)}%`,
                height: '100%',
                backgroundColor: overallProgress.percentage >= 100 ? 'var(--pastel-mint)' : 'var(--pastel-blue)',
                transition: 'width 0.8s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '1.1rem',
                minWidth: '60px'
              }}>
                {overallProgress.percentage}%
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-light)', textAlign: 'center', margin: 0 }}>
              {overallProgress.completed} of {overallProgress.total} days completed across all bets
            </p>
          </div>
        )}

        {/* Feature Cards */}
        <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div 
            className="card" 
            style={{ flex: '1', minWidth: '200px', borderRadius: '20px', padding: '1.75rem', cursor: 'pointer' }}
            onClick={() => navigate('/your-bets')}
          >
            <div className="flex items-center gap-3 mb-3">
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'var(--pastel-blue)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--text-dark)'
              }}>B</div>
              <h3 className="handwritten" style={{ margin: 0, fontSize: '1.4rem' }}>Your Bets</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: 0, paddingLeft: '3.5rem' }}>
              {bets.length} {bets.length === 1 ? 'bet' : 'bets'}
            </p>
          </div>

          <div 
            className="card" 
            style={{ flex: '1', minWidth: '200px', borderRadius: '20px', cursor: 'pointer', padding: '1.75rem' }}
            onClick={() => navigate('/leaderboard')}
          >
            <div className="flex items-center gap-3 mb-3">
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'var(--pastel-yellow)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--text-dark)'
              }}>L</div>
              <h3 className="handwritten" style={{ margin: 0, fontSize: '1.4rem' }}>Leaderboard</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: 0, paddingLeft: '3.5rem' }}>
              View rankings
            </p>
          </div>

          <div 
            className="card" 
            style={{ flex: '1', minWidth: '200px', borderRadius: '20px', cursor: 'pointer', padding: '1.75rem' }}
            onClick={() => navigate('/friends')}
          >
            <div className="flex items-center gap-3 mb-3">
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'var(--pastel-mint)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--text-dark)'
              }}>F</div>
              <h3 className="handwritten" style={{ margin: 0, fontSize: '1.4rem' }}>Friends</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: 0, paddingLeft: '3.5rem' }}>
              Connect & compete
            </p>
          </div>

          <div 
            className="card" 
            style={{ flex: '1', minWidth: '200px', borderRadius: '20px', cursor: 'pointer', padding: '1.75rem' }}
            onClick={() => navigate('/rooms')}
          >
            <div className="flex items-center gap-3 mb-3">
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'var(--pastel-purple)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'white'
              }}>R</div>
              <h3 className="handwritten" style={{ margin: 0, fontSize: '1.4rem' }}>Game Rooms</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: 0, paddingLeft: '3.5rem' }}>
              Join with code
            </p>
          </div>
        </div>

        {/* Create New Bet Card */}
        <div 
          className="card" 
          style={{ borderRadius: '20px', cursor: 'pointer', padding: '1.75rem' }}
          onClick={() => navigate('/create-bet')}
        >
          <div className="flex items-center gap-4">
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              backgroundColor: '#F5F5F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              +
            </div>
            <div>
              <h3 className="handwritten" style={{ margin: 0, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Create New Bet</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: 0 }}>
                Start a new habit challenge
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
