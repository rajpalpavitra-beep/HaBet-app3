import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function CreateBet() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dailyGoal, setDailyGoal] = useState('10k steps')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!title.trim() || !startDate || !endDate || !dailyGoal.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from('bets')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || '',
            target_date: endDate,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      navigate('/')
    } catch (err) {
      console.error('Error creating bet:', err)
      setError(err.message || 'Failed to create bet')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
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

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '24px' }}>
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
                placeholder="I week treat in cafe"
              />
            </div>

            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                style={{
                  borderRadius: '12px',
                  border: '2px solid #E8E8E8',
                  padding: '0.875rem 1.25rem',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-handwritten)',
                  backgroundColor: 'white',
                  resize: 'vertical',
                  width: '100%'
                }}
                placeholder="More details about the bet..."
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

            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              <label className="handwritten" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Daily Goal *
              </label>
              <input
                type="text"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                required
                style={{
                  borderRadius: '12px',
                  border: '2px solid #E8E8E8',
                  padding: '0.875rem 1.25rem',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-handwritten)',
                  backgroundColor: '#F5F5F5',
                  width: '100%'
                }}
                placeholder="10k steps"
              />
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
