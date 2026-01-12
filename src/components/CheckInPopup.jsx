import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

function CheckInPopup({ bet, onClose, onCheckIn }) {
  const { user } = useAuth()
  const [completed, setCompleted] = useState(false)
  const [notes, setNotes] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [customDays, setCustomDays] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already checked in today
    checkTodayStatus()
  }, [bet])

  const checkTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('bet_id', bet.id)
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setCompleted(data.completed)
        setNotes(data.notes || '')
      }
    } catch (err) {
      console.error('Error checking status:', err)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')

      const today = new Date().toISOString().split('T')[0]

      // For now, just check in for today
      // Weekly and custom can be implemented later with date picker
      const datesToCheckIn = [today]

      // Create check-ins for all dates
      const checkIns = datesToCheckIn.map(date => ({
        bet_id: bet.id,
        user_id: user.id,
        checkin_date: date,
        completed: completed,
        notes: notes.trim() || null
      }))

      const { error: insertError } = await supabase
        .from('check_ins')
        .upsert(checkIns, { onConflict: 'bet_id,user_id,checkin_date' })

      if (insertError) throw insertError

      onCheckIn()
      onClose()
    } catch (err) {
      console.error('Error saving check-in:', err)
      setError(err.message || 'Failed to save check-in')
    } finally {
      setLoading(false)
    }
  }

  const getCheckInProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('bet_id', bet.id)
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })

      if (error) throw error

      const totalDays = Math.ceil((new Date(bet.target_date) - new Date(bet.start_date)) / (1000 * 60 * 60 * 24)) + 1
      const completedDays = (data || []).filter(c => c.completed).length
      const percentage = totalDays > 0 ? (completedDays / totalDays * 100).toFixed(0) : 0

      return { totalDays, completedDays, percentage }
    } catch (err) {
      console.error('Error loading progress:', err)
      return { totalDays: 0, completedDays: 0, percentage: 0 }
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div className="card" style={{
        maxWidth: '500px',
        width: '100%',
        borderRadius: '24px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--text-dark)'
          }}
        >
          ×
        </button>

        <h2 className="handwritten" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Check-In: {bet.title} 📝
        </h2>

        {error && (
          <div className="error-box mb-3">
            {error}
          </div>
        )}

        <div className="flex flex-col" style={{ gap: '1.5rem' }}>
          {/* Frequency Selection */}
          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem' }}>
              Check-In Frequency
            </label>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {['daily', 'weekly', 'custom'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '10px',
                    border: frequency === freq ? '2px solid var(--pastel-pink)' : '2px solid #E8E8E8',
                    backgroundColor: frequency === freq ? '#FFF' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Completion Status */}
          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem' }}>
              Did you complete your goal today?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCompleted(true)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: completed ? '2px solid var(--pastel-mint)' : '2px solid #E8E8E8',
                  backgroundColor: completed ? 'var(--pastel-mint)' : 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                ✓ Yes
              </button>
              <button
                type="button"
                onClick={() => setCompleted(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: !completed ? '2px solid var(--pastel-pink)' : '2px solid #E8E8E8',
                  backgroundColor: !completed ? 'var(--pastel-pink)' : 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                ✗ No
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="How did it go?"
              style={{
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-handwritten)',
                backgroundColor: 'white',
                resize: 'vertical',
                width: '100%'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.875rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.875rem 1.5rem',
                borderRadius: '12px',
                backgroundColor: 'var(--pastel-pink)',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Check-In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckInPopup
