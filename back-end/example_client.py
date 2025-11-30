"""
Example Python client for ML Model Builder Backend API
Demonstrates how to use the API endpoints programmatically
"""

import requests
import json
import pandas as pd
from typing import Dict, List, Optional

class MLModelClient:
    """Client for interacting with ML Model Builder Backend API"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        """
        Initialize the API client
        
        Args:
            base_url: Base URL of the API server
        """
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def health_check(self) -> Dict:
        """Check if API is running"""
        try:
            response = self.session.get(f"{self.base_url}/api/health")
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def parse_csv(self, csv_data: str) -> Dict:
        """
        Parse and analyze CSV data
        
        Args:
            csv_data: CSV content as string
        
        Returns:
            Dictionary with columns, sample data, row count, and types
        """
        payload = {"csv_data": csv_data}
        response = self.session.post(f"{self.base_url}/api/parse-csv", json=payload)
        return response.json()
    
    def train_model(self, 
                   model_name: str,
                   csv_data: str,
                   model_type: str,
                   input_features: List[str],
                   output_feature: str,
                   description: str = "") -> Dict:
        """
        Train a new model
        
        Args:
            model_name: Name of the model
            csv_data: CSV content as string
            model_type: 'classification' or 'regression'
            input_features: List of input feature column names
            output_feature: Target column name
            description: Optional model description
        
        Returns:
            Dictionary with training results and model_id
        """
        payload = {
            "model_name": model_name,
            "description": description,
            "model_type": model_type,
            "csv_data": csv_data,
            "input_features": input_features,
            "output_feature": output_feature
        }
        response = self.session.post(f"{self.base_url}/api/train", json=payload)
        return response.json()
    
    def get_models(self, page: int = 1, limit: int = 20) -> Dict:
        """
        Get list of all trained models
        
        Args:
            page: Page number for pagination
            limit: Items per page
        
        Returns:
            Dictionary with models list and pagination info
        """
        params = {"page": page, "limit": limit}
        response = self.session.get(f"{self.base_url}/api/models", params=params)
        return response.json()
    
    def get_model(self, model_id: int) -> Dict:
        """
        Get detailed information about a specific model
        
        Args:
            model_id: ID of the model
        
        Returns:
            Dictionary with model details and training results
        """
        response = self.session.get(f"{self.base_url}/api/models/{model_id}")
        return response.json()
    
    def update_model(self, model_id: int, **kwargs) -> Dict:
        """
        Update model metadata
        
        Args:
            model_id: ID of the model
            **kwargs: Fields to update (model_name, description)
        
        Returns:
            Dictionary with updated model info
        """
        response = self.session.put(f"{self.base_url}/api/models/{model_id}", json=kwargs)
        return response.json()
    
    def delete_model(self, model_id: int) -> Dict:
        """
        Delete a model
        
        Args:
            model_id: ID of the model to delete
        
        Returns:
            Dictionary with success status
        """
        response = self.session.delete(f"{self.base_url}/api/models/{model_id}")
        return response.json()
    
    def predict(self, model_id: int, data: Dict) -> Dict:
        """
        Make a single prediction
        
        Args:
            model_id: ID of the model to use
            data: Dictionary with feature values
        
        Returns:
            Dictionary with prediction result
        """
        payload = {"data": data}
        response = self.session.post(f"{self.base_url}/api/models/{model_id}/predict", json=payload)
        return response.json()
    
    def batch_predict(self, model_id: int, data_list: List[Dict]) -> Dict:
        """
        Make multiple predictions at once
        
        Args:
            model_id: ID of the model to use
            data_list: List of dictionaries with feature values
        
        Returns:
            Dictionary with prediction results
        """
        payload = {"data": data_list}
        response = self.session.post(f"{self.base_url}/api/models/{model_id}/batch-predict", json=payload)
        return response.json()


# ============================================================
# Example Usage
# ============================================================

if __name__ == "__main__":
    # Initialize client
    client = MLModelClient("http://localhost:5000")
    
    # 1. Health check
    print("1. Health Check")
    print("-" * 50)
    health = client.health_check()
    print(json.dumps(health, indent=2))
    print()
    
    # 2. Create sample CSV data
    print("2. Prepare Sample Data")
    print("-" * 50)
    csv_data = """age,income,credit_score,approved
