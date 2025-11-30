"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Zap, ArrowRight } from "lucide-react"

interface EmptyStateProps {
  onCreateModel?: () => void
}

export function EmptyState({ onCreateModel }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary/50 border-2 border-dashed border-border">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-primary/10 rounded-full">
          <Zap className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">Aucun modèle créé</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Commencez par créer votre premier modèle d'apprentissage automatique. Importez vos données, configurez votre
        modèle et entraînez-le en quelques minutes.
      </p>
      <Button onClick={onCreateModel} className="gap-2">
        Créer le premier modèle
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Card>
  )
}
