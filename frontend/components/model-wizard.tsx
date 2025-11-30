"use client"

import { useState } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LandingPage } from "./wizard-steps/landing-page"
import { StepModelInfo } from "./wizard-steps/step-model-info"
import { StepDataUpload } from "./wizard-steps/step-data-upload"
import { StepModelType } from "./wizard-steps/step-model-type"
import { StepFeatureSelectionEnhanced } from "./wizard-steps/step-feature-selection-enhanced"
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
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
      })
    }
    onOpenChange(open)
  }

  const updateWizardState = (updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => Math.max(0, prev - 1))

  const steps = [
    <LandingPage key="landing" />,
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
      onNewModel={() => handleOpenChange(false)}
    />,
  ]

  return (
    <div>
      {step === 0 && (
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

              <Button
                onClick={() => {
                  setStep(1)
                  onOpenChange(true)
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Créer un nouveau modèle
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {step > 0 && (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 bg-card shadow-2xl">
            <div className="overflow-y-auto flex-1">
              <div className="px-6 pt-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Étape {step} sur {steps.length - 1}
                  </DialogTitle>
                  <div className="mt-2 h-1 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                    />
                  </div>
                </DialogHeader>
              </div>
              <div className="px-6 py-6">{steps[step]}</div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
