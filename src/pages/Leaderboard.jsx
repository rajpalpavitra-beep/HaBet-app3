import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Leaderboard() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const processLeaderboardData = (users, bets, checkins) => {
    // Calculate stats for each user
    const stats = users.map(user => {
      const userBets = bets.filter(b => b.user_id === user.id)
      const won = userBets.filter(b => b.status === 'won').length
      const lost = userBets.filter(b => b.status === 'lost').length
      const pending = userBets.filter(b => b.status === 'pending').length
      const total = userBets.length
      
      // Calculate current streak
      const userCheckins = checkins
        .filter(c => c.user_id === user.id)
        .map(c => new Date(c.checkin_date).toISOString().split('T')[0])
        .sort()
        .reverse()
      
      let streak = 0
      for (let i = 0; i < userCheckins.length; i++) {
        const expectedDate = new Date()
        expectedDate.setDate(expectedDate.getDate() - i)
        const expectedDateStr = expectedDate.toISOString().split('T')[0]
        
        if (userCheckins[i] === expectedDateStr) {
          streak++
        } else {
          break
        }
      }

      const winRate = total > 0 ? (won / total * 100).toFixed(1) : 0
      const score = won * 10 + streak * 5 - lost * 5

      return {
        ...user,
        won,
        lost,
        pending,
        total,
        winRate,
        streak,
        score
      }
    })

    // Sort by score (descending)
    stats.sort((a, b) => b.score - a.score)
    setLeaderboard(stats)
  }

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      
      // Get all bets
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('user_id, status')
      
      if (betsError) throw betsError

      // Get all check-ins
      const { data: checkins, error: checkinsError } = await supabase
        .from('daily_checkins')
        .select('user_id, checkin_date')
      
      if (checkinsError) {
        console.warn('Error loading checkins:', checkinsError)
      }

      // Get all users with their stats
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
      
      if (usersError) {
        console.error('Error loading profiles:', usersError)
        // If profiles table doesn't exist or is empty, return empty leaderboard
        setLeaderboard([])
        setLoading(false)
        return
      }
      
      if (!users || users.length === 0) {
        setLeaderboard([])
        setLoading(false)
        return
      }

      processLeaderboardData(users, bets || [], checkins || [])
    } catch (err) {
      console.error('Error loading leaderboard:', err)
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-4">
        <h1>Leaderboard</h1>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3">
          {leaderboard.length === 0 ? (
            <p className="text-center">No users yet</p>
          ) : (
            leaderboard.map((user, index) => (
              <div
                key={user.id}
                className="card"
                style={{
                  backgroundColor: index === 0 ? 'var(--pastel-yellow)' : 'white',
                  border: index < 3 ? '2px solid var(--pastel-pink)' : 'none'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--pastel-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '1.2rem'
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3>{user.display_name || user.email}</h3>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Score: {user.score} | Wins: {user.won} | Losses: {user.lost} | Streak: {user.streak} days
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                      {user.winRate}%
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Win Rate</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