25,30000,600,0
35,60000,700,1
45,80000,750,1
28,45000,620,0
55,120000,800,1
32,50000,680,0
48,95000,780,1
22,25000,550,0
60,150000,820,1
30,55000,710,1"""
    
    print("Sample data:")
    print(csv_data)
    print()
    
    # 3. Parse CSV
    print("3. Parse CSV")
    print("-" * 50)
    parse_result = client.parse_csv(csv_data)
    print(json.dumps(parse_result, indent=2))
    print()
    
    # 4. Train model
    print("4. Train Classification Model")
    print("-" * 50)
    train_result = client.train_model(
        model_name="Loan Approval Classifier",
        description="Predicts loan approval based on customer data",
        model_type="classification",
        csv_data=csv_data,
        input_features=["age", "income", "credit_score"],
        output_feature="approved"
    )
    print(json.dumps(train_result, indent=2))
    
    if train_result.get("success"):
        model_id = train_result["model_id"]
        print(f"\n✓ Model trained successfully! Model ID: {model_id}\n")
        
        # 5. Get all models
        print("5. Get All Models")
        print("-" * 50)
        models = client.get_models()
        print(json.dumps(models, indent=2))
        print()
        
        # 6. Get specific model details
        print("6. Get Model Details")
        print("-" * 50)
        model_details = client.get_model(model_id)
        print(json.dumps(model_details, indent=2))
        print()
        
        # 7. Make single prediction
        print("7. Make Single Prediction")
        print("-" * 50)
        test_data = {
            "age": 38,
            "income": 72000,
            "credit_score": 730
        }
        prediction = client.predict(model_id, test_data)
        print(f"Input: {test_data}")
        print(json.dumps(prediction, indent=2))
        print()
        
        # 8. Make batch predictions
        print("8. Make Batch Predictions")
        print("-" * 50)
        batch_data = [
            {"age": 25, "income": 35000, "credit_score": 620},
            {"age": 45, "income": 85000, "credit_score": 760},
            {"age": 50, "income": 110000, "credit_score": 800}
        ]
        batch_predictions = client.batch_predict(model_id, batch_data)
        print(json.dumps(batch_predictions, indent=2))
        print()
        
        # 9. Update model
        print("9. Update Model Metadata")
        print("-" * 50)
        updated = client.update_model(
            model_id,
            model_name="Updated Loan Classifier",
            description="Updated description for the model"
        )
        print(json.dumps(updated, indent=2))
        print()
        
        # Note: Uncommenting the line below will delete the model
        # print("10. Delete Model")
        # print("-" * 50)
        # deleted = client.delete_model(model_id)
        # print(json.dumps(deleted, indent=2))
    
    else:
        print(f"\n✗ Training failed: {train_result.get('error')}\n")

"""
=============================================================
Example Output:

1. Health Check
--------------------------------------------------
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-27T10:30:00.000000"
}

2. Prepare Sample Data
--------------------------------------------------
Sample data: [CSV content]

3. Parse CSV
--------------------------------------------------
{
  "success": true,
  "columns": ["age", "income", "credit_score", "approved"],
  "sample_data": [...],
  "row_count": 10,
  "column_types": {...}
}

4. Train Classification Model
--------------------------------------------------
{
  "success": true,
  "model_id": 1,
  "model_name": "Loan Approval Classifier",
  "model_type": "classification",
  "best_model": "Random Forest",
  "results": [
    {
      "algorithm": "Random Forest",
      "metrics": {
        "accuracy": 0.8,
        "precision": 0.8,
        "recall": 0.8,
        "f1_score": 0.8
      },
      "score": 0.8
    }
  ],
  "justification": "Random Forest was selected..."
}

7. Make Single Prediction
--------------------------------------------------
{
  "success": true,
  "model_id": 1,
  "model_name": "Loan Approval Classifier",
  "prediction": 1
}

8. Make Batch Predictions
--------------------------------------------------
{
  "success": true,
  "model_id": 1,
  "model_name": "Loan Approval Classifier",
  "predictions": [
    {"input": {...}, "prediction": 0},
    {"input": {...}, "prediction": 1},
    {"input": {...}, "prediction": 1}
  ]
}

=============================================================
"""
