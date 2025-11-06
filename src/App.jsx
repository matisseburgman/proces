import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Auth from './components/Auth'
import TasksPage from './pages/TasksPage' 
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1">
          <Auth />
        </div>
        <footer className="bg-footer-bg text-footer-text p-4 text-center border-t border-border">
          <p>I am a 🦍</p>
        </footer>
      </div>
    )
  }

  // Use TasksPage component
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1">
        <TasksPage session={session} />
      </div>
      <footer className="bg-footer-bg text-footer-text p-4 text-center border-t border-border">
        <p>I am a 🦍</p>
      </footer>
    </div>
  )
}

export default App