import { useEffect } from 'react'
import { AppShell, Box, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import SessionBanner from '../components/SessionBanner'
import { DataProvider } from '../data/DataContext'
import { toMessage } from '@shared/errors'
import logo from '../assets/mi-logo.png'
import sidebarArt from '../assets/auth-background.png'
import {
  BackupIcon,
  LogOutIcon,
  PatientsIcon,
  ProgramsIcon,
  ReportsIcon,
  SessionsIcon
} from '../components/icons'

const NAV_ITEMS = [
  { label: 'Patients', path: '/patients', icon: <PatientsIcon /> },
  { label: 'Sessions', path: '/sessions', icon: <SessionsIcon /> },
  { label: 'Programs', path: '/programs', icon: <ProgramsIcon /> },
  { label: 'Reports', path: '/reports', icon: <ReportsIcon /> }
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
      notifications.show({ color: 'red', message: toMessage(err, 'Could not create the backup') })
    }
  }

  return (
    <AppShell
      header={{ height: 78 }}
      navbar={{ width: 210, breakpoint: 'xs', collapsed: { mobile: false } }}
      padding="lg"
    >
      <AppShell.Header className="app-header">
        <Group h="100%" px="lg" gap="md" wrap="nowrap">
          <img src={logo} alt="Motion Informatics" className="app-header__logo" />
          <Box className="app-header__divider" />
          <Stack gap={0}>
            <Text className="app-header__product">Stimel-03</Text>
            <Text className="app-header__tagline">Neuromuscular Rehabilitation System</Text>
          </Stack>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="app-nav" style={{ backgroundImage: `url(${sidebarArt})` }}>
        <Stack justify="space-between" h="100%" p="sm" style={{ position: 'relative' }}>
          <Stack gap={4}>
            {NAV_ITEMS.map((item) => (
              <UnstyledButton
                key={item.path}
                onClick={() => navigate(item.path)}
                className="app-nav__item"
                data-active={location.pathname === item.path || undefined}
              >
                <Group gap="sm" wrap="nowrap">
                  {item.icon}
                  <Text size="sm" fw={600}>
                    {item.label}
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>

          <Stack gap={4}>
            <UnstyledButton onClick={handleBackup} className="app-nav__item">
              <Group gap="sm" wrap="nowrap">
                <BackupIcon />
                <Text size="sm" fw={600}>
                  Backup
                </Text>
              </Group>
            </UnstyledButton>

            <UnstyledButton onClick={handleLogout} className="app-nav__item">
              <Group gap="sm" wrap="nowrap">
                <LogOutIcon />
                <Text size="sm" fw={600}>
                  Log Out
                </Text>
              </Group>
            </UnstyledButton>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className="app-main">
        {/* Design document 6.12. Visible on every screen, cannot be dismissed. */}
        <SessionBanner />

        {/*
          Everything the application shows is loaded once here, immediately
          after authentication, and held for the life of the session. Screens
          read from that store rather than querying on mount.
        */}
        <DataProvider>
          <Outlet />
        </DataProvider>
      </AppShell.Main>
    </AppShell>
  )
}
