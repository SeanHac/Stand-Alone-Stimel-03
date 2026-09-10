import { useEffect, useState } from 'react'
import { MantineProvider, Center, Loader, Alert } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './assets/app.css'

import { theme } from './theme'

import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'

import FirstLaunchPage from './pages/FirstLaunchPage'
import WelcomePage from './pages/WelcomePage'
import LoginPage from './pages/LoginPage'
import RecoveryPage from './pages/RecoveryPage'
import CreateUserPage from './pages/onboarding/CreateUserPage'
import RecoveryKeyPage from './pages/onboarding/RecoveryKeyPage'
import RestorePage from './pages/onboarding/RestorePage'

import PatientsPage from './pages/PatientsPage'
import SessionsPage from './pages/SessionsPage'
import ProgramsPage from './pages/ProgramsPage'
import ReportsPage from './pages/ReportsPage'

/**
 * Decides the landing screen on launch.
 *
 * No account on this computer -> first launch, offering sign-up or restore.
 * An account exists           -> welcome, offering sign in or recovery.
 *
 * A failure here is shown rather than guessed at: defaulting to the wrong
 * branch either hides sign-up from a new user or offers sign-in for an
 * account that does not exist.
 */
function Bootstrap(): React.JSX.Element {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    window.api.auth
      .startupState()
      .then((state) => {
        if (cancelled) return
        navigate(state === 'first-launch' ? '/first-launch' : '/welcome', { replace: true })
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Startup failed')
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (error) {
    return (
      <Center mih="100vh" p="xl">
        <Alert color="red" title="Could not start" maw={420}>
          {error}
        </Alert>
      </Center>
    )
  }

  return (
    <Center mih="100vh">
      <Loader />
    </Center>
  )
}

function App(): React.JSX.Element {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />

      {/*
        HashRouter, not BrowserRouter. The packaged application loads from
        file://, where path-based routing has no server to resolve it.
      */}
      <HashRouter>
        <Routes>
          {/* Authentication and onboarding — no sidebar */}
          <Route element={<AuthLayout />}>
            <Route path="/first-launch" element={<FirstLaunchPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recovery" element={<RecoveryPage />} />
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
