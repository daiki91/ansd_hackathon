import { SenegalMap } from '@/components/SenegalMap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Map } from 'lucide-react'

export default function MapPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-[var(--color-teal)]" />
            Carte interactive du Sénégal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SenegalMap />
        </CardContent>
      </Card>
    </div>
  )
}
