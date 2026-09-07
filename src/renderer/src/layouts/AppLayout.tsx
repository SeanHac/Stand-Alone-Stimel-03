import { AppShell, NavLink, Title, Group, Button, Stack } from '@mantine/core'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Patients', path: '/patients' },
  { label: 'Sessions', path: '/sessions' },
  { label: 'Programs', path: '/programs' },
  { label: 'Reports', path: '/reports' }
]

export default function AppLayout(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = (): void => {
    // Real logout arrives with authentication: auth:logout, then /login.
    navigate('/login')
  }

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={4}>Stimel-03</Title>
          <Button variant="subtle" size="compact-sm" onClick={handleLogout}>
            Log out
          </Button>
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
        {/*
          The session expiry banner belongs here, above the content and
          visible on every screen. See design document section 6.12.
        */}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}