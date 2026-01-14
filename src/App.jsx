import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BetDetail from './pages/BetDetail'
import Leaderboard from './pages/Leaderboard'
import CreateBet from './pages/CreateBet'
import Friends from './pages/Friends'
import GameRooms from './pages/GameRooms'
import ProfileSettings from './pages/ProfileSettings'
import YourBets from './pages/YourBets'
import Notifications from './pages/Notifications'
import RoomDashboard from './pages/RoomDashboard'
import RoomCreateBet from './pages/RoomCreateBet'
import RoomLeaderboard from './pages/RoomLeaderboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bet/:id"
          element={
            <ProtectedRoute>
              <BetDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-bet"
          element={
            <ProtectedRoute>
              <CreateBet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <GameRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/your-bets"
          element={
            <ProtectedRoute>
              <YourBets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:id"
          element={
            <ProtectedRoute>
              <RoomDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:id/create-bet"
          element={
            <ProtectedRoute>
              <RoomCreateBet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:id/leaderboard"
          element={
            <ProtectedRoute>
              <RoomLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

