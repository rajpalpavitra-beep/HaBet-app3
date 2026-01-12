import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

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
    } catch (err) {
      console.error('Error loading bets:', err)
    } finally {
      setLoading(false)
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
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Welcome, {getDisplayName()}! 👋
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
        </div>

        {/* Feature Cards */}
        <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div className="card" style={{ flex: '1', minWidth: '200px', borderRadius: '20px', padding: '1.75rem' }}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{ fontSize: '2rem' }}>📊</div>
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
              <div style={{ fontSize: '2rem' }}>🏆</div>
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
              <div style={{ fontSize: '2rem' }}>👥</div>
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
              <div style={{ fontSize: '2rem' }}>🎮</div>
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
