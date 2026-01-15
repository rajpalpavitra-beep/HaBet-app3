import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useButtonState } from '../utils/buttonStates'

function GameRooms() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitingRoomId, setInvitingRoomId] = useState(null)
  const inviteState = useButtonState()
  const createRoomState = useButtonState()

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
      inviteState.setLoading()
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
      const appUrl = import.meta.env.VITE_APP_URL || 'https://ha-bet-app3.vercel.app'
      const inviteLink = `${appUrl}/room/${roomId}`
      const roomName = roomData?.name || 'a room'

      // Determine email server URL (same strategy as Friends page)
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
      let emailServerUrl

      if (isProduction) {
        // On Vercel, use serverless function
        emailServerUrl = `${window.location.origin}/api/send-invite-email`
      } else {
        // Local dev: use local email server
        emailServerUrl = import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3001/send-invite'
        if (!emailServerUrl.includes('/send-invite')) {
          emailServerUrl = emailServerUrl.endsWith('/')
            ? `${emailServerUrl}send-invite`
            : `${emailServerUrl}/send-invite`
        }
      }

      console.log('Room invite email server URL:', emailServerUrl, 'isProduction:', isProduction)

      const emailResponse = await fetch(emailServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: inviteEmail.trim(),
          fromName: userName,
          inviteLink,
          appName: 'HaBet',
          roomName,
        }),
      })

      let responseText = ''
      let responseData = null
      let functionError = null

      try {
        responseText = await emailResponse.text()
        // Try to parse as JSON
        try {
          responseData = JSON.parse(responseText)
        } catch {
          // Not JSON, that's okay
        }
      } catch (e) {
        console.warn('Failed to read email response text', e)
      }

      if (!emailResponse.ok) {
        try {
          const errorJson = responseData || JSON.parse(responseText)
          functionError = {
            message: errorJson.message || errorJson.error || `HTTP ${emailResponse.status}: ${emailResponse.statusText}`,
            status: emailResponse.status,
          }
        } catch {
          functionError = {
            message: `HTTP ${emailResponse.status}: ${emailResponse.statusText} - ${responseText}`,
            status: emailResponse.status,
          }
        }
      } else {
        // Email sent successfully - verify response
        if (responseData && (responseData.error || (!responseData.success && !responseData.messageId))) {
          functionError = {
            message: responseData.error || responseData.message || 'Email service returned an error',
            status: emailResponse.status,
          }
        }
      }

      if (functionError) {
        console.error('Room invite email server error:', functionError)

        const errorMessage = functionError.message || 'Unknown error'
        const errorStatus = functionError.status || 'N/A'

        if (!isProduction) {
          // Local dev helpful hints
          if (errorStatus === 404 || errorMessage.includes('404') || errorMessage.includes('Failed to fetch')) {
            alert(
              `Email Server Not Running (404):\n\n` +
              `The local email server for room invites is not running.\n\n` +
              `To fix:\n` +
              `1. Open a new terminal\n` +
              `2. Run: npm run email-server\n` +
              `3. Or run: npm run dev:full (starts app + email server)\n` +
              `4. Then try sending the room invite again.\n\n` +
              `Error: ${errorMessage}`
            )
          } else {
            alert(
              `Error sending room invite (Status: ${errorStatus}):\n\n${errorMessage}\n\n` +
              `Make sure:\n` +
              `1. Email server is running (npm run email-server)\n` +
              `2. Gmail settings in .env are correct\n`
            )
          }
        } else {
          // Production hints
          alert(
            `Error sending room invite (Status: ${errorStatus}):\n\n${errorMessage}\n\n` +
            `If this keeps happening, check the Vercel function logs for /api/send-invite-email.`
          )
        }

        throw new Error(errorMessage)
      }

      // Check if invite already exists before creating
      const { data: existingInvite, error: checkError } = await supabase
        .from('room_invites')
        .select('id, status, expires_at')
        .eq('room_id', roomId)
        .eq('invitee_email', inviteEmail.trim())
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        throw checkError
      }

      if (existingInvite) {
        // Invite already exists
        if (existingInvite.status === 'pending') {
          // Check if expired
          const isExpired = existingInvite.expires_at && new Date(existingInvite.expires_at) < new Date()
          
          if (isExpired) {
            // Update expired invite
            const { error: updateError } = await supabase
              .from('room_invites')
              .update({
                status: 'pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                inviter_id: user.id
              })
              .eq('id', existingInvite.id)

            if (updateError) throw updateError
          } else {
            // Invite is still pending and valid
            inviteState.setSuccess(`Invitation already sent to ${inviteEmail.trim()}! (Still pending)`)
            setInviteEmail('')
            setInvitingRoomId(null)
            setError('')
            return
          }
        } else {
          // Accepted/rejected - update to resend
          const { error: updateError } = await supabase
            .from('room_invites')
            .update({
              status: 'pending',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              inviter_id: user.id
            })
            .eq('id', existingInvite.id)

          if (updateError) throw updateError
        }
      } else {
        // Create new invite record only if email succeeded
        const { error: inviteError } = await supabase
          .from('room_invites')
          .insert([{
            room_id: roomId,
            inviter_id: user.id,
            invitee_email: inviteEmail.trim(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          }])

        if (inviteError) {
          // Handle duplicate key error specifically
          if (inviteError.code === '23505' || inviteError.message.includes('duplicate key')) {
            inviteState.setError(`${inviteEmail.trim()} has already been invited to this room!`)
            setError(`${inviteEmail.trim()} has already been invited to this room!`)
            return
          }
          throw inviteError
        }
      }

      // Success! Show message and keep form open briefly so user can see success
      inviteState.setSuccess(`Invitation sent to ${inviteEmail.trim()}!`)
      setError('')
      
      // Clear email and close form after a short delay so success message is visible
      setTimeout(() => {
        setInviteEmail('')
        setInvitingRoomId(null)
      }, 2000) // 2 seconds to see success message
      
      console.log('✅ Room invite sent successfully to:', inviteEmail.trim())
    } catch (err) {
      console.error('❌ Error sending room invite:', err)
      const errorMsg = err.message || 'Failed to send invitation'
      setError(errorMsg)
      inviteState.setError(errorMsg)
      // Don't close form on error so user can see the error message
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
          className="btn-purple btn-sm"
          style={{ marginBottom: '2rem' }}
        >
          ← Back
        </button>

        <h1 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
          Group Rooms
        </h1>

        {createRoomState.message && (
          <div className={createRoomState.isSuccess ? 'success-box mb-4' : 'error-box mb-4'}>
            {createRoomState.message}
          </div>
        )}
        {error && !createRoomState.message && (
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
              disabled={createRoomState.isLoading}
              className={`btn-primary btn-md ${createRoomState.isSuccess ? 'btn-success-state' : ''} ${createRoomState.isError ? 'btn-error-state' : ''} ${createRoomState.isLoading ? 'btn-loading' : ''}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {createRoomState.isLoading ? 'Creating...' : createRoomState.isSuccess ? 'Created!' : 'Create'}
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
                  <div className="flex flex-col gap-2" style={{ marginTop: '1rem' }}>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      <input
                        type="email"
                        placeholder="Enter email to invite"
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value)
                          inviteState.reset()
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && !inviteState.isLoading && sendRoomInvite(room.id)}
                        style={{
                          flex: 1,
                          minWidth: '200px',
                          borderRadius: '12px',
                          border: inviteState.isError ? '2px solid var(--error-red)' : '2px solid #E8E8E8',
                          padding: '0.875rem 1.25rem',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-body)',
                          backgroundColor: 'white'
                        }}
                      />
                      <button
                        onClick={() => sendRoomInvite(room.id)}
                        disabled={inviteState.isLoading}
                        className={`btn-success btn-md ${inviteState.isSuccess ? 'btn-success-state' : ''} ${inviteState.isError ? 'btn-error-state' : ''} ${inviteState.isLoading ? 'btn-loading' : ''}`}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {inviteState.isLoading ? 'Sending...' : inviteState.isSuccess ? 'Sent!' : 'Send Invite'}
                      </button>
                      <button
                        onClick={() => {
                          setInvitingRoomId(null)
                          setInviteEmail('')
                          inviteState.reset()
                        }}
                        className="btn-secondary btn-md"
                      >
                        Cancel
                      </button>
                    </div>
                    {inviteState.message && (
                      <div className={inviteState.isSuccess ? 'success-box' : 'error-box'}>
                        {inviteState.message}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setInvitingRoomId(room.id)}
                    className="btn-purple btn-md"
                    style={{ width: '100%', marginTop: '1rem' }}
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
