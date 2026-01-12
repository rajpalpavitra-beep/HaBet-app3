import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

function CreateBet({ onBetCreated, onCancel }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!title.trim() || !description.trim() || !targetDate) {
      setError('Please fill in all fields')
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
            description: description.trim(),
            target_date: targetDate,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      setTitle('')
      setDescription('')
      setTargetDate('')
      onBetCreated()
    } catch (err) {
      console.error('Error creating bet:', err)
      setError(err.message || 'Failed to create bet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="mb-3">Create New Bet</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Bet Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Bet Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          required
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          required
        />
        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Bet'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateBet
