"use client"

import { Card } from "@/components/ui/card"
import { BarChart3, TrendingUp, Zap, Sparkles } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"
import type { Model } from "@/lib/api"

interface QuickStatsProps {
  models: Model[]
}

export function QuickStats({ models }: QuickStatsProps) {
  const totalModels = models.length
  const classificationModels = models.filter((m) => m.model_type === "classification").length
  const regressionModels = models.filter((m) => m.model_type === "regression").length
  const avgAccuracy =
    models.length > 0 ? (models.reduce((sum, m) => sum + (m.accuracy || 0), 0) / models.length) * 100 : 0

  const stats = [
    {
      label: "Modèles totaux",
      value: totalModels,
      icon: BarChart3,
      color: "bg-primary/10 text-primary",
      hoverColor: "hover:bg-primary/20",
    },
    {
      label: "Classification",
      value: classificationModels,
      icon: TrendingUp,
      color: "bg-green-500/10 text-green-500",
      hoverColor: "hover:bg-green-500/20",
    },
    {
      label: "Régression",
      value: regressionModels,
      icon: Zap,
      color: "bg-orange-500/10 text-orange-500",
      hoverColor: "hover:bg-orange-500/20",
    },
    {
      label: "Précision moyenne",
      value: Math.round(avgAccuracy),
      suffix: "%",
      icon: Sparkles,
      color: "bg-purple-500/10 text-purple-500",
      hoverColor: "hover:bg-purple-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="p-8 hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20 group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-4xl font-bold text-foreground flex items-baseline gap-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix || ""} />
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} ${stat.hoverColor} transition-colors`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
