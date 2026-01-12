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
          Game Rooms 🎮
        </h1>

        {error && (
          <div className="error-box mb-4">
            {error}
          </div>
        )}

        {/* Create Room */}
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Create Room</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.75rem 1rem',
                fontSize: '1rem'
              }}
            />
            <button
              onClick={createRoom}
              style={{
                backgroundColor: 'var(--pastel-pink)',
                color: 'white',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Create
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Join Room</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.75rem 1rem',
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
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Join
            </button>
          </div>
        </div>

        {/* My Rooms */}
        <div className="card" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>My Rooms</h2>
          {myRooms.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
              You're not in any rooms yet. Create or join a room to get started!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {myRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '1rem',
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
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
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
    </div>
  )
}

export default GameRooms
