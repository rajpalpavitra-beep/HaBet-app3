import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

function RoomCreateBet() {
  const { id: roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [stake, setStake] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [roomMembers, setRoomMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [error, setError] = useState('')
  const [notificationTime, setNotificationTime] = useState('18:00')
  const [notificationFrequency, setNotificationFrequency] = useState('daily')

  useEffect(() => {
    if (user && roomId) {
      loadRoomMembers()
    }
  }, [user, roomId])

  const loadRoomMembers = async () => {
    try {
      setLoadingMembers(true)
      
      // Get all room members
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)

      if (memberError) throw memberError

      const userIds = (memberData || []).map(m => m.user_id).filter(id => id !== user.id) // Exclude self
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nickname, emoji_avatar, email')
          .in('id', userIds)

        if (profilesError) throw profilesError
        setRoomMembers(profiles || [])
        // Auto-select all members by default
        setSelectedMembers(profiles.map(p => p.id))
      } else {
        setRoomMembers([])
        setSelectedMembers([])
      }
    } catch (err) {
      console.error('Error loading room members:', err)
      setError('Failed to load room members: ' + err.message)
    } finally {
      setLoadingMembers(false)
    }
  }

  const toggleMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!title.trim() || !goal.trim() || !stake.trim() || !startDate || !endDate) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      // Create bet with room_id
      const { data: betData, error: insertError } = await supabase
        .from('bets')
        .insert([
          {
            user_id: user.id,
            room_id: roomId,
            title: title.trim(),
            description: '',
            goal: goal.trim(),
            stake: stake.trim(),
            start_date: startDate,
            target_date: endDate,
            status: 'pending',
            verification_required: selectedMembers.length > 0,
            notification_time: notificationTime,
            notification_frequency: notificationFrequency
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Add selected room members as accountable friends
      if (selectedMembers.length > 0) {
        const accountabilityRecords = selectedMembers.map(memberId => ({
          bet_id: betData.id,
          friend_id: memberId
        }))

        const { error: accountabilityError } = await supabase
          .from('bet_accountability')
          .insert(accountabilityRecords)

        if (accountabilityError) throw accountabilityError
      }

      navigate(`/room/${roomId}`)
    } catch (err) {
      console.error('Error creating bet:', err)
      setError(err.message || 'Failed to create bet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-create" style={{ minHeight: '100vh', padding: '2rem' }}>
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

        <h1 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
          Create Bet in Room
        </h1>

        {error && (
          <div className="error-box mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '1.75rem', maxWidth: '600px' }}>
          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              Bet Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-handwritten)',
                backgroundColor: 'white',
                width: '100%'
              }}
            />
          </div>

          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              Goal *
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              style={{
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-handwritten)',
                backgroundColor: 'white',
                width: '100%'
              }}
            />
          </div>

          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              Stake *
            </label>
            <input
              type="text"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              required
              style={{
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-handwritten)',
                backgroundColor: 'white',
                width: '100%'
              }}
            />
          </div>

          <div className="flex gap-4" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="flex flex-col" style={{ flex: '1', minWidth: '200px', gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{
                  borderRadius: '12px',
                  border: '2px solid #E8E8E8',
                  padding: '0.875rem 1.25rem',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  width: '100%'
                }}
              />
            </div>

            <div className="flex flex-col" style={{ flex: '1', minWidth: '200px', gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{
                  borderRadius: '12px',
                  border: '2px solid #E8E8E8',
                  padding: '0.875rem 1.25rem',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Room Members as Accountable */}
          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              Who Should Hold You Accountable? (Room Members)
            </label>
            {loadingMembers ? (
              <p style={{ color: 'var(--text-light)' }}>Loading members...</p>
            ) : roomMembers.length === 0 ? (
              <p style={{ color: 'var(--text-light)', padding: '1rem', backgroundColor: '#F9F9F9', borderRadius: '12px' }}>
                No other members in this room yet.
              </p>
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <div style={{
                  border: '2px solid var(--pastel-purple)',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  padding: '0.5rem',
                  boxShadow: '0 4px 12px rgba(212, 165, 245, 0.2)'
                }}>
                  <select
                    multiple
                    size={Math.min(Math.max(roomMembers.length, 3), 6)}
                    value={selectedMembers}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                      setSelectedMembers(selected)
                    }}
                    style={{
                      width: '100%',
                      minHeight: '180px',
                      borderRadius: '8px',
                      border: 'none',
                      padding: '0.5rem',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-handwritten)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {roomMembers.map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        style={{
                          padding: '0.75rem 1rem',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-handwritten)',
                          color: 'var(--text-dark)',
                          cursor: 'pointer'
                        }}
                      >
                        {member?.emoji_avatar || '👤'} {member?.nickname || member?.email?.split('@')[0] || 'Member'}
                      </option>
                    ))}
                  </select>
                </div>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-light)',
                  marginTop: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple members. All selected by default.
                </p>
                {selectedMembers.length > 0 && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#F9F9F9',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    color: 'var(--text-dark)'
                  }}>
                    <strong>Selected ({selectedMembers.length}):</strong>{' '}
                    {selectedMembers.map((memberId, index) => {
                      const member = roomMembers.find(m => m.id === memberId)
                      const displayName = member?.nickname || member?.email?.split('@')[0] || 'Member'
                      return (
                        <span key={memberId}>
                          {index > 0 && ', '}
                          {member?.emoji_avatar || '👤'} {displayName}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Settings */}
          <div className="flex flex-col" style={{ gap: '0.75rem' }}>
            <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              Check-In Reminder Settings
            </label>
            <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
              <div className="flex flex-col" style={{ flex: '1', minWidth: '200px', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: '500' }}>
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  style={{
                    borderRadius: '12px',
                    border: '2px solid #E8E8E8',
                    padding: '0.875rem 1.25rem',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    width: '100%'
                  }}
                />
              </div>
              <div className="flex flex-col" style={{ flex: '1', minWidth: '200px', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: '500' }}>
                  Frequency
                </label>
                <select
                  value={notificationFrequency}
                  onChange={(e) => setNotificationFrequency(e.target.value)}
                  style={{
                    borderRadius: '12px',
                    border: '2px solid #E8E8E8',
                    padding: '0.875rem 1.25rem',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-handwritten)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: 'var(--pastel-pink)',
                color: 'white',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1.05rem',
                fontWeight: '600',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Bet'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/room/${roomId}`)}
              style={{
                backgroundColor: 'var(--pastel-blue)',
                color: 'var(--text-dark)',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1.05rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoomCreateBet
