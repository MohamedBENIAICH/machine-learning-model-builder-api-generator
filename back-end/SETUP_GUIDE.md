# Backend Setup Guide

## 📋 Prerequisites

Before setting up the backend, ensure you have:
- Python 3.8 or higher installed
- MySQL Server 5.7+ installed and running
- pip (Python package manager)
- Bash or command line access

## 🔧 Step-by-Step Setup

### 1. Create MySQL Database

Open your MySQL command line and create the database:

```bash
# Login to MySQL
mysql -u root -p

# In MySQL console
CREATE DATABASE ml_models CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Configure Environment Variables

Navigate to the back-end folder and create `.env` file:

```bash
cd back-end
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ml_models
DB_PORT=3306
FLASK_DEBUG=True
SECRET_KEY=your-random-secret-key-here
MODEL_STORAGE_PATH=./models
```

### 3. Install Python Dependencies

```bash
# Make sure you're in the back-end directory
pip install -r requirements.txt
```

This will install:
- Flask 3.0.0 - Web framework
- flask-cors 4.0.0 - CORS support
- pandas 2.1.4 - Data manipulation
- numpy 1.26.2 - Numerical computing
- scikit-learn 1.3.2 - Machine learning
- mysql-connector-python 8.2.0 - MySQL connection
- python-dotenv 1.0.0 - Environment variables

### 4. Verify Setup

Test the database connection:

```bash
python -c "
import config
from database import init_db
try:
    db = init_db()
    print('✓ Database connected successfully!')
except Exception as e:
    print(f'✗ Database connection failed: {e}')
"
```

### 5. Run the Server

```bash
# Development mode with auto-reload
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
✓ Database connection established
✓ Database tables created successfully
```

### 6. Test the API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-27T10:30:00.000000"
}
```

## 📁 Project Structure

```
back-end/
├── app.py                      # Main Flask application with all endpoints
├── config.py                   # Configuration and settings
├── database.py                 # MySQL database management
├── model_serializer.py         # Model serialization and preprocessing
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── .env                       # Your actual environment (create from example)
├── API_DOCUMENTATION.md       # API reference
├── SETUP_GUIDE.md            # This file
├── models/                    # Stored trained models (created automatically)
│   ├── model_1_loan_approval.pkl
│   ├── metadata_1.json
│   └── ...
└── algorithms/               # Reference algorithm implementations
    ├── classification/
    └── regression/
```

## 🎯 Key Files Explained

### `app.py`
Main Flask application containing:
- MLModelTrainer class - Trains and evaluates algorithms
- API endpoints for training, predictions, and model management
- Request/response handling

### `database.py`
Database management layer:
- DatabaseManager class - Handles all DB operations
- Schema creation and maintenance
- Model CRUD operations
- Prediction history tracking

### `model_serializer.py`
Model persistence and preprocessing:
- ModelSerializer - Saves/loads trained models
- PreprocessingPipeline - Handles data preprocessing and predictions
- Scaler and encoder serialization

### `config.py`
Application configuration:
- Database credentials
- Flask settings
- Model storage paths

## 🚀 Starting Development

### 1. Terminal 1: Run Flask Server
```bash
cd back-end
python app.py
```

### 2. Terminal 2: Test API (Optional)
```bash
# Check health
curl http://localhost:5000/api/health

# Parse CSV
curl -X POST http://localhost:5000/api/parse-csv \
  -H "Content-Type: application/json" \
  -d '{"csv_data": "age,income,approved\n25,50000,1\n35,75000,1"}'
```

## 🐛 Troubleshooting

### Database Connection Failed
```
Error: Access denied for user 'root'@'localhost'
```
**Solution**: 
- Verify MySQL is running: `mysql -u root -p` (test with your password)
- Update DB_PASSWORD in `.env` file
- Restart Flask server

### Port 5000 Already in Use
```
Address already in use
```
**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID with actual number)
kill -9 <PID>

# Or use different port
python -c "import app; app.app.run(port=5001)"
```

### Module Not Found
```
ModuleNotFoundError: No module named 'sklearn'
```
**Solution**:
```bash
pip install -r requirements.txt
# Or install specific package
pip install scikit-learn==1.3.2
```

### MySQL Extension Issues (Windows)
If you get MySQL connector issues on Windows:
```bash
pip install --upgrade mysql-connector-python
```

## 📊 Testing the API

### 1. Train a Model

Create test CSV data file `test_data.csv`:
```csv
age,income,credit_score,approved
25,30000,600,0
35,60000,700,1
45,80000,750,1
28,45000,620,0
55,120000,800,1
```

Test with curl:
```bash
curl -X POST http://localhost:5000/api/train \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "Test Loan Model",
    "description": "Test classification model",
    "model_type": "classification",
    "csv_data": "age,income,credit_score,approved\n25,30000,600,0\n35,60000,700,1\n45,80000,750,1\n28,45000,620,0\n55,120000,800,1",
    "input_features": ["age", "income", "credit_score"],
    "output_feature": "approved"
  }'
```

### 2. Get Model Details

```bash
curl http://localhost:5000/api/models/1
```

### 3. Make a Prediction

```bash
curl -X POST http://localhost:5000/api/models/1/predict \
  -H "Content-Type: application/json" \
  -d '{"data": {"age": 30, "income": 55000, "credit_score": 680}}'
```

## 🔐 Production Deployment

### Using Gunicorn (Recommended)

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

### Using Nginx Reverse Proxy

Create `/etc/nginx/sites-available/ml-backend`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment for Production

Update `.env`:
```env
FLASK_DEBUG=False
SECRET_KEY=generate-secure-random-key-here
DB_HOST=your-db-server
DB_USER=ml_user
DB_PASSWORD=secure-password-here
```

## ✅ Verification Checklist

- [ ] MySQL server is running
- [ ] Database `ml_models` created
- [ ] `.env` file configured with correct credentials
- [ ] All dependencies installed: `pip list | grep -E "Flask|pandas|scikit"`
- [ ] Models directory exists and is writable: `ls -la models/`
- [ ] Flask server starts without errors: `python app.py`
- [ ] Health endpoint responds: `curl http://localhost:5000/api/health`
- [ ] Can train a model with test data
- [ ] Can retrieve model list: `curl http://localhost:5000/api/models`
- [ ] Can make predictions with trained model

## 📚 Next Steps

1. **Frontend Integration**: Connect frontend to these API endpoints
2. **Authentication**: Add JWT or session-based authentication
3. **Monitoring**: Set up logging and error tracking
4. **Scaling**: Use load balancing for high traffic
5. **Testing**: Add unit and integration tests

## 🆘 Getting Help

- Check `API_DOCUMENTATION.md` for detailed endpoint documentation
- Review database schema in `database.py`
- Check Flask logs for detailed error messages
- Verify MySQL logs: `tail -f /var/log/mysql/error.log` (Linux)

## 📞 Support Files

- `API_DOCUMENTATION.md` - Complete API reference
- `database.py` - Database schema and operations
- `model_serializer.py` - Model storage details
- Flask error logs in console output
