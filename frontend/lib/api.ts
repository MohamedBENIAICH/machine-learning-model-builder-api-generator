// API integration layer for ML Model Manager
// All API calls to Flask backend at http://localhost:5000

export const API_BASE_URL = "http://localhost:5000/api"

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
