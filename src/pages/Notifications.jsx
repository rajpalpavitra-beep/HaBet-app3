import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotifications()
      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            loadNotifications()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          bet:bets(id, title, goal),
          related_user:profiles!notifications_related_user_id_fkey(id, nickname, emoji_avatar, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading notifications:', error)
        setNotifications([])
        setUnreadCount(0)
        return
      }
      
      const notificationsList = (data || []).filter(n => n && n.id) // Filter out any null/invalid entries
      setNotifications(notificationsList)
      setUnreadCount(notificationsList.filter(n => n.read === false).length)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      loadNotifications()
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      loadNotifications()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'check_in':
        return '📝'
      case 'verification_request':
        return '⏳'
      case 'verification_complete':
        return '✓'
      case 'bet_complete':
        return '🎉'
      default:
        return '🔔'
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.bet_id) {
      navigate(`/bet/${notification.bet_id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2 className="handwritten">Loading notifications...</h2>
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

        <div className="flex items-center justify-between mb-4">
          <h1 className="handwritten" style={{ fontSize: '2.5rem', margin: 0 }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                backgroundColor: 'var(--pastel-blue)',
                color: 'white',
                borderRadius: '10px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Mark All Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="card" style={{ borderRadius: '24px', textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔔</div>
            <h2 className="handwritten" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              No notifications yet
            </h2>
            <p style={{ color: 'var(--text-light)' }}>
              You'll see notifications here when friends check in or verify your bets!
            </p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: '1rem' }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '1.5rem',
                  backgroundColor: notification.read ? 'white' : '#F0F8FF',
                  borderRadius: '16px',
                  border: notification.read ? '2px solid #E8E8E8' : '2px solid var(--pastel-blue)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  flexShrink: 0
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="handwritten" style={{ 
                      fontSize: '1.2rem', 
                      margin: 0,
                      fontWeight: notification.read ? '400' : '600',
                      color: notification.read ? 'var(--text-dark)' : 'var(--text-dark)'
                    }}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--pastel-blue)',
                        display: 'inline-block'
                      }}></span>
                    )}
                  </div>
                  <p style={{ 
                    fontSize: '0.95rem', 
                    color: 'var(--text-light)',
                    margin: '0.5rem 0'
                  }}>
                    {notification.message}
                  </p>
                  {notification.bet && (
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--pastel-purple)',
                      margin: '0.25rem 0 0 0',
                      fontWeight: '500'
                    }}>
                      Bet: {notification.bet.title}
                    </p>
                  )}
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-light)',
                    margin: '0.5rem 0 0 0'
                  }}>
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
