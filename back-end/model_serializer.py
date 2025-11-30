"""
Model serialization and persistence module
"""
import pickle
import json
import os
from datetime import datetime
from typing import Any, Dict, Optional
import config

class ModelSerializer:
    """Handles model serialization and deserialization"""
    
    @staticmethod
    def save_model(model: Any, model_id: int, model_name: str) -> str:
        """
        Save trained model to disk
        
        Args:
            model: Trained sklearn model
            model_id: Database ID for the model
            model_name: Name of the model
        
        Returns:
            Path to saved model file
        """
        try:
            # Create unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"model_{model_id}_{model_name.replace(' ', '_')}_{timestamp}.pkl"
            filepath = os.path.join(config.MODEL_STORAGE_PATH, filename)
            
            # Ensure directory exists
            os.makedirs(config.MODEL_STORAGE_PATH, exist_ok=True)
            
            # Serialize and save model
            with open(filepath, 'wb') as f:
                pickle.dump(model, f)
            
            print(f"✓ Model saved to: {filepath}")
            return filepath
        except Exception as e:
            print(f"✗ Error saving model: {e}")
            raise
    
    @staticmethod
    def load_model(filepath: str) -> Optional[Any]:
        """
        Load model from disk
        
        Args:
            filepath: Path to model file
        
        Returns:
            Loaded model or None if error
        """
        try:
            if not os.path.exists(filepath):
                print(f"✗ Model file not found: {filepath}")
                return None
            
            with open(filepath, 'rb') as f:
                model = pickle.load(f)
            
            print(f"✓ Model loaded from: {filepath}")
            return model
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            return None
    
    @staticmethod
    def save_metadata(model_id: int, metadata: Dict) -> str:
        """
        Save model metadata (preprocessing info, label encoders, etc.)
        
        Args:
            model_id: Database ID for the model
            metadata: Dictionary containing metadata
        
        Returns:
            Path to saved metadata file
        """
        try:
            filename = f"metadata_{model_id}.json"
            filepath = os.path.join(config.MODEL_STORAGE_PATH, filename)
            
            os.makedirs(config.MODEL_STORAGE_PATH, exist_ok=True)
            
            with open(filepath, 'w') as f:
                json.dump(metadata, f, indent=4, default=str)
            
            print(f"✓ Metadata saved to: {filepath}")
            return filepath
        except Exception as e:
            print(f"✗ Error saving metadata: {e}")
            raise
    
    @staticmethod
    def load_metadata(model_id: int) -> Optional[Dict]:
        """
        Load model metadata
        
        Args:
            model_id: Database ID for the model
        
        Returns:
            Metadata dictionary or None if error
        """
        try:
            filename = f"metadata_{model_id}.json"
            filepath = os.path.join(config.MODEL_STORAGE_PATH, filename)
            
            if not os.path.exists(filepath):
                print(f"✗ Metadata file not found: {filepath}")
                return None
            
            with open(filepath, 'r') as f:
                metadata = json.load(f)
            
            print(f"✓ Metadata loaded from: {filepath}")
            return metadata
        except Exception as e:
            print(f"✗ Error loading metadata: {e}")
            return None
    
    @staticmethod
    def serialize_preprocessing(label_encoders: Dict, scaler: Any) -> Dict:
        """
        Convert preprocessing objects to serializable format
        
        Args:
            label_encoders: Dictionary of label encoders
            scaler: StandardScaler instance
        
        Returns:
            Dictionary with serialized preprocessing info
        """
        import numpy as np
        
        serialized = {
            'label_encoders': {},
            'scaler': None
        }
        
        # Serialize label encoders
        for name, encoder in label_encoders.items():
            serialized['label_encoders'][name] = {
                'classes': encoder.classes_.tolist() if hasattr(encoder, 'classes_') else [],
                'type': type(encoder).__name__
            }
        
        # Serialize scaler
        if scaler:
            serialized['scaler'] = {
                'mean': scaler.mean_.tolist() if hasattr(scaler, 'mean_') else [],
                'scale': scaler.scale_.tolist() if hasattr(scaler, 'scale_') else [],
                'type': type(scaler).__name__
            }
        
        return serialized

class PreprocessingPipeline:
    """Handles preprocessing for predictions"""
    
    def __init__(self, label_encoders: Dict = None, scaler: Any = None):
        """
        Initialize preprocessing pipeline
        
        Args:
            label_encoders: Dict of label encoders for categorical features
            scaler: StandardScaler instance for feature scaling
        """
        self.label_encoders = label_encoders or {}
        self.scaler = scaler
    
    def preprocess_input(self, input_data: Dict, input_features: list) -> Any:
        """
        Preprocess input data for prediction
        
        Args:
            input_data: Raw input data dictionary
            input_features: List of feature names
        
        Returns:
            Preprocessed numpy array ready for model prediction
        """
        import numpy as np
        
        try:
            # Extract features in correct order
            features = []
            for feature in input_features:
                if feature in input_data:
                    value = input_data[feature]
                    
                    # Encode categorical features
                    if feature in self.label_encoders:
                        encoder = self.label_encoders[feature]
                        # Handle unknown categories
                        try:
                            value = encoder.transform([value])[0]
                        except ValueError:
                            # Use the most common class if unknown
                            value = encoder.transform([encoder.classes_[0]])[0]
                    
                    features.append(float(value))
                else:
                    raise ValueError(f"Missing required feature: {feature}")
            
            # Convert to numpy array
            X = np.array([features])
            
            # Scale features if scaler is available
            if self.scaler:
                X = self.scaler.transform(X)
            
            return X
        except Exception as e:
            print(f"✗ Error preprocessing input: {e}")
            raise
    
    def postprocess_output(self, prediction: Any, label_encoder: Any = None) -> Any:
        """
        Postprocess model output
        
        Args:
            prediction: Raw model prediction
            label_encoder: Label encoder for target variable (for classification)
        
        Returns:
            Human-readable prediction
        """
        import numpy as np
        try:
            if isinstance(prediction, (list, np.ndarray)):
                prediction = prediction[0]
            
            # Decode categorical predictions
            if label_encoder:
                prediction = label_encoder.inverse_transform([int(prediction)])[0]
            
            return prediction
        except Exception as e:
            print(f"✗ Error postprocessing output: {e}")
            raise

    @staticmethod
    def serialize_preprocessing(label_encoders: Dict, scaler: Any) -> Dict:
        """Convert preprocessing objects to serializable format"""
        import numpy as np
        
        serialized = {
            'label_encoders': {},
            'scaler': None
        }
        
        # Serialize label encoders
        for name, encoder in label_encoders.items():
            serialized['label_encoders'][name] = {
                'classes': encoder.classes_.tolist() if hasattr(encoder, 'classes_') else [],
                'type': type(encoder).__name__
            }
        
        # Serialize scaler
        if scaler:
            serialized['scaler'] = {
                'mean': scaler.mean_.tolist() if hasattr(scaler, 'mean_') else [],
                'scale': scaler.scale_.tolist() if hasattr(scaler, 'scale_') else [],
                'type': type(scaler).__name__
            }
        
        return serialized
