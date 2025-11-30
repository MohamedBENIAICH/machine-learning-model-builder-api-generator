# ML Model Builder - Backend API Documentation

## 🚀 Overview

The backend is a Flask-based REST API that:
1. **Trains** machine learning models on datasets
2. **Automatically selects** the best performing algorithm
3. **Stores models** in MySQL database with metadata
4. **Serves predictions** via REST API endpoints
5. **Manages** model lifecycle (CRUD operations)

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- MySQL Server running
- pip (Python package manager)

### 1. Install Dependencies

```bash
cd back-end
pip install -r requirements.txt
```

### 2. Configure Database

Create a `.env` file in the `back-end` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=ml_models
DB_PORT=3306

# Flask Configuration
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-change-in-production

# Model Storage
MODEL_STORAGE_PATH=./models
```

### 3. Initialize Database

First, create the MySQL database:

```bash
mysql -u root -p -e "CREATE DATABASE ml_models;"
```

Then run the Flask app, which will auto-create tables:

```bash
python app.py
```

## 🔌 API Endpoints

### Training & Storage

#### **POST** `/api/train`
Train a new model and save it to the database.

**Request Body:**
```json
{
  "model_name": "Loan Approval Model",
  "description": "Predicts loan approval status",
  "model_type": "classification",
  "csv_data": "CSV content as string",
  "input_features": ["age", "income", "credit_score"],
  "output_feature": "approved"
}
```

**Response:**
```json
{
  "success": true,
  "model_id": 1,
  "model_name": "Loan Approval Model",
  "model_type": "classification",
  "best_model": "Random Forest",
  "results": [
    {
      "algorithm": "Random Forest",
      "metrics": {
        "accuracy": 0.95,
        "precision": 0.93,
        "recall": 0.92,
        "f1_score": 0.925
      },
      "score": 0.925
    }
  ],
  "justification": "Random Forest was selected..."
}
```

### Model Management

#### **GET** `/api/models`
Get all trained models with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)

**Response:**
```json
{
  "success": true,
  "models": [
    {
      "id": 1,
      "model_name": "Loan Approval Model",
      "model_type": "classification",
      "best_algorithm": "Random Forest",
      "accuracy": 0.925,
      "created_at": "2025-11-27T10:30:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### **GET** `/api/models/<model_id>`
Get detailed information about a specific model.

**Response:**
```json
{
  "success": true,
  "model": {
    "id": 1,
    "model_name": "Loan Approval Model",
    "description": "Predicts loan approval status",
    "model_type": "classification",
    "best_algorithm": "Random Forest",
    "metrics": {
      "accuracy": 0.95,
      "precision": 0.93,
      "recall": 0.92,
      "f1_score": 0.925
    },
    "input_features": ["age", "income", "credit_score"],
    "output_feature": "approved",
    "created_at": "2025-11-27T10:30:00"
  },
  "training_results": [
    {
      "algorithm_name": "Random Forest",
      "metrics": {...},
      "score": 0.925
    }
  ]
}
```

#### **PUT** `/api/models/<model_id>`
Update model metadata.

**Request Body:**
```json
{
  "model_name": "Updated Model Name",
  "description": "Updated description"
}
```

#### **DELETE** `/api/models/<model_id>`
Delete a model (removes both database record and model file).

### Predictions

#### **POST** `/api/models/<model_id>/predict`
Make a single prediction using a trained model.

**Request Body:**
```json
{
  "data": {
    "age": 35,
    "income": 75000,
    "credit_score": 720
  }
}
```

**Response:**
```json
{
  "success": true,
  "model_id": 1,
  "model_name": "Loan Approval Model",
  "prediction": "approved"
}
```

#### **POST** `/api/models/<model_id>/batch-predict`
Make multiple predictions at once.

**Request Body:**
```json
{
  "data": [
    {"age": 35, "income": 75000, "credit_score": 720},
    {"age": 42, "income": 95000, "credit_score": 750},
    {"age": 28, "income": 45000, "credit_score": 650}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "model_id": 1,
  "model_name": "Loan Approval Model",
  "predictions": [
    {
      "input": {"age": 35, "income": 75000, "credit_score": 720},
      "prediction": "approved"
    },
    {
      "input": {"age": 42, "income": 95000, "credit_score": 750},
      "prediction": "approved"
    },
    {
      "input": {"age": 28, "income": 45000, "credit_score": 650},
      "prediction": "denied"
    }
  ]
}
```

### Utility

#### **POST** `/api/parse-csv`
Parse and analyze CSV data.

**Request Body:**
```json
{
  "csv_data": "CSV content as string"
}
```

**Response:**
```json
{
  "success": true,
  "columns": ["age", "income", "credit_score", "approved"],
  "sample_data": [...],
  "row_count": 1000,
  "column_types": {
    "age": "int64",
    "income": "int64",
    "credit_score": "int64",
    "approved": "object"
  }
}
```

#### **GET** `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-27T10:30:00.000000"
}
```

## 📁 Database Schema

### Tables

#### `models`
Stores trained model information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| model_name | VARCHAR | User-friendly model name |
| description | TEXT | Model description |
| model_type | ENUM | 'classification' or 'regression' |
| best_algorithm | VARCHAR | Selected best algorithm |
| metrics | JSON | Performance metrics |
| justification | TEXT | Why this model was selected |
| model_file_path | VARCHAR | Path to serialized model |
| input_features | JSON | List of input feature names |
| output_feature | VARCHAR | Target feature name |
| accuracy | FLOAT | Primary performance score |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `training_results`
Stores all algorithm results for a model.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| model_id | INT | Foreign key to models |
| algorithm_name | VARCHAR | Algorithm name |
| metrics | JSON | Metrics for this algorithm |
| score | FLOAT | Primary score |

#### `predictions`
Stores prediction history for audit/analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| model_id | INT | Foreign key to models |
| input_data | JSON | Input features |
| prediction | JSON | Predicted result |
| created_at | TIMESTAMP | Prediction timestamp |

## 📊 Supported Algorithms

### Classification
- Logistic Regression
- Decision Tree
- Random Forest
- Gradient Boosting
- Support Vector Machine
- Naive Bayes
- K-Nearest Neighbors

### Regression
- Linear Regression
- Ridge Regression
- Lasso Regression
- Decision Tree
- Random Forest
- Gradient Boosting
- Support Vector Machine
- K-Nearest Neighbors

## 🔧 Model Serialization

Models are stored as pickle files in the `models/` directory:
- **Model file**: `model_{id}_{name}.pkl`
- **Metadata file**: `metadata_{id}.json`

Metadata includes:
- Label encoders for categorical features
- Scaler parameters for feature scaling
- Input/output feature information
- Model type

## 🚀 Running the Server

```bash
# Development mode (with auto-reload)
python app.py

# Production mode (with gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

The API will be available at `http://localhost:5000`

## 📝 Example Workflow

### 1. Prepare Data
```bash
curl -X POST http://localhost:5000/api/parse-csv \
  -H "Content-Type: application/json" \
  -d '{"csv_data": "your,csv,data,here"}'
```

### 2. Train Model
```bash
curl -X POST http://localhost:5000/api/train \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "My Model",
    "description": "Test model",
    "model_type": "classification",
    "csv_data": "your,csv,data",
    "input_features": ["feature1", "feature2"],
    "output_feature": "target"
  }'
```

### 3. Get Model Details
```bash
curl http://localhost:5000/api/models/1
```

### 4. Make Predictions
```bash
curl -X POST http://localhost:5000/api/models/1/predict \
  -H "Content-Type: application/json" \
  -d '{"data": {"feature1": 10, "feature2": 20}}'
```

## ⚠️ Error Handling

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Detailed error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created (for training)
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

## 🔐 Security Notes

- Change `SECRET_KEY` in production
- Use environment variables for sensitive data
- Implement authentication/authorization as needed
- Validate all user inputs
- Use HTTPS in production

## 📞 Support

For issues or questions, please refer to the main project documentation.
