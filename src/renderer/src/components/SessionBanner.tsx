import { useEffect, useState } from 'react'
import { Alert, Text } from '@mantine/core'
import { formatRemaining } from '@shared/auth'

export default function SessionBanner(): React.JSX.Element | null {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const tick = async (): Promise<void> => {
      const status = await window.api.auth.sessionStatus()
      setRemaining(status.warning ? status.remainingMs : null)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (remaining === null) return null

  return (
    <Alert color="yellow" radius={0} mb="md" withCloseButton={false}>
      <Text size="sm" fw={500}>
        Your session ends in {formatRemaining(remaining)}
      </Text>
      <Text size="sm">
        Save any work in progress. Do not start anything you cannot finish and save in time.
        You can log out and sign in again to begin a fresh twelve hours.
      </Text>
    </Alert>
  )
}