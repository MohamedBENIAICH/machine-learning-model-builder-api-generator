"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trash2, Eye } from "lucide-react"
import { Clock } from "lucide-react"
import type { Model } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface ModelCardProps {
  model: Model
  onView?: (model: Model) => void
  onDelete?: (id: string) => void
  onEdit?: (model: Model) => void
}

export function ModelCard({ model, onView, onDelete, onEdit }: ModelCardProps) {
  const isClassification = model.model_type === "classification"
  const accuracy = isClassification ? model.accuracy : model.r2_score
  const accuracyLabel = isClassification ? "Précision" : "Score R²"
  const accuracyPercent = accuracy ? (accuracy * 100).toFixed(2) : "0"

  const createdDate = new Date(model.created_at)
  const timeAgo = formatDistanceToNow(createdDate, {
    addSuffix: true,
    locale: fr,
  })

  return (
    <Card className="p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-border/50 hover:border-primary/30 group relative">
      {/* Status accent bar */}
      <div
        className={`absolute top-0 left-0 w-1 h-full ${model.status === "active" ? "bg-green-500" : "bg-amber-500"}`}
      ></div>

      {/* Header */}
      <div className="space-y-3 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {model.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${model.status === "active" ? "bg-green-500" : "bg-amber-500"}`}></div>
        </div>

        {/* Type badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isClassification ? "default" : "secondary"} className="text-xs">
            {isClassification ? "Classification" : "Régression"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {model.best_algorithm}
          </Badge>
        </div>
      </div>

      {/* Metrics section */}
      <div className="space-y-3 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">{accuracyLabel}</span>
            <span className="text-lg font-bold text-primary">{accuracyPercent}%</span>
          </div>
          <Progress value={Math.min(Number.parseFloat(accuracyPercent), 100)} className="h-2" />
        </div>

        {isClassification && model.f1_score && (
          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="bg-muted/30 p-2 rounded">
              <p className="text-muted-foreground">F1-Score</p>
              <p className="font-semibold text-foreground">{(model.f1_score * 100).toFixed(1)}%</p>
            </div>
            {model.precision && (
              <div className="bg-muted/30 p-2 rounded">
                <p className="text-muted-foreground">Précision</p>
                <p className="font-semibold text-foreground">{(model.precision * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4 pt-2 border-t border-border/30">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${model.status === "active" ? "bg-green-500" : "bg-amber-500"}`}
            ></div>
            <span className="text-xs font-medium text-muted-foreground">
              {model.status === "active" ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={() => onView?.(model)} className="flex-1 gap-2 group/btn">
          <Eye className="w-4 h-4 group-hover/btn:text-primary" />
          <span className="hidden sm:inline">Voir</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete?.(model.id)}
          className="gap-2 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
