import json
import os
import hashlib
import jwt
from datetime import datetime, timedelta
import psycopg2

def handler(event: dict, context) -> dict:
    """API для регистрации, входа и управления пользователями"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        action = body.get('action', '')
        
        if action == 'register' and method == 'POST':
            email = body.get('email')
            username = body.get('username')
            password = body.get('password')
            
            if not email or not username or not password:
                return error_response('Все поля обязательны', 400)
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            try:
                cur.execute(
                    "INSERT INTO users (email, username, password_hash) VALUES (%s, %s, %s) RETURNING id, email, username, created_at",
                    (email, username, password_hash)
                )
                user = cur.fetchone()
                conn.commit()
                
                token = generate_token(user[0])
                
                return success_response({
                    'token': token,
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'username': user[2],
                        'created_at': user[3].isoformat()
                    }
                })
            except psycopg2.IntegrityError:
                conn.rollback()
                return error_response('Пользователь с таким email или username уже существует', 400)
        
        elif action == 'login' and method == 'POST':
            email = body.get('email')
            password = body.get('password')
            
            if not email or not password:
                return error_response('Email и пароль обязательны', 400)
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(
                "SELECT id, email, username, created_at FROM users WHERE email = %s AND password_hash = %s",
                (email, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                return error_response('Неверный email или пароль', 401)
            
            token = generate_token(user[0])
            
            return success_response({
                'token': token,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'username': user[2],
                    'created_at': user[3].isoformat()
                }
            })
        
        elif action == 'profile' and method == 'POST':
            token = event.get('headers', {}).get('X-Authorization', event.get('headers', {}).get('authorization', '')).replace('Bearer ', '')
            
            if not token:
                return error_response('Требуется авторизация', 401)
            
            try:
                user_id = verify_token(token)
                
                cur.execute(
                    "SELECT id, email, username, avatar_url, created_at FROM users WHERE id = %s",
                    (user_id,)
                )
                user = cur.fetchone()
                
                if not user:
                    return error_response('Пользователь не найден', 404)
                
                cur.execute(
                    "SELECT COUNT(*) FROM user_library WHERE user_id = %s",
                    (user_id,)
                )
                games_count = cur.fetchone()[0]
                
                return success_response({
                    'id': user[0],
                    'email': user[1],
                    'username': user[2],
                    'avatar_url': user[3],
                    'created_at': user[4].isoformat(),
                    'games_count': games_count
                })
            except Exception as e:
                return error_response('Неверный токен', 401)
        
        cur.close()
        conn.close()
        
        return error_response('Метод не найден', 404)
        
    except Exception as e:
        return error_response(str(e), 500)

def generate_token(user_id: int) -> str:
    secret = os.environ.get('JWT_SECRET', 'default_secret_key')
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def verify_token(token: str) -> int:
    secret = os.environ.get('JWT_SECRET', 'default_secret_key')
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    return payload['user_id']

def success_response(data: dict) -> dict:
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data),
        'isBase64Encoded': False
    }

def error_response(message: str, status_code: int) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }