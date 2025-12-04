# 🚀 Machine Learning Model Builder

A comprehensive full-stack web application that enables users to train, manage, and deploy machine learning models with automatic algorithm selection. Simply upload your data, select features, and let the system find the best performing model for your use case.

## ✨ Overview

This project provides an intuitive interface for:
- **Training ML Models**: Upload CSV data and train classification or regression models automatically
- **Algorithm Comparison**: Test multiple algorithms simultaneously and select the best performer
- **Model Management**: Store, version, and manage trained models in a MySQL database
- **API Deployment**: Automatically generate REST API endpoints for each trained model
- **Statistics Dashboard**: Track API usage, performance metrics, and model analytics
- **Code Generation**: Get ready-to-use code snippets for integrating models into your applications

## 🏗️ Architecture

### Technology Stack

**Backend (Python/Flask)**
- **Flask 3.0.0** - Web framework for REST API
- **scikit-learn 1.3.2** - Machine learning algorithms
- **pandas 2.1.4** - Data manipulation and analysis
- **MySQL** - Model and metadata persistence
- **NumPy 1.26.2** - Numerical computing

**Frontend (Next.js/React)**
- **Next.js 16.0.3** - React framework with server-side rendering
- **React 19.2.0** - UI component library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **shadcn/ui** - Modern UI components

### Supported Algorithms

**Classification Models:**
- Logistic Regression
- Decision Tree Classifier
- Random Forest Classifier
- Gradient Boosting Classifier
- Support Vector Machine (SVM)
- Naive Bayes
- K-Nearest Neighbors (KNN)

**Regression Models:**
- Linear Regression
- Ridge Regression
- Lasso Regression
- Decision Tree Regressor
- Random Forest Regressor
- Gradient Boosting Regressor
- Support Vector Regression (SVR)
- K-Nearest Neighbors Regressor

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.8 or higher
- **Node.js** 16.x or higher and npm
- **MySQL Server** 5.7 or higher
- **Git** (for cloning the repository)

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/MohamedBENIAICH/machine-learning-model-builder-api-generator.git
cd machine-learning-model-builder
```

### Step 2: Database Setup

1. **Start MySQL Server** (if not already running):
   ```bash
   sudo service mysql start
   # or on macOS with Homebrew
   brew services start mysql
   ```

2. **Create the Database**:
   ```bash
   mysql -u root -p
   ```
   
   Then in the MySQL prompt:
   ```sql
   CREATE DATABASE ml_models;
   EXIT;
   ```

3. **Configure Database Credentials**:
   
   The backend will automatically create all required tables on first run. You just need to configure your credentials in the next step.

### Step 3: Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd back-end
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   
   # Activate the virtual environment
   # On Linux/macOS:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   
   Create a `.env` file in the `back-end` directory:
   ```bash
   touch .env
   ```
   
   Add the following configuration (modify with your MySQL credentials):
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ml_models
   DB_PORT=3306

   # Flask Configuration
   FLASK_DEBUG=True
   SECRET_KEY=your-secret-key-change-in-production

   # Model Storage
   MODEL_STORAGE_PATH=./models
   ```

5. **Create the models storage directory**:
   ```bash
   mkdir -p models
   ```

### Step 4: Frontend Setup

1. **Open a new terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Configure the API endpoint** (if needed):
   
   By default, the frontend connects to `http://localhost:5000`. If your backend runs on a different port, create a `.env.local` file:
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
   ```

## 🎯 Running the Application

### Start the Backend Server

1. **Navigate to the backend directory** (if not already there):
   ```bash
   cd back-end
   ```

2. **Activate your virtual environment** (if using one):
   ```bash
   # On Linux/macOS:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Start the Flask server**:
   ```bash
   python app.py
   ```

   You should see:
   ```
   * Running on http://127.0.0.1:5000
   * Database initialized successfully
   ```

   The backend API will be available at: **http://localhost:5000**

### Start the Frontend Development Server

