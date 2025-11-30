"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/animated-counter"
import { ArrowRight, Sparkles, Zap, TrendingUp, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Model } from "@/lib/api"
import { fetchModels } from "@/lib/api"
import { Intro3D } from "@/components/3d-intro"
import { AccuracyDistributionChart } from "@/components/charts/accuracy-distribution-chart"
import { ModelTypeChart } from "@/components/charts/model-type-chart"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { TrainingMetricsChart } from "@/components/charts/training-metrics-chart"

export default function LandingPage() {
  const router = useRouter()
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await fetchModels()
        setModels(data)
      } catch (err) {
        console.error("Failed to load models:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadModels()
  }, [])

  if (showIntro) {
  return <Intro3D onComplete={() => setShowIntro(false)} />
}

  const totalModels = models.length
  const classificationModels = models.filter((m) => m.model_type === "classification").length
  const regressionModels = models.filter((m) => m.model_type === "regression").length
  const avgAccuracy =
    models.length > 0 ? (models.reduce((sum, m) => sum + (m.accuracy || 0), 0) / models.length) * 100 : 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
                <span className="block">Créez des modèles</span>
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  d'IA puissants
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Gérez et entraînez des modèles d'apprentissage automatique avec une plateforme enterprise-grade
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push("/train")} className="gap-2 bg-primary hover:bg-primary/90">
                Créer un nouveau modèle
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/dashboard")}>
                Voir les modèles
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Models */}
          <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20">
            <div className="space-y-4">
              <div className="p-3 w-fit bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modèles totaux</p>
                <p className="text-4xl font-bold mt-2">{isLoading ? "..." : <AnimatedCounter end={totalModels} />}</p>
              </div>
            </div>
          </Card>

          {/* Classification */}
          <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20">
            <div className="space-y-4">
              <div className="p-3 w-fit bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classification</p>
                <p className="text-4xl font-bold mt-2">
                  {isLoading ? "..." : <AnimatedCounter end={classificationModels} />}
                </p>
              </div>
            </div>
          </Card>

          {/* Regression */}
          <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20">
            <div className="space-y-4">
              <div className="p-3 w-fit bg-orange-500/10 rounded-lg">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Régression</p>
                <p className="text-4xl font-bold mt-2">
                  {isLoading ? "..." : <AnimatedCounter end={regressionModels} />}
                </p>
              </div>
            </div>
          </Card>

          {/* Average Accuracy */}
          <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20">
            <div className="space-y-4">
              <div className="p-3 w-fit bg-purple-500/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Précision moyenne</p>
                <p className="text-4xl font-bold mt-2">
                  {isLoading ? "..." : <AnimatedCounter end={Math.round(avgAccuracy)} suffix="%" />}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Répartition des précisions</h3>
            <AccuracyDistributionChart models={models} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Types de modèles</h3>
            <ModelTypeChart models={models} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance globale</h3>
            <PerformanceChart models={models} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Métriques d'entraînement</h3>
            <TrainingMetricsChart models={models} />
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Pourquoi choisir ML Model Manager</h2>
          <p className="text-muted-foreground mt-4">Tous les outils pour réussir vos projets d'IA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Entraînement facile",
              description: "Interface intuitive pour créer et entraîner vos modèles en quelques clics",
              icon: "⚡",
            },
            {
              title: "Gestion centralisée",
              description: "Gérez tous vos modèles au même endroit avec métriques détaillées",
              icon: "📊",
            },
            {
              title: "API intégrée",
              description: "Déployez vos modèles et accédez-les via une API REST simple",
              icon: "🔌",
            },
          ].map((feature, idx) => (
            <Card key={idx} className="p-8 border border-border/50 hover:border-primary/20 transition-all">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/50 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à créer vos modèles?</h2>
        <Button size="lg" onClick={() => router.push("/train")} className="gap-2">
          Commencer maintenant
          <ArrowRight className="w-5 h-5" />
        </Button>
      </section>
    </div>
  )
}
