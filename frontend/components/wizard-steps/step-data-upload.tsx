"use client"

import type React from "react"

import { useState, useRef } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Upload, X, CheckCircle } from "lucide-react"
import type { WizardState } from "@/components/model-wizard"

interface StepDataUploadProps {
  state: WizardState
  onUpdate: (updates: Partial<WizardState>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepDataUpload({ state, onUpdate, onNext, onPrev }: StepDataUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Veuillez télécharger un fichier CSV")
      return
    }

    Papa.parse(file, {
      dynamicTyping: false,
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.data && results.data.length > 0) {
          const rawColumns = results.data[0]
          const columns = rawColumns.map((c: string) =>
            String(c)
              .replace(/^\s*"|"\s*$|^\s*'|'\s*$/g, "")
              .trim(),
          )
          const data = results.data
          onUpdate({
            csvColumns: columns,
            csvData: data,
          })
        }
      },
      error: (error: any) => {
        alert(`Erreur lors de l'analyse du fichier: ${error.message}`)
      },
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const clearData = () => {
    onUpdate({
      csvData: [],
      csvColumns: [],
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {state.csvData.length === 0 ? (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base font-semibold text-foreground mb-1">Déposez votre fichier CSV ici</p>
            <p className="text-sm text-muted-foreground mb-6">ou cliquez pour parcourir votre ordinateur</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              onClick={(e) => (e.currentTarget.value = "")}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-primary text-primary hover:bg-primary/10 font-semibold"
            >
              Sélectionner un fichier
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-primary">Fichier téléchargé avec succès</p>
              <div className="text-sm text-primary/80 mt-2">
                <p>Lignes: {state.csvData.length}</p>
                <p>Colonnes: {state.csvColumns.length}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearData}
              className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Aperçu des données</p>
            <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-secondary border-b border-border">
                    <tr>
                      {state.csvColumns.map((col: string, i: number) => (
                        <th key={i} className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.csvData.slice(0, 5).map((row: string[], i: number) => (
                      <tr key={i} className="border-b border-border hover:bg-secondary/50 last:border-b-0">
                        {row.map((cell: string, j: number) => (
                          <td key={j} className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
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
          onClick={onNext}
          disabled={state.csvData.length === 0}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md disabled:opacity-50"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
