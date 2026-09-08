import { useEffect, useState } from 'react'
import { MantineProvider, Center, Loader } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'

import LoginPage from './pages/LoginPage'
import CreateUserPage from './pages/onboarding/CreateUserPage'
import RecoveryKeyPage from './pages/onboarding/RecoveryKeyPage'
import RestorePage from './pages/onboarding/RestorePage'

import PatientsPage from './pages/PatientsPage'
import SessionsPage from './pages/SessionsPage'
import ProgramsPage from './pages/ProgramsPage'
import ReportsPage from './pages/ReportsPage'

/**
 * Decides the landing screen on launch, and returns to login when the
 * twelve-hour session expires.
 */
function Bootstrap(): React.JSX.Element {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    window.api.auth
      .startupState()
      .then((state) => {
        if (cancelled) return
        navigate(state === 'first-launch' ? '/onboarding/create-user' : '/login', {
          replace: true
        })
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    const unsubscribe = window.api.auth.onSessionExpired(() => {
      navigate('/login', { replace: true })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [navigate])

  if (!ready) {
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    )
  }

  return <Navigate to="/login" replace />
}

function App(): React.JSX.Element {
  return (
    <MantineProvider defaultColorScheme="light">
      <Notifications position="top-right" />

      {/*
        HashRouter, not BrowserRouter. The packaged application loads from
        file://, where path-based routing has no server to resolve it.
      */}
      <HashRouter>
        <Routes>
          {/* Authentication and onboarding — no sidebar */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding/create-user" element={<CreateUserPage />} />
            <Route path="/onboarding/recovery-key" element={<RecoveryKeyPage />} />
            <Route path="/onboarding/restore" element={<RestorePage />} />
          </Route>

          {/* Main application — fixed sidebar */}
          <Route element={<AppLayout />}>
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route path="*" element={<Bootstrap />} />
        </Routes>
      </HashRouter>
    </MantineProvider>
  )
}

export default App
