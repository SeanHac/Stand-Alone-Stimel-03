import { useEffect } from 'react'
import { Box, Center, Stack } from '@mantine/core'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/mi-logo.png'
import background from '../assets/auth-background.png'

/**
 * Onboarding and authentication screens. No sidebar, no navigation —
 * nothing in the application is reachable until a session exists.
 *
 * The layout supplies only the background and the logo. Each screen decides
 * its own card treatment: the onboarding choices sit directly on the
 * background, while the login form is enclosed in a panel.
 *
 * The routing rule is enforced here rather than only at startup, so a stale
 * URL cannot land on the wrong screen.
 */
export default function AuthLayout(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    window.api.auth.startupState().then((state) => {
      const onOnboarding =
        location.pathname.startsWith('/onboarding') || location.pathname === '/first-launch'

      if (state === 'first-launch' && !onOnboarding) {
        navigate('/first-launch', { replace: true })
      }

      if (state === 'login' && location.pathname === '/onboarding/create-user') {
        navigate('/welcome', { replace: true })
      }
    })
  }, [location.pathname, navigate])

  return (
    <Box className="auth-shell" style={{ backgroundImage: `url(${background})` }}>
      <Center mih="100vh" p="xl">
        <Stack gap="xl" w="100%" maw={400} align="center">
          <img src={logo} alt="Motion Informatics" className="auth-logo" />
          <Box w="100%">
            <Outlet />
          </Box>
        </Stack>
      </Center>
    </Box>
  )
}
