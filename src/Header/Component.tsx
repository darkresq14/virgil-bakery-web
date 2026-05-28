import { draftMode } from 'next/headers'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { HeaderClient } from './Component.client'

export async function Header() {
  const headerData = await getCachedGlobal('header', 1)()
  const { isEnabled } = await draftMode()

  return <HeaderClient data={headerData} adminBarProps={{ preview: isEnabled }} />
}
