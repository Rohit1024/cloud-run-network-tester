import { getDefaultTargets } from '@/app/actions/network'
import NetworkDebuggerClient from '@/app/components/NetworkDebuggerClient'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const defaultTargets = await getDefaultTargets()

  return (
    <NetworkDebuggerClient defaultTargets={defaultTargets} />
  )
}
