"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchModelStatistics, type ApiStatistics } from "@/lib/api"
import {
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, Server, Clock, Users, Globe, Copy, AlertTriangle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChartDataInput {
  [key: string]: string | number;
  name: string;
  value: number;
}

interface StatusCodeStats extends ChartDataInput {
  name: string;
  value: number;
  status: number;
}

interface ApiStatsDashboardProps {
  modelId: string
  modelName: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ApiStatsDashboard({ modelId, modelName }: ApiStatsDashboardProps) {
  const [stats, setStats] = useState<ApiStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("7")

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const data = await fetchModelStatistics(modelId, parseInt(timeRange))
        if (data) {
          setStats(data)
        }
      } catch (err) {
        setError("Impossible de charger les statistiques API")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()

    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [modelId, timeRange])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <AlertTriangle className="mr-2 h-5 w-5" />
        {error}
      </div>
    )
  }

  if (!stats) return <div>Aucune statistique disponible</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tableau de bord API</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Dernières 24h</SelectItem>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appels</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulCalls} succès, {stats.failedCalls} échecs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime} ms</div>
            <p className="text-xs text-muted-foreground">
              Moyenne sur la période
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCalls > 0
                ? ((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibilité API
            </p>
          </CardContent>
        </Card>

      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="usage">Ressources</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Trafic API</CardTitle>
                <CardDescription>Nombre d'appels par jour</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.timeSeriesData}>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area type="monotone" dataKey="calls" stroke="#8884d8" fillOpacity={1} fill="url(#colorCalls)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Distribution des Codes Statut</CardTitle>
                <CardDescription>Succès vs Erreurs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusCodeDistribution as ChartDataInput[]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {stats.statusCodeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {stats.statusCodeDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Endpoints</CardTitle>
              <CardDescription>Détails par route API</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-right">Appels</TableHead>
                    <TableHead className="text-right">Succès</TableHead>
                    <TableHead className="text-right">Latence Moy.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.endpoints.map((endpoint, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                      <TableCell className="text-right">{endpoint.callCount}</TableCell>
                      <TableCell className="text-right">
                        <span className={endpoint.successRate >= 98 ? "text-green-500" : "text-yellow-500"}>
                          {endpoint.successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{endpoint.avgResponseTime} ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Utilisation CPU</CardTitle>
                <CardDescription>Charge système actuelle</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[200px]">
                <div className="relative flex items-center justify-center">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * stats.resourceUsage.cpu) / 100}
                      className="text-primary transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold">{stats.resourceUsage.cpu}%</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Charge CPU</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Utilisation Mémoire</CardTitle>
                <CardDescription>Consommation RAM</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.resourceUsage.memory.toFixed(0)} MB
                </div>
                <p className="text-sm text-muted-foreground">Mémoire utilisée</p>
                <div className="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.resourceUsage.memory / 1024) * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clients les plus actifs</CardTitle>
              <CardDescription>Top consommateurs de l'API</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client ID / IP</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead className="text-right">Appels</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topClients.map((client, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {client.clientId}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(client.lastActive).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{client.callCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}