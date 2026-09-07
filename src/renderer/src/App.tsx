import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

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

          {/*
            Temporary landing rule. Once authentication exists this becomes
            a check: no profile -> first launch, profile but no session ->
            /login, active session -> /patients.
          */}
          <Route path="*" element={<Navigate to="/patients" replace />} />
        </Routes>
      </HashRouter>
    </MantineProvider>
  )
}

export default App
