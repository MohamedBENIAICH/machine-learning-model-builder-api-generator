"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import type { Model } from "@/lib/api"

export function AccuracyDistributionChart({ models }: { models: Model[] }) {
  const ranges = [
    { range: "60-70%", count: 0 },
    { range: "70-80%", count: 0 },
    { range: "80-90%", count: 0 },
    { range: "90-100%", count: 0 },
  ]

  models.forEach((m) => {
    const acc = m.accuracy || 0
    if (acc < 70) ranges[0].count++
    else if (acc < 80) ranges[1].count++
    else if (acc < 90) ranges[2].count++
    else ranges[3].count++
  })

  return (
    <Card className="p-6 border border-border/50 hover:border-primary/20 transition-all">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Accuracy Distribution</h3>
        <p className="text-sm text-muted-foreground">Models by accuracy range</p>
      </div>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ranges}>
            <XAxis dataKey="range" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",              // very dark tooltip
                border: "1px solid #38bdf8",             // cyan border
                color: "#e5e7eb",
              }}
            />
            <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} barSize={40} />
          </BarChart>
      </ResponsiveContainer>
      </div>
    </Card>
  )
}
