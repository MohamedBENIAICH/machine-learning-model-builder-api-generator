"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { WizardState } from "@/components/model-wizard"

interface StepModelInfoProps {
  state: WizardState
  onUpdate: (updates: Partial<WizardState>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepModelInfo({ state, onUpdate, onNext, onPrev }: StepModelInfoProps) {
  const handleNext = () => {
    if (state.modelName.trim()) {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="modelName" className="text-base font-semibold text-foreground mb-2 block">
          Nom du modèle
        </Label>
        <Input
          id="modelName"
          placeholder="Ex: Prédicteur d'attrition client"
          value={state.modelName}
          onChange={(e) => onUpdate({ modelName: e.target.value })}
          className="bg-background text-foreground placeholder:text-muted-foreground border-border hover:border-primary/30 focus:border-primary transition-colors"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-base font-semibold text-foreground mb-2 block">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Décrivez ce que votre modèle fera et les objectifs visés..."
          value={state.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="min-h-[120px] bg-background text-foreground placeholder:text-muted-foreground border-border hover:border-primary/30 focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="flex gap-3 pt-6">
        <Button
          variant="outline"
          onClick={onPrev}
          className="border-border hover:bg-secondary bg-background text-foreground"
        >
          Retour
        </Button>
        <Button
          onClick={handleNext}
          disabled={!state.modelName.trim()}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
