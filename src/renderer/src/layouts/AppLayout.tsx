import { useEffect } from 'react'
import { AppShell, NavLink, Title, Group, Button, Stack } from '@mantine/core'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import SessionBanner from '../components/SessionBanner'
import { notifications } from '@mantine/notifications'

const NAV_ITEMS = [
  { label: 'Patients', path: '/patients' },
  { label: 'Sessions', path: '/sessions' },
  { label: 'Programs', path: '/programs' },
  { label: 'Reports', path: '/reports' }
]

export default function AppLayout(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // The session decides what is reachable, not the URL. Without this a
    // stale hash or a direct navigation would show patient data with no
    // active session behind it.
    window.api.auth.sessionStatus().then((status) => {
      if (!status.active) navigate('/welcome', { replace: true })
    })

    // React to the twelve hours elapsing while the user sits on a screen.
    // This listener belongs here rather than on a route component, because
    // this layout is mounted for every screen inside the application.
    return window.api.auth.onSessionExpired(() => {
      navigate('/welcome', { replace: true })
    })
  }, [navigate])

  const handleLogout = async (): Promise<void> => {
    await window.api.auth.logout()
    navigate('/welcome', { replace: true })
  }

  const handleBackup = async (): Promise<void> => {
    try {
      const result = await window.api.backup.create()
      if (result.ok) {
        notifications.show({
          color: 'green',
          title: 'Backup saved',
          message: 'Keep this file somewhere safe. It contains all of your records.'
        })
      }
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof Error ? err.message : 'Could not create the backup'
      })
    }
  }

  return (
    <AppShell header={{ height: 56 }}   navbar={{ width: 220, breakpoint: 'xs', collapsed: { mobile: false } }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={4}>Stimel-03</Title>
          <Group gap="xs">
            <Button variant="subtle" size="compact-sm" onClick={handleBackup}>
              Backup
            </Button>
            <Button variant="subtle" size="compact-sm" onClick={handleLogout}>
              Log out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <Stack gap={2}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        {/* Design document 6.12. Visible on every screen, cannot be dismissed. */}
        <SessionBanner />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}