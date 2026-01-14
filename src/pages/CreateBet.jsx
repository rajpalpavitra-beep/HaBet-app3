import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function CreateBet() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [stake, setStake] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedFriends, setSelectedFriends] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadFriends()
    }
  }, [user])

  const loadFriends = async () => {
    try {
      setLoadingFriends(true)
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          requester:profiles!friends_requester_id_fkey(id, nickname, emoji_avatar, email),
          addressee:profiles!friends_addressee_id_fkey(id, nickname, emoji_avatar, email)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (error) {
        console.error('Error loading friends:', error)
        throw error
      }

      console.log('Friends loaded:', data)

      // Get friend profiles
      const friendIds = (data || []).map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      console.log('Friend IDs:', friendIds)

      if (friendIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nickname, emoji_avatar, email')
          .in('id', friendIds)

        if (profilesError) {
          console.error('Error loading profiles:', profilesError)
          throw profilesError
        }

        console.log('Profiles loaded:', profiles)

        const friendsWithProfiles = (data || []).map(f => {
          const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
          const profile = (profiles || []).find(p => p.id === friendId)
          return {
            ...f,
            friendId: friendId,
            friendProfile: profile
          }
        })

        console.log('Friends with profiles:', friendsWithProfiles)
        setFriends(friendsWithProfiles)
      } else {
        setFriends([])
      }
    } catch (err) {
      console.error('Error loading friends:', err)
      setError('Failed to load friends: ' + err.message)
    } finally {
      setLoadingFriends(false)
    }
  }

  const toggleFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId))
    } else {
      setSelectedFriends([...selectedFriends, friendId])
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
      
      // Create bet
      const { data: betData, error: insertError } = await supabase
        .from('bets')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            description: '',
            goal: goal.trim(),
            stake: stake.trim(),
            start_date: startDate,
            target_date: endDate,
            status: 'pending',
            verification_required: selectedFriends.length > 0
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Add accountable friends if any selected
      if (selectedFriends.length > 0) {
        console.log('Adding accountable friends:', selectedFriends)
        const accountabilityRecords = selectedFriends.map(friendId => ({
          bet_id: betData.id,
          friend_id: friendId
        }))

        console.log('Accountability records to insert:', accountabilityRecords)

        const { data: accountabilityData, error: accountabilityError } = await supabase
          .from('bet_accountability')
          .insert(accountabilityRecords)
          .select()

        if (accountabilityError) {
          console.error('Error adding accountable friends:', accountabilityError)
          throw accountabilityError
        }
        
        console.log('Accountable friends added successfully:', accountabilityData)
      }

      navigate('/')
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

        <div className="card" style={{ maxWidth: '700px', margin: '0 auto', borderRadius: '24px' }}>
          <h1 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Create New Bet
          </h1>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '1.75rem' }}>
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
                placeholder="e.g., Exercise every day"
              />
            </div>

            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Set a Goal *
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
                placeholder="e.g., 10k steps daily, No social media, Read 30 min"
              />
            </div>

            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Set a Stake *
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
                placeholder="e.g., $50, Buy coffee for team, No dessert for a week"
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

            {/* Accountable Friends */}
            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Who Should Hold You Accountable?
              </label>
              {loadingFriends ? (
                <p style={{ color: 'var(--text-light)' }}>Loading friends...</p>
              ) : friends.length === 0 ? (
                <p style={{ color: 'var(--text-light)', padding: '1rem', backgroundColor: '#F9F9F9', borderRadius: '12px' }}>
                  No friends yet. Add friends to hold you accountable!
                </p>
              ) : (
                <div style={{ position: 'relative' }}>
                  <select
                    multiple
                    value={selectedFriends}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                      setSelectedFriends(selected)
                    }}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      borderRadius: '12px',
                      border: '2px solid #E8E8E8',
                      padding: '0.875rem 1.25rem',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-handwritten)',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      paddingRight: '3rem'
                    }}
                  >
                    {friends.map((friend) => {
                      const friendId = friend.friendId || (friend.requester_id === user.id ? friend.addressee_id : friend.requester_id)
                      const profile = friend.friendProfile
                      const displayName = profile?.nickname || profile?.email?.split('@')[0] || 'Friend'
                      
                      return (
                        <option
                          key={friendId}
                          value={friendId}
                          style={{
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontFamily: 'var(--font-handwritten)'
                          }}
                        >
                          {profile?.emoji_avatar || '👤'} {displayName}
                        </option>
                      )
                    })}
                  </select>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-light)',
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple friends
                  </p>
                  {selectedFriends.length > 0 && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#F9F9F9',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      color: 'var(--text-dark)'
                    }}>
                      <strong>Selected ({selectedFriends.length}):</strong>{' '}
                      {selectedFriends.map((friendId, index) => {
                        const friend = friends.find(f => {
                          const id = f.friendId || (f.requester_id === user.id ? f.addressee_id : f.requester_id)
                          return id === friendId
                        })
                        const profile = friend?.friendProfile
                        const displayName = profile?.nickname || profile?.email?.split('@')[0] || 'Friend'
                        return (
                          <span key={friendId}>
                            {index > 0 && ', '}
                            {profile?.emoji_avatar || '👤'} {displayName}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: 'var(--pastel-pink)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  fontSize: '1.05rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  flex: 1
                }}
              >
                {loading ? 'Creating...' : 'Create Bet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateBet
