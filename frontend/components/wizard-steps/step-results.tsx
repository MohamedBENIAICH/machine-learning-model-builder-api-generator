"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { WizardState } from "@/components/model-wizard"
import { CheckCircle, Download, RotateCw } from "lucide-react"

interface StepResultsProps {
  state: WizardState
  onNext: () => void
  onPrev: () => void
  onNewModel: () => void
}

export function StepResults({ state, onPrev, onNewModel }: StepResultsProps) {
  const bestAlgorithm =
    state.trainingResults.length > 0
      ? state.trainingResults.reduce((prev, current) => {
          const prevScore = Object.values(prev.metrics).reduce((a, b) => a + b, 0)
          const currentScore = Object.values(current.metrics).reduce((a, b) => a + b, 0)
          return currentScore > prevScore ? current : prev
        })
      : null

  const metricKeys = bestAlgorithm ? Object.keys(bestAlgorithm.metrics) : []

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-primary">Entraînement du modèle terminé</p>
          <p className="text-sm text-primary/80 mt-1">
            Tous les algorithmes ont été évalués sur votre ensemble de données
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-base text-foreground">Comparaison des algorithmes</h3>
        <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Algorithme</th>
                {metricKeys.map((key) => (
                  <th key={key} className="px-4 py-3 text-right font-semibold text-foreground">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.trainingResults.map((result, index) => (
                <tr
                  key={index}
                  className={`border-b border-border transition-colors last:border-b-0 ${
                    bestAlgorithm && result.algorithm === bestAlgorithm.algorithm
                      ? "bg-primary/5"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {result.algorithm}
                    {bestAlgorithm && result.algorithm === bestAlgorithm.algorithm && (
                      <span className="ml-2 inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-semibold">
                        Meilleur
                      </span>
                    )}
                  </td>
                  {metricKeys.map((key) => (
                    <td key={key} className="px-4 py-3 text-right text-muted-foreground">
                      {result.metrics[key].toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bestAlgorithm && (
        <Card className="p-5 border-l-4 border-l-primary bg-primary/5 shadow-sm">
          <p className="text-sm font-semibold text-primary mb-2">
            Pourquoi {bestAlgorithm.algorithm} a été sélectionné
          </p>
          <p className="text-sm text-primary/80">
            {state.justification ||
              `En fonction des métriques d'évaluation, ${bestAlgorithm.algorithm} a montré les meilleures performances globales dans tous les critères mesurés.`}
          </p>
        </Card>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onPrev}
          className="border-border hover:bg-secondary bg-background text-foreground"
        >
          Retour
        </Button>
        <Button
          variant="outline"
          onClick={onNewModel}
          className="flex-1 border-border hover:bg-secondary bg-background text-foreground font-semibold"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Nouveau modèle
        </Button>
        <Button
          onClick={() => window.location.href = 'http://localhost:3000/dashboard'}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
        >
          <Download className="w-4 h-4 mr-2" />
          Voir la liste  des modèles
        </Button>
      </div>
    </div>
  )
}
