import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  const [error, setError] = useState('')
  const [supabaseConfigured, setSupabaseConfigured] = useState(true)

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key || url === '' || key === '') {
      setSupabaseConfigured(false)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const result = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password)
    
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="bg-gradient-login flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
          <h1 className="text-center handwritten">Setup Required</h1>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            Please configure your Supabase credentials in the <code>.env</code> file:
          </p>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginTop: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <div>VITE_SUPABASE_URL=your-project-url</div>
            <div style={{ marginTop: '0.5rem' }}>VITE_SUPABASE_ANON_KEY=your-anon-key</div>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-light)' }}>
            After adding your credentials, restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-login flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', borderRadius: '24px' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="handwritten" style={{ fontSize: '2.5rem', margin: 0 }}>HaBet</h1>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#FF6B6B" stroke="#fff" strokeWidth="2"/>
              <circle cx="16" cy="16" r="8" fill="#4A90E2" stroke="#fff" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="3" fill="#fff"/>
            </svg>
          </div>
        </div>
        <p className="text-center" style={{ fontSize: '1rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          Bet on your habits, keep it real!
        </p>
        
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '1.5rem' }}>
          <div className="flex flex-col" style={{ gap: '0.5rem' }}>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: '500', marginBottom: '0.25rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                borderRadius: '12px',
                border: '2px solid #E8E8E8',
                padding: '0.875rem 1.25rem',
                fontSize: '1rem',
                backgroundColor: email ? '#F5F5F5' : 'white',
                width: '100%'
              }}
            />
          </div>

          <div className="flex flex-col" style={{ gap: '0.5rem' }}>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: '500', marginBottom: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <button 
            type="submit" 
            style={{
              backgroundColor: 'var(--pastel-pink)',
              color: 'white',
              borderRadius: '12px',
              padding: '1rem 1.75rem',
              fontSize: '1.05rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '0.5rem',
              width: '100%'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <p className="text-center" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <span
                  onClick={() => {
                    setIsSignUp(false)
                    setError('')
                  }}
                  style={{
                    color: '#FF6B6B',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Sign In
                </span>
              </>
            ) : (
              <>
                Need an account?{' '}
                <span
                  onClick={() => {
                    setIsSignUp(true)
                    setError('')
                  }}
                  style={{
                    color: '#FF6B6B',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Sign Up
                </span>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
