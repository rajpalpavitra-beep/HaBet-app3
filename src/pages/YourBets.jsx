import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function YourBets() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingBet, setEditingBet] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    goal: '',
    stake: '',
    start_date: '',
    target_date: ''
  })
  const [friends, setFriends] = useState([])
  const [selectedFriends, setSelectedFriends] = useState([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [currentAccountableFriends, setCurrentAccountableFriends] = useState([])

  useEffect(() => {
    if (user) {
      loadBets()
    }
  }, [user])

  const loadBets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setBets(data || [])
    } catch (err) {
      console.error('Error loading bets:', err)
    } finally {
      setLoading(false)
    }
  }

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

      const friendIds = (data || []).map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      if (friendIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nickname, emoji_avatar, email')
          .in('id', friendIds)

        if (profilesError) {
          console.error('Error loading profiles:', profilesError)
          throw profilesError
        }

        const friendsWithProfiles = (data || []).map(f => {
          const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
          const profile = (profiles || []).find(p => p.id === friendId)
          return {
            ...f,
            friendId: friendId,
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

  const loadAccountableFriends = async (betId) => {
    try {
      const { data, error } = await supabase
        .from('bet_accountability')
        .select('friend_id')
        .eq('bet_id', betId)

      if (error) throw error
      const friendIds = (data || []).map(af => af.friend_id)
      setCurrentAccountableFriends(friendIds)
      setSelectedFriends(friendIds)
    } catch (err) {
      console.error('Error loading accountable friends:', err)
    }
  }

  const toggleFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId))
    } else {
      setSelectedFriends([...selectedFriends, friendId])
    }
  }

  const handleEdit = async (bet) => {
    setEditingBet(bet.id)
    setEditForm({
      title: bet.title || '',
      goal: bet.goal || '',
      stake: bet.stake || '',
      start_date: bet.start_date || '',
      target_date: bet.target_date || ''
    })
    // Load friends and current accountable friends
    await loadFriends()
    await loadAccountableFriends(bet.id)
  }

  const handleSaveEdit = async () => {
    try {
      // Update bet details
      const { error } = await supabase
        .from('bets')
        .update({
          title: editForm.title.trim(),
          goal: editForm.goal.trim(),
          stake: editForm.stake.trim(),
          start_date: editForm.start_date,
          target_date: editForm.target_date,
          verification_required: selectedFriends.length > 0
        })
        .eq('id', editingBet)

      if (error) throw error

      // Update accountable friends
      // First, remove old accountable friends
      const { error: deleteError } = await supabase
        .from('bet_accountability')
        .delete()
        .eq('bet_id', editingBet)

      if (deleteError) throw deleteError

      // Then, add new accountable friends
      if (selectedFriends.length > 0) {
        const accountabilityRecords = selectedFriends.map(friendId => ({
          bet_id: editingBet,
          friend_id: friendId
        }))

        const { error: insertError } = await supabase
          .from('bet_accountability')
          .insert(accountabilityRecords)

        if (insertError) throw insertError
      }

      setEditingBet(null)
      setSelectedFriends([])
      setCurrentAccountableFriends([])
      loadBets()
    } catch (err) {
      console.error('Error updating bet:', err)
      alert('Failed to update bet: ' + err.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingBet(null)
    setEditForm({
      title: '',
      goal: '',
      stake: '',
      start_date: '',
      target_date: ''
    })
    setSelectedFriends([])
    setCurrentAccountableFriends([])
  }

  const handleDelete = async (betId) => {
    if (!confirm('Are you sure you want to delete this bet? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', betId)

      if (error) throw error
      loadBets()
    } catch (err) {
      console.error('Error deleting bet:', err)
      alert('Failed to delete bet: ' + err.message)
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
          Your Bets 📊
        </h1>

        {bets.length === 0 ? (
          <div className="card" style={{ borderRadius: '24px', textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              No bets yet. Create your first bet to get started!
            </p>
            <button
              onClick={() => navigate('/create-bet')}
              style={{
                backgroundColor: 'var(--pastel-pink)',
                color: 'white',
                borderRadius: '12px',
                padding: '0.875rem 1.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Create Your First Bet
            </button>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: '1.5rem' }}>
            {bets.map((bet) => (
              <div key={bet.id} className="card" style={{ borderRadius: '24px' }}>
                {editingBet === bet.id ? (
                  <div className="flex flex-col" style={{ gap: '1.5rem' }}>
                    <h3 className="handwritten" style={{ fontSize: '1.5rem' }}>Edit Bet</h3>
                    
                    <div className="flex flex-col" style={{ gap: '0.75rem' }}>
                      <label className="handwritten" style={{ fontSize: '1.1rem' }}>Title *</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
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
                      <label className="handwritten" style={{ fontSize: '1.1rem' }}>Goal *</label>
                      <input
                        type="text"
                        value={editForm.goal}
                        onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
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
                      <label className="handwritten" style={{ fontSize: '1.1rem' }}>Stake *</label>
                      <input
                        type="text"
                        value={editForm.stake}
                        onChange={(e) => setEditForm({...editForm, stake: e.target.value})}
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
                        <label className="handwritten" style={{ fontSize: '1.1rem' }}>Start Date *</label>
                        <input
                          type="date"
                          value={editForm.start_date}
                          onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
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
                        <label className="handwritten" style={{ fontSize: '1.1rem' }}>End Date *</label>
                        <input
                          type="date"
                          value={editForm.target_date}
                          onChange={(e) => setEditForm({...editForm, target_date: e.target.value})}
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

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--pastel-mint)',
                          color: 'var(--text-dark)',
                          borderRadius: '12px',
                          padding: '0.875rem 1.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--pastel-pink)',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '0.875rem 1.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div style={{ flex: 1 }}>
                        <h3 className="handwritten" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                          {bet.title}
                        </h3>
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
                          fontWeight: '600'
                        }}>
                          {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(bet)}
                          style={{
                            backgroundColor: 'var(--pastel-blue)',
                            color: 'var(--text-dark)',
                            borderRadius: '10px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        {bet.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(bet.id)}
                            style={{
                              backgroundColor: 'var(--pastel-pink)',
                              color: 'white',
                              borderRadius: '10px',
                              padding: '0.5rem 1rem',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col" style={{ gap: '0.75rem', marginTop: '1rem' }}>
                      {bet.goal && (
                        <div>
                          <strong>Goal:</strong> {bet.goal}
                        </div>
                      )}
                      {bet.stake && (
                        <div>
                          <strong>Stake:</strong> {bet.stake}
                        </div>
                      )}
                      <div>
                        <strong>Dates:</strong> {
                          bet.start_date && bet.target_date
                            ? `${new Date(bet.start_date).toLocaleDateString()} - ${new Date(bet.target_date).toLocaleDateString()}`
                            : 'Not set'
                        }
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => navigate(`/bet/${bet.id}`)}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--pastel-pink)',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '0.875rem 1.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default YourBets
