"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, ArrowRight, Upload, Zap } from "lucide-react"

type WizardStep = "name" | "type" | "upload" | "features" | "training"

interface WizardState {
  name: string
  description: string
  modelType: "classification" | "regression"
  uploadedFile: File | null
  selectedFeatures: string[]
  allFeatures: string[]
}

interface ModelWizardEnhancedProps {
  onComplete?: (model: WizardState) => void
}

export function ModelWizardEnhanced({ onComplete }: ModelWizardEnhancedProps) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>("name")
  const [state, setState] = useState<WizardState>({
    name: "",
    description: "",
    modelType: "classification",
    uploadedFile: null,
    selectedFeatures: [],
    allFeatures: [],
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const steps: Array<{ id: WizardStep; label: string; number: number }> = [
    { id: "name", label: "Nom du modèle", number: 1 },
    { id: "type", label: "Type de modèle", number: 2 },
    { id: "upload", label: "Données d'entraînement", number: 3 },
    { id: "features", label: "Sélection des features", number: 4 },
    { id: "training", label: "Entraînement", number: 5 },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)
  const stepProgress = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = async () => {
    if (step === "name" && state.name.trim()) {
      setStep("type")
    } else if (step === "type") {
      setStep("upload")
    } else if (step === "upload" && state.uploadedFile) {
      // Simulate CSV parsing
      const mockFeatures = ["age", "income", "employment_length", "purpose", "home_ownership"]
      setState((prev) => ({ ...prev, allFeatures: mockFeatures, selectedFeatures: mockFeatures }))
      setStep("features")
    } else if (step === "features" && state.selectedFeatures.length > 0) {
      setStep("training")
    } else if (step === "training") {
      await handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      onComplete?.(state)
      router.push("/dashboard")
    } catch (err) {
      console.error("Error completing wizard:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    const stepIds: WizardStep[] = ["name", "type", "upload", "features", "training"]
    const currentIdx = stepIds.indexOf(step)
    if (currentIdx > 0) {
      setStep(stepIds[currentIdx - 1])
    }
  }

  const canProceed =
    (step === "name" && state.name.trim()) ||
    step === "type" ||
    (step === "upload" && state.uploadedFile) ||
    (step === "features" && state.selectedFeatures.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Header with progress */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">Créer un nouveau modèle</h2>
              <span className="text-sm text-muted-foreground">
                Étape {currentStepIndex + 1} sur {steps.length}
              </span>
            </div>
            <Progress value={stepProgress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex-1 flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    idx <= currentStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx < currentStepIndex ? <Check className="w-4 h-4" /> : s.number}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded-full ${idx < currentStepIndex ? "bg-primary" : "bg-muted"}`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-2xl">
          {/* Step 1: Model Name */}
          {step === "name" && (
            <Card className="p-12 border border-border/50 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-foreground">Donnez un nom à votre modèle</h3>
                  <p className="text-muted-foreground">
                    Choisissez un nom descriptif pour identifier facilement votre modèle
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Ex: Détection de fraude bancaire"
                    value={state.name}
                    onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground text-lg"
                    autoFocus
                  />
                  <textarea
                    placeholder="Description optionnelle (ce que ce modèle fait, ses objectifs, etc.)"
                    value={state.description}
                    onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Model Type */}
          {step === "type" && (
            <Card className="p-12 border border-border/50 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-foreground">Type de modèle</h3>
                  <p className="text-muted-foreground">Sélectionnez le type de problème que vous résolvez</p>
                </div>

                <div className="space-y-4">
                  <div
                    onClick={() => setState((prev) => ({ ...prev, modelType: "classification" }))}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      state.modelType === "classification"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                          state.modelType === "classification" ? "border-primary bg-primary" : "border-border"
                        }`}
                      >
                        {state.modelType === "classification" && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Classification</h4>
                        <p className="text-sm text-muted-foreground mt-1">Prédire des catégories ou des étiquettes</p>
                        <p className="text-xs text-muted-foreground mt-2">Ex: Spam/Non-spam, Approuvé/Rejeté</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setState((prev) => ({ ...prev, modelType: "regression" }))}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      state.modelType === "regression"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                          state.modelType === "regression" ? "border-primary bg-primary" : "border-border"
                        }`}
                      >
                        {state.modelType === "regression" && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Régression</h4>
                        <p className="text-sm text-muted-foreground mt-1">Prédire des valeurs numériques</p>
                        <p className="text-xs text-muted-foreground mt-2">Ex: Prix, température, revenus</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Data Upload */}
          {step === "upload" && (
            <Card className="p-12 border border-border/50 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-foreground">Données d'entraînement</h3>
                  <p className="text-muted-foreground">Importez votre fichier CSV ou Excel contenant les données</p>
                </div>

                <div
                  className="border-2 border-dashed border-primary/50 rounded-lg p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer group"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Upload className="w-12 h-12 text-primary/50 group-hover:text-primary mx-auto mb-4 transition-colors" />
                  <h4 className="font-bold text-foreground mb-2">
                    {state.uploadedFile ? state.uploadedFile.name : "Déposez vos fichiers ici"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {state.uploadedFile
                      ? `Fichier prêt (${(state.uploadedFile.size / 1024).toFixed(2)} KB)`
                      : "Formats supportés: CSV, Excel"}
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setState((prev) => ({ ...prev, uploadedFile: file }))
                      }
                    }}
                    className="hidden"
                  />
                </div>

                {state.uploadedFile && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Fichier chargé avec succès</p>
                      <p className="text-muted-foreground text-xs mt-1">Prêt pour l'étape suivante</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 4: Feature Selection */}
          {step === "features" && (
            <Card className="p-12 border border-border/50 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-foreground">Sélection des features</h3>
                  <p className="text-muted-foreground">Choisissez les colonnes à utiliser pour l'entraînement</p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {state.allFeatures.map((feature) => (
                    <div
                      key={feature}
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          selectedFeatures: prev.selectedFeatures.includes(feature)
                            ? prev.selectedFeatures.filter((f) => f !== feature)
                            : [...prev.selectedFeatures, feature],
                        }))
                      }}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        state.selectedFeatures.includes(feature)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            state.selectedFeatures.includes(feature) ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {state.selectedFeatures.includes(feature) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{feature}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-foreground">
                    <strong>{state.selectedFeatures.length}</strong> features sélectionnées sur{" "}
                    <strong>{state.allFeatures.length}</strong>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Training */}
          {step === "training" && (
            <Card className="p-12 border border-border/50 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-foreground">Entraînement du modèle</h3>
                  <p className="text-muted-foreground">Votre modèle s'entraîne maintenant...</p>
                </div>

                {/* Animated training visualization */}
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="relative w-24 h-24">
                    {/* Animated circles */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                    <div
                      className="absolute inset-2 border-4 border-transparent border-b-accent rounded-full animate-spin"
                      style={{ animationDirection: "reverse" }}
                    ></div>
                    <div className="absolute inset-4 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-foreground">Entraînement en cours</p>
                    <p className="text-sm text-muted-foreground">Cela peut prendre quelques secondes...</p>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="space-y-3">
                  {["Préprocessing des données", "Division train/test", "Entraînement du modèle", "Validation"].map(
                    (label, idx) => (
                      <div key={label} className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            idx < 2 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {idx < 2 ? <Check className="w-4 h-4" /> : <span className="text-xs">{idx + 1}</span>}
                        </div>
                        <span className={idx < 2 ? "text-muted-foreground" : "text-foreground"}>{label}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8 justify-between">
            <Button variant="outline" onClick={handleBack} disabled={step === "name"} className="gap-2 bg-transparent">
              Retour
            </Button>
            <Button onClick={handleNext} disabled={!canProceed || isProcessing} className="gap-2">
              {step === "training" ? "Terminer" : "Suivant"}
              {step !== "training" && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
