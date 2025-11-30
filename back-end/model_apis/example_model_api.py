#!/usr/bin/env python3
"""
Example generated Flask app for serving a trained model.
This file is an example of what the generator creates. To create a file for your actual model use:

python back-end/tools/generate_model_api.py --model-id 1

Then run the generated file:
python back-end/model_apis/your_model_name.py

Requests:
Single prediction:
curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d '{"input": {"age": 35, "income": 45000}}'

Batch prediction:
curl -X POST http://localhost:8000/predict_batch -H "Content-Type: application/json" -d '{"inputs": [{"age": 35, "income": 45000}, {"age": 28, "income": 38000}]}'
"""
from flask import Flask, request, jsonify
import pickle
import json
import os
import traceback

try:
    # Use project's preprocessing if available
    from model_serializer import PreprocessingPipeline
except Exception:
    PreprocessingPipeline = None

app = Flask(__name__)

# TODO: update this path to the real pickle for the model you want to serve
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'example_model.pkl'))
metadata = {}

try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
    else:
        model = None
        print('Model pickle not found at', MODEL_PATH)
except Exception as e:
    print('Failed to load model pickle:', e)
    model = None

preprocessor = None
if PreprocessingPipeline is not None and metadata:
    try:
        preprocessor = PreprocessingPipeline(
            label_encoders=metadata.get('label_encoders'),
            scaler=metadata.get('scaler')
        )
    except Exception as e:
        print('Failed to init PreprocessingPipeline:', e)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'success': True, 'loaded': model is not None})


def predict_input_dict(input_dict: dict):
    try:
        if preprocessor is not None and metadata:
            input_features = metadata.get('input_features') or list(input_dict.keys())
            X = preprocessor.preprocess_input(input_dict, input_features)
        else:
            X = [list(input_dict.values())]

        preds = model.predict(X)
        try:
            result = preds[0].tolist() if hasattr(preds[0], 'tolist') else preds[0]
        except Exception:
            result = preds[0]
        return {'success': True, 'prediction': result}
    except Exception as e:
        traceback.print_exc()
        return {'success': False, 'error': str(e)}


@app.route('/predict', methods=['POST'])
def predict():
    payload = request.get_json(force=True)
    input_data = payload.get('input') if isinstance(payload, dict) else payload
    if input_data is None:
        return jsonify({'success': False, 'error': 'Missing "input" in JSON body'}), 400
    res = predict_input_dict(input_data)
    return jsonify(res)


@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    payload = request.get_json(force=True)
    inputs = payload.get('inputs') if isinstance(payload, dict) else payload
    if not inputs or not isinstance(inputs, list):
        return jsonify({'success': False, 'error': 'Missing "inputs" (list) in JSON body'}), 400
    results = []
    for inp in inputs:
        r = predict_input_dict(inp)
        results.append(r)
    return jsonify({'success': True, 'results': results})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
