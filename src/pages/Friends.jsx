import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function Friends() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [searchEmail, setSearchEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadFriends()
    }
  }, [user])

  const loadFriends = async () => {
    try {
      setLoading(true)
      
      // Get all friend relationships
      const { data: allFriends, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (friendsError) throw friendsError

      // Get all user profiles
      const friendIds = [
        ...new Set(
          (allFriends || [])
            .map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
        )
      ]

      let profilesMap = {}
      if (friendIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', friendIds)

        if (profilesError) throw profilesError
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p
          return acc
        }, {})
      }

      // Separate into categories
      const accepted = (allFriends || []).filter(f => f.status === 'accepted')
      const sent = (allFriends || []).filter(f => f.requester_id === user.id && f.status === 'pending')
      const received = (allFriends || []).filter(f => f.addressee_id === user.id && f.status === 'pending')

      // Attach profile data
      const friendsWithProfiles = accepted.map(f => ({
        ...f,
        requester: profilesMap[f.requester_id] || null,
        addressee: profilesMap[f.addressee_id] || null
      }))

      const sentWithProfiles = sent.map(f => ({
        ...f,
        addressee: profilesMap[f.addressee_id] || null
      }))

      const receivedWithProfiles = received.map(f => ({
        ...f,
        requester: profilesMap[f.requester_id] || null
      }))

      setFriends(friendsWithProfiles)
      setPendingRequests(sentWithProfiles)
      setReceivedRequests(receivedWithProfiles)
    } catch (err) {
      console.error('Error loading friends:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async () => {
    if (!searchEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      setError('')
      
      // Find user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', searchEmail.trim())
        .single()

      if (profileError || !profiles) {
        setError('User not found')
        return
      }

      if (profiles.id === user.id) {
        setError('You cannot add yourself')
        return
      }

      // Check if request already exists
      const { data: existing, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profiles.id}),and(requester_id.eq.${profiles.id},addressee_id.eq.${user.id})`)
        .single()

      if (existing) {
        setError('Friend request already exists')
        return
      }

      // Send friend request
      const { error: insertError } = await supabase
        .from('friends')
        .insert([
          {
            requester_id: user.id,
            addressee_id: profiles.id,
            status: 'pending'
          }
        ])

      if (insertError) throw insertError

      setSearchEmail('')
      loadFriends()
    } catch (err) {
      console.error('Error sending friend request:', err)
      setError(err.message || 'Failed to send friend request')
    }
  }

  const acceptRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (error) throw error
      loadFriends()
    } catch (err) {
      console.error('Error accepting request:', err)
      setError(err.message)
    }
  }

  const rejectRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'rejected' })
        .eq('id', requestId)

      if (error) throw error
      loadFriends()
    } catch (err) {
      console.error('Error rejecting request:', err)
      setError(err.message)
    }
  }

  const getFriendName = (friend) => {
    if (friend.requester_id === user.id) {
      return friend.addressee?.display_name || friend.addressee?.email || 'Unknown'
    }
    return friend.requester?.display_name || friend.requester?.email || 'Unknown'
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
          Friends 👥
        </h1>

        {error && (
          <div className="error-box mb-4">
            {error}
          </div>
        )}

        {/* Add Friend Section */}
        <div className="card mb-6" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Add Friend</h2>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Enter email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem'
              }}
            />
            <button
              onClick={sendFriendRequest}
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
              Send Request
            </button>
          </div>
        </div>

        {/* Received Requests */}
        {receivedRequests.length > 0 && (
          <div className="card mb-6" style={{ borderRadius: '24px' }}>
            <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Friend Requests</h2>
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              {receivedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#F9F9F9',
                    borderRadius: '12px'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {request.requester?.display_name || request.requester?.email}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {request.requester?.email}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => acceptRequest(request.id)}
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
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(request.id)}
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
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests Sent */}
        {pendingRequests.length > 0 && (
          <div className="card mb-6" style={{ borderRadius: '24px' }}>
            <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>Pending Requests</h2>
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#F9F9F9',
                    borderRadius: '12px'
                  }}
                >
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {request.addressee?.display_name || request.addressee?.email}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    Waiting for response...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="card" style={{ borderRadius: '24px' }}>
          <h2 className="handwritten mb-3" style={{ fontSize: '1.8rem' }}>My Friends</h2>
          {friends.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
              No friends yet. Send a friend request to get started!
            </p>
          ) : (
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#F9F9F9',
                    borderRadius: '12px'
                  }}
                >
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {getFriendName(friend)}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {friend.requester_id === user.id 
                      ? friend.addressee?.email 
                      : friend.requester?.email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Friends
