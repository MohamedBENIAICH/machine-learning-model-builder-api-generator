"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Trash2, Calendar } from "lucide-react"
import type { Model } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface ModelDetailViewProps {
  model: Model
  onBack?: () => void
  onDelete?: (id: string) => void
}

export function ModelDetailView({ model, onBack, onDelete }: ModelDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // const isClassification = model.model_type === "classification"

    const apiBaseUrl = "http://localhost:5000"

  const isClassification = model.model_type === "classification"

  const exampleInput =
    model.input_features?.reduce((acc: any, feature) => {
      acc[feature] = feature === "age" ? 32 : feature === "income" ? 45000 : 0
      return acc
    }, {}) || {}

  const prettyInput = JSON.stringify(exampleInput, null, 2)

  const createdDate = new Date(model.created_at)
  const timeAgo = formatDistanceToNow(createdDate, {
    addSuffix: true,
    locale: fr,
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete?.(model.id)
    } finally {
      setIsDeleting(false)
    }
  }

  // Mock comparison data
  const algorithmsComparison = [
    {
      name: model.best_algorithm,
      accuracy: model.accuracy || model.r2_score || 0,
      f1Score: model.f1_score || 0,
      trainingTime: "2.5s",
      selected: true,
    },
    {
      name: "Random Forest",
      accuracy: (model.accuracy || model.r2_score || 0) * 0.92,
      f1Score: (model.f1_score || 0) * 0.9,
      trainingTime: "3.2s",
      selected: false,
    },
    {
      name: "SVM",
      accuracy: (model.accuracy || model.r2_score || 0) * 0.88,
      f1Score: (model.f1_score || 0) * 0.85,
      trainingTime: "4.1s",
      selected: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{model.name}</h1>
              <p className="text-muted-foreground text-sm mt-1">Créé {timeAgo}</p>
            </div>
            <Badge variant={isClassification ? "default" : "secondary"}>
              {isClassification ? "Classification" : "Régression"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Model info */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Informations du modèle</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Meilleur algorithme</p>
                  <p className="text-lg font-semibold text-foreground">{model.best_algorithm}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="text-lg font-semibold text-foreground">
                    {model.status === "active" ? "Actif" : "Inactif"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type de modèle</p>
                  <p className="text-lg font-semibold text-foreground">
                    {isClassification ? "Classification" : "Régression"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taille des données</p>
                  <p className="text-lg font-semibold text-foreground">{model.training_data_size || "N/A"} lignes</p>
                </div>
              </div>
            </Card>

            {/* Metrics tabs */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Métriques</h2>
              <Tabs defaultValue="performance" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="detailed">Détaillées</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="mt-6 space-y-4">
                  {isClassification ? (
                    <>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Précision</span>
                          <span className="text-lg font-bold text-primary">{model.accuracy?.toFixed(2)}%</span>
                        </div>
                        <Progress value={model.accuracy || 0} />
                      </div>
                      {model.f1_score && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Score F1</span>
                            <span className="text-lg font-bold text-primary">{model.f1_score.toFixed(2)}</span>
                          </div>
                          <Progress value={model.f1_score * 100} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Score R²</span>
                          <span className="text-lg font-bold text-primary">{model.r2_score?.toFixed(4)}</span>
                        </div>
                        <Progress value={(model.r2_score || 0) * 100} />
                      </div>
                      {model.rmse && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">RMSE</span>
                            <span className="text-lg font-bold text-primary">{model.rmse.toFixed(4)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="detailed" className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {model.accuracy && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">Précision</p>
                        <p className="text-2xl font-bold text-foreground">{model.accuracy.toFixed(2)}%</p>
                      </div>
                    )}
                    {model.f1_score && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">Score F1</p>
                        <p className="text-2xl font-bold text-foreground">{model.f1_score.toFixed(4)}</p>
                      </div>
                    )}
                    {model.precision && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">Précision</p>
                        <p className="text-2xl font-bold text-foreground">{model.precision.toFixed(4)}</p>
                      </div>
                    )}
                    {model.recall && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">Rappel</p>
                        <p className="text-2xl font-bold text-foreground">{model.recall.toFixed(4)}</p>
                      </div>
                    )}
                    {model.rmse && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">RMSE</p>
                        <p className="text-2xl font-bold text-foreground">{model.rmse.toFixed(4)}</p>
                      </div>
                    )}
                    {model.mae && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">MAE</p>
                        <p className="text-2xl font-bold text-foreground">{model.mae.toFixed(4)}</p>
                      </div>
                    )}
                    {model.r2_score && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">Score R²</p>
                        <p className="text-2xl font-bold text-foreground">{model.r2_score.toFixed(4)}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Algorithms comparison */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Comparaison des algorithmes</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algorithme</TableHead>
                    <TableHead className="text-right">Précision</TableHead>
                    <TableHead className="text-right">Score F1</TableHead>
                    <TableHead className="text-right">Temps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {algorithmsComparison.map((algo) => (
                    <TableRow key={algo.name} className={algo.selected ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {algo.selected && (
                            <Badge variant="default" className="text-xs">
                              Sélectionné
                            </Badge>
                          )}
                          {algo.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{algo.accuracy.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{algo.f1Score.toFixed(4)}</TableCell>
                      <TableCell className="text-right">{algo.trainingTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                          {/* API & Integration guide */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Utiliser ce modèle via l&apos;API</h2>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Ce modèle est un{" "}
                  <span className="font-semibold text-foreground">
                    {isClassification ? "modèle de classification" : "modèle de régression"}
                  </span>{" "}
                  entraîné pour prédire{" "}
                  <span className="font-semibold text-foreground">{model.output_feature}</span>{" "}
                  à partir des caractéristiques suivantes:
                </p>

                <ul className="list-disc list-inside text-foreground">
                  {model.input_features?.map((f) => (
                    <li key={f} className="text-sm">
                      <span className="font-mono">{f}</span> – valeur numérique ou catégorielle selon votre jeu de
                      données d&apos;entraînement.
                    </li>
                  ))}
                </ul>

                <p>
                  Lors de l&apos;appel à l&apos;API, vous devez envoyer un objet JSON avec ces champs dans la clé{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-xs">data</code> (pour une prédiction unique) ou
                  un tableau d&apos;objets dans <code className="px-1 py-0.5 rounded bg-muted text-xs">data</code>{" "}
                  (pour une prédiction par lot).
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {/* Single prediction */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Endpoint pour une prédiction unique</h3>
                  <p className="text-xs text-muted-foreground">
                    URL à appeler en POST avec un JSON contenant un objet <code>data</code>.
                  </p>
                  <pre className="bg-black/60 text-xs text-emerald-100 p-3 rounded-md overflow-x-auto">
{`${apiBaseUrl}/${model.name}/predict`}
                  </pre>

                  <p className="text-xs text-muted-foreground">Exemple de requête (cURL)</p>
                  <pre className="bg-black/60 text-xs text-emerald-100 p-3 rounded-md overflow-x-auto">
{`curl -X POST ${apiBaseUrl}/${model.name}/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": ${prettyInput.replace(/\n/g, "\n    ")}
  }'`}
                  </pre>

                  <p className="text-xs text-muted-foreground">Exemple de réponse</p>
                  <pre className="bg-black/60 text-xs text-emerald-100 p-3 rounded-md overflow-x-auto">
{`{
  "success": true,
  "model_name": "${model.name}",
  "prediction": ${isClassification ? '"Yes"' : 123.45}
}`}
                  </pre>
                </div>

                {/* Batch prediction */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Endpoint pour les prédictions par lot</h3>
                  <p className="text-xs text-muted-foreground">
                    Même format, mais avec un tableau sous la clé <code>data</code>.
                  </p>
                  <pre className="bg-black/60 text-xs text-emerald-100 p-3 rounded-md overflow-x-auto">
{`${apiBaseUrl}/${model.name}/predict_batch`}
                  </pre>

                  <p className="text-xs text-muted-foreground">Exemple de requête (cURL)</p>
                  <pre className="bg-black/60 text-xs text-emerald-100 p-3 rounded-md overflow-x-auto">
{`curl -X POST ${apiBaseUrl}/${model.name}/predict_batch \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": [
      ${prettyInput.replace(/\n/g, "\n      ")},
      ${prettyInput.replace(/\n/g, "\n      ")}
    ]
  }'`}
                  </pre>

                  <p className="text-xs text-muted-foreground">Exemple de réponse</p>
                  <pre className="bg-black/60 text-xs text-emerald-100 p-3 rounded-md overflow-x-auto">
{`{
  "success": true,
  "model_name": "${model.name}",
  "predictions": [
    ${isClassification ? '"Yes", "No"' : "123.45, 98.76"}
  ]
}`}
                  </pre>
                </div>

                {/* Python client hint */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Exemple de client Python</h3>
                  <pre className="bg-black/60 text-xs text-emerald-100 p-3 rounded-md overflow-x-auto">
{`import requests

API_URL = "${apiBaseUrl}/${model.name}/predict"

input_data = ${prettyInput}

response = requests.post(
    API_URL,
    json={"data": input_data}
)

print(response.json())`}
                  </pre>
                </div>
              </div>
            </Card>
            </Card>

            {/* Justification */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h2 className="text-xl font-bold text-foreground mb-4">Justification de la sélection</h2>
              <p className="text-foreground leading-relaxed">
                L'algorithme {model.best_algorithm} a été sélectionné car il offre le meilleur équilibre entre précision
                et performance. Il a atteint une précision de {model.accuracy?.toFixed(2)}% sur les données de test,
                dépassant les autres algorithmes testés. De plus, le temps d'entraînement est optimal, permettant une
                réaction rapide aux nouvelles données.
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features summary */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">Caractéristiques</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Caractéristiques d'entrée</p>
                  <div className="space-y-2">
                    {model.input_features?.slice(0, 5).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {model.input_features && model.input_features.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{model.input_features.length - 5} plus
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Cible de sortie</p>
                  <Badge variant="default" className="text-xs">
                    {model.output_feature}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Dates */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">Dates</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Créé</p>
                    <p className="text-sm font-medium text-foreground">{createdDate.toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                {model.updated_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Modifié</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(model.updated_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6 space-y-3">
              <Button className="w-full gap-2">
                <Download className="w-4 h-4" />
                Télécharger le modèle
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2" disabled={isDeleting}>
                    <Trash2 className="w-4 h-4" />
                    Supprimer le modèle
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action ne peut pas être annulée.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Supprimer
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
