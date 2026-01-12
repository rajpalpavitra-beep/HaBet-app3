import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const EMOJI_OPTIONS = ['👤', '😊', '🎯', '🚀', '⭐', '🔥', '💪', '🎨', '🌈', '🌟', '🎪', '🎭', '🤖', '🦄', '🐱', '🐶', '🦁', '🐼', '🐨', '🦊']

function ProfileSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [emoji, setEmoji] = useState('👤')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setNickname(data.nickname || '')
        setEmoji(data.emoji_avatar || '👤')
      } else {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            nickname: '',
            emoji_avatar: '👤'
          }])

        if (insertError) throw insertError
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          nickname: nickname.trim(),
          emoji_avatar: emoji,
          updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError

      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
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

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '24px' }}>
          <h1 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
            Profile Settings 👤
          </h1>

          {error && (
            <div className="error-box mb-4">
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: 'var(--pastel-mint)',
              borderLeft: '4px solid #4CAF50',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              color: '#2E7D32',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              {success}
            </div>
          )}

          <div className="flex flex-col" style={{ gap: '2rem' }}>
            {/* Emoji Avatar Selection */}
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              <label className="handwritten" style={{ fontSize: '1.3rem' }}>
                Choose Your Avatar
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#F9F9F9',
                borderRadius: '12px'
              }}>
                {EMOJI_OPTIONS.map((emojiOption) => (
                  <button
                    key={emojiOption}
                    type="button"
                    onClick={() => setEmoji(emojiOption)}
                    style={{
                      fontSize: '2.5rem',
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      border: emoji === emojiOption ? '3px solid var(--pastel-pink)' : '2px solid #E8E8E8',
                      backgroundColor: emoji === emojiOption ? '#FFF' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (emoji !== emojiOption) {
                        e.target.style.transform = 'scale(1.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
                  >
                    {emojiOption}
                  </button>
                ))}
              </div>
              <div style={{
                fontSize: '3rem',
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#F9F9F9',
                borderRadius: '12px'
              }}>
                {emoji}
              </div>
            </div>

            {/* Nickname Input */}
            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.3rem' }}>
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={20}
                style={{
                  borderRadius: '12px',
                  border: '2px solid #E8E8E8',
                  padding: '0.875rem 1.25rem',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-handwritten)',
                  backgroundColor: 'white'
                }}
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                This will be displayed on your profile and in bets
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: 'var(--pastel-pink)',
                color: 'white',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1.05rem',
                fontWeight: '600',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                marginTop: '1rem'
              }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings
