#!/usr/bin/env python3
"""
Comprehensive API Testing Script for ML Model Backend

Tests all 12 endpoints:
1. POST /api/parse-csv
2. POST /api/train
3. GET /api/models
4. GET /api/models/<id>
5. PUT /api/models/<id>
6. POST /api/models/<id>/predict
7. POST /api/models/<id>/batch-predict
8. DELETE /api/models/<id>
9. GET /api/health

Run this script while the Flask server is running on http://localhost:5000
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
HEADERS = {"Content-Type": "application/json"}

# Sample data
SAMPLE_CSV = """age,income,approved
25,30000,No
35,45000,Yes
28,38000,No
42,55000,Yes
31,42000,No
38,50000,Yes
26,32000,No
45,60000,Yes
29,40000,No
40,52000,Yes
27,35000,No
44,58000,Yes"""

CLASSIFICATION_DATA = {
    "model_name": "Loan Approval Model",
    "description": "Classification model to predict loan approval",
    "model_type": "classification",
    "csv_data": SAMPLE_CSV,
    "input_features": ["age", "income"],
    "output_feature": "approved"
}

REGRESSION_CSV = """house_size,price
1000,150000
1500,200000
2000,250000
2500,300000
1200,160000
1800,230000
2200,270000
3000,350000
1100,155000
2100,260000"""

REGRESSION_DATA = {
    "model_name": "House Price Prediction",
    "description": "Regression model to predict house prices",
    "model_type": "regression",
    "csv_data": REGRESSION_CSV,
    "input_features": ["house_size"],
    "output_feature": "price"
}

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    """Print a formatted header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^70}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}\n")

def print_test(test_num, endpoint, method):
    """Print test information"""
    print(f"{Colors.CYAN}{Colors.BOLD}TEST {test_num}: {method} {endpoint}{Colors.END}")
    print(f"{Colors.CYAN}{'-'*70}{Colors.END}")

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def print_response(response):
    """Print formatted response"""
    try:
        print(f"{Colors.YELLOW}Response Status: {response.status_code}{Colors.END}")
        print(f"{Colors.YELLOW}Response JSON:{Colors.END}")
        print(json.dumps(response.json(), indent=2))
    except:
        print(f"{Colors.YELLOW}Response Text:{Colors.END}")
        print(response.text)

def test_health():
    """Test 1: Health Check"""
    print_test(1, "/api/health", "GET")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", headers=HEADERS)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Health check passed - Database: {data.get('database')}")
            return True
        else:
            print_error(f"Expected status 200, got {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to server at http://localhost:5000")
        print_info("Make sure the Flask server is running: python3 app.py")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_parse_csv():
    """Test 2: Parse CSV"""
    print_test(2, "/api/parse-csv", "POST")
    
    payload = {"csv_data": SAMPLE_CSV}
    print_info(f"Payload: {json.dumps(payload, indent=2)[:100]}...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/parse-csv",
            headers=HEADERS,
            json=payload
        )
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"CSV parsed successfully - Columns: {data.get('columns')}")
            print_success(f"Rows: {data.get('row_count')}")
            return True
        else:
            print_error(f"Failed to parse CSV: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_train_classification():
    """Test 3: Train Classification Model"""
    print_test(3, "/api/train", "POST (Classification)")
    
    print_info(f"Model Type: {CLASSIFICATION_DATA['model_type']}")
    print_info(f"Input Features: {CLASSIFICATION_DATA['input_features']}")
    print_info(f"Output Feature: {CLASSIFICATION_DATA['output_feature']}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/train",
            headers=HEADERS,
            json=CLASSIFICATION_DATA,
            timeout=60
        )
        print_response(response)
        
        if response.status_code == 201:
            data = response.json()
            model_id = data.get('model_id')
            best_model = data.get('best_model')
            print_success(f"Classification model trained - ID: {model_id}, Best Algorithm: {best_model}")
            print_info(f"Justification: {data.get('justification')}")
            return model_id
        else:
            print_error(f"Failed to train model: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def test_train_regression():
    """Test 4: Train Regression Model"""
    print_test(4, "/api/train", "POST (Regression)")
    
    print_info(f"Model Type: {REGRESSION_DATA['model_type']}")
    print_info(f"Input Features: {REGRESSION_DATA['input_features']}")
    print_info(f"Output Feature: {REGRESSION_DATA['output_feature']}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/train",
            headers=HEADERS,
            json=REGRESSION_DATA,
            timeout=60
        )
        print_response(response)
        
        if response.status_code == 201:
            data = response.json()
            model_id = data.get('model_id')
            best_model = data.get('best_model')
            print_success(f"Regression model trained - ID: {model_id}, Best Algorithm: {best_model}")
            print_info(f"Justification: {data.get('justification')}")
            return model_id
        else:
            print_error(f"Failed to train model: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def test_get_models():
    """Test 5: Get All Models"""
    print_test(5, "/api/models", "GET")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/models?page=1&limit=10",
            headers=HEADERS
        )
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            model_count = len(data.get('models', []))
            print_success(f"Retrieved {model_count} models")
            return True
        else:
            print_error(f"Failed to get models: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_get_model(model_id):
    """Test 6: Get Specific Model"""
    print_test(6, f"/api/models/{model_id}", "GET")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/models/{model_id}",
            headers=HEADERS
        )
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            model_name = data.get('model', {}).get('model_name')
            print_success(f"Retrieved model: {model_name}")
            return True
        else:
            print_error(f"Failed to get model: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_update_model(model_id):
    """Test 7: Update Model"""
    print_test(7, f"/api/models/{model_id}", "PUT")
    
    update_data = {
        "description": "Updated description - Model tested on 2025-11-27"
    }
    print_info(f"Update payload: {json.dumps(update_data, indent=2)}")
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/models/{model_id}",
            headers=HEADERS,
            json=update_data
        )
        print_response(response)
        
        if response.status_code == 200:
            print_success("Model updated successfully")
            return True
        else:
            print_error(f"Failed to update model: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_predict(model_id):
    """Test 8: Single Prediction"""
    print_test(8, f"/api/models/{model_id}/predict", "POST")
    
    prediction_data = {
        "data": {
            "age": 32,
            "income": 45000
        }
    }
    print_info(f"Prediction input: {json.dumps(prediction_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/models/{model_id}/predict",
            headers=HEADERS,
            json=prediction_data
        )
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            prediction = data.get('prediction')
            print_success(f"Prediction: {prediction}")
            return True
        else:
            print_error(f"Failed to make prediction: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_batch_predict(model_id):
    """Test 9: Batch Predictions"""
    print_test(9, f"/api/models/{model_id}/batch-predict", "POST")
    
    batch_data = {
        "data": [
            {"age": 25, "income": 30000},
            {"age": 35, "income": 50000},
            {"age": 45, "income": 60000}
        ]
    }
    print_info(f"Batch size: {len(batch_data['data'])} samples")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/models/{model_id}/batch-predict",
            headers=HEADERS,
            json=batch_data
        )
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            predictions = data.get('predictions', [])
            print_success(f"Batch predictions made: {len(predictions)} results")
            return True
        else:
            print_error(f"Failed to make batch predictions: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_delete_model(model_id):
    """Test 10: Delete Model"""
    print_test(10, f"/api/models/{model_id}", "DELETE")
    
    print_info(f"This will delete model ID {model_id}")
    
    try:
        response = requests.delete(
            f"{BASE_URL}/api/models/{model_id}",
            headers=HEADERS
        )
        print_response(response)
        
        if response.status_code == 200:
            print_success(f"Model {model_id} deleted successfully")
            return True
        else:
            print_error(f"Failed to delete model: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print_header("ML MODEL BACKEND API - COMPREHENSIVE TEST SUITE")
    print_info(f"Testing server at: {BASE_URL}")
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test 1: Health Check
    print("\n" + "="*70)
    results['health'] = test_health()
    if not results['health']:
        print_error("Server is not responding. Make sure it's running.")
        return results
    
    input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
    
    # Test 2: Parse CSV
    print("\n" + "="*70)
    results['parse_csv'] = test_parse_csv()
    input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
    
    # Test 3: Train Classification Model
    print("\n" + "="*70)
    classification_model_id = test_train_classification()
    results['train_classification'] = classification_model_id is not None
    input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
    
    # Test 4: Train Regression Model
    print("\n" + "="*70)
    regression_model_id = test_train_regression()
    results['train_regression'] = regression_model_id is not None
    input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
    
    # Test 5: Get All Models
    print("\n" + "="*70)
    results['get_models'] = test_get_models()
    input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
    
    # Test 6-9: Model-specific operations (using classification model)
    if classification_model_id:
        # Test 6: Get Specific Model
        print("\n" + "="*70)
        results['get_model'] = test_get_model(classification_model_id)
        input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
        
        # Test 7: Update Model
        print("\n" + "="*70)
        results['update_model'] = test_update_model(classification_model_id)
        input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
        
        # Test 8: Single Prediction
        print("\n" + "="*70)
        results['predict'] = test_predict(classification_model_id)
        input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
        
        # Test 9: Batch Predictions
        print("\n" + "="*70)
        results['batch_predict'] = test_batch_predict(classification_model_id)
        input(f"\n{Colors.YELLOW}Press ENTER to continue to next test...{Colors.END}")
    
    # Print Summary
    print_header("TEST SUMMARY")
    
    test_names = {
        'health': 'Health Check (GET /api/health)',
        'parse_csv': 'Parse CSV (POST /api/parse-csv)',
        'train_classification': 'Train Classification (POST /api/train)',
        'train_regression': 'Train Regression (POST /api/train)',
        'get_models': 'Get Models (GET /api/models)',
        'get_model': 'Get Model (GET /api/models/<id>)',
        'update_model': 'Update Model (PUT /api/models/<id>)',
        'predict': 'Single Prediction (POST /api/models/<id>/predict)',
        'batch_predict': 'Batch Predictions (POST /api/models/<id>/batch-predict)',
    }
    
    passed = 0
    failed = 0
    
    for test_key, test_name in test_names.items():
        if test_key in results:
            status = "✅ PASSED" if results[test_key] else "❌ FAILED"
            if results[test_key]:
                passed += 1
            else:
                failed += 1
            print(f"{status} - {test_name}")
    
    print(f"\n{Colors.BOLD}Total: {passed} passed, {failed} failed{Colors.END}")
    
    if failed == 0:
        print_success("All tests passed! 🎉")
    else:
        print_error(f"{failed} test(s) failed. Check the output above for details.")
    
    print(f"\n{Colors.YELLOW}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}\n")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.END}")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)