1. **Open a new terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ▲ Next.js 16.0.3
   - Local:        http://localhost:3000
   - Ready in 2.5s
   ```

3. **Access the application**:
   
   Open your browser and visit: **http://localhost:3000**

## 📖 Usage Guide

### Training Your First Model

1. **Navigate to the "Train Model" page** from the dashboard

2. **Upload your CSV data**:
   - Click "Upload CSV" or drag and drop your file
   - Supported separators: comma (`,`), semicolon (`;`), tab
   - Ensure your data has headers

3. **Configure your model**:
   - **Model Name**: Give your model a descriptive name
   - **Description**: Add details about what the model predicts (optional)
   - **Model Type**: Choose Classification or Regression
   - **Input Features**: Select the columns to use as features
   - **Target Column**: Select the column to predict

4. **Train the model**:
   - Click "Train Model"
   - The system will automatically:
     - Test all available algorithms
     - Compare their performance
     - Select the best one
     - Save the model to the database

5. **View results**:
   - See algorithm comparison metrics
   - Review the justification for the selected algorithm
   - Get your model's unique API endpoint
   - Access code snippets for integration

### Using the API

Once your model is trained, you can make predictions via the REST API:

#### Example 1: Single Prediction (Python)

```python
import requests

# Your model's endpoint
url = "http://localhost:5000/my_model_name/predict"

# Input data
data = {
    "data": {
        "age": 35,
        "income": 65000,
        "credit_score": 720
    }
}

# Make prediction
response = requests.post(url, json=data)
result = response.json()

print(f"Prediction: {result['prediction']}")
```

#### Example 2: Batch Prediction (JavaScript)

```javascript
const response = await fetch('http://localhost:5000/my_model_name/predict_batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: [
      { age: 25, income: 50000, credit_score: 680 },
      { age: 45, income: 90000, credit_score: 750 },
      { age: 30, income: 70000, credit_score: 700 }
    ]
  })
});

const result = await response.json();
console.log('Predictions:', result.predictions);
```

#### Example 3: Using cURL

```bash
curl -X POST http://localhost:5000/my_model_name/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "age": 35,
      "income": 65000,
      "credit_score": 720
    }
  }'
```

### Managing Models

- **View All Models**: Dashboard shows all trained models with metrics
- **Model Details**: Click on any model to see detailed information
- **API Statistics**: Track usage, performance, and geographic distribution
- **Delete Models**: Remove models you no longer need

## 📁 Project Structure

```
machine-learning-model-builder/
├── back-end/                      # Flask backend
│   ├── app.py                     # Main Flask application
│   ├── config.py                  # Configuration settings
│   ├── database.py                # Database operations
│   ├── model_serializer.py        # Model storage & loading
│   ├── api_statistics.py          # API usage tracking
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables (create this)
│   ├── models/                    # Stored models directory
│   ├── algorithms/                # Algorithm implementations
│   └── API_DOCUMENTATION.md       # Detailed API reference
│
├── frontend/                      # Next.js frontend
│   ├── app/                       # Next.js app directory
│   │   ├── page.tsx              # Home/Dashboard page
│   │   ├── train/                # Model training page
│   │   ├── models/               # Model management pages
│   │   └── dashboard/            # Statistics dashboard
│   ├── components/                # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── model-card.tsx        # Model display card
│   │   ├── training-form.tsx     # Model training form
│   │   └── api-stats-dashboard.tsx # Statistics visualization
│   ├── lib/                       # Utilities
│   │   ├── api.ts                # API client functions
│   │   └── utils.ts              # Helper functions
│   ├── package.json               # Node dependencies
│   └── next.config.mjs           # Next.js configuration
│
└── README.md                      # This file
```

## 🔌 API Endpoints

### Training & Model Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/train` | Train a new model |
| GET | `/api/models` | List all models (with pagination) |
| GET | `/api/models/:id` | Get model details |
| PUT | `/api/models/:id` | Update model metadata |
| DELETE | `/api/models/:id` | Delete a model |

### Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:model_name/predict` | Single prediction |
| POST | `/:model_name/predict_batch` | Batch predictions |
| POST | `/api/models/:id/predict` | Prediction by model ID |

