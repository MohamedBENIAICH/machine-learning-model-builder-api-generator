"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import type { Model } from "@/lib/api"

export function TrainingMetricsChart({ models }: { models: Model[] }) {
  const data = [
    { stage: "Preprocessing", complete: 100 },
    { stage: "Training", complete: Math.round((models.length / 10) * 100) || 85 },
    { stage: "Validation", complete: 92 },
    { stage: "Testing", complete: 88 },
  ]

  return (
    <Card className="p-6 border border-border/50 hover:border-primary/20 transition-all">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Training Pipeline</h3>
        <p className="text-sm text-muted-foreground">Pipeline completion status</p>
      </div>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="stage" stroke="#ffffff" />      {/* use 'stage' and bright text */}
            <YAxis stroke="#ffffff" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #f97316",
                color: "#e5e7eb",
              }}
            />
            <Bar
              dataKey="complete"
              fill="#f97316"
              radius={[8, 8, 0, 0]}
              barSize={40}
              label={{ fill: "#e5e7eb", fontSize: 12 }}
            />
          </BarChart>
      </ResponsiveContainer>
      </div>
    </Card>
  )
}
