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

      if (error) throw error

      // Get friend profiles
      const friendIds = (data || []).map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      if (friendIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nickname, emoji_avatar, email')
          .in('id', friendIds)

        if (profilesError) throw profilesError

        const friendsWithProfiles = (data || []).map(f => {
          const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
          const profile = (profiles || []).find(p => p.id === friendId)
          return {
            ...f,
            friendProfile: profile
          }
        })

        setFriends(friendsWithProfiles)
      } else {
        setFriends([])
      }
    } catch (err) {
      console.error('Error loading friends:', err)
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
        const accountabilityRecords = selectedFriends.map(friendId => ({
          bet_id: betData.id,
          friend_id: friendId
        }))

        const { error: accountabilityError } = await supabase
          .from('bet_accountability')
          .insert(accountabilityRecords)

        if (accountabilityError) throw accountabilityError
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
            Create New Bet 🚀
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
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#F9F9F9',
                  borderRadius: '12px',
                  minHeight: '100px'
                }}>
                  {friends.map((friend) => {
                    const friendId = friend.requester_id === user.id ? friend.addressee_id : friend.requester_id
                    const profile = friend.friendProfile
                    const isSelected = selectedFriends.includes(friendId)
                    
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => toggleFriend(friendId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--pastel-pink)' : '2px solid #E8E8E8',
                          backgroundColor: isSelected ? '#FFF' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '1rem'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>
                          {profile?.emoji_avatar || '👤'}
                        </span>
                        <span>
                          {profile?.nickname || profile?.email?.split('@')[0] || 'Friend'}
                        </span>
                        {isSelected && <span>✓</span>}
                      </button>
                    )
                  })}
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
