"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card } from "@/components/ui/card"
import type { Model } from "@/lib/api"

export function ModelTypeChart({ models }: { models: Model[] }) {
  const classificationCount = models.filter((m) => m.model_type === "classification").length
  const regressionCount = models.filter((m) => m.model_type === "regression").length

  const data = [
    { name: "Classification", value: classificationCount, fill: "#e11d48" }, // bright rose
  { name: "Regression", value: regressionCount, fill: "#22d3ee" },        // bright cyan
  ]

  return (
    <Card className="p-6 border border-border/50 hover:border-primary/20 transition-all">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Model Types</h3>
        <p className="text-sm text-muted-foreground">Distribution by model type</p>
      </div>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label
              dataKey="value"
              innerRadius={60}
              outerRadius={120}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
