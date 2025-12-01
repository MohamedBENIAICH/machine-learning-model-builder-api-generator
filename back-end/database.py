"""
Database module for handling MySQL connections and model storage
"""
import mysql.connector
from mysql.connector import Error
import json
import os
from datetime import datetime
from typing import Optional, List, Dict
import config
# from database import get_db
from api_statistics import create_api_stats_tables

class DatabaseManager:
    """Handles all database operations for ML models"""
    
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """Establish connection to MySQL database"""
        try:
            self.connection = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME,
                port=config.DB_PORT
            )
            print("✓ Database connection established")
        except Error as e:
            print(f"✗ Error connecting to database: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✓ Database connection closed")
    
    def create_tables(self):
        """Create necessary tables if they don't exist"""
        cursor = self.connection.cursor()
        
        try:
            # Models table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS models (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    model_name VARCHAR(255) NOT NULL,
                    description TEXT,
                    model_type ENUM('classification', 'regression') NOT NULL,
                    best_algorithm VARCHAR(255) NOT NULL,
                    metrics JSON NOT NULL,
                    justification TEXT,
                    model_file_path VARCHAR(500) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    input_features JSON NOT NULL,
                    output_feature VARCHAR(255) NOT NULL,
                    accuracy FLOAT,
                    INDEX idx_model_name (model_name),
                    INDEX idx_model_type (model_type),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            
            # Prediction history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    model_id INT NOT NULL,
                    input_data JSON NOT NULL,
                    prediction JSON NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
                    INDEX idx_model_id (model_id),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            
            # Training results table (for all algorithms tested)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS training_results (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    model_id INT NOT NULL,
                    algorithm_name VARCHAR(255) NOT NULL,
                    metrics JSON NOT NULL,
                    score FLOAT NOT NULL,
                    INDEX idx_model_id (model_id),
                    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            
            self.connection.commit()
            print("✓ Database tables created successfully")
        except Error as e:
            print(f"✗ Error creating tables: {e}")
            self.connection.rollback()
            raise
        finally:
            cursor.close()
    
    def save_model(self, model_name: str, description: str, model_type: str,
                   best_algorithm: str, metrics: Dict, justification: str,
                   model_file_path: str, input_features: List[str],
                   output_feature: str, all_results: List[Dict]) -> Optional[int]:
        """
        Save model information to database
        
        Returns: model_id if successful, None otherwise
        """
        cursor = self.connection.cursor()
        
        try:
            # Determine accuracy/score value
            if model_type == 'classification':
                accuracy = metrics.get('f1_score')
            else:
                accuracy = metrics.get('r2_score')
            
            # Insert model record
            insert_query = """
                INSERT INTO models 
                (model_name, description, model_type, best_algorithm, metrics, 
                 justification, model_file_path, input_features, output_feature, accuracy)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(insert_query, (
                model_name,
                description,
                model_type,
                best_algorithm,
                json.dumps(metrics),
                justification,
                model_file_path,
                json.dumps(input_features),
                output_feature,
                accuracy
            ))
            
            model_id = cursor.lastrowid
            
            # Save all training results
            for result in all_results:
                self.save_training_result(model_id, result['algorithm'], 
                                        result['metrics'], result['score'])
            
            self.connection.commit()
            print(f"✓ Model saved to database with ID: {model_id}")
            return model_id
            
        except Error as e:
            print(f"✗ Error saving model: {e}")
            self.connection.rollback()
            return None
        finally:
            cursor.close()
    
    def save_training_result(self, model_id: int, algorithm_name: str,
                            metrics: Dict, score: float):
        """Save individual algorithm training result"""
        cursor = self.connection.cursor()
        
        try:
            query = """
                INSERT INTO training_results (model_id, algorithm_name, metrics, score)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (model_id, algorithm_name, json.dumps(metrics), score))
            self.connection.commit()
        except Error as e:
            print(f"✗ Error saving training result: {e}")
            self.connection.rollback()
        finally:
            cursor.close()
    
    def get_model(self, model_id: int) -> Optional[Dict]:
        """Retrieve model information from database"""
        cursor = self.connection.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM models WHERE id = %s"
            cursor.execute(query, (model_id,))
            result = cursor.fetchone()
            
            if result:
                # Parse JSON fields
                result['metrics'] = json.loads(result['metrics'])
                result['input_features'] = json.loads(result['input_features'])
            
            return result
        except Error as e:
            print(f"✗ Error retrieving model: {e}")
            return None
        finally:
            cursor.close()
    
    def get_all_models(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Retrieve all models with pagination"""
        cursor = self.connection.cursor(dictionary=True)
        
        try:
            query = """
                SELECT id, model_name, description, model_type, best_algorithm, 
                       accuracy, created_at, updated_at
                FROM models
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"✗ Error retrieving models: {e}")
            return []
        finally:
            cursor.close()
    
    def get_model_count(self) -> int:
        """Get total count of models"""
        cursor = self.connection.cursor()
        
        try:
            query = "SELECT COUNT(*) as count FROM models"
            cursor.execute(query)
            result = cursor.fetchone()
            return result[0] if result else 0
        except Error as e:
            print(f"✗ Error counting models: {e}")
            return 0
        finally:
            cursor.close()
    
    def get_training_results(self, model_id: int) -> List[Dict]:
        """Get all training results for a specific model"""
        cursor = self.connection.cursor(dictionary=True)
        
        try:
            query = """
                SELECT algorithm_name, metrics, score
                FROM training_results
                WHERE model_id = %s
                ORDER BY score DESC
            """
            cursor.execute(query, (model_id,))
            results = cursor.fetchall()
            
            for result in results:
                result['metrics'] = json.loads(result['metrics'])
            
            return results
        except Error as e:
            print(f"✗ Error retrieving training results: {e}")
            return []
        finally:
            cursor.close()
    
    def save_prediction(self, model_id: int, input_data: Dict, prediction: Dict):
        """Save prediction history"""
        cursor = self.connection.cursor()
        
        try:
            query = """
                INSERT INTO predictions (model_id, input_data, prediction)
                VALUES (%s, %s, %s)
            """
            cursor.execute(query, (model_id, json.dumps(input_data), json.dumps(prediction)))
            self.connection.commit()
            print(f"✓ Prediction saved for model {model_id}")
        except Error as e:
            print(f"✗ Error saving prediction: {e}")
            self.connection.rollback()
        finally:
            cursor.close()
    
    def delete_model(self, model_id: int) -> bool:
        """Delete a model and its associated data"""
        cursor = self.connection.cursor()
        
        try:
            # Get model file path
            query = "SELECT model_file_path FROM models WHERE id = %s"
            cursor.execute(query, (model_id,))
            result = cursor.fetchone()
            
            if result:
                model_file_path = result[0]
                
                # Delete model file
                if os.path.exists(model_file_path):
                    os.remove(model_file_path)
                    print(f"✓ Model file deleted: {model_file_path}")
                
                # Delete database records (cascade will handle related records)
                delete_query = "DELETE FROM models WHERE id = %s"
                cursor.execute(delete_query, (model_id,))
                self.connection.commit()
                print(f"✓ Model {model_id} deleted from database")
                return True
            
            return False
        except Error as e:
            print(f"✗ Error deleting model: {e}")
            self.connection.rollback()
            return False
        finally:
            cursor.close()
    
    def update_model(self, model_id: int, **kwargs) -> bool:
        """Update model information"""
        cursor = self.connection.cursor()
        
        try:
            allowed_fields = ['model_name', 'description']
            updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
            
            if not updates:
                return False
            
            set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
            values = list(updates.values()) + [model_id]
            
            query = f"UPDATE models SET {set_clause} WHERE id = %s"
            cursor.execute(query, values)
            self.connection.commit()
            print(f"✓ Model {model_id} updated")
            return True
        except Error as e:
            print(f"✗ Error updating model: {e}")
            self.connection.rollback()
            return False
        finally:
            cursor.close()

    def get_model_by_name(self, model_name):
        """Get model by name from database"""
        cursor = self.conn.cursor(dictionary=True)
        query = "SELECT * FROM models WHERE name = %s"
        cursor.execute(query, (model_name,))
        model = cursor.fetchone()
        cursor.close()
        return model

# Global database manager instance
db_manager = None

def init_db():
    """Initialize database connection"""
    global db_manager
    db_manager = DatabaseManager()
    db_manager.create_tables()
    return db_manager

def get_db():
    """Get database manager instance"""
    global db_manager
    if db_manager is None:
        init_db()
    return db_manager

db = get_db()
create_api_stats_tables(db.connection)