// Utility hook for button states (success/error/loading)
import { useState } from 'react'

export function useButtonState() {
  const [state, setState] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  const setLoading = () => {
    setState('loading')
    setMessage('')
  }

  const setSuccess = (msg = 'Success!') => {
    setState('success')
    setMessage(msg)
    setTimeout(() => {
      setState('idle')
      setMessage('')
    }, 3000) // Reset after 3 seconds
  }

  const setError = (msg) => {
    setState('error')
    setMessage(msg)
  }

  const reset = () => {
    setState('idle')
    setMessage('')
  }

  return {
    state,
    message,
    setLoading,
    setSuccess,
    setError,
    reset,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error'
  }
}
