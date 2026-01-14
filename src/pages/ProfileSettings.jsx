import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const AVATAR_COLORS = [
  { bg: '#FFB3BA', text: '#4A4A4A' }, // Pastel Pink
  { bg: '#BAE1FF', text: '#4A4A4A' }, // Pastel Blue
  { bg: '#FFFACD', text: '#4A4A4A' }, // Pastel Yellow
  { bg: '#E6D7F0', text: '#4A4A4A' }, // Pastel Lavender
  { bg: '#D4A5F5', text: 'white' }, // Pastel Purple
  { bg: '#B3E5D0', text: '#4A4A4A' }, // Pastel Mint
  { bg: '#FFD4A3', text: '#4A4A4A' }, // Pastel Peach
  { bg: '#C7CEEA', text: '#4A4A4A' }, // Pastel Periwinkle
  { bg: '#FFB6C1', text: '#4A4A4A' }, // Light Pink
  { bg: '#E0BBE4', text: '#4A4A4A' }, // Lavender
]

function ProfileSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [avatarColor, setAvatarColor] = useState(0)
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
        // Get avatar color index from emoji_avatar if it exists, otherwise default to 0
        const colorIndex = data.avatar_color_index !== undefined ? data.avatar_color_index : 0
        setAvatarColor(colorIndex)
      } else {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            nickname: '',
            avatar_color_index: 0
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
          avatar_color_index: avatarColor,
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
            Profile Settings
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
            {/* Avatar Color Selection */}
            <div className="flex flex-col" style={{ gap: '1rem' }}>
              <label className="handwritten" style={{ fontSize: '1.3rem' }}>
                Choose Your Avatar Color
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#F9F9F9',
                borderRadius: '12px'
              }}>
                {AVATAR_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatarColor(index)}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      border: avatarColor === index ? '3px solid var(--pastel-pink)' : '2px solid #E8E8E8',
                      backgroundColor: color.bg,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: color.text
                    }}
                    onMouseEnter={(e) => {
                      if (avatarColor !== index) {
                        e.target.style.transform = 'scale(1.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
                  >
                    {(nickname || user?.email || 'U').charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: AVATAR_COLORS[avatarColor].bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: 'bold',
                color: AVATAR_COLORS[avatarColor].text,
                margin: '0 auto',
                border: '3px solid var(--pastel-pink)'
              }}>
                {(nickname || user?.email || 'U').charAt(0).toUpperCase()}
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
