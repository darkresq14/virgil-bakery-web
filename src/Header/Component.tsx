import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { draftMode } from 'next/headers'

export async function Header() {
  const headerData = await getCachedGlobal('header', 1)()
  const { isEnabled } = await draftMode()

  return <HeaderClient data={headerData} adminBarProps={{ preview: isEnabled }} />
}
