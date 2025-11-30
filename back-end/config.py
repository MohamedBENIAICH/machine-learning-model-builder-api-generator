"""
Configuration file for Flask app and database connections
"""
import os
from datetime import timedelta

# Flask Configuration
DEBUG = os.getenv('FLASK_DEBUG', True)
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# Database Configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
DB_NAME = os.getenv('DB_NAME', 'ml_models')
DB_PORT = int(os.getenv('DB_PORT', 3306))

# Model Storage Configuration
MODEL_STORAGE_PATH = os.getenv('MODEL_STORAGE_PATH', os.path.join(os.path.dirname(__file__), 'models'))
MAX_MODEL_SIZE = 100 * 1024 * 1024  # 100MB

# Ensure model storage directory exists
os.makedirs(MODEL_STORAGE_PATH, exist_ok=True)
