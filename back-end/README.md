# ML Model Builder - Backend

🚀 A comprehensive Flask-based REST API for training, storing, and serving machine learning models with automatic algorithm selection.

## ✨ Features

### Core Capabilities
- **🤖 Automated Model Training**: Train classification and regression models with multiple algorithms
- **🏆 Automatic Algorithm Selection**: Intelligently selects the best performing algorithm
- **💾 Model Persistence**: Store models in MySQL database with full metadata
- **🔮 REST API for Predictions**: Serve predictions via simple HTTP endpoints
- **📊 Batch Processing**: Make predictions on multiple samples simultaneously
- **📈 Model Management**: Full CRUD operations for trained models
- **📋 Training History**: Track all algorithm performances
- **🔄 Prediction Logging**: Audit trail of all predictions

### Supported Algorithms
- **Classification**: Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, SVM, Naive Bayes, KNN
- **Regression**: Linear Regression, Ridge, Lasso, Decision Tree, Random Forest, Gradient Boosting, SVM, KNN

## 🚀 Quick Start

### Prerequisites
```bash
- Python 3.8+
- MySQL Server 5.7+
- pip
```

### Installation

1. **Clone/Navigate to backend**
   ```bash
   cd back-end
   ```

2. **Create MySQL database**
   ```bash
   mysql -u root -p -e "CREATE DATABASE ml_models;"
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the server**
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## 📚 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup and configuration guide
- **[example_client.py](./example_client.py)** - Python client example with full workflow

## 🔌 API Endpoints Overview

### Training
- `POST /api/train` - Train and save a new model

### Model Management
- `GET /api/models` - List all models
- `GET /api/models/<id>` - Get model details
- `PUT /api/models/<id>` - Update model metadata
- `DELETE /api/models/<id>` - Delete a model

### Predictions
- `POST /api/models/<id>/predict` - Single prediction
- `POST /api/models/<id>/batch-predict` - Batch predictions

### Utilities
- `POST /api/parse-csv` - Parse and analyze CSV
- `GET /api/health` - Health check

## 📊 Project Structure

```
back-end/
├── app.py                      # Main Flask application
├── config.py                   # Configuration
├── database.py                 # Database management
├── model_serializer.py         # Model storage & preprocessing
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── API_DOCUMENTATION.md       # API reference
├── SETUP_GUIDE.md            # Setup instructions
├── README.md                 # This file
├── example_client.py         # Python client example
├── models/                   # Stored models (auto-created)
└── algorithms/               # Reference implementations
```

## 💻 Usage Example

```python
from example_client import MLModelClient

# Initialize client
client = MLModelClient("http://localhost:5000")

# Prepare CSV data
csv_data = """age,income,approved
25,30000,0
35,60000,1
45,80000,1"""

# Train model
result = client.train_model(
    model_name="Loan Model",
    model_type="classification",
    csv_data=csv_data,
    input_features=["age", "income"],
    output_feature="approved"
)

model_id = result["model_id"]

# Make prediction
prediction = client.predict(model_id, {
    "age": 35,
    "income": 65000
})

print(f"Prediction: {prediction['prediction']}")
```

## 🗄️ Database Schema

### Models Table
Stores trained model information with metrics, features, and file paths.

### Training Results Table
Tracks performance of all algorithms tested for each model.

### Predictions Table
Audit trail of all predictions made with the models.

See [database.py](./database.py) for detailed schema.

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ml_models
DB_PORT=3306

# Flask
FLASK_DEBUG=True
SECRET_KEY=your-secret-key

# Storage
MODEL_STORAGE_PATH=./models
```

## 📦 Dependencies

- **Flask 3.0.0** - Web framework
- **pandas 2.1.4** - Data manipulation
- **scikit-learn 1.3.2** - ML algorithms
- **mysql-connector-python 8.2.0** - MySQL connection
- **numpy 1.26.2** - Numerical computing
- **python-dotenv 1.0.0** - Environment management

## 🎯 API Workflow Example

### 1. Parse CSV
```bash
curl -X POST http://localhost:5000/api/parse-csv \
  -H "Content-Type: application/json" \
  -d '{"csv_data": "age,income\n25,30000\n35,60000"}'
```

### 2. Train Model
```bash
curl -X POST http://localhost:5000/api/train \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "My Model",
    "model_type": "classification",
    "csv_data": "...",
    "input_features": ["age", "income"],
    "output_feature": "target"
  }'
```

### 3. Get Predictions
```bash
curl -X POST http://localhost:5000/api/models/1/predict \
  -H "Content-Type: application/json" \
  -d '{"data": {"age": 30, "income": 50000}}'
```

## 🔐 Security Best Practices

- Change `SECRET_KEY` in production
- Use environment variables for credentials
- Implement authentication/authorization
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting

## 🚀 Deployment

### Development
```bash
python app.py
```

### Production with Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### With Nginx (Reverse Proxy)
Configure Nginx to proxy requests to Flask server on port 5000.

## 🐛 Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Verify credentials in `.env`
- Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use
- Use different port: `app.run(port=5001)`
- Or kill existing process: `lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

### Module Not Found
```bash
pip install -r requirements.txt
```

### Model Training Fails
- Ensure CSV data is valid
- Check for sufficient rows (minimum ~50)
- Verify feature columns exist
- Check for missing values

## 📊 Performance Metrics

Each model training evaluates:

**Classification**:
- Accuracy
- Precision
- Recall
- F1-Score

**Regression**:
- Mean Squared Error (MSE)
- Root Mean Squared Error (RMSE)
- Mean Absolute Error (MAE)
- R² Score

## 🔄 Model Serialization

Models are stored as:
- **Model file** (`model_{id}_{name}.pkl`) - Trained sklearn model
- **Metadata file** (`metadata_{id}.json`) - Preprocessing info, encoders, scalers

This allows models to be:
- Loaded on demand for predictions
- Versioned and tracked
- Shared across servers
- Archived and restored

## 📝 Example Workflows

### Classification Task
1. Upload loan approval dataset
2. Select features and target column
3. API trains multiple classifiers
4. Best model (e.g., Random Forest) selected automatically
5. Deployed for approval predictions

### Regression Task
1. Upload house price dataset
2. Train regression models
3. Best model selected (e.g., Gradient Boosting)
4. Use for price predictions

## 🤝 Integration with Frontend

The frontend sends:
1. CSV data as string
2. Feature and target columns
3. Model type (classification/regression)

The backend returns:
1. Model ID
2. Algorithm results
3. Performance metrics
4. Prediction endpoint URL

## 📞 Support

For detailed information:
- Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for installation help
- Review [example_client.py](./example_client.py) for usage patterns
- Check Flask logs for detailed error messages

## 📜 License

This is part of the ML Model Builder project.

## 🎓 Learning Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [MySQL Reference](https://dev.mysql.com/doc/)

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Production Ready ✅
