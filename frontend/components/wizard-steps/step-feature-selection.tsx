"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"
import type { WizardState } from "@/components/model-wizard"
import { AlertCircle, ChevronLeft, ChevronRight, Search, Database, CheckCircle2, Zap, TrendingUp } from "lucide-react"
import Papa from "papaparse"

interface StepFeatureSelectionProps {
  state: WizardState
  onUpdate: (updates: Partial<WizardState>) => void
  onNext: () => void
  onPrev: () => void
}

const getDataType = (columnName: string): "numerical" | "categorical" => {
  const lowerName = columnName.toLowerCase()
  if (
    lowerName.includes("age") ||
    lowerName.includes("income") ||
    lowerName.includes("amount") ||
    lowerName.includes("rate") ||
    lowerName.includes("score") ||
    lowerName.includes("ratio") ||
    lowerName.includes("years") ||
    lowerName.includes("price") ||
    lowerName.includes("salary") ||
    lowerName.includes("value")
  ) {
    return "numerical"
  }
  return "categorical"
}

const ITEMS_PER_PAGE = 6

export function StepFeatureSelectionEnhanced({ state, onUpdate, onNext, onPrev }: StepFeatureSelectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputSearchTerm, setInputSearchTerm] = useState("")
  const [outputSearchTerm, setOutputSearchTerm] = useState("")
  const [inputFeaturesPage, setInputFeaturesPage] = useState(0)
  const [outputTargetPage, setOutputTargetPage] = useState(0)
  const [animatingFeatures, setAnimatingFeatures] = useState<Set<string>>(new Set())

  const handleFeatureToggle = (column: string) => {
    setAnimatingFeatures((prev) => new Set(prev).add(column))
    setTimeout(() => {
      setAnimatingFeatures((prev) => {
        const next = new Set(prev)
        next.delete(column)
        return next
      })
    }, 300)

    const newFeatures = state.inputFeatures.includes(column)
      ? state.inputFeatures.filter((f) => f !== column)
      : [...state.inputFeatures, column]
    onUpdate({ inputFeatures: newFeatures })
  }

  const handleSelectAll = () => {
    if (state.inputFeatures.length === inputFeaturesFiltered.length) {
      onUpdate({ inputFeatures: [] })
    } else {
      onUpdate({ inputFeatures: inputFeaturesFiltered })
    }
  }

  interface StepFeatureSelectionProps {
  state: WizardState
  onUpdate: (updates: Partial<WizardState>) => void
  onNext: () => void
  onPrev: () => void
  onTrainingStart?: () => void  // Add this
  onTrainingEnd?: () => void    // Add this
}

  const handleTargetChange = (column: string) => {
    const newInputFeatures = state.inputFeatures.filter((f) => f !== column)
    onUpdate({ outputTarget: column, inputFeatures: newInputFeatures })
  }

  const handleNext = async () => {
    setError(null)
    if (state.inputFeatures.length === 0 || !state.outputTarget) return

    try {
      setIsLoading(true)

      const columns = state.csvColumns
      const rows = state.csvData && state.csvData.length > 0 ? state.csvData.slice(1) : []
      const csvString = Papa.unparse({ fields: columns, data: rows })

      const payload = {
        model_name: state.modelName,
        description: state.description,
        model_type: state.modelType,
        csv_data: csvString,
        input_features: state.inputFeatures,
        output_feature: state.outputTarget,
      }

      const parseRes = await fetch("http://localhost:5000/api/parse-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_data: csvString }),
      })

      const parseData = await parseRes.json()
      if (!parseRes.ok || !parseData.success) {
        throw new Error(parseData.error || "Erreur lors de l'analyse du CSV sur le serveur")
      }

      const serverColumns: string[] = parseData.columns || []
      const missingInputs = state.inputFeatures.filter((f) => !serverColumns.includes(f))
      const missingTarget = serverColumns.includes(state.outputTarget) ? null : state.outputTarget
      if (missingInputs.length > 0 || missingTarget) {
        const msgs: string[] = []
        if (missingInputs.length > 0) msgs.push(`Colonnes d'entrée manquantes: ${missingInputs.join(", ")}`)
        if (missingTarget) msgs.push(`Colonne cible manquante: ${missingTarget}`)
        throw new Error(msgs.join("; "))
      }

      const res = await fetch("http://localhost:5000/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "L'entraînement a échoué sur le serveur")
      }

      const trainingResults = data.results.map((r: any) => ({ algorithm: r.algorithm, metrics: r.metrics }))

      onUpdate({ trainingResults, justification: data.justification })
      onNext()
    } catch (err: any) {
      console.error("Erreur d'entraînement:", err)
      setError(err.message || String(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and paginate input features
  const inputFeaturesItems = state.csvColumns.filter((col) => col !== state.outputTarget)
  const inputFeaturesFiltered = useMemo(
    () => inputFeaturesItems.filter((col) => col.toLowerCase().includes(inputSearchTerm.toLowerCase())),
    [inputFeaturesItems, inputSearchTerm],
  )
  const inputFeaturesStart = inputFeaturesPage * ITEMS_PER_PAGE
  const inputFeaturesEnd = inputFeaturesStart + ITEMS_PER_PAGE
  const currentInputFeatures = inputFeaturesFiltered.slice(inputFeaturesStart, inputFeaturesEnd)
  const inputFeaturesMaxPages = Math.ceil(inputFeaturesFiltered.length / ITEMS_PER_PAGE)

  // Filter and paginate output features
  const outputFeaturesFiltered = useMemo(
    () => state.csvColumns.filter((col) => col.toLowerCase().includes(outputSearchTerm.toLowerCase())),
    [state.csvColumns, outputSearchTerm],
  )
  const outputFeaturesStart = outputTargetPage * ITEMS_PER_PAGE
  const outputFeaturesEnd = outputFeaturesStart + ITEMS_PER_PAGE
  const currentOutputTargets = outputFeaturesFiltered.slice(outputFeaturesStart, outputFeaturesEnd)
  const outputFeaturesMaxPages = Math.ceil(outputFeaturesFiltered.length / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6 py-2">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground">Sélection des caractéristiques</h2>
            <p className="text-sm text-muted-foreground">
              Définissez les colonnes d'entrée pour vos prédictions et choisissez votre variable cible
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Étape 4 sur 5</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {state.inputFeatures.length + (state.outputTarget ? 1 : 0)}
            </p>
            <p className="text-xs text-muted-foreground">sélectionnés</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Features Section */}
        <div className="space-y-4 flex flex-col min-h-[600px]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">Caractéristiques d'entrée</h3>
                <p className="text-xs text-muted-foreground">Sélectionnez les colonnes qui prédisent votre cible</p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher des caractéristiques..."
              value={inputSearchTerm}
              onChange={(e) => {
                setInputSearchTerm(e.target.value)
                setInputFeaturesPage(0)
              }}
              className="pl-10 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Select All */}
          <div
            className="flex items-center gap-3 px-1 py-2 hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
            onClick={handleSelectAll}
          >
            <Checkbox
              checked={state.inputFeatures.length === inputFeaturesFiltered.length && inputFeaturesFiltered.length > 0}
              onCheckedChange={handleSelectAll}
              className="border-primary data-[state=checked]:bg-primary"
            />
            <Label className="text-sm font-semibold cursor-pointer text-foreground flex-1 select-none">
              Tout sélectionner
            </Label>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-md">
              {state.inputFeatures.length}/{inputFeaturesFiltered.length}
            </span>
          </div>

          {/* Features List - With glassmorphism and animations */}
          <div className="border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm flex-1 flex flex-col shadow-sm overflow-hidden hover:border-border/70 transition-colors">
            <div className="space-y-2 flex-1 overflow-y-auto px-3 py-3">
              {currentInputFeatures.length > 0 ? (
                currentInputFeatures.map((column: string) => {
                  const dataType = getDataType(column)
                  const isSelected = state.inputFeatures.includes(column)
                  const isAnimating = animatingFeatures.has(column)

                  return (
                    <div
                      key={column}
                      onClick={() => handleFeatureToggle(column)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? "border-primary/80 bg-primary/8 shadow-md shadow-primary/10"
                          : "border-border/40 hover:border-primary/40 hover:bg-primary/3"
                      } ${isAnimating ? "scale-95 opacity-75" : "scale-100 opacity-100"}`}
                    >
                      <div className={`transition-all duration-200 ${isSelected ? "scale-110" : "scale-100"}`}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleFeatureToggle(column)}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:shadow-md data-[state=checked]:shadow-primary/30"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium cursor-pointer text-foreground block truncate group-hover:text-primary transition-colors">
                          {column}
                        </Label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground font-medium">
                            {dataType === "numerical" ? "📊 Numérique" : "🏷️ Catégorique"}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-md shadow-primary/50" />
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground gap-2">
                  <TrendingUp className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Aucune caractéristique trouvée</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {inputFeaturesMaxPages > 1 && (
              <div className="flex items-center justify-between px-3 py-3 border-t border-border/30 bg-background/20 backdrop-blur-sm gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {inputFeaturesStart + 1}–{Math.min(inputFeaturesEnd, inputFeaturesFiltered.length)}/
                  {inputFeaturesFiltered.length}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputFeaturesPage(Math.max(0, inputFeaturesPage - 1))}
                    disabled={inputFeaturesPage === 0}
                    className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputFeaturesPage(Math.min(inputFeaturesMaxPages - 1, inputFeaturesPage + 1))}
                    disabled={inputFeaturesPage === inputFeaturesMaxPages - 1}
                    className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Target Section */}
        <div className="space-y-3 flex flex-col min-h-[450px]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">Cible de sortie</h3>
                <p className="text-xs text-muted-foreground">Choisissez la variable que votre modèle prédit</p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher la cible..."
              value={outputSearchTerm}
              onChange={(e) => {
                setOutputSearchTerm(e.target.value)
                setOutputTargetPage(0)
              }}
              className="pl-10 bg-background/50 border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Accent Divider */}
          <div className="h-1 w-16 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 rounded-full" />

          {/* Target List - Radio Selection */}
          <div className="border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm flex-1 flex flex-col shadow-sm overflow-hidden hover:border-border/70 transition-colors">
            <RadioGroup value={state.outputTarget} onValueChange={handleTargetChange} className="flex-1">
              <div className="space-y-2 flex flex-col overflow-y-auto px-3 py-3">
                {currentOutputTargets.length > 0 ? (
                  currentOutputTargets.map((column: string) => {
                    const dataType = getDataType(column)
                    const isSelected = state.outputTarget === column

                    return (
                      <div
                        key={column}
                        onClick={() => handleTargetChange(column)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
                          isSelected
                            ? "border-blue-500/80 bg-blue-500/8 shadow-md shadow-blue-500/10"
                            : "border-border/40 hover:border-blue-500/40 hover:bg-blue-500/3"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <RadioGroupItem
                            value={column}
                            id={`output-${column}`}
                            className="border-2 border-border group-hover:border-blue-500/50 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`output-${column}`}
                            className="text-sm font-medium cursor-pointer text-foreground block truncate group-hover:text-blue-500 transition-colors"
                          >
                            {column}
                          </Label>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground font-medium">
                              {dataType === "numerical" ? "📊 Numérique" : "🏷️ Catégorique"}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="animate-in fade-in zoom-in-50 duration-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 drop-shadow-md drop-shadow-blue-500/50" />
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground gap-2">
                    <Zap className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Aucune cible trouvée</p>
                  </div>
                )}
              </div>
            </RadioGroup>

            {/* Pagination */}
            {outputFeaturesMaxPages > 1 && (
              <div className="flex items-center justify-between px-3 py-3 border-t border-border/30 bg-background/20 backdrop-blur-sm gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {outputFeaturesStart + 1}–{Math.min(outputFeaturesEnd, outputFeaturesFiltered.length)}/
                  {outputFeaturesFiltered.length}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutputTargetPage(Math.max(0, outputTargetPage - 1))}
                    disabled={outputTargetPage === 0}
                    className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutputTargetPage(Math.min(outputFeaturesMaxPages - 1, outputTargetPage + 1))}
                    disabled={outputTargetPage === outputFeaturesMaxPages - 1}
                    className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        <div className="group p-4 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/8 hover:border-primary/40 transition-all cursor-default">
          <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2">✓ Entrées sélectionnées</p>
          <p className="text-sm text-foreground font-semibold line-clamp-2">
            {state.inputFeatures.length > 0 ? state.inputFeatures.join(", ") : "Aucune sélection"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">{state.inputFeatures.length} feature(s)</p>
        </div>

        <div className="group p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/8 hover:border-blue-500/40 transition-all cursor-default">
          <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider mb-2">✓ Cible sélectionnée</p>
          <p className="text-sm text-foreground font-semibold">{state.outputTarget || "Aucune sélection"}</p>
          <p className="text-xs text-muted-foreground mt-2">Variable à prédire</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Erreur d'entraînement</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={onPrev}
          className="border-border/50 hover:bg-secondary/50 text-foreground font-medium transition-all bg-transparent"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading || state.inputFeatures.length === 0 || !state.outputTarget}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin mr-2" />
              Entraînement en cours...
            </>
          ) : (
            <>
              Entraîner le modèle
              <Zap className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
