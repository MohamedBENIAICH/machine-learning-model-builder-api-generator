"use client"

import { useState } from "react"
import { Sparkles, ArrowRight, ChevronLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepModelInfo } from "./wizard-steps/step-model-info"
import { StepDataUpload } from "./wizard-steps/step-data-upload"
import { StepModelType } from "./wizard-steps/step-model-type"
import { StepFeatureSelectionEnhanced } from "./wizard-steps/step-feature-selection"
import { StepResults } from "./wizard-steps/step-results"

export type ModelType = "classification" | "regression"

export interface WizardState {
  modelName: string
  description: string
  csvData: string[][]
  csvColumns: string[]
  modelType: ModelType
  inputFeatures: string[]
  outputTarget: string
  trainingResults: TrainingResult[]
  justification?: string
}

export interface TrainingResult {
  algorithm: string
  metrics: {
    [key: string]: number
  }
}

interface ModelWizardProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

// StepFeatureSelection Component (Enhanced for full page)
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

export function ModelWizard({ isOpen, onOpenChange }: ModelWizardProps) {
  const [step, setStep] = useState(0)
  const [wizardState, setWizardState] = useState<WizardState>({
    modelName: "",
    description: "",
    csvData: [],
    csvColumns: [],
    modelType: "classification",
    inputFeatures: [],
    outputTarget: "",
    trainingResults: [],
    justification: "",
  })

  const handleReset = () => {
    setStep(0)
    setWizardState({
      modelName: "",
      description: "",
      csvData: [],
      csvColumns: [],
      modelType: "classification",
      inputFeatures: [],
      outputTarget: "",
      trainingResults: [],
      justification: "",
    })
  }

  const updateWizardState = (updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => Math.max(0, prev - 1))

  const stepComponents = [
    null, // Landing page handled separately
    <StepModelInfo
      key="model-info"
      state={wizardState}
      onUpdate={updateWizardState}
      onNext={nextStep}
      onPrev={prevStep}
    />,
    <StepDataUpload
      key="data-upload"
      state={wizardState}
      onUpdate={updateWizardState}
      onNext={nextStep}
      onPrev={prevStep}
    />,
    <StepModelType
      key="model-type"
      state={wizardState}
      onUpdate={updateWizardState}
      onNext={nextStep}
      onPrev={prevStep}
    />,
    <StepFeatureSelectionEnhanced
      key="feature-selection"
      state={wizardState}
      onUpdate={updateWizardState}
      onNext={nextStep}
      onPrev={prevStep}
    />,
    <StepResults
      key="results"
      state={wizardState}
      onNext={nextStep}
      onPrev={prevStep}
      onNewModel={handleReset}
    />,
  ]

  // Landing Page (Step 0)
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Plateforme d'apprentissage automatique</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
              Créez des modèles <span className="text-primary">d'IA puissants</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto text-balance">
              Construisez, entraînez et déployez des modèles d'apprentissage automatique sans complexité. Une
              plateforme intuitive pour les data scientists et les experts en ML.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => setStep(1)}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Créer un nouveau modèle
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                onClick={() => window.location.href = 'http://localhost:3000/dashboard'}
                size="lg"
                variant="outline"
                className="border-2 border-primary/30 hover:border-primary hover:bg-primary/10 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Afficher les modèles
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Wizard Steps (Steps 1-5)
  const stepLabels = [
    { name: "Informations", icon: "📝" },
    { name: "Données", icon: "📊" },
    { name: "Type", icon: "🎯" },
    { name: "Caractéristiques", icon: "✨" },
    { name: "Résultats", icon: "🎉" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = 'http://localhost:3000/'}
                className="hover:bg-primary/10 hover:border-primary border-2 font-semibold"
              >
                <Home className="w-5 h-5 mr-2" />
                Accueil
              </Button>
              <div className="h-8 w-px bg-border/50" />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Étape {step} sur {stepComponents.length - 1}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {step === 1 && "Informations du modèle"}
                  {step === 2 && "Téléchargement des données"}
                  {step === 3 && "Type de modèle"}
                  {step === 4 && "Sélection des caractéristiques"}
                  {step === 5 && "Résultats de l'entraînement"}
                </p>
              </div>
            </div>
            
            {/* Progress Percentage */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Progression</span>
              <div className="w-40 h-3 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(step / (stepComponents.length - 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-primary">
                {Math.round((step / (stepComponents.length - 1)) * 100)}%
              </span>
            </div>
          </div>

          {/* Step Pipeline - Bigger */}
          <div className="flex items-center justify-center gap-3">
            {stepLabels.map((stepLabel, index) => {
              const stepNumber = index + 1
              const isCompleted = step > stepNumber
              const isCurrent = step === stepNumber
              const isPending = step < stepNumber

              return (
                <div key={stepNumber} className="flex items-center">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`
                        flex items-center justify-center w-14 h-14 rounded-full border-3 transition-all duration-300
                        ${isCompleted ? 'bg-primary border-primary shadow-lg shadow-primary/40' : ''}
                        ${isCurrent ? 'bg-primary/20 border-primary scale-110 shadow-xl shadow-primary/30 ring-4 ring-primary/20' : ''}
                        ${isPending ? 'bg-background border-border/50' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <span className="text-primary-foreground text-lg font-bold">✓</span>
                      ) : (
                        <span className={`text-lg ${isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {stepLabel.icon}
                        </span>
                      )}
                    </div>
                    <span
                      className={`
                        text-sm font-semibold transition-colors hidden sm:block
                        ${isCompleted ? 'text-primary' : ''}
                        ${isCurrent ? 'text-primary font-bold' : ''}
                        ${isPending ? 'text-muted-foreground' : ''}
                      `}
                    >
                      {stepLabel.name}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < stepLabels.length - 1 && (
                    <div
                      className={`
                        w-16 sm:w-28 h-1 mx-2 rounded-full transition-all duration-300
                        ${step > stepNumber ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-border/30'}
                      `}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`container mx-auto px-4 py-8 ${step === 4 ? 'max-w-[1400px]' : 'max-w-4xl'}`}>
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
          {stepComponents[step]}
        </div>
      </div>
    </div>
  )
}