// API integration layer for ML Model Manager
// All API calls to Flask backend at http://localhost:5000

export const API_BASE_URL = "http://localhost:5000/api"

interface EndpointStats {
  endpoint: string
  method: string
  callCount: number
  successRate: number
  avgResponseTime: number
}

interface TimeSeriesData {
  date: string
  calls: number
  successRate: number
  avgResponseTime: number
}

interface GeoData {
  country: string
  region: string
  city: string
  callCount: number
}

interface ResourceUsage {
  cpu: number
  memory: number
  timestamp: string
}

interface ClientStats {
  clientId: string
  callCount: number
  lastActive: string
}

export interface StatusCodeStats {
  name: string
  value: number
}

export interface ApiStatistics {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  avgResponseTime: number
  totalCopiedCount: number
  endpoints: EndpointStats[]
  timeSeriesData: TimeSeriesData[]
  statusCodeDistribution: StatusCodeStats[]
  resourceUsage: ResourceUsage
  topClients: ClientStats[]
}

export interface Model {
  id: string
  name: string
  description?: string
  model_type: "classification" | "regression"
  best_algorithm: string
  accuracy?: number
  r2_score?: number
  f1_score?: number
  precision?: number
  recall?: number
  rmse?: number
  mae?: number
  created_at: string
  updated_at?: string
  status: "active" | "inactive"
  input_features?: string[]
  output_feature?: string
  training_data_size?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const trackCodeCopy = async (modelId: string | number, section: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/${modelId}/track-copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ section })
    })
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Error tracking code copy:', error)
    return false
  }
}

export const fetchModelStatistics = async (
  modelId: string,
  days: number = 7
): Promise<ApiStatistics | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/models/${modelId}/statistics?days=${days}`
    )
    const data = await response.json()
    return data.statistics || null
  } catch (error) {
    console.error("Error fetching model statistics:", error)
    return null
  }
}

export const copyToClipboardWithTracking = async (
  text: string,
  modelId: string,
  section: string
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    await trackCodeCopy(modelId, section)
    return true
  } catch (error) {
    console.error("Error copying to clipboard:", error)
    return false
  }
}

// Health check
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

// Get all models
export const fetchModels = async (): Promise<Model[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models`)
    if (!response.ok) throw new Error("Failed to fetch models")
    const data = await response.json()
    return data.models || []
  } catch (error) {
    console.error("Error fetching models:", error)
    return []
  }
}

// Get single model
export const fetchModel = async (id: string): Promise<Model | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/${id}`)
    if (!response.ok) throw new Error("Failed to fetch model")
    const data = await response.json()
    return data.model || null
  } catch (error) {
    console.error("Error fetching model:", error)
    return null
  }
}

// Delete model
export const deleteModel = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: "DELETE",
    })
    return response.ok
  } catch (error) {
    console.error("Error deleting model:", error)
    return false
  }
}

// Update model
export const updateModel = async (id: string, updates: Partial<Model>): Promise<Model | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (!response.ok) throw new Error("Failed to update model")
    const data = await response.json()
    return data.model || null
  } catch (error) {
    console.error("Error updating model:", error)
    return null
  }
}

