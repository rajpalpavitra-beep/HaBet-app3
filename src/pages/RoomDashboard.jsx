import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useButtonState } from '../utils/buttonStates'

function RoomDashboard() {
  const { id: roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [room, setRoom] = useState(null)
  const [bets, setBets] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteInput, setShowInviteInput] = useState(false)
  const inviteState = useButtonState()
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && roomId) {
      loadRoom()
    }
  }, [user, roomId])

  const loadRoom = async () => {
    try {
      setLoading(true)
      
      // Load room details
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError
      setRoom(roomData)

      // Check if user is a member
      const { data: memberCheck, error: memberError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single()

      if (memberError && memberError.code !== 'PGRST116') throw memberError
      
      if (memberCheck) {
        setIsMember(true)
        await Promise.all([loadBets(), loadMembers()])
      } else {
        // Check if user has a pending invite
        const { data: invite } = await supabase
          .from('room_invites')
          .select('*')
          .eq('room_id', roomId)
          .eq('invitee_email', user.email)
          .eq('status', 'pending')
          .single()

        if (invite) {
          // Auto-accept invite
          await supabase
            .from('room_members')
            .insert([{ room_id: roomId, user_id: user.id }])
          
          await supabase
            .from('room_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id)

          setIsMember(true)
          await Promise.all([loadBets(), loadMembers()])
        }
      }
    } catch (err) {
      console.error('Error loading room:', err)
      alert('Failed to load room: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadBets = async () => {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBets(data || [])
    } catch (err) {
      console.error('Error loading bets:', err)
    }
  }

  const loadMembers = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)

      if (memberError) throw memberError

      const userIds = (memberData || []).map(m => m.user_id)
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nickname, emoji_avatar, email')
          .in('id', userIds)

        if (profilesError) throw profilesError
        setMembers(profiles || [])
      }
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const sendRoomInvite = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.trim())) {
      setError('Please enter a valid email address')
      return
    }

    try {
      inviteState.setLoading()
      setError('')

      // Get inviter profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, nickname')
        .eq('id', user.id)
        .single()

      const userName = profile?.nickname || profile?.display_name || user.email?.split('@')[0] || 'Someone'
      const inviteLink = `${import.meta.env.VITE_APP_URL || 'https://ha-bet-app3.vercel.app'}/room/${roomId}`
      const roomName = room?.name || 'a room'

      // Determine email server URL
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
      const emailServerUrl = isProduction
        ? `${window.location.origin}/api/send-invite-email`
        : (import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3001/send-invite')

      // Send email invite
      const emailResponse = await fetch(emailServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inviteEmail.trim(),
          fromName: userName,
          inviteLink: inviteLink,
          appName: 'HaBet',
          roomName: roomName
        }),
      })

      if (!emailResponse.ok) {
        throw new Error('Failed to send invite email')
      }

      // Create invite record
      const { error: inviteError } = await supabase
        .from('room_invites')
        .insert([{
          room_id: roomId,
          inviter_id: user.id,
          invitee_email: inviteEmail.trim(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }])

      if (inviteError) throw inviteError

      inviteState.setSuccess(`Invitation sent to ${inviteEmail.trim()}!`)
      setInviteEmail('')
      setShowInviteInput(false)
      setError('')
    } catch (err) {
      console.error('Error sending invite:', err)
      inviteState.setError(err.message || 'Failed to send invitation')
      setError(err.message || 'Failed to send invitation')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2 className="handwritten">Loading...</h2>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="handwritten">Room not found</h2>
          <button className="btn-primary mt-3" onClick={() => navigate('/rooms')}>
            Back to Rooms
          </button>
        </div>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="handwritten">You're not a member of this room</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            You need an invitation to join this room.
          </p>
          <button 
            onClick={() => navigate('/rooms')}
            style={{
              backgroundColor: 'var(--pastel-purple)',
              color: 'white',
              borderRadius: '12px',
              padding: '0.875rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Back to Rooms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/rooms')}
              style={{
                backgroundColor: 'var(--pastel-purple)',
                color: 'white',
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              ← Back to Rooms
            </button>
            <h1 className="handwritten" style={{ fontSize: '2.5rem', margin: 0 }}>
              {room.name || 'Room'}
            </h1>
          </div>
        </div>

        {/* Room Members */}
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="handwritten" style={{ fontSize: '1.5rem', margin: 0 }}>Members</h2>
            <button
              onClick={() => setShowInviteInput(!showInviteInput)}
              style={{
                backgroundColor: 'var(--pastel-purple)',
                color: 'white',
                borderRadius: '10px',
                padding: '0.625rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {showInviteInput ? 'Cancel' : '+ Invite Members'}
            </button>
          </div>

          {/* Invite Input */}
          {showInviteInput && (
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Enter email to invite"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    setError('')
                    inviteState.reset()
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && !inviteState.isLoading && sendRoomInvite()}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    borderRadius: '12px',
                    border: error || inviteState.isError ? '2px solid var(--error-red)' : '2px solid #E8E8E8',
                    padding: '0.875rem 1.25rem',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    fontFamily: 'var(--font-body)'
                  }}
                />
                <button
                  onClick={sendRoomInvite}
                  disabled={inviteState.isLoading}
                  className={`btn-success btn-md ${inviteState.isSuccess ? 'btn-success-state' : ''} ${inviteState.isError ? 'btn-error-state' : ''} ${inviteState.isLoading ? 'btn-loading' : ''}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {inviteState.isLoading ? 'Sending...' : inviteState.isSuccess ? 'Sent!' : 'Send Invite'}
                </button>
              </div>
              {inviteState.message && (
                <div className={inviteState.isSuccess ? 'success-box' : 'error-box'}>
                  {inviteState.message}
                </div>
              )}
              {error && !inviteState.message && (
                <div className="error-box">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap" style={{ gap: '0.75rem' }}>
            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F9F9F9',
                  borderRadius: '12px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#F9F9F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  border: '2px solid var(--pastel-purple)'
                }}>
                  {member?.emoji_avatar || '👤'}
                </div>
                <span style={{ fontWeight: '500' }}>
                  {member?.nickname || member?.email?.split('@')[0] || 'Member'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="button-group button-group-full mb-6">
          <button
            onClick={() => navigate(`/room/${roomId}/create-bet`)}
            className="btn-primary btn-lg"
            style={{ flex: 1, minWidth: '200px' }}
          >
            + Create Bet
          </button>
          <button
            onClick={() => navigate(`/room/${roomId}/leaderboard`)}
            className="btn-warning btn-lg"
            style={{ flex: 1, minWidth: '200px' }}
          >
            Leaderboard
          </button>
        </div>

        {/* Room Bets */}
        <div className="card" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-4" style={{ fontSize: '1.8rem' }}>Room Bets</h2>
          {bets.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
              No bets in this room yet. Create the first bet!
            </p>
          ) : (
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              {bets.map((bet) => (
                <div
                  key={bet.id}
                  onClick={() => navigate(`/bet/${bet.id}`)}
                  className="card"
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    backgroundColor: '#F9F9F9',
                    border: '2px solid #E8E8E8'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div style={{ flex: 1 }}>
                      <h3 className="handwritten" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                        {bet.title}
                      </h3>
                      {bet.goal && (
                        <p style={{ color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                          Goal: {bet.goal}
                        </p>
                      )}
                      <div style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 
                          bet.status === 'won' ? 'var(--pastel-mint)' :
                          bet.status === 'lost' ? 'var(--pastel-pink)' :
                          'var(--pastel-blue)',
                        color: 'var(--text-dark)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginTop: '0.5rem'
                      }}>
                        {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/bet/${bet.id}`)
                      }}
                      className="btn-purple btn-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomDashboard
