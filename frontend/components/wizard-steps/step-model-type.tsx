"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { WizardState, ModelType } from "@/components/model-wizard"
import { CheckCircle2 } from "lucide-react"

interface StepModelTypeProps {
  state: WizardState
  onUpdate: (updates: Partial<WizardState>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepModelType({ state, onUpdate, onNext, onPrev }: StepModelTypeProps) {
  const models = [
    {
      id: "classification" as ModelType,
      title: "Classification",
      description: "Prédire des catégories ou des classes (ex: spam ou non-spam)",
    },
    {
      id: "regression" as ModelType,
      title: "Régression",
      description: "Prédire des valeurs continues (ex: prix, température)",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Sélectionnez le type de modèle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <Card
              key={model.id}
              className={`p-6 cursor-pointer transition-all border-2 ${
                state.modelType === model.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/30 hover:shadow-sm"
              }`}
              onClick={() => onUpdate({ modelType: model.id })}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    state.modelType === model.id ? "border-primary bg-primary" : "border-muted-foreground bg-background"
                  }`}
                >
                  {state.modelType === model.id && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{model.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onPrev}
          className="border-border hover:bg-secondary bg-background text-foreground"
        >
          Retour
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
