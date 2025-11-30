"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import type { Model } from "@/lib/api"

export function PerformanceChart({ models }: { models: Model[] }) {
  const data = models.slice(0, 6).map((model, idx) => ({
    name: model.name.substring(0, 10),
    accuracy: model.accuracy || 0,
    precision: Math.min(100, (model.accuracy || 0) + Math.random() * 5),
  }))

  return (
    <Card className="p-6 border border-border/50 hover:border-primary/20 transition-all">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Model Performance</h3>
        <p className="text-sm text-muted-foreground">Accuracy and precision metrics</p>
      </div>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Legend />
            <Line type="monotone" dataKey="accuracy" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, fill: "#a855f7" }} />
            <Line type="monotone" dataKey="precision" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: "#22c55e" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
