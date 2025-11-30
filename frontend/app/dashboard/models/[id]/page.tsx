"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ModelDetailView } from "@/components/model-detail-view"
import { fetchModel, deleteModel, type Model } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

export default function ModelPage() {
  const params = useParams()
  const router = useRouter()
  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modelId = params.id as string

  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true)
        const data = await fetchModel(modelId)
        if (data) {
          setModel(data)
          setError(null)
        } else {
          setError("Modèle non trouvé")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement")
      } finally {
        setLoading(false)
      }
    }

    loadModel()
  }, [modelId])

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      try {
        const success = await deleteModel(id)
        if (success) {
          router.push("/dashboard")
        } else {
          alert("Erreur lors de la suppression du modèle")
        }
      } catch (err) {
        alert("Erreur lors de la suppression du modèle")
      }
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Erreur</h1>
          <p className="text-muted-foreground mb-4">{error || "Modèle non trouvé"}</p>
          <button onClick={handleBack} className="text-primary hover:underline">
            Retourner
          </button>
        </div>
      </div>
    )
  }

  return <ModelDetailView model={model} onBack={handleBack} onDelete={handleDelete} />
}
