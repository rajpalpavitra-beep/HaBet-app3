import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

function RoomLeaderboard() {
  const { id: roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState(null)

  useEffect(() => {
    if (user && roomId) {
      loadRoom()
      loadLeaderboard()
    }
  }, [user, roomId])

  const loadRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('name')
        .eq('id', roomId)
        .single()

      if (error) throw error
      setRoom(data)
    } catch (err) {
      console.error('Error loading room:', err)
    }
  }

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      
      // Get all room members
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)

      if (memberError) throw memberError

      const memberIds = (memberData || []).map(m => m.user_id)
      
      if (memberIds.length === 0) {
        setLeaderboard([])
        setLoading(false)
        return
      }

      // Get bets for this room
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('user_id, status')
        .eq('room_id', roomId)
      
      if (betsError) throw betsError

      // Get check-ins for room members' bets
      const { data: roomBets, error: roomBetsError } = await supabase
        .from('bets')
        .select('id')
        .eq('room_id', roomId)

      if (roomBetsError) throw roomBetsError

      const betIds = (roomBets || []).map(b => b.id)
      
      let checkins = []
      if (betIds.length > 0) {
        const { data: checkinsData, error: checkinsError } = await supabase
          .from('check_ins')
          .select('user_id, checkin_date, bet_id')
          .in('bet_id', betIds)
          .eq('completed', true)
        
        if (checkinsError) {
          console.warn('Error loading checkins:', checkinsError)
        } else {
          checkins = checkinsData || []
        }
      }

      // Get member profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nickname, emoji_avatar')
        .in('id', memberIds)
      
      if (profilesError) throw profilesError

      // Calculate stats for each member
      const stats = (profiles || []).map(profile => {
        const userBets = bets.filter(b => b.user_id === profile.id)
        const won = userBets.filter(b => b.status === 'won').length
        const lost = userBets.filter(b => b.status === 'lost').length
        const pending = userBets.filter(b => b.status === 'pending').length
        const total = userBets.length
        
        // Calculate current streak from check-ins
        const userCheckins = checkins
          .filter(c => c.user_id === profile.id)
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
          ...profile,
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
    } catch (err) {
      console.error('Error loading leaderboard:', err)
    } finally {
      setLoading(false)
    }
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
        <button
          onClick={() => navigate(`/room/${roomId}`)}
          style={{
            backgroundColor: 'var(--pastel-purple)',
            color: 'white',
            borderRadius: '12px',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '2rem'
          }}
        >
          ← Back to Room
        </button>

        <h1 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {room?.name || 'Room'} Leaderboard
        </h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
          See how room members are performing
        </p>

        {leaderboard.length === 0 ? (
          <div className="card" style={{ borderRadius: '24px', textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-light)' }}>
              No data yet. Create bets to see rankings!
            </p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: '1rem' }}>
            {leaderboard.map((member, index) => (
              <div
                key={member.id}
                className="card"
                style={{
                  borderRadius: '20px',
                  padding: '1.5rem',
                  backgroundColor: index === 0 ? 'var(--pastel-yellow)' : 'white',
                  border: index === 0 ? '3px solid var(--pastel-pink)' : '2px solid #E8E8E8'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4" style={{ flex: 1 }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#F9F9F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      border: '3px solid var(--pastel-purple)',
                      flexShrink: 0
                    }}>
                      {member?.emoji_avatar || '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-3">
                        <h3 className="handwritten" style={{ fontSize: '1.5rem', margin: 0 }}>
                          {index + 1}. {member?.nickname || member?.email?.split('@')[0] || 'Member'}
                        </h3>
                        {index === 0 && (
                          <span style={{
                            fontSize: '1.2rem',
                            marginLeft: '0.5rem'
                          }}>🏆</span>
                        )}
                      </div>
                      <div className="flex gap-4" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                          <strong>Score:</strong> {member.score}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                          <strong>Won:</strong> {member.won} | <strong>Lost:</strong> {member.lost} | <strong>Pending:</strong> {member.pending}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                          <strong>Win Rate:</strong> {member.winRate}%
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                          <strong>Streak:</strong> {member.streak} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoomLeaderboard
