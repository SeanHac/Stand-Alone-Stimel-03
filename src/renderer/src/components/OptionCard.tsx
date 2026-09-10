import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { ChevronRightIcon } from './icons'

/**
 * A large tappable choice: icon, title, one or two lines of explanation,
 * chevron. Used on the first-launch and welcome screens.
 */

interface Props {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}

export default function OptionCard({
  icon,
  title,
  description,
  onClick
}: Props): React.JSX.Element {
  return (
    <UnstyledButton onClick={onClick} w="100%" className="option-card">
      <Group wrap="nowrap" gap="md" align="center">
        <Box className="option-card__icon">{icon}</Box>

        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text className="option-card__title">{title}</Text>
          <Text className="option-card__description">{description}</Text>
        </Stack>

        <Box className="option-card__chevron">
          <ChevronRightIcon />
        </Box>
      </Group>
    </UnstyledButton>
  )
}
