import AppShell from '@/components/layout/app-shell'
import ExportForm from './export-form'

export default async function ExportPage() {
  return (
    <AppShell title="Export">
      <ExportForm />
    </AppShell>
  )
}
