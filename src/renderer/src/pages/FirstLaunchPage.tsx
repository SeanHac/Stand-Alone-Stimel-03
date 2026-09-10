import { useNavigate } from 'react-router-dom'
import { Group, Stack, Text, Title } from '@mantine/core'
import OptionCard from '../components/OptionCard'
import { CloudUploadIcon, InfoIcon, UserPlusIcon } from '../components/icons'

/**
 * Design document section 6.1. Shown only when no user profile exists on
 * this computer. Once an account exists this screen is never shown again.
 */
export default function FirstLaunchPage(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <Stack gap="lg">
      <Stack gap={2} align="center">
        <Title order={3} className="auth-heading">
          Welcome to Motion Informatics
        </Title>
        <Text className="auth-subheading">Let&apos;s get you started</Text>
      </Stack>

      <Stack gap="sm">
        <OptionCard
          icon={<UserPlusIcon />}
          title="Create New User"
          description="Create a new local user profile to get started."
          onClick={() => navigate('/onboarding/create-user')}
        />
        <OptionCard
          icon={<CloudUploadIcon />}
          title="Restore from Backup"
          description="Restore your existing profile and data from a backup file."
          onClick={() => navigate('/onboarding/restore')}
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
