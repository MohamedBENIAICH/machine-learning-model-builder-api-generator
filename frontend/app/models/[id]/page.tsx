"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2, Copy, Check, Activity, BarChart3, Zap, Code } from "lucide-react"
import { fetchModel, deleteModel, type Model } from "@/lib/api"

export default function ModelDetailPage() {
  const router = useRouter()
  const params = useParams()
  const modelId = params.id as string

  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true)
        const data = await fetchModel(modelId)
        setModel(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du modèle")
      } finally {
        setLoading(false)
      }
    }

    if (modelId) {
      loadModel()
    }
  }, [modelId])

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      try {
        const success = await deleteModel(modelId)
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

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const sanitizeName = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "")

  const safeName = model ? sanitizeName(model.name) : "model"
  const apiHost = "http://localhost:8001"
  const predictEndpoint = `${apiHost}/${safeName}/predict`
  const predictBatchEndpoint = `${apiHost}/${safeName}/predict_batch`

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive">{error || "Modèle non trouvé"}</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Retour au tableau de bord
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  const isClassification = model.model_type === "classification"
  const accuracy = isClassification ? model.accuracy : model.r2_score
  const accuracyLabel = isClassification ? "Précision" : "Score R²"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with back button and model title */}
        <div className="mb-8">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">{model.name}</h1>
              <p className="text-muted-foreground mt-1">{model.description || "Pas de description"}</p>
            </div>

            {/* Status indicator */}
            <div className="flex flex-col items-end gap-2">
              <Badge
                className={
                  model.status === "active" ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"
                }
              >
                {model.status === "active" ? "Actif" : "Inactif"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(model.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>

        {/* Tabbed interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="general" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Infos</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Métriques</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* General Info Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Informations générales</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Type de modèle</p>
                    <Badge variant={isClassification ? "default" : "secondary"} className="text-sm">
                      {isClassification ? "Classification" : "Régression"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Meilleur algorithme</p>
                    <p className="text-lg font-semibold text-foreground">{model.best_algorithm}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Statut</p>
                    <Badge variant="outline" className="text-sm">
                      {model.status === "active" ? "Actif" : "Inactif"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Date de création</p>
                    <p className="text-foreground">
                      {new Date(model.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Quick summary card */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Résumé du modèle</h3>
                  <p className="text-sm text-muted-foreground">
                    Ce modèle de {model.model_type === "classification" ? "classification" : "régression"} utilise
                    l'algorithme <strong>{model.best_algorithm}</strong> et présente une performance de{" "}
                    <strong>{accuracy ? (accuracy * 100).toFixed(2) : 0}%</strong> sur l'ensemble de test.
                  </p>
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      Vous pouvez consulter les métriques détaillées dans l'onglet "Métriques".
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Métriques de performance</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Main accuracy metric */}
                <div className="border border-border/50 rounded-lg p-6 bg-card/50">
                  <p className="text-sm text-muted-foreground mb-2">{accuracyLabel}</p>
                  <p className="text-5xl font-bold text-primary">{accuracy ? (accuracy * 100).toFixed(2) : 0}%</p>
                  <div className="mt-4 h-2 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${Math.min((accuracy || 0) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {isClassification && model.f1_score && (
                  <div className="border border-border/50 rounded-lg p-6 bg-card/50">
                    <p className="text-sm text-muted-foreground mb-2">F1-Score</p>
                    <p className="text-5xl font-bold text-green-500">{(model.f1_score * 100).toFixed(2)}%</p>
                    <div className="mt-4 h-2 bg-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                        style={{ width: `${Math.min((model.f1_score || 0) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {model.precision && (
                  <div className="border border-border/50 rounded-lg p-6 bg-card/50">
                    <p className="text-sm text-muted-foreground mb-2">Précision</p>
                    <p className="text-5xl font-bold text-blue-500">{(model.precision * 100).toFixed(2)}%</p>
                    <div className="mt-4 h-2 bg-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                        style={{ width: `${Math.min((model.precision || 0) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {model.recall && (
                  <div className="border border-border/50 rounded-lg p-6 bg-card/50">
                    <p className="text-sm text-muted-foreground mb-2">Rappel</p>
                    <p className="text-5xl font-bold text-orange-500">{(model.recall * 100).toFixed(2)}%</p>
                    <div className="mt-4 h-2 bg-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                        style={{ width: `${Math.min((model.recall || 0) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            {(model.input_features || model.output_feature) && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Fonctionnalités</h2>

                {model.output_feature && (
                  <div className="mb-8">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Caractéristique de sortie</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-sm">
                        {model.output_feature}
                      </Badge>
                      <span className="text-xs text-muted-foreground">(cible/prédiction)</span>
                    </div>
                  </div>
                )}

                {model.input_features && model.input_features.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      Caractéristiques d'entrée ({model.input_features.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {model.input_features.map((feature, idx) => (
                        <div key={idx} className="bg-muted/50 border border-border/50 rounded-lg px-4 py-2">
                          <p className="text-sm font-medium text-foreground truncate">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card className="p-8 border-primary/20 bg-primary/5">
              <h2 className="text-2xl font-bold text-foreground mb-6">API Endpoint</h2>

              <div className="space-y-6">
                {/* Single Prediction Endpoint */}
                <div className="bg-background/50 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-3">Endpoint pour les prédictions uniques</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm break-all text-foreground">
                        {`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict`}
                      </p>
          </div>
          <button
            onClick={() => 
              handleCopyToClipboard(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict`,
                "single-endpoint"
              )
            }
            className="p-2 rounded hover:bg-muted transition-colors flex-shrink-0"
            title="Copier l'endpoint"
          >
            {copiedField === "single-endpoint" ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Exemple de requête (cURL)</p>
          <div className="relative">
            <pre className="bg-muted/50 p-4 rounded text-xs overflow-x-auto text-foreground font-mono">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ data: model.input_features?.reduce((acc, feature) => ({ ...acc, [feature]: 0 }), {}) }, null, 2)}'`}
            </pre>
            <button
              onClick={() => 
                handleCopyToClipboard(
                  `curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ data: model.input_features?.reduce((acc, feature) => ({ ...acc, [feature]: 0 }), {}) })}'`,
                  "single-curl"
                )
              }
              className="absolute top-2 right-2 p-1.5 rounded hover:bg-muted"
              title="Copier la commande cURL"
            >
              {copiedField === "single-curl" ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Batch Prediction Endpoint */}
      <div className="bg-background/50 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-3">Endpoint pour les prédictions par lot</p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm break-all text-foreground">
              {`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict_batch`}
            </p>
          </div>
          <button
            onClick={() => 
              handleCopyToClipboard(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict_batch`,
                "batch-endpoint"
              )
            }
            className="p-2 rounded hover:bg-muted transition-colors flex-shrink-0"
            title="Copier l'endpoint"
          >
            {copiedField === "batch-endpoint" ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Exemple de requête (cURL)</p>
          <div className="relative">
            <pre className="bg-muted/50 p-4 rounded text-xs overflow-x-auto text-foreground font-mono">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict_batch \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ data: [model.input_features?.reduce((acc, feature) => ({ ...acc, [feature]: 0 }), {})] }, null, 2)}'`}
            </pre>
            <button
              onClick={() => 
                handleCopyToClipboard(
                  `curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/${safeName}/predict_batch \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ data: [model.input_features?.reduce((acc, feature) => ({ ...acc, [feature]: 0 }), {})] })}'`,
                  "batch-curl"
                )
              }
              className="absolute top-2 right-2 p-1.5 rounded hover:bg-muted"
              title="Copier la commande cURL"
            >
              {copiedField === "batch-curl" ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Python Client Example */}
      <div className="bg-background/50 border border-primary/20 rounded-lg p-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Client Python</p>
        <div className="relative">
          <pre className="bg-muted/50 p-4 rounded text-xs overflow-x-auto text-foreground font-mono">
{`import requests
import json

# Configuration
API_URL = "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}"
MODEL_NAME = "${safeName}"

# Données d'exemple basées sur les caractéristiques du modèle
input_data = ${JSON.stringify(model.input_features?.reduce((acc, feature) => ({ ...acc, [feature]: 0 }), {}), null, 2)}

# Faire une prédiction
response = requests.post(
    f"{API_URL}/{MODEL_NAME}/predict",
    headers={"Content-Type": "application/json"},
    json={"data": input_data}
)

if response.status_code == 200:
    result = response.json()
    print("Prédiction:", result["prediction"])
else:
    print("Erreur:", response.json().get("error", "Erreur inconnue"))
`}
          </pre>
          <button
            onClick={() => 
              handleCopyToClipboard(
                `import requests\nimport json\n\n# Configuration\nAPI_URL = \"${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}\"\nMODEL_NAME = \"${safeName}\"\n\n# Données d'exemple basées sur les caractéristiques du modèle\ninput_data = ${JSON.stringify(model.input_features?.reduce((acc, feature) => ({ ...acc, [feature]: 0 }), {}), null, 2)}\n\n# Faire une prédiction\nresponse = requests.post(\n    f\"{API_URL}/{MODEL_NAME}/predict\",\n    headers={\"Content-Type\": \"application/json\"},\n    json={\"data\": input_data}\n)\n\nif response.status_code == 200:\n    result = response.json()\n    print(\"Prédiction:\", result[\"prediction\"])\nelse:\n    print(\"Erreur:\", response.json().get(\"error\", \"Erreur inconnue\"))`,
                "python-client"
              )
            }
            className="absolute top-2 right-2 p-1.5 rounded hover:bg-muted"
            title="Copier le code Python"
          >
            {copiedField === "python-client" ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  </Card>
</TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button onClick={handleDelete} variant="destructive" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Supprimer le modèle
          </Button>
        </div>
      </main>
    </div>
  )
}