### Statistics & Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models/:id/statistics` | Get API usage statistics |
| POST | `/api/models/:id/track-copy` | Track code snippet copy |
| POST | `/api/parse-csv` | Parse and analyze CSV data |
| GET | `/api/health` | Health check |

For detailed API documentation, see [back-end/API_DOCUMENTATION.md](back-end/API_DOCUMENTATION.md).

## 🗄️ Database Schema

The application uses MySQL with the following main tables:

- **`models`** - Stores trained model metadata, metrics, and file paths
- **`training_results`** - Records performance of all tested algorithms
- **`predictions`** - Audit trail of all predictions
- **`api_calls`** - API usage statistics
- **`code_copies`** - Tracks code snippet copying

Tables are automatically created when you first run the backend.

## 🛠️ Development

### Backend Development

```bash
cd back-end
source venv/bin/activate  # On Linux/macOS
python app.py
```

The backend uses Flask's debug mode by default (set `FLASK_DEBUG=True` in `.env`).

### Frontend Development

```bash
cd frontend
npm run dev
```

Next.js provides hot-reload for instant updates during development.

### Running Tests

Backend tests:
```bash
cd back-end
python test_all_endpoints.py
```

## 🔧 Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'flask'`
- **Solution**: Make sure you've activated your virtual environment and installed dependencies:
  ```bash
  source venv/bin/activate
  pip install -r requirements.txt
  ```

**Problem**: `mysql.connector.errors.ProgrammingError: Access denied`
- **Solution**: Check your `.env` file has correct MySQL credentials

**Problem**: `Can't connect to MySQL server`
- **Solution**: Ensure MySQL is running:
  ```bash
  sudo service mysql start
  ```

### Frontend Issues

**Problem**: `Error: Cannot find module 'next'`
- **Solution**: Install dependencies:
  ```bash
  npm install
  ```

**Problem**: `fetch failed` or `ECONNREFUSED`
- **Solution**: Ensure the backend is running on `http://localhost:5000`

**Problem**: `Module not found: Can't resolve '@/components/...'`
- **Solution**: This is usually a temporary TypeScript issue. Restart the dev server:
  ```bash
  npm run dev
  ```

### Database Issues

**Problem**: `Table doesn't exist`
- **Solution**: Delete the database and let the app recreate it:
  ```sql
  DROP DATABASE ml_models;
  CREATE DATABASE ml_models;
  ```
  Then restart the backend.

## 📊 Features in Detail

### Automatic Algorithm Selection

The system evaluates multiple algorithms for your problem type:
- Uses train/test split for datasets > 30 samples
- Uses k-fold cross-validation for smaller datasets
- Compares all algorithms on standardized metrics
- Automatically selects the best performer
- Provides detailed justification for the selection

### Model Persistence

Models are saved with:
- Serialized sklearn model (`.pkl` file)
- Preprocessing metadata (encoders, scalers)
- Input/output feature configuration
- Performance metrics and training history

### API Statistics Dashboard

Track your deployed models:
- Total API calls over time
- Response time trends
- Geographic distribution of requests
- Status code distribution
- Code snippet copy tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open-source and available under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [API Documentation](back-end/API_DOCUMENTATION.md)
3. Open an issue on GitHub

## 🎓 Example Use Cases

### Loan Approval Prediction
1. Upload customer data (age, income, credit score, etc.)
2. Train classification model
3. Deploy API to predict loan approval in real-time

### House Price Prediction
1. Upload real estate data (size, location, bedrooms, etc.)
2. Train regression model
3. Use API to estimate property values

### Customer Churn Prediction
1. Upload customer behavior data
2. Train classification model
3. Identify customers at risk of leaving

### Sales Forecasting
1. Upload historical sales data
2. Train regression model
3. Predict future sales trends

## 🚀 Next Steps

After setting up the application:

1. **Explore the UI**: Familiarize yourself with the dashboard and training interface
2. **Train a test model**: Use sample data to understand the workflow
3. **Read the API docs**: Learn about all available endpoints
4. **Integrate with your app**: Use the generated code snippets to connect your applications

---

**Built with ❤️ using Flask, Next.js, and scikit-learn**
