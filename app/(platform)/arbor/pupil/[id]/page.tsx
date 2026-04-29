import { AttainmentPupilDetailClient } from '@/components/arbor/AttainmentPupilDetailClient'

interface PupilPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ uploadId?: string }>
}

export default async function ArborPupilPage({ params, searchParams }: PupilPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  return <AttainmentPupilDetailClient pupilId={decodeURIComponent(id)} uploadId={query.uploadId} />
}
