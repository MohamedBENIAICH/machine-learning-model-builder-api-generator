#!/usr/bin/env python3
"""
Unified Model API Gateway
Serves all trained models on a single port with model-specific routes.
Routes: /{model_name}/predict and /{model_name}/predict_batch
"""
from flask import Flask, request, jsonify
import pickle
import os
import traceback
import glob
from pathlib import Path
import time
import psutil
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database for tracking
try:
    from database import get_db
    DB_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not import database: {e}")
    DB_AVAILABLE = False

app = Flask(__name__)

# Cache loaded models
models_cache = {}

def sanitize_name(name: str) -> str:
    """Sanitize model name for URL routing"""
    return name.lower().replace(' ', '_').replace('-', '_')

def load_model(model_name: str):
    """Load a model from the models directory"""
    if model_name in models_cache:
        return models_cache[model_name]
    
    # Try to find the model file
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    
    # Look for model files matching the name (case-insensitive)
    all_files = glob.glob(os.path.join(models_dir, "*.pkl"))
    matching_files = [
        f for f in all_files 
        if model_name.lower() in os.path.basename(f).lower()
    ]
    
    if not matching_files:
        return None
    
    # Use the first matching file
    model_path = matching_files[0]
    
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        models_cache[model_name] = model
        print(f"✓ Loaded model: {model_name} from {model_path}")
        return model
    except Exception as e:
        print(f"✗ Failed to load model {model_name}: {e}")
        return None

def predict_input_dict(model, input_dict: dict):
    """Make a prediction with a single input"""
    try:
        # Convert dict to list of values
        if isinstance(input_dict, dict):
            X = [list(input_dict.values())]
        else:
            X = [input_dict]
        
        preds = model.predict(X)
        
        # Convert numpy types to python types
        try:
            result = preds[0].tolist() if hasattr(preds[0], 'tolist') else preds[0]
        except Exception:
            result = preds[0]
        
        return {'success': True, 'prediction': result}
    except Exception as e:
        traceback.print_exc()
        return {'success': False, 'error': str(e)}

def track_api_call(endpoint, method, status_code, response_time_ms, model_id=None):
    """Track API call to database"""
    if not DB_AVAILABLE:
        return
    
    try:
        # Get system metrics
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        memory_usage_mb = memory.used / (1024 * 1024)
        
        db = get_db()
        if db and db.connection:
            cursor = db.connection.cursor()
            query = """
                INSERT INTO api_stats 
                (endpoint, method, status_code, response_time_ms, model_id, client_ip, cpu_percent, memory_usage_mb)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                endpoint,
                method,
                status_code,
                response_time_ms,
                model_id,
                request.remote_addr,
                cpu_percent,
                memory_usage_mb
            ))
            db.connection.commit()
            cursor.close()
    except Exception as e:
        print(f"Warning: Failed to log API stat: {e}")

def get_model_id_from_name(model_name):
    """Extract model ID from model filename"""
    try:
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        all_files = glob.glob(os.path.join(models_dir, "*.pkl"))
        matching_files = [
            f for f in all_files 
            if model_name.lower() in os.path.basename(f).lower()
        ]
        
        if matching_files:
            basename = os.path.basename(matching_files[0])
            # Extract ID from "model_21_ModelTest.pkl"
            parts = basename.replace('.pkl', '').split('_', 2)
            if len(parts) >= 2:
                return int(parts[1])
    except Exception:
        pass
    return None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'success': True, 'models_loaded': len(models_cache)})

@app.route('/<model_name>/predict', methods=['POST'])
def predict(model_name):
    """Single prediction endpoint"""
    start_time = time.time()
    status_code = 200
    
    try:
        # Sanitize the model name
        model_name_clean = sanitize_name(model_name)
        
        # Get model ID for tracking
        model_id = get_model_id_from_name(model_name_clean)
        
        # Load the model
        model = load_model(model_name_clean)
        if model is None:
            status_code = 404
            return jsonify({'success': False, 'error': f'Model "{model_name}" not found'}), status_code
        
        # Parse request
        payload = request.get_json(force=True)
        if not payload:
            status_code = 400
            return jsonify({'success': False, 'error': 'Missing JSON body'}), status_code
        
        # Accept both {"data": {...}} and {"input": {...}} formats
        input_data = payload.get('data') or payload.get('input')
        if input_data is None:
            status_code = 400
            return jsonify({'success': False, 'error': 'Missing "data" or "input" in JSON body'}), status_code
        
        # Make prediction
        result = predict_input_dict(model, input_data)
        status_code = 200 if result.get('success') else 500
        
        return jsonify(result), status_code
    finally:
        # Track the API call
        duration_ms = (time.time() - start_time) * 1000
        track_api_call(
            endpoint=request.path,
            method=request.method,
            status_code=status_code,
            response_time_ms=duration_ms,
            model_id=model_id if 'model_id' in locals() else None
        )

@app.route('/<model_name>/predict_batch', methods=['POST'])
def predict_batch(model_name):
    """Batch prediction endpoint"""
    # Sanitize the model name
    model_name_clean = sanitize_name(model_name)
    
    # Load the model
    model = load_model(model_name_clean)
    if model is None:
        return jsonify({'success': False, 'error': f'Model "{model_name}" not found'}), 404
    
    # Parse request
    payload = request.get_json(force=True)
    if not payload:
        return jsonify({'success': False, 'error': 'Missing JSON body'}), 400
    
    # Accept both {"data": [...]} and {"inputs": [...]} formats
    inputs = payload.get('data') or payload.get('inputs')
    if not inputs or not isinstance(inputs, list):
        return jsonify({'success': False, 'error': 'Missing "data" or "inputs" (list) in JSON body'}), 400
    
    # Make predictions
    results = []
    for inp in inputs:
        result = predict_input_dict(model, inp)
        results.append(result)
    
    return jsonify({'success': True, 'results': results})

@app.route('/models', methods=['GET'])
def list_models():
    """List all available models"""
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    model_files = glob.glob(os.path.join(models_dir, '*.pkl'))
    
    models = []
    for f in model_files:
        basename = os.path.basename(f)
        # Extract model ID and name from filename like "model_18_sklklsd.pkl"
        parts = basename.replace('.pkl', '').split('_', 2)
        if len(parts) >= 3:
            model_id = parts[1]
            model_name = parts[2]
            models.append({
                'id': model_id,
                'name': model_name,
                'endpoint': f'/{sanitize_name(model_name)}/predict'
            })
    
    return jsonify({'success': True, 'models': models})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8001))
    print(f'Starting Unified Model API Gateway on port {port}...')
    print('Available endpoints:')
    print('  GET  /health')
    print('  GET  /models')
    print('  POST /<model_name>/predict')
    print('  POST /<model_name>/predict_batch')
    app.run(host='0.0.0.0', port=port, debug=False)
