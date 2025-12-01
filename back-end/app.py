"""
Enhanced Flask API for ML Model Training, Storage, and Serving

Integrates model serialization, MySQL storage, and prediction endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_validate, KFold, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score
)
import io
import json
import os
from datetime import datetime
import pickle
from flask import g
import psutil  # Install with: pip install psutil
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Classification algorithms
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier

# Regression algorithms
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor

# Import custom modules
import config
from model_serializer import ModelSerializer, PreprocessingPipeline
from database import get_db

app = Flask(__name__)
CORS(app)

# Initialize database on startup
db = None


@app.before_request
def before_request():
    """Initialize database connection"""
    global db
    if db is None:
        try:
            db = get_db()
        except Exception as e:
            print(f"Warning: Database initialization may have failed: {e}")


# Import the tracking decorator
from api_statistics import track_api_call, get_api_statistics


def robust_read_csv(csv_string: str):
    """Try to read a CSV string with multiple common separators.
    
    Returns a pandas.DataFrame or raises the last exception.
    """
    # First try pandas autodetect (engine='python', sep=None)
    try:
        return pd.read_csv(io.StringIO(csv_string), sep=None, engine="python")
    except Exception as e_auto:
        last_exc = e_auto
    
    # Try common separators
    for sep in [';', ',', '\t']:
        try:
            return pd.read_csv(io.StringIO(csv_string), sep=sep)
        except Exception as e:
            last_exc = e
    
    # If all attempts fail, raise the last exception
    raise last_exc


class MLModelTrainer:
    """Enhanced model trainer with model persistence and evaluation"""
    
    def __init__(self, model_type):
        self.model_type = model_type
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.best_model = None
        self.best_model_name = None

    def get_algorithms(self):
        """Get available algorithms for the model type"""
        if self.model_type == 'classification':
            return {
                'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
                'Decision Tree': DecisionTreeClassifier(random_state=42),
                'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
                'Gradient Boosting': GradientBoostingClassifier(random_state=42),
                'Support Vector Machine': SVC(random_state=42),
                'Naive Bayes': GaussianNB(),
                'K-Nearest Neighbors': KNeighborsClassifier()
            }
        else:  # regression
            return {
                'Linear Regression': LinearRegression(),
                'Ridge Regression': Ridge(random_state=42),
                'Lasso Regression': Lasso(random_state=42),
                'Decision Tree': DecisionTreeRegressor(random_state=42),
                'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
                'Gradient Boosting': GradientBoostingRegressor(random_state=42),
                'Support Vector Machine': SVR(),
                'K-Nearest Neighbors': KNeighborsRegressor()
            }

    def preprocess_data(self, df, input_features, output_feature):
        """Preprocess data: handle missing values and encode categorical features"""
        # Handle missing values
        df = df.dropna()

        # Separate features and target
        X = df[input_features].copy()
        y = df[output_feature].copy()

        # Encode categorical features
        for col in X.columns:
            if X[col].dtype == 'object':
                self.label_encoders[col] = LabelEncoder()
                X[col] = self.label_encoders[col].fit_transform(X[col])

        # Encode target for classification
        if self.model_type == 'classification' and y.dtype == 'object':
            self.label_encoders['target'] = LabelEncoder()
            y = self.label_encoders['target'].fit_transform(y)

        return X, y

    def evaluate_classification(self, y_true, y_pred):
        """Evaluate classification model"""
        return {
            'accuracy': round(accuracy_score(y_true, y_pred), 4),
            'precision': round(precision_score(y_true, y_pred, average='weighted', zero_division=0), 4),
            'recall': round(recall_score(y_true, y_pred, average='weighted', zero_division=0), 4),
            'f1_score': round(f1_score(y_true, y_pred, average='weighted', zero_division=0), 4)
        }

    def evaluate_regression(self, y_true, y_pred):
        """Evaluate regression model"""
        mse = mean_squared_error(y_true, y_pred)
        return {
            'mse': round(mse, 4),
            'rmse': round(np.sqrt(mse), 4),
            'mae': round(mean_absolute_error(y_true, y_pred), 4),
            'r2_score': round(r2_score(y_true, y_pred), 4)
        }

    def train_and_evaluate(self, df, input_features, output_feature):
        """Train and evaluate all algorithms using k-fold CV for small datasets"""
        X, y = self.preprocess_data(df, input_features, output_feature)

        n_samples = len(X)
        use_kfold = n_samples < 30  # Use k-fold for datasets smaller than 30 samples

        # Determine evaluation strategy
        if use_kfold:
            # For small datasets, use k-fold cross-validation (more stable metrics)
            if self.model_type == 'classification':
                n_splits = min(3, len(np.unique(y)))  # Ensure enough samples per fold
                cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
            else:
                n_splits = min(3, n_samples)
                cv = KFold(n_splits=n_splits, shuffle=True, random_state=42)
            evaluation_method = 'k-fold cross-validation'
        else:
            # For larger datasets, use traditional train/test split
            try:
                if self.model_type == 'classification' and len(np.unique(y)) > 1:
                    X_train, X_test, y_train, y_test = train_test_split(
                        X, y, test_size=0.2, random_state=42, stratify=y
                    )
                else:
                    X_train, X_test, y_train, y_test = train_test_split(
                        X, y, test_size=0.2, random_state=42
                    )
            except Exception:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
            evaluation_method = 'train/test split'

        algorithms = self.get_algorithms()
        results = []

        for name, model in algorithms.items():
            try:
                if use_kfold:
                    # K-fold cross-validation: fit and average metrics across folds
                    fold_metrics = []
                    fold_scores = []
                    
                    # Get fold indices
                    if self.model_type == 'classification':
                        fold_generator = cv.split(X, y)
                    else:
                        fold_generator = cv.split(X)
                    
                    for train_idx, test_idx in fold_generator:
                        X_train_fold = X.iloc[train_idx] if hasattr(X, 'iloc') else X[train_idx]
                        X_test_fold = X.iloc[test_idx] if hasattr(X, 'iloc') else X[test_idx]
                        y_train_fold = y.iloc[train_idx] if hasattr(y, 'iloc') else y[train_idx]
                        y_test_fold = y.iloc[test_idx] if hasattr(y, 'iloc') else y[test_idx]
                        
                        # Scale features per fold
                        scaler_fold = StandardScaler()
                        X_train_scaled = scaler_fold.fit_transform(X_train_fold)
                        X_test_scaled = scaler_fold.transform(X_test_fold)
                        
                        # Clone and fit model
                        from sklearn.base import clone
                        model_clone = clone(model)
                        model_clone.fit(X_train_scaled, y_train_fold)
                        y_pred = model_clone.predict(X_test_scaled)
                        
                        # Evaluate fold
                        if self.model_type == 'classification':
                            metrics_fold = self.evaluate_classification(y_test_fold, y_pred)
                            score_fold = metrics_fold['f1_score']
                        else:
                            metrics_fold = self.evaluate_regression(y_test_fold, y_pred)
                            score_fold = metrics_fold['r2_score']
                        
                        fold_metrics.append(metrics_fold)
                        fold_scores.append(score_fold)
                    
                    # Average metrics across folds
                    metrics = {}
                    if fold_metrics:
                        for key in fold_metrics[0].keys():
                            metrics[key] = round(np.mean([m[key] for m in fold_metrics]), 4)
                        score = np.mean(fold_scores)
                    else:
                        raise ValueError(f"No valid folds for {name}")
                    
                    # Also train on full dataset for serialization
                    X_scaled = self.scaler.fit_transform(X)
                    model.fit(X_scaled, y)
                    
                else:
                    # Traditional train/test split evaluation
                    X_train_scaled = self.scaler.fit_transform(X_train)
                    X_test_scaled = self.scaler.transform(X_test)
                    
                    # Train model
                    model.fit(X_train_scaled, y_train)
                    
                    # Predict
                    y_pred = model.predict(X_test_scaled)
                    
                    # Evaluate
                    if self.model_type == 'classification':
                        metrics = self.evaluate_classification(y_test, y_pred)
                        score = metrics['f1_score']
                    else:
                        metrics = self.evaluate_regression(y_test, y_pred)
                        score = metrics['r2_score']

                results.append({
                    'algorithm': name,
                    'metrics': metrics,
                    'score': score,
                    'model': model  # Store model for later serialization
                })
            except Exception as e:
                print(f"Error with {name}: {str(e)}")
                continue

        # If no algorithm produced results, raise a clear error
        if len(results) == 0:
            raise ValueError(
                "No algorithms could be trained successfully. Check your dataset for sufficient rows, "
                "correct column types, and that the selected input/output columns exist and contain valid values."
            )

        # Sort by score and select best
        results.sort(key=lambda x: x['score'], reverse=True)
        best_result = results[0]

        # Store best model for serialization
        self.best_model = best_result['model']
        self.best_model_name = best_result['algorithm']

        # Remove model object from results for JSON serialization
        results_for_response = [
            {
                'algorithm': r['algorithm'],
                'metrics': r['metrics'],
                'score': r['score']
            }
            for r in results
        ]

        # Generate justification
        justification = self.generate_justification(best_result, results, self.model_type, evaluation_method)

        return {
            'results': results_for_response,
            'best_model': best_result['algorithm'],
            'justification': justification
        }

    def generate_justification(self, best_model, all_results, model_type, evaluation_method='train/test split'):
        """Generate explanation for model selection"""
        algorithm = best_model['algorithm']
        metrics = best_model['metrics']

        if model_type == 'classification':
            primary_metric = 'F1-Score'
            primary_value = metrics['f1_score']
            justification = (
                f"{algorithm} was selected as the best algorithm with an F1-Score of {primary_value:.4f}. "
                f"This model achieved the best balance between precision ({metrics['precision']:.4f}) "
                f"and recall ({metrics['recall']:.4f}), with an overall accuracy of {metrics['accuracy']:.4f}. "
            )
        else:
            primary_metric = 'R² Score'
            primary_value = metrics['r2_score']
            justification = (
                f"{algorithm} was selected as the best algorithm with an R² Score of {primary_value:.4f}. "
                f"This model explains {primary_value*100:.2f}% of the variance in the target variable, "
                f"with a Root Mean Squared Error (RMSE) of {metrics['rmse']:.4f} and "
                f"Mean Absolute Error (MAE) of {metrics['mae']:.4f}. "
            )

        # Add comparison with second best (guard against division by zero)
        if len(all_results) > 1:
            second_best = all_results[1]
            try:
                if second_best.get('score') and second_best['score'] != 0:
                    improvement = ((best_model['score'] - second_best['score']) / second_best['score']) * 100
                    improvement_str = f"by {improvement:.2f}% in {primary_metric}."
                else:
                    improvement_str = f"(no measurable improvement over {second_best['algorithm']} in {primary_metric})."
            except Exception:
                improvement_str = f"(unable to compute improvement vs {second_best['algorithm']})."

            justification += f"It outperforms the second-best algorithm ({second_best['algorithm']}) {improvement_str}"

        # Add evaluation method note for small datasets
        if evaluation_method == 'k-fold cross-validation':
            justification += f" (Evaluated using {evaluation_method} due to small dataset size.)"

        return justification


# ==================== TRAINING & STORAGE ENDPOINTS ====================

@app.route('/api/train', methods=['POST'])
def train_model():
    """Train model and save to database"""
    try:
        # Get request data
        data = request.json
        model_name = data.get('model_name')
        description = data.get('description', '')
        model_type = data.get('model_type')  # 'classification' or 'regression'
        csv_data = data.get('csv_data')
        input_features = data.get('input_features')
        output_feature = data.get('output_feature')

        # Log incoming data
        print("\n" + "="*80)
        print("📨 INCOMING TRAINING REQUEST FROM FRONTEND")
        print("="*80)
        print(f"Model Name: {model_name}")
        print(f"Description: {description}")
        print(f"Model Type: {model_type}")
        print(f"Input Features: {input_features}")
        print(f"Output Feature: {output_feature}")
        print(f"CSV Data (first 200 chars): {csv_data[:200] if csv_data else 'None'}...")
        print(f"CSV Data Total Length: {len(csv_data) if csv_data else 0} characters")
        print("="*80 + "\n")

        if not all([model_name, model_type, csv_data, input_features, output_feature]):
            print("❌ ERROR: Missing required fields!")
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400

        # Parse CSV data
        try:
            df = robust_read_csv(csv_data)
            print(f"✅ CSV parsed successfully!")
            print(f"   Dataset shape: {df.shape[0]} rows × {df.shape[1]} columns")
            print(f"   Columns: {list(df.columns)}")
            print(f"   Data preview:\n{df.head()}\n")
        except Exception as e:
            print(f"❌ CSV parsing error: {str(e)}")
            return jsonify({'success': False, 'error': f"CSV parsing error: {str(e)}"}), 400

        # Initialize trainer
        trainer = MLModelTrainer(model_type)

        # Train and evaluate
        print(f"🚀 Starting training with model type: {model_type}")
        print(f"   Input features: {input_features}")
        print(f"   Output feature: {output_feature}\n")
        results = trainer.train_and_evaluate(df, input_features, output_feature)
        
        print(f"\n✅ Training completed!")
        print(f"   Best Model: {results['best_model']}")
        print(f"   All Results:")
        for result in results['results']:
            print(f"      - {result['algorithm']}: {result['metrics']} (score: {result['score']:.4f})")
        print(f"   Justification: {results['justification']}\n")

        # Save model and metadata to disk
        try:
            # Get best model metrics
            best_metrics = None
            for result in results['results']:
                if result['algorithm'] == results['best_model']:
                    best_metrics = result['metrics']
                    break

            # Serialize and save the model
            model_file_path = ModelSerializer.save_model(
                trainer.best_model,
                1,  # Temporary ID, will be updated after DB insert
                model_name
            )

            # Save preprocessing metadata
            metadata = {
                'label_encoders': ModelSerializer.serialize_preprocessing(trainer.label_encoders, trainer.scaler)['label_encoders'],
                'scaler': ModelSerializer.serialize_preprocessing(trainer.label_encoders, trainer.scaler)['scaler'],
                'input_features': input_features,
                'output_feature': output_feature,
                'model_type': model_type
            }

            metadata_file_path = ModelSerializer.save_metadata(1, metadata)

            # Save to database
            if db:
                model_id = db.save_model(
                    model_name=model_name,
                    description=description,
                    model_type=model_type,
                    best_algorithm=results['best_model'],
                    metrics=best_metrics,
                    justification=results['justification'],
                    model_file_path=model_file_path,
                    input_features=input_features,
                    output_feature=output_feature,
                    all_results=results['results']
                )

                # Update model files with correct ID
                if model_id:
                    # Rename files with actual model_id
                    new_model_path = os.path.join(
                        config.MODEL_STORAGE_PATH,
                        f"model_{model_id}_{model_name.replace(' ', '_')}.pkl"
                    )
                    os.rename(model_file_path, new_model_path)

                    new_metadata_path = os.path.join(
                        config.MODEL_STORAGE_PATH,
                        f"metadata_{model_id}.json"
                    )
                    os.rename(metadata_file_path, new_metadata_path)

                    response_data = {
                        'success': True,
                        'model_id': model_id,
                        'model_name': model_name,
                        'description': description,
                        'model_type': model_type,
                        'results': results['results'],
                        'best_model': results['best_model'],
                        'justification': results['justification']
                    }
                    
                    print(f"💾 Model saved successfully!")
                    print(f"   Model ID: {model_id}")
                    print(f"   Model Path: {new_model_path}")
                    print(f"   Metadata Path: {new_metadata_path}")
                    print(f"   Response: {response_data}\n")
                    
                    return jsonify(response_data), 201

            # If DB save failed but files were saved
            return jsonify({
                'success': False,
                'error': 'Model trained but failed to save to database'
            }), 500

        except Exception as e:
            return jsonify({
                'success': False,
                'error': f"Error saving model: {str(e)}"
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


# ==================== MODEL MANAGEMENT ENDPOINTS ====================

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get all trained models with pagination"""
    try:
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=20, type=int)
        offset = (page - 1) * limit

        if db:
            models = db.get_all_models(limit=limit, offset=offset)
            total_count = db.get_model_count()

            # Map database field names to API contract
            formatted_models = []
            for model in models:
                formatted_model = {
                    'id': str(model['id']),
                    'name': model['model_name'],
                    'description': model.get('description', ''),
                    'model_type': model['model_type'],
                    'best_algorithm': model['best_algorithm'],
                    'accuracy': model.get('accuracy'),
                    'r2_score': model.get('accuracy'),  # Use accuracy for r2_score if not available
                    'created_at': model['created_at'].isoformat() if model['created_at'] else None,
                    'updated_at': model.get('updated_at'),
                    'status': 'active'
                }
                formatted_models.append(formatted_model)

            return jsonify({
                'success': True,
                'models': formatted_models,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': (total_count + limit - 1) // limit
                }
            }), 200

        return jsonify({'success': False, 'error': 'Database not available'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/models/<int:model_id>', methods=['GET'])
def get_model(model_id):
    """Get detailed model information"""
    try:
        if db:
            model = db.get_model(model_id)

            if not model:
                return jsonify({'success': False, 'error': 'Model not found'}), 404

            # Get training results
            training_results = db.get_training_results(model_id)

            # Format model response
            formatted_model = {
                'id': str(model['id']),
                'name': model['model_name'],
                'description': model.get('description', ''),
                'model_type': model['model_type'],
                'best_algorithm': model['best_algorithm'],
                'accuracy': model.get('accuracy'),
                'r2_score': model.get('accuracy'),  # Use accuracy for r2_score if not available
                'f1_score': model.get('f1_score'),
                'precision': model.get('precision'),
                'recall': model.get('recall'),
                'rmse': model.get('rmse'),
                'mae': model.get('mae'),
                'created_at': model['created_at'].isoformat() if model['created_at'] else None,
                'updated_at': model.get('updated_at'),
                'status': 'active',
                'input_features': model.get('input_features', []),
                'output_feature': model.get('output_feature'),
                'training_data_size': model.get('training_data_size')
            }

            return jsonify({
                'success': True,
                'model': formatted_model,
                'training_results': training_results
            }), 200

        return jsonify({'success': False, 'error': 'Database not available'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/models/<int:model_id>', methods=['PUT'])
def update_model_endpoint(model_id):
    """Update model information"""
    try:
        data = request.json

        if db:
            success = db.update_model(model_id, **data)

            if success:
                model = db.get_model(model_id)
                return jsonify({
                    'success': True,
                    'message': 'Model updated',
                    'model': model
                }), 200
            else:
                return jsonify({'success': False, 'error': 'Failed to update model'}), 400

        return jsonify({'success': False, 'error': 'Database not available'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/models/<int:model_id>', methods=['DELETE'])
def delete_model_endpoint(model_id):
    """Delete a model"""
    try:
        if db:
            success = db.delete_model(model_id)

            if success:
                return jsonify({'success': True, 'message': f'Model {model_id} deleted'}), 200
            else:
                return jsonify({'success': False, 'error': 'Model not found'}), 404

        return jsonify({'success': False, 'error': 'Database not available'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


# ==================== PREDICTION ENDPOINTS ====================

@app.route('/<model_name>/predict', methods=['POST'])
@track_api_call 
def predict_by_name(model_name):
    """Make predictions using trained model by name"""
    try:
        if not db:
            return jsonify({'success': False, 'error': 'Database not available'}), 500

        # Get model information from database by name
        model_info = db.get_model_by_name(model_name)
        if not model_info:
            return jsonify({'success': False, 'error': 'Model not found'}), 404

        return _make_prediction(model_info, request)

    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction error: {str(e)}'}), 400

@app.route('/api/models/<int:model_id>/predict', methods=['POST'])
def predict(model_id):
    """Make predictions using trained model by ID (legacy endpoint)"""
    try:
        if not db:
            return jsonify({'success': False, 'error': 'Database not available'}), 500

        # Get model information from database
        model_info = db.get_model(model_id)
        if not model_info:
            return jsonify({'success': False, 'error': 'Model not found'}), 404

        return _make_prediction(model_info, request)

    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction error: {str(e)}'}), 400

def _make_prediction(model_info, request):
    """Helper function to make predictions"""
    # Load model from disk
    model = ModelSerializer.load_model(model_info['model_file_path'])
    if model is None:
        return jsonify({'success': False, 'error': 'Failed to load model'}), 500

    # Get input data - support both formats for backward compatibility
    input_data = request.json.get('data') or request.json.get('input')
    if not input_data:
        return jsonify({'success': False, 'error': 'Missing input data'}), 400

    # Convert single input to list if needed
    if not isinstance(input_data, list):
        input_data = [input_data]

    try:
        # Preprocess input
        preprocessing = PreprocessingPipeline()
        X = preprocessing.preprocess_input(input_data, model_info['input_features'])

        # Make prediction
        prediction = model.predict(X)

        # Postprocess output
        result = preprocessing.postprocess_output(prediction)

        # Save prediction to database
        db.save_prediction(model_info['id'], input_data, {'prediction': str(result)})

        return jsonify({
            'success': True,
            'model_id': model_info['id'],
            'model_name': model_info['name'],
            'prediction': result[0] if len(result) == 1 else result
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction error: {str(e)}'}), 400

@app.route('/<model_name>/predict_batch', methods=['POST'])
@track_api_call
def batch_predict_by_name(model_name):
    """Make batch predictions using trained model by name"""
    try:
        if not db:
            return jsonify({'success': False, 'error': 'Database not available'}), 500

        # Get model information from database by name
        model_info = db.get_model_by_name(model_name)
        if not model_info:
            return jsonify({'success': False, 'error': 'Model not found'}), 404

        return _make_batch_prediction(model_info, request)

    except Exception as e:
        return jsonify({'success': False, 'error': f'Batch prediction error: {str(e)}'}), 400

@app.route('/api/models/<int:model_id>/track-copy', methods=['POST'])
def track_copy(model_id):
    try:
        data = request.json
        section = data.get('section', 'unknown')
        client_ip = request.remote_addr
        
        success = api_statistics.track_code_copy(model_id, section, client_ip)
        
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to track copy'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/models/<int:model_id>/statistics', methods=['GET'])
def get_model_statistics(model_id):
    '''Get API statistics for a model'''
    try:
        days = request.args.get('days', default=7, type=int)
        
        if not db:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        stats = get_api_statistics(db, model_id, days)
        
        return jsonify({
            'success': True,
            'statistics': stats
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/models/<int:model_id>/predict_batch', methods=['POST'])
def batch_predict(model_id):
    """Make batch predictions using trained model by ID (legacy endpoint)"""
    try:
        if not db:
            return jsonify({'success': False, 'error': 'Database not available'}), 500

        # Get model information from database
        model_info = db.get_model(model_id)
        if not model_info:
            return jsonify({'success': False, 'error': 'Model not found'}), 404

        return _make_batch_prediction(model_info, request)

    except Exception as e:
        return jsonify({'success': False, 'error': f'Batch prediction error: {str(e)}'}), 400

def _make_batch_prediction(model_info, request):
    """Helper function to make batch predictions"""
    # Load model from disk
    model = ModelSerializer.load_model(model_info['model_file_path'])
    if model is None:
        return jsonify({'success': False, 'error': 'Failed to load model'}), 500

    # Get input data - support both formats for backward compatibility
    input_data = request.json.get('data') or request.json.get('inputs') or []
    if not input_data:
        return jsonify({'success': False, 'error': 'Missing input data'}), 400

    try:
        # Preprocess input
        preprocessing = PreprocessingPipeline()
        X = preprocessing.preprocess_input(input_data, model_info['input_features'])

        # Make predictions
        predictions = model.predict(X)

        # Postprocess outputs
        results = preprocessing.postprocess_output(predictions)

        # Save predictions to database
        for i, input_item in enumerate(input_data):
            db.save_prediction(model_info['id'], input_item, {'prediction': str(results[i])})

        return jsonify({
            'success': True,
            'model_id': model_info['id'],
            'model_name': model_info['name'],
            'predictions': results
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Batch prediction error: {str(e)}'}), 400

# ==================== UTILITY ENDPOINTS ====================


@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for landing page"""
    try:
        if not db:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        cursor = db.connection.cursor(dictionary=True)
        
        # Get total model count and breakdown by type
        cursor.execute("""
            SELECT 
                COUNT(*) as total_models,
                SUM(CASE WHEN model_type = 'classification' THEN 1 ELSE 0 END) as classification_count,
                SUM(CASE WHEN model_type = 'regression' THEN 1 ELSE 0 END) as regression_count,
                AVG(accuracy) as avg_accuracy
            FROM models
        """)
        
        result = cursor.fetchone()
        cursor.close()
        
        stats = {
            'totalModels': result['total_models'] or 0,
            'classificationCount': result['classification_count'] or 0,
            'regressionCount': result['regression_count'] or 0,
            'avgAccuracy': round(float(result['avg_accuracy'] or 0) * 100, 1)  # Convert to percentage
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/parse-csv', methods=['POST'])

def parse_csv():
    """Parse CSV and return column information"""
    try:
        csv_data = request.json.get('csv_data')
        try:
            df = robust_read_csv(csv_data)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400

        return jsonify({
            'success': True,
            'columns': df.columns.tolist(),
            'sample_data': df.head(5).to_dict('records'),
            'row_count': len(df),
            'column_types': df.dtypes.astype(str).to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    db_status = 'connected' if db and db.connection.is_connected() else 'disconnected'

    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
