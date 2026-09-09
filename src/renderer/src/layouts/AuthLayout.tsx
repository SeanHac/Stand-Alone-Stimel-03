import { useEffect } from 'react'
import { Center, Paper, Box } from '@mantine/core'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function AuthLayout(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    window.api.auth.startupState().then((state) => {
      // No account: the only reachable screens are sign-up and restore.
      if (state === 'first-launch' && !location.pathname.startsWith('/onboarding')) {
        navigate('/onboarding/create-user', { replace: true })
      }
      // An account exists: sign-up must not be reachable at all.
      if (state === 'login' && location.pathname === '/onboarding/create-user') {
        navigate('/welcome', { replace: true })
      }
    })
  }, [location.pathname, navigate])

  return (
    <Center mih="100vh" p="md">
      <Box w="100%" maw={520}>
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Outlet />
        </Paper>
      </Box>
    </Center>
  )
}