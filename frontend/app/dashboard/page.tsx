"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuickStats } from "@/components/quick-stats"
import { ModelsSection } from "@/components/models-section"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { fetchModels, type Model } from "@/lib/api"

export default function DashboardPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true)
        const data = await fetchModels()
        setModels(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des modèles")
      } finally {
        setLoading(false)
      }
    }

    loadModels()
  }, [])

  const handleViewModel = (model: Model) => {
    router.push(`/models/${model.id}`)
  }

  const handleDeleteModel = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/models/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setModels(models.filter((m) => m.id !== id))
        } else {
          alert("Erreur lors de la suppression du modèle")
        }
      } catch (err) {
        alert("Erreur lors de la suppression du modèle")
      }
    }
  }

  const handleEditModel = (model: Model) => {
    console.log("Edit model:", model)
    // TODO: Navigate to model edit page
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="space-y-2">
            <h2 className="text-5xl font-bold text-foreground">Tableau de bord</h2>
            <p className="text-lg text-muted-foreground">
              Gérez et suivez vos modèles d'apprentissage automatique en temps réel
            </p>
          </div>
        </div>

        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20 mb-6">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Quick stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <QuickStats models={models} />
          </div>
        )}

        {/* Models section */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-6">Modèles</h3>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : (
            <ModelsSection
              models={models}
              onViewModel={handleViewModel}
              onDeleteModel={handleDeleteModel}
              onEditModel={handleEditModel}
            />
          )}
        </div>
      </main>
    </div>
  )
}
