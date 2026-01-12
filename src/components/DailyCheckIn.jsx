import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'

function DailyCheckIn() {
  const { user } = useAuth()
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (user) {
      checkTodayStatus()
      loadStreak()
    }
  }, [user])

  const checkTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setCheckedInToday(!!data)
    } catch (err) {
      console.error('Error checking status:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('checkin_date')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setStreak(0)
        return
      }

      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < data.length; i++) {
        const checkinDate = new Date(data[i].checkin_date)
        checkinDate.setHours(0, 0, 0, 0)
        
        const expectedDate = new Date(today)
        expectedDate.setDate(today.getDate() - i)

        if (checkinDate.getTime() === expectedDate.getTime()) {
          currentStreak++
        } else {
          break
        }
      }

      setStreak(currentStreak)
    } catch (err) {
      console.error('Error loading streak:', err)
    }
  }

  const handleCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase
        .from('daily_checkins')
        .insert([
          {
            user_id: user.id,
            checkin_date: today
          }
        ])

      if (error) throw error

      setCheckedInToday(true)
      loadStreak()
    } catch (err) {
      console.error('Error checking in:', err)
      alert('Failed to check in: ' + err.message)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="card mb-4" style={{ backgroundColor: 'var(--pastel-yellow)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3>Daily Check-In</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Current Streak: {streak} days
          </p>
        </div>
        {checkedInToday ? (
          <div className="text-center">
            <p style={{ fontWeight: '600', color: 'var(--text-dark)' }}>✓ Checked In Today</p>
          </div>
        ) : (
          <button className="btn-success" onClick={handleCheckIn}>
            Check In
          </button>
        )}
      </div>
    </div>
  )
}

export default DailyCheckIn
