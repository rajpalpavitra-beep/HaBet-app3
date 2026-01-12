import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import CheckInPopup from '../components/CheckInPopup'

function BetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bet, setBet] = useState(null)
  const [accountableFriends, setAccountableFriends] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [showCheckInPopup, setShowCheckInPopup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [progress, setProgress] = useState({ totalDays: 0, completedDays: 0, percentage: 0 })

  useEffect(() => {
    if (user && id) {
      loadBet()
    }
  }, [user, id])

  const loadBet = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setBet(data)

      // Load accountable friends
      if (data) {
        await loadAccountableFriends(data.id)
        await loadCheckIns(data.id)
        await calculateProgress(data)
      }
    } catch (err) {
      console.error('Error loading bet:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAccountableFriends = async (betId) => {
    try {
      const { data, error } = await supabase
        .from('bet_accountability')
        .select(`
          *,
          friend:profiles!bet_accountability_friend_id_fkey(id, nickname, emoji_avatar, email)
        `)
        .eq('bet_id', betId)

      if (error) throw error
      setAccountableFriends(data || [])
    } catch (err) {
      console.error('Error loading accountable friends:', err)
    }
  }

  const loadCheckIns = async (betId) => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('bet_id', betId)
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })

      if (error) throw error
      setCheckIns(data || [])
    } catch (err) {
      console.error('Error loading check-ins:', err)
    }
  }

  const calculateProgress = async (betData) => {
    try {
      const start = new Date(betData.start_date || betData.created_at)
      const end = new Date(betData.target_date || betData.start_date)
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('bet_id', betData.id)
        .eq('user_id', user.id)
        .eq('completed', true)

      if (error) throw error

      const completedDays = (data || []).length
      const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

      setProgress({ totalDays, completedDays, percentage })
    } catch (err) {
      console.error('Error calculating progress:', err)
    }
  }

  const handleVerify = async (accountabilityId) => {
    try {
      const { error } = await supabase
        .from('bet_accountability')
        .update({ 
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', accountabilityId)

      if (error) throw error
      loadBet()
    } catch (err) {
      console.error('Error verifying:', err)
      alert('Failed to verify: ' + err.message)
    }
  }

  const canMarkComplete = () => {
    if (!bet || bet.status !== 'pending') return false
    if (!bet.verification_required) return true
    if (accountableFriends.length === 0) return true
    return accountableFriends.every(af => af.verified)
  }

  const handleMarkWon = async () => {
    if (!canMarkComplete()) {
      alert('You need all accountable friends to verify before marking as complete!')
      return
    }

    if (!confirm('Mark this bet as won? This action cannot be undone.')) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('bets')
        .update({ status: 'won', resolved_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      loadBet()
    } catch (err) {
      console.error('Error updating bet:', err)
      alert('Failed to update bet: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkLost = async () => {
    if (!confirm('Mark this bet as lost? This action cannot be undone.')) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('bets')
        .update({ status: 'lost', resolved_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      loadBet()
    } catch (err) {
      console.error('Error updating bet:', err)
      alert('Failed to update bet: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleCheckInComplete = () => {
    loadCheckIns(bet.id)
    calculateProgress(bet)
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2 className="handwritten">Loading...</h2>
      </div>
    )
  }

  if (!bet) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="handwritten">Bet not found</h2>
          <button className="btn-primary mt-3" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isPastTargetDate = bet.target_date && new Date(bet.target_date) < new Date()
  const statusColor = 
    bet.status === 'won' ? 'var(--pastel-mint)' :
    bet.status === 'lost' ? 'var(--pastel-pink)' :
    'var(--pastel-blue)'

  // Check if current user is an accountable friend (not the bet creator)
  const isAccountableFriend = bet.user_id !== user.id && accountableFriends.some(af => af.friend_id === user.id)
  const pendingVerifications = accountableFriends.filter(af => !af.verified).length

  return (
    <div className="container">
      <button 
        className="btn-secondary mb-3" 
        onClick={() => navigate('/')}
        style={{ marginBottom: '1.5rem' }}
      >
        ← Back to Dashboard
      </button>

      <div className="card" style={{ borderRadius: '24px', marginBottom: '1.5rem' }}>
        <div style={{ 
          padding: '1.5rem', 
          borderRadius: '12px', 
          backgroundColor: statusColor,
          marginBottom: '1.5rem'
        }}>
          <h1 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {bet.title}
          </h1>
          <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Status: <strong>{bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}</strong>
          </p>
        </div>

        {/* Goal and Stake */}
        <div className="mb-4">
          <h3 className="handwritten" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Goal 🎯</h3>
          <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>{bet.goal || 'No goal set'}</p>
        </div>

        <div className="mb-4">
          <h3 className="handwritten" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Stake 💰</h3>
          <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>{bet.stake || 'No stake set'}</p>
        </div>

        {/* Dates */}
        <div className="mb-4">
          <h3 className="handwritten" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Duration</h3>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Start:</strong> {bet.start_date ? new Date(bet.start_date).toLocaleDateString() : 'Not set'}
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>End:</strong> {bet.target_date ? new Date(bet.target_date).toLocaleDateString() : 'Not set'}
            {isPastTargetDate && bet.status === 'pending' && (
              <span style={{ color: 'red', marginLeft: '1rem' }}>⚠ Past due</span>
            )}
          </p>
        </div>

        {/* Check-In Progress Meter */}
        {bet.status === 'pending' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="handwritten" style={{ fontSize: '1.5rem', margin: 0 }}>Check-In Progress</h3>
              <button
                onClick={() => setShowCheckInPopup(true)}
                style={{
                  backgroundColor: 'var(--pastel-blue)',
                  color: 'var(--text-dark)',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Check In
              </button>
            </div>
            <div style={{
              width: '100%',
              height: '30px',
              backgroundColor: '#E8E8E8',
              borderRadius: '15px',
              overflow: 'hidden',
              marginTop: '0.75rem'
            }}>
              <div style={{
                width: `${progress.percentage}%`,
                height: '100%',
                backgroundColor: 'var(--pastel-mint)',
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dark)',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}>
                {progress.percentage > 10 && `${progress.percentage}%`}
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              {progress.completedDays} of {progress.totalDays} days completed
            </p>
          </div>
        )}

        {/* Accountable Friends */}
        {accountableFriends.length > 0 && (
          <div className="mb-4">
            <h3 className="handwritten" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              Accountable Friends 👥
            </h3>
            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              {accountableFriends.map((af) => (
                <div
                  key={af.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#F9F9F9',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '2rem' }}>
                      {af.friend?.emoji_avatar || '👤'}
                    </span>
                    <div>
                      <p style={{ fontWeight: '600', margin: 0 }}>
                        {af.friend?.nickname || af.friend?.email?.split('@')[0] || 'Friend'}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0.25rem 0 0 0' }}>
                        {af.verified ? '✓ Verified' : '⏳ Pending verification'}
                      </p>
                    </div>
                  </div>
                  {isAccountableFriend && !af.verified && af.friend_id === user.id && (
                    <button
                      onClick={() => handleVerify(af.id)}
                      style={{
                        backgroundColor: 'var(--pastel-mint)',
                        color: 'var(--text-dark)',
                        borderRadius: '10px',
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Verify ✓
                    </button>
                  )}
                  {bet.user_id === user.id && !af.verified && (
                    <span style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-light)',
                      fontStyle: 'italic'
                    }}>
                      Waiting for verification...
                    </span>
                  )}
                </div>
              ))}
            </div>
            {bet.verification_required && pendingVerifications > 0 && (
              <p style={{ 
                fontSize: '0.9rem', 
                color: 'var(--error-red)', 
                marginTop: '0.75rem',
                fontWeight: '600'
              }}>
                ⚠ {pendingVerifications} verification{pendingVerifications > 1 ? 's' : ''} needed before completion
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {bet.status === 'pending' && bet.user_id === user?.id && (
          <div className="flex gap-3 mt-4">
            <button 
              className="btn-success" 
              onClick={handleMarkWon}
              disabled={updating || !canMarkComplete()}
              style={{
                opacity: canMarkComplete() ? 1 : 0.5,
                cursor: canMarkComplete() ? 'pointer' : 'not-allowed'
              }}
            >
              {canMarkComplete() ? 'Mark as Won ✓' : `Mark as Won (${pendingVerifications} verification${pendingVerifications !== 1 ? 's' : ''} needed)`}
            </button>
            <button 
              className="btn-primary" 
              onClick={handleMarkLost}
              disabled={updating}
            >
              Mark as Lost
            </button>
          </div>
        )}
      </div>

      {showCheckInPopup && (
        <CheckInPopup
          bet={bet}
          onClose={() => setShowCheckInPopup(false)}
          onCheckIn={handleCheckInComplete}
        />
      )}
    </div>
  )
}

export default BetDetail
