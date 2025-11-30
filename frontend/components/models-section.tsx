"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModelCard } from "@/components/model-card"
import { EmptyState } from "@/components/empty-state"
import { Grid3x3, List } from "lucide-react"
import type { Model } from "@/lib/api"

interface ModelsSectionProps {
  models: Model[]
  onViewModel?: (model: Model) => void
  onDeleteModel?: (id: string) => void
  onEditModel?: (model: Model) => void
}

export function ModelsSection({ models, onViewModel, onDeleteModel, onEditModel }: ModelsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [modelType, setModelType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredModels = useMemo(() => {
    const filtered = models.filter((model) => {
      // Safely handle missing model properties
      if (!model || !model.name) return false
      
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = modelType === "all" || model.model_type === modelType

      return matchesSearch && matchesType
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "accuracy":
          const aAcc = a.accuracy || a.r2_score || 0
          const bAcc = b.accuracy || b.r2_score || 0
          return bAcc - aAcc
        case "name":
          return (a.name || "").localeCompare(b.name || "")
        case "date":
        default:
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
          return bDate - aDate
      }
    })

    return filtered
  }, [models, searchQuery, modelType, sortBy])

  if (models.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Filters and controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <Input
          placeholder="Rechercher les modèles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />

        <Select value={modelType} onValueChange={setModelType}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Type de modèle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modèles</SelectItem>
            <SelectItem value="classification">Classification</SelectItem>
            <SelectItem value="regression">Régression</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="accuracy">Précision</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex gap-2 border border-border rounded-lg p-1">
          <Button
            size="icon"
            variant={viewMode === "grid" ? "default" : "ghost"}
            onClick={() => setViewMode("grid")}
            className="w-10 h-10"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "list" ? "default" : "ghost"}
            onClick={() => setViewMode("list")}
            className="w-10 h-10"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Models display */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Aucun modèle trouvé</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onView={onViewModel}
              onDelete={onDeleteModel}
              onEdit={onEditModel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
