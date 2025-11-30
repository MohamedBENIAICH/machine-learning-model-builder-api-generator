# Frontend Console Logging Setup

## Overview
Added comprehensive console logging to the frontend API layer to track all data being sent to and received from the backend.

## Changes Made

### File: `frontend_/lib/api.ts`

#### 1. **Health Check Logging**
```typescript
console.log("🏥 Checking health at:", `${API_BASE_URL}/health`)
console.log(isHealthy ? "✅ Backend is healthy" : "❌ Backend health check failed")
```

#### 2. **Fetch Models Logging**
```typescript
console.log("📥 Fetching all models from:", `${API_BASE_URL}/models`)
console.log("✅ Models fetched successfully:", data.models?.length, "models")
```

#### 3. **Fetch Single Model Logging**
```typescript
console.log("📥 Fetching model:", id, "from:", `${API_BASE_URL}/models/${id}`)
console.log("✅ Model fetched successfully:", data.model)
```

#### 4. **Train Model Logging** ⭐ (Most Important)
The most comprehensive logging group showing exactly what is being sent to the backend:

**Request Payload Logging:**
```typescript
console.group("🚀 Training Model - Request Payload")
console.log("Model Name:", payload.model_name)
console.log("Description:", payload.description)
console.log("Model Type:", payload.model_type)
console.log("Input Features:", payload.input_features)
console.log("Output Feature:", payload.output_feature)
console.log("CSV Data (first 300 chars):", payload.csv_data.substring(0, 300) + "...")
console.log("CSV Data Total Length:", payload.csv_data.length, "characters")
console.log("Full Payload:", payload)
console.groupEnd()
```

**Request Sending:**
```typescript
console.log(`📤 Sending POST request to: ${API_BASE_URL}/train`)
```

**Response Logging:**
```typescript
console.group("✅ Training Model - Response Received")
console.log("Status:", response.status, response.statusText)
console.log("Response Data:", data)
if (data.results) {
  console.log("Training Results:")
  data.results.forEach((result: any) => {
    console.log(`  - ${result.algorithm}: ${JSON.stringify(result.metrics)}`)
  })
}
console.log("Best Model:", data.best_model)
console.log("Justification:", data.justification)
console.groupEnd()
```

**Error Logging:**
```typescript
console.error("❌ Error training model:", error)
```

## How to View Logs

### In Browser Developer Console:
1. Open your browser's **Developer Tools** (F12 or Cmd+Option+I on Mac)
2. Go to the **Console** tab
3. When you submit the training form, you'll see:
   - 🚀 Collapsed group with "Training Model - Request Payload"
   - 📤 Message showing the POST request URL
   - ✅ Collapsed group with "Training Model - Response Received"
   - Individual log entries for each API call

### Console Output Example:
```
🏥 Checking health at: http://localhost:5000/api/health
✅ Backend is healthy

🚀 Training Model - Request Payload
  Model Name: Loan Approval Model
  Description: Training with loan data
  Model Type: classification
  Input Features: ['age', 'income']
  Output Feature: 'approved'
  CSV Data (first 300 chars): age,income,approved
  25,30000,No
  35,45000,Yes...
  CSV Data Total Length: 125 characters
  Full Payload: {model_name: 'Loan Approval Model', ...}

📤 Sending POST request to: http://localhost:5000/api/train

✅ Training Model - Response Received
  Status: 201 Created
  Response Data: {success: true, model_id: 13, ...}
  Training Results:
    - Logistic Regression: {"accuracy":1,"f1_score":1,"precision":1,"recall":1}
    - Decision Tree: {"accuracy":1,"f1_score":1,"precision":1,"recall":1}
  Best Model: Logistic Regression
  Justification: "Logistic Regression was selected as..."
```

## Color Coding
- 🏥 = Health check operations
- 📥 = Data fetching from backend
- 📤 = Sending data to backend
- 🚀 = Training initiated
- ✅ = Success operations
- ❌ = Errors

## Debugging Tips

1. **Check what data is being sent**: Expand the "Request Payload" group to see all fields
2. **Verify CSV formatting**: Check "CSV Data" to ensure the CSV is properly formatted
3. **Track API status**: Look for response status codes (201 = Created, 400 = Bad Request, etc.)
4. **Monitor model training**: See individual algorithm results in the "Training Results" section
5. **Trace errors**: Check the console for red ❌ error messages with full stack traces

## Backend Logs

The backend also logs incoming requests. To see backend logs:
```bash
cd /home/mohamed/Desktop/BEN/machine-learning-model-builder/back-end
tail -f server.log
```

Backend will show:
```
================================================================================
📨 INCOMING TRAINING REQUEST FROM FRONTEND
================================================================================
Model Name: Loan Approval Model
Description: Training with loan data
Model Type: classification
Input Features: ['age', 'income']
Output Feature: approved
CSV Data (first 200 chars): age,income,approved
25,30000,No
35,45000,Yes...
CSV Data Total Length: 125 characters
================================================================================

✅ CSV parsed successfully!
   Dataset shape: 4 rows × 3 columns
   Columns: ['age', 'income', 'approved']
   Data preview:
      age  income approved
   0   25   30000       No
   1   35   45000      Yes
   2   28   38000       No
   3   42   55000      Yes

🚀 Starting training with model type: classification
   Input features: ['age', 'income']
   Output feature: approved

✅ Training completed!
   Best Model: Logistic Regression
   All Results:
      - Logistic Regression: {'accuracy': 1.0, ...} (score: 1.0000)
      - Decision Tree: {'accuracy': 1.0, ...} (score: 1.0000)
   Justification: "Logistic Regression was selected as..."

💾 Model saved successfully!
   Model ID: 13
   Model Path: /path/to/models/model_13_Loan_Approval_Model.pkl
   Metadata Path: /path/to/models/metadata_13.json
```

## Files Modified
- ✅ `frontend_/lib/api.ts` - Added comprehensive console logging to all API functions

## Testing
To test the logging:
1. Start the frontend: `cd frontend_ && npm run dev`
2. Start the backend: `cd back-end && python3 app.py`
3. Open browser console (F12)
4. Upload a CSV file and submit the training form
5. Watch the logs appear in real-time in both browser console and backend terminal

