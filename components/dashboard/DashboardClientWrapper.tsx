'use client'

import { DashboardClient } from './DashboardClient'
import type { ComponentProps } from 'react'

export function DashboardClientWrapper(props: ComponentProps<typeof DashboardClient>) {
  return <DashboardClient {...props} />
}
