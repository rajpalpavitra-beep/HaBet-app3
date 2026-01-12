import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

function BetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bet, setBet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

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
    } catch (err) {
      console.error('Error loading bet:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkWon = async () => {
    if (!confirm('Mark this bet as won?')) return

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
    if (!confirm('Mark this bet as lost?')) return

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

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  if (!bet) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Bet not found</h2>
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

  return (
    <div className="container">
      <button className="btn-secondary mb-3" onClick={() => navigate('/')}>
        ← Back to Dashboard
      </button>

      <div className="card">
        <div style={{ 
          padding: '1rem', 
          borderRadius: '12px', 
          backgroundColor: statusColor,
          marginBottom: '1rem'
        }}>
          <h1>{bet.title}</h1>
          <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Status: <strong>{bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}</strong>
          </p>
        </div>

        <div className="mb-3">
          <h3>Description</h3>
          <p style={{ marginTop: '0.5rem' }}>{bet.description}</p>
        </div>

        <div className="mb-3">
          <h3>Target Date</h3>
          <p style={{ marginTop: '0.5rem' }}>
            {bet.target_date ? new Date(bet.target_date).toLocaleDateString() : 'No target date'}
            {isPastTargetDate && bet.status === 'pending' && (
              <span style={{ color: 'red', marginLeft: '1rem' }}>⚠ Past due</span>
            )}
          </p>
        </div>

        <div className="mb-3">
          <h3>Created</h3>
          <p style={{ marginTop: '0.5rem' }}>
            {new Date(bet.created_at).toLocaleString()}
          </p>
        </div>

        {bet.resolved_at && (
          <div className="mb-3">
            <h3>Resolved</h3>
            <p style={{ marginTop: '0.5rem' }}>
              {new Date(bet.resolved_at).toLocaleString()}
            </p>
          </div>
        )}

        {bet.status === 'pending' && bet.user_id === user?.id && (
          <div className="flex gap-2 mt-4">
            <button 
              className="btn-success" 
              onClick={handleMarkWon}
              disabled={updating}
            >
              Mark as Won
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
    </div>
  )
}

export default BetDetail
