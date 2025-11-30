#!/usr/bin/env python3
"""
Quick API Test - Non-interactive version
Tests all endpoints quickly without waiting for user input
"""

import requests
import json

BASE_URL = "http://localhost:5000"
HEADERS = {"Content-Type": "application/json"}

print("="*70)
print("QUICK BACKEND API TEST")
print("="*70)

# Test 1: Health Check
print("\n✓ TEST 1: Health Check")
try:
    r = requests.get(f"{BASE_URL}/api/health")
    print(f"  Status: {r.status_code}")
    print(f"  Database: {r.json()['database']}")
except Exception as e:
    print(f"  Error: {e}")

# Test 2: Parse CSV
print("\n✓ TEST 2: Parse CSV")
csv_data = "age,income,approved\n25,30000,No\n35,45000,Yes\n28,38000,No\n42,55000,Yes"
try:
    r = requests.post(f"{BASE_URL}/api/parse-csv", headers=HEADERS, json={"csv_data": csv_data})
    print(f"  Status: {r.status_code}")
    data = r.json()
    print(f"  Columns: {data['columns']}")
    print(f"  Rows: {data['row_count']}")
except Exception as e:
    print(f"  Error: {e}")

# Test 3: Train Classification Model
print("\n✓ TEST 3: Train Classification Model")
train_data = {
    "model_name": "Quick Test Classification",
    "model_type": "classification",
    "csv_data": "age,income,approved\n25,30000,No\n35,45000,Yes\n28,38000,No\n42,55000,Yes\n31,42000,No\n38,50000,Yes\n26,32000,No\n45,60000,Yes",
    "input_features": ["age", "income"],
    "output_feature": "approved"
}
try:
    r = requests.post(f"{BASE_URL}/api/train", headers=HEADERS, json=train_data, timeout=60)
    print(f"  Status: {r.status_code}")
    data = r.json()
    model_id = data.get('model_id')
    print(f"  Model ID: {model_id}")
    print(f"  Best Algorithm: {data.get('best_model')}")
    print(f"  Accuracy: {data['results'][0]['metrics']['accuracy']}")
except Exception as e:
    print(f"  Error: {e}")
    model_id = None

if model_id:
    # Test 4: Get All Models
    print("\n✓ TEST 4: List All Models")
    try:
        r = requests.get(f"{BASE_URL}/api/models", headers=HEADERS)
        print(f"  Status: {r.status_code}")
        data = r.json()
        print(f"  Total Models: {data['pagination']['total']}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 5: Get Specific Model
    print(f"\n✓ TEST 5: Get Model Details (ID: {model_id})")
    try:
        r = requests.get(f"{BASE_URL}/api/models/{model_id}", headers=HEADERS)
        print(f"  Status: {r.status_code}")
        data = r.json()
        model = data['model']
        print(f"  Name: {model['model_name']}")
        print(f"  Type: {model['model_type']}")
        print(f"  Algorithm: {model['best_algorithm']}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 6: Make Single Prediction
    print(f"\n✓ TEST 6: Single Prediction (Model ID: {model_id})")
    try:
        pred_data = {"data": {"age": 32, "income": 45000}}
        r = requests.post(f"{BASE_URL}/api/models/{model_id}/predict", headers=HEADERS, json=pred_data)
        print(f"  Status: {r.status_code}")
        data = r.json()
        print(f"  Prediction: {data['prediction']}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 7: Batch Predictions
    print(f"\n✓ TEST 7: Batch Predictions (Model ID: {model_id})")
    try:
        batch_data = {
            "data": [
                {"age": 25, "income": 30000},
                {"age": 40, "income": 55000},
                {"age": 50, "income": 65000}
            ]
        }
        r = requests.post(f"{BASE_URL}/api/models/{model_id}/batch-predict", headers=HEADERS, json=batch_data)
        print(f"  Status: {r.status_code}")
        data = r.json()
        predictions = data['predictions']
        print(f"  Predictions made: {len(predictions)}")
        for i, pred in enumerate(predictions):
            print(f"    Sample {i+1}: {pred['prediction']}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 8: Update Model
    print(f"\n✓ TEST 8: Update Model (ID: {model_id})")
    try:
        update_data = {"description": "Updated via quick test"}
        r = requests.put(f"{BASE_URL}/api/models/{model_id}", headers=HEADERS, json=update_data)
        print(f"  Status: {r.status_code}")
        print(f"  Updated: {'Yes' if r.status_code == 200 else 'No'}")
    except Exception as e:
        print(f"  Error: {e}")

print("\n" + "="*70)
print("TEST COMPLETED")
print("="*70 + "\n")
