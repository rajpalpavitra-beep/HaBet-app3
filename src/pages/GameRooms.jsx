import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function GameRooms() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitingRoomId, setInvitingRoomId] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadRooms()
    }
  }, [user])

  const loadRooms = async () => {
    try {
      setLoading(true)
      
      // Get rooms I'm a member of
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError

      const roomIds = (memberData || []).map(m => m.room_id)
      
      if (roomIds.length > 0) {
        const { data: roomsData, error: roomsError } = await supabase
          .from('game_rooms')
          .select('*')
          .in('id', roomIds)
          .order('created_at', { ascending: false })

        if (roomsError) throw roomsError
        setRooms(roomsData || [])
      } else {
        setRooms([])
      }
    } catch (err) {
      console.error('Error loading rooms:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      setError('Please enter a room name')
      return
    }

    try {
      setError('')
      
      const { data, error: insertError } = await supabase
        .from('game_rooms')
        .insert([
          {
            creator_id: user.id,
            name: newRoomName.trim()
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Add creator as member
      await supabase
        .from('room_members')
        .insert([{ room_id: data.id, user_id: user.id }])

      setNewRoomName('')
      loadRooms()
      navigate(`/room/${data.id}`)
    } catch (err) {
      console.error('Error creating room:', err)
      setError(err.message || 'Failed to create room')
    }
  }

  const sendRoomInvite = async (roomId) => {
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
      setInviteLoading(true)
      setError('')

      // Get room info
      const { data: roomData } = await supabase
        .from('game_rooms')
        .select('name')
        .eq('id', roomId)
        .single()

      // Get inviter profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, nickname')
        .eq('id', user.id)
        .single()

      const userName = profile?.nickname || profile?.display_name || user.email?.split('@')[0] || 'Someone'
      const inviteLink = `${import.meta.env.VITE_APP_URL || 'https://ha-bet-app3.vercel.app'}/room/${roomId}`
      const roomName = roomData?.name || 'a room'

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

      alert(`✅ Invitation sent to ${inviteEmail.trim()}!`)
      setInviteEmail('')
      setInvitingRoomId(null)
    } catch (err) {
      console.error('Error sending invite:', err)
      setError(err.message || 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const leaveRoom = async (roomId) => {
    if (!confirm('Are you sure you want to leave this room?')) return

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)

      if (error) throw error
      loadRooms()
    } catch (err) {
      console.error('Error leaving room:', err)
      setError(err.message)
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
          onClick={() => navigate('/')}
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
          ← Back
        </button>

        <h1 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
          Group Rooms
        </h1>

        {error && (
          <div className="error-box mb-4">
            {error}
          </div>
        )}

        {/* Create Room */}
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Create New Room</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-handwritten)'
              }}
            />
            <button
              onClick={createRoom}
              style={{
                backgroundColor: 'var(--pastel-pink)',
                color: 'white',
                borderRadius: '12px',
                padding: '0.875rem 1.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Create
            </button>
          </div>
        </div>

        {/* My Rooms */}
        {rooms.length === 0 ? (
          <div className="card" style={{ borderRadius: '24px', textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              You haven't joined any rooms yet. Create a room to get started!
            </p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: '1.5rem' }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                className="card"
                style={{ borderRadius: '24px', padding: '1.5rem' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="handwritten" style={{ fontSize: '1.8rem', margin: 0, marginBottom: '0.5rem' }}>
                      {room.name || 'Unnamed Room'}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: 0 }}>
                      Group bet room
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/room/${room.id}`)}
                      style={{
                        backgroundColor: 'var(--pastel-blue)',
                        color: 'var(--text-dark)',
                        borderRadius: '10px',
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => leaveRoom(room.id)}
                      style={{
                        backgroundColor: 'var(--pastel-pink)',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Invite Section */}
                {invitingRoomId === room.id ? (
                  <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                    <input
                      type="email"
                      placeholder="Enter email to invite"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendRoomInvite(room.id)}
                      style={{
                        flex: 1,
                        borderRadius: '12px',
                        border: '2px solid #E8E8E8',
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem'
                      }}
                    />
                    <button
                      onClick={() => sendRoomInvite(room.id)}
                      disabled={inviteLoading}
                      style={{
                        backgroundColor: 'var(--pastel-mint)',
                        color: 'var(--text-dark)',
                        borderRadius: '12px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: inviteLoading ? 'not-allowed' : 'pointer',
                        opacity: inviteLoading ? 0.6 : 1
                      }}
                    >
                      {inviteLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                    <button
                      onClick={() => {
                        setInvitingRoomId(null)
                        setInviteEmail('')
                      }}
                      style={{
                        backgroundColor: '#E8E8E8',
                        color: 'var(--text-dark)',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setInvitingRoomId(room.id)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--pastel-purple)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    + Invite Friends
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameRooms
