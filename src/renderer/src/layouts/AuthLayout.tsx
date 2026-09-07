import { Center, Paper, Box } from '@mantine/core'
import { Outlet } from 'react-router-dom'
 
/**
 * Onboarding and authentication screens. No sidebar, no navigation —
 * nothing in the application is reachable until a session exists.
 */
export default function AuthLayout(): React.JSX.Element {
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