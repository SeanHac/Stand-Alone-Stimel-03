import { useNavigate } from 'react-router-dom'
import { Button, Stack, Text, Title } from '@mantine/core'

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
      <div>
        <Title order={3}>Stimel-03</Title>
        <Text c="dimmed" size="sm">
          Treatment documentation
        </Text>
      </div>

      <Stack gap="sm">
        <Button size="md" onClick={() => navigate('/login')} fullWidth>
          Sign in
        </Button>

        <Button
          size="md"
          variant="default"
          onClick={() => navigate('/recovery')}
          fullWidth
        >
          Account recovery
        </Button>
      </Stack>

      <Text c="dimmed" size="xs" ta="center">
        Use account recovery if you have forgotten your password and still have the recovery
        key you saved when this account was created.
      </Text>
    </Stack>
  )
}
