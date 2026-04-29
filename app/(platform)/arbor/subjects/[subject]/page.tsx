import { AttainmentSubjectDetailClient } from '@/components/arbor/AttainmentSubjectDetailClient'

interface SubjectPageProps {
  params: Promise<{ subject: string }>
  searchParams: Promise<{ uploadId?: string }>
}

export default async function ArborSubjectPage({ params, searchParams }: SubjectPageProps) {
  const [{ subject }, query] = await Promise.all([params, searchParams])
  return <AttainmentSubjectDetailClient subject={decodeURIComponent(subject)} uploadId={query.uploadId} />
}
