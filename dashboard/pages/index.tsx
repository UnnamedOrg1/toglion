import NextLink from 'next/link'
import {Box, Heading, Link as ChakraLink, Text, VStack} from '@chakra-ui/react'
import {useState} from 'react'
import {signIn, signOut, useSession} from 'next-auth/react'
import {AppShell} from 'components/layout/AppShell'
import {Flag} from 'types'

const defaultFlags: Flag[] = [
  {
    id: 'maintenance',
    name: 'Maintenance',
    value: true,
    organizationId: 'DELETEME',
    schema: '{"type": "boolean"}',
  },
  {
    id: 'experiment',
    name: 'Experiment',
    value: false,
    organizationId: 'DELETEME',
    schema: '{"type": "boolean"}',
  },
]

function IndexPage() {
  const {data: session, status: authStatus} = useSession()
  const [flags, setFlags] = useState(defaultFlags)

  const onFlagToggle = (id: string) => {
    setFlags((flags) => {
      const newFlags = [...flags]
      const flagIndex = flags.findIndex((flag) => flag.id === id)

      if (flagIndex !== -1) {
        const flag = flags[flagIndex]
        const isEnabled = !flag.value
        newFlags[flagIndex] = {
          ...flag,
          value: isEnabled,
        }
      }

      return newFlags
    })
  }

  return (
    <AppShell>
      <Box maxW="lg">
        <Heading>Placeholder</Heading>
        {authStatus !== 'authenticated' ? (
          <ChakraLink onClick={() => signIn()}>Sign In</ChakraLink>
        ) : (
          <>
            {/* FIXME: just all of this */}
            <Text>{session?.user?.email ?? 'Fug'}</Text>
            <VStack>
              <ChakraLink onClick={() => signOut()}>Sign Out</ChakraLink>
              <NextLink href="/organizations/create" passHref>
                <ChakraLink>New Organization</ChakraLink>
              </NextLink>
            </VStack>
          </>
        )}
      </Box>
    </AppShell>
  )
}

export default IndexPage
