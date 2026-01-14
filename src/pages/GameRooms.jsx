import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function GameRooms() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [myRooms, setMyRooms] = useState([])
  const [roomCode, setRoomCode] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newRoomCode, setNewRoomCode] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)

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

        if (roomsError) throw roomsError
        setMyRooms(roomsData || [])
      } else {
        setMyRooms([])
      }

      // Get rooms I created
      const { data: createdRooms, error: createdError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('creator_id', user.id)

      if (createdError) throw createdError
      setRooms(createdRooms || [])
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
      
      // Generate room code using Supabase function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_room_code')

      if (codeError) {
        // Fallback if function doesn't exist
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        const { data, error: insertError } = await supabase
          .from('game_rooms')
          .insert([
            {
              creator_id: user.id,
              name: newRoomName.trim(),
              room_code: code
            }
          ])
          .select()
          .single()

        if (insertError) throw insertError

        // Add creator as member
        await supabase
          .from('room_members')
          .insert([{ room_id: data.id, user_id: user.id }])

        // Show the room code
        setNewRoomCode(code)
        setShowCodeModal(true)
        setNewRoomName('')
        loadRooms()
      } else {
        const { data, error: insertError } = await supabase
          .from('game_rooms')
          .insert([
            {
              creator_id: user.id,
              name: newRoomName.trim(),
              room_code: codeData
            }
          ])
          .select()
          .single()

        if (insertError) throw insertError

        await supabase
          .from('room_members')
          .insert([{ room_id: data.id, user_id: user.id }])

        // Show the room code
        setNewRoomCode(codeData)
        setShowCodeModal(true)
        setNewRoomName('')
        loadRooms()
      }
    } catch (err) {
      console.error('Error creating room:', err)
      setError(err.message || 'Failed to create room')
    }
  }

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    try {
      setError('')
      
      // Find room by code
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.trim().toUpperCase())
        .single()

      if (roomError || !roomData) {
        setError('Room not found')
        return
      }

      // Check if already a member
      const { data: existing, error: checkError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        setError('You are already a member of this room')
        return
      }

      // Join room
      const { error: joinError } = await supabase
        .from('room_members')
        .insert([{ room_id: roomData.id, user_id: user.id }])

      if (joinError) throw joinError

      setRoomCode('')
      loadRooms()
    } catch (err) {
      console.error('Error joining room:', err)
      setError(err.message || 'Failed to join room')
    }
  }

  const leaveRoom = async (roomId) => {
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
          Game Rooms
        </h1>

        {error && (
          <div className="error-box mb-4">
            {error}
          </div>
        )}

        {/* Create Room */}
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Create Room</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem'
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

        {/* Join Room */}
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Join Room</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem',
                textTransform: 'uppercase'
              }}
            />
            <button
              onClick={joinRoom}
              style={{
                backgroundColor: 'var(--pastel-blue)',
                color: 'var(--text-dark)',
                borderRadius: '12px',
                padding: '0.875rem 1.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Join
            </button>
          </div>
        </div>

        {/* Rooms I Created */}
        {rooms.length > 0 && (
          <div className="card mb-6" style={{ borderRadius: '24px' }}>
            <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Rooms I Created</h2>
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--pastel-yellow)',
                    borderRadius: '16px',
                    border: '2px solid var(--pastel-pink)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 style={{ fontWeight: '600', fontSize: '1.2rem', margin: 0 }}>
                      {room.name || 'Unnamed Room'}
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(room.room_code)
                        alert('Room code copied to clipboard!')
                      }}
                      style={{
                        backgroundColor: 'var(--pastel-pink)',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Copy Code
                    </button>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    textAlign: 'center',
                    marginTop: '0.75rem'
                  }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem', margin: 0 }}>
                      Share this code with friends:
                    </p>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      letterSpacing: '0.3rem',
                      color: 'var(--text-dark)',
                      margin: 0
                    }}>
                      {room.room_code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Rooms */}
        <div className="card" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Rooms I Joined</h2>
          {myRooms.filter(room => !rooms.find(r => r.id === room.id)).length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
              You haven't joined any rooms yet. Create or join a room to get started!
            </p>
          ) : (
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              {myRooms.filter(room => !rooms.find(r => r.id === room.id)).map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#F9F9F9',
                    borderRadius: '12px'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {room.name || 'Unnamed Room'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      Code: <strong>{room.room_code}</strong>
                    </p>
                  </div>
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Room Code Modal */}
      {showCodeModal && (
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
              onClick={() => setShowCodeModal(false)}
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
              Room Created
            </h2>

            <p style={{ fontSize: '1rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Share this code with your friends so they can join:
            </p>

            <div style={{
              padding: '2rem',
              backgroundColor: 'var(--pastel-yellow)',
              borderRadius: '16px',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                Room Code
              </p>
              <div style={{
                fontSize: '3rem',
                fontWeight: '700',
                fontFamily: 'monospace',
                letterSpacing: '0.5rem',
                color: 'var(--text-dark)',
                marginBottom: '1rem'
              }}>
                {newRoomCode}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newRoomCode)
                  alert('Room code copied to clipboard!')
                }}
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
                Copy Code
              </button>
            </div>

            <button
              onClick={() => setShowCodeModal(false)}
              style={{
                width: '100%',
                backgroundColor: 'var(--pastel-blue)',
                color: 'var(--text-dark)',
                borderRadius: '12px',
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameRooms
