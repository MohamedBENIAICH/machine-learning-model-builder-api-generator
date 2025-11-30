# Model APIs

This folder contains Flask apps generated to serve individual trained models (pickles).

Generator script:

```
python ../tools/generate_model_api.py --model-id 1
```

This will create a file named after the model (sanitized) in this directory, e.g. `loan_approval_model.py`.

Run the generated app:

```bash
python loan_approval_model.py
# or
python -m flask run --host=0.0.0.0 -p 8000
```

Endpoints:
- GET /health -> check loaded status
- POST /predict -> JSON {"input": {...}}
- POST /predict_batch -> JSON {"inputs": [{...}, {...}]}

Example curl (single):

```bash
curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" \
  -d '{"input": {"age": 35, "income": 45000}}'
```

Example curl (batch):

```bash
curl -X POST http://localhost:8000/predict_batch -H "Content-Type: application/json" \
  -d '{"inputs": [{"age": 35, "income": 45000}, {"age": 28, "income": 38000}]}'
```
