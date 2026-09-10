import { useNavigate } from 'react-router-dom'
import { Group, Stack, Text, Title } from '@mantine/core'
import OptionCard from '../components/OptionCard'
import { InfoIcon, KeyIcon, SignInIcon } from '../components/icons'

/**
 * Shown on launch when an account already exists on this computer.
 *
 * There is no sign-up option here: one therapist per installation, enforced
 * by a check constraint on the users table. Recovery lives on this screen
 * rather than as a link on the login form, because design document 6.5
 * requires the login screen to carry nothing but the two credentials.
 */
export default function WelcomePage(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <Stack gap="lg">
      <Stack gap={2} align="center">
        <Title order={3} className="auth-heading">
          Welcome to Motion Informatics
        </Title>
        <Text className="auth-subheading">Sign in to continue</Text>
      </Stack>

      <Stack gap="sm">
        <OptionCard
          icon={<SignInIcon />}
          title="Sign In"
          description="Enter your username and password to continue."
          onClick={() => navigate('/login')}
        />
        <OptionCard
          icon={<KeyIcon />}
          title="Account Recovery"
          description="Reset a forgotten password using your recovery key."
          onClick={() => navigate('/recovery')}
        />
      </Stack>

      <Group gap={6} justify="center" wrap="nowrap" c="dimmed">
        <InfoIcon />
        <Text size="xs" c="dimmed">
          Only one local user is supported on this device.
        </Text>
      </Group>
    </Stack>
  )
}
