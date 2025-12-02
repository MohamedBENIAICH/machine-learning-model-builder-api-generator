import functools
import time
from datetime import datetime, timedelta
from flask import request, g
import json
import mysql.connector
import psutil
import os

def create_api_stats_tables(connection):
    """Create table for tracking API calls if it doesn't exist"""
    cursor = connection.cursor(buffered=True)
    try:
        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                endpoint VARCHAR(255) NOT NULL,
                method VARCHAR(10) NOT NULL,
                status_code INT NOT NULL,
                response_time_ms FLOAT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                model_id INT,
                client_ip VARCHAR(45),
                cpu_percent FLOAT,
                memory_usage_mb FLOAT,
                INDEX idx_endpoint (endpoint),
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Check if new columns exist, if not add them (simple migration)
        cursor.execute("SHOW COLUMNS FROM api_stats LIKE 'cpu_percent'")
        if not cursor.fetchone():
            print("Adding cpu_percent column to api_stats...")
            cursor.execute("ALTER TABLE api_stats ADD COLUMN cpu_percent FLOAT")
            
        cursor.execute("SHOW COLUMNS FROM api_stats LIKE 'memory_usage_mb'")
        if not cursor.fetchone():
            print("Adding memory_usage_mb column to api_stats...")
            cursor.execute("ALTER TABLE api_stats ADD COLUMN memory_usage_mb FLOAT")

        # Also create code_copies table as seen in app.py usage
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS code_copies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                model_id INT NOT NULL,
                section VARCHAR(50) NOT NULL,
                client_id VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_model_id (model_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        connection.commit()
        print("✓ API statistics tables created/updated successfully")
    except mysql.connector.Error as e:
        print(f"✗ Error creating/updating API stats tables: {e}")
    finally:
        cursor.close()

def track_api_call(func):
    """Decorator to track API calls"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        # Execute the function
        response = func(*args, **kwargs)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Get system metrics
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        memory_usage_mb = memory.used / (1024 * 1024)
        
        # Extract status code
        status_code = 200
        if isinstance(response, tuple):
            status_code = response[1]
        elif hasattr(response, 'status_code'):
            status_code = response.status_code
            
        # Extract model_id if present in kwargs or args
        model_id = kwargs.get('model_id')
        
        # Log to database if possible
        try:
            from database import get_db
            db = get_db()
            if db and db.connection:
                cursor = db.connection.cursor(buffered=True)
                query = """
                    INSERT INTO api_stats 
                    (endpoint, method, status_code, response_time_ms, model_id, client_ip, cpu_percent, memory_usage_mb)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (
                    request.path,
                    request.method,
                    status_code,
                    duration_ms,
                    model_id,
                    request.remote_addr,
                    cpu_percent,
                    memory_usage_mb
                ))
                db.connection.commit()
                cursor.close()
        except Exception as e:
            print(f"Warning: Failed to log API stat: {e}")
            
        return response
    return wrapper

def get_api_statistics(db_manager, model_id=None, days=7):
    """Get detailed API statistics"""
    cursor = db_manager.connection.cursor(dictionary=True, buffered=True)
    stats = {
        'totalCalls': 0,
        'successfulCalls': 0,
        'failedCalls': 0,
        'avgResponseTime': 0,
        'totalCopiedCount': 0,
        'endpoints': [],
        'timeSeriesData': [],
        'geographicData': [],
        'resourceUsage': {'cpu': 0, 'memory': 0, 'timestamp': datetime.now().isoformat()},
        'topClients': []
    }
    
    try:
        # 1. Overview Stats
        query_overview = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed,
                AVG(response_time_ms) as avg_time
            FROM api_stats
            WHERE timestamp >= CURDATE() - INTERVAL %s DAY
        """
        params = [days]
        if model_id:
            query_overview += " AND model_id = %s"
            params.append(model_id)
            
        cursor.execute(query_overview, params)
        overview = cursor.fetchone()
        
        if overview:
            stats['totalCalls'] = overview['total'] or 0
            stats['successfulCalls'] = overview['success'] or 0
            stats['failedCalls'] = overview['failed'] or 0
            stats['avgResponseTime'] = round(overview['avg_time'] or 0, 2)

        # 2. Code Copies
        query_copies = "SELECT COUNT(*) as count FROM code_copies WHERE timestamp >= CURDATE() - INTERVAL %s DAY"
        params_copies = [days]
        if model_id:
            query_copies += " AND model_id = %s"
            params_copies.append(model_id)
            
        cursor.execute(query_copies, params_copies)
        copies = cursor.fetchone()
        stats['totalCopiedCount'] = copies['count'] if copies else 0

        # 3. Time Series Data
        query_series = """
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as calls,
                SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate,
                AVG(response_time_ms) as avg_response_time
            FROM api_stats
            WHERE timestamp >= CURDATE() - INTERVAL %s DAY
        """
        params_series = [days]
        if model_id:
            query_series += " AND model_id = %s"
            params_series.append(model_id)
        
        query_series += " GROUP BY DATE(timestamp) ORDER BY date"
        
        cursor.execute(query_series, params_series)
        series_results = cursor.fetchall()
        
        stats['timeSeriesData'] = [
            {
                'date': r['date'].strftime('%Y-%m-%d'),
                'calls': r['calls'],
                'successRate': round(float(r['success_rate']), 2),
                'avgResponseTime': round(r['avg_response_time'], 2)
            } for r in series_results
        ]

        # 4. Endpoints Stats
        query_endpoints = """
            SELECT 
                endpoint,
                method,
                COUNT(*) as call_count,
                SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate,
                AVG(response_time_ms) as avg_response_time
            FROM api_stats
            WHERE timestamp >= CURDATE() - INTERVAL %s DAY
        """
        params_endpoints = [days]
        if model_id:
            query_endpoints += " AND model_id = %s"
            params_endpoints.append(model_id)
            
        query_endpoints += " GROUP BY endpoint, method ORDER BY call_count DESC LIMIT 10"
        
        cursor.execute(query_endpoints, params_endpoints)
        endpoint_results = cursor.fetchall()
        
        stats['endpoints'] = [
            {
                'endpoint': r['endpoint'],
                'method': r['method'],
                'callCount': r['call_count'],
                'successRate': round(float(r['success_rate']), 2),
                'avgResponseTime': round(r['avg_response_time'], 2)
            } for r in endpoint_results
        ]

        # 5. Top Clients
        query_clients = """
            SELECT 
                client_ip as client_id,
                COUNT(*) as call_count,
                MAX(timestamp) as last_active
            FROM api_stats
            WHERE timestamp >= CURDATE() - INTERVAL %s DAY
        """
        params_clients = [days]
        if model_id:
            query_clients += " AND model_id = %s"
            params_clients.append(model_id)
            
        query_clients += " GROUP BY client_ip ORDER BY call_count DESC LIMIT 5"
        
        cursor.execute(query_clients, params_clients)
        client_results = cursor.fetchall()
        
        stats['topClients'] = [
            {
                'clientId': r['client_id'] or 'Unknown',
                'callCount': r['call_count'],
                'lastActive': r['last_active'].isoformat()
            } for r in client_results
        ]
        
        # 6. Resource Usage (Latest)
        # In a real app we might average this over time, but for now let's take the average of the last hour
        query_resources = """
            SELECT AVG(cpu_percent) as cpu, AVG(memory_usage_mb) as memory
            FROM api_stats
            WHERE timestamp >= NOW() - INTERVAL 1 HOUR
        """
        params_resources = []
        if model_id:
            query_resources += " AND model_id = %s"
            params_resources.append(model_id)
            
        cursor.execute(query_resources, params_resources)
        resource_result = cursor.fetchone()
        
        if resource_result and resource_result['cpu'] is not None:
             stats['resourceUsage'] = {
                'cpu': round(resource_result['cpu'], 2),
                'memory': round(resource_result['memory'], 2),
                'timestamp': datetime.now().isoformat()
             }
        else:
             # Fallback to current system stats if no DB stats
             stats['resourceUsage'] = {
                'cpu': psutil.cpu_percent(),
                'memory': psutil.virtual_memory().used / (1024 * 1024),
                'timestamp': datetime.now().isoformat()
             }

        # 7. Status Code Distribution (Replaces Geographic Data)
        query_status = """
            SELECT 
                CASE 
                    WHEN status_code >= 200 AND status_code < 300 THEN 'Success (2xx)'
                    WHEN status_code >= 400 AND status_code < 500 THEN 'Client Error (4xx)'
                    WHEN status_code >= 500 THEN 'Server Error (5xx)'
                    ELSE 'Other'
                END as category,
                COUNT(*) as count
            FROM api_stats
            WHERE timestamp >= CURDATE() - INTERVAL %s DAY
        """
        params_status = [days]
        if model_id:
            query_status += " AND model_id = %s"
            params_status.append(model_id)
        query_status += " GROUP BY category"
        
        cursor.execute(query_status, params_status)
        status_stats = cursor.fetchall()
        
        stats['statusCodeDistribution'] = [
            {'name': row['category'], 'value': row['count']} for row in status_stats
        ]
        
        return stats
        
    except Exception as e:
        print(f"Error getting API stats: {e}")
        return stats
    finally:
        cursor.close()

def track_code_copy(model_id, section, client_ip=None):
    """Track when a user copies code snippet"""
    try:
        from database import get_db
        db = get_db()
        if db and db.connection:
            cursor = db.connection.cursor(buffered=True)
            query = """
                INSERT INTO code_copies 
                (model_id, section, client_id)
                VALUES (%s, %s, %s)
            """
            cursor.execute(query, (model_id, section, client_ip))
            db.connection.commit()
            cursor.close()
            return True
    except Exception as e:
        print(f"Error tracking code copy: {e}")
        return False
