import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для работы с каталогом игр и библиотекой пользователя"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        body = json.loads(event.get('body', '{}')) if method == 'POST' else {}
        params = event.get('queryStringParameters') or {}
        action = body.get('action', params.get('action', ''))
        
        if action == 'catalog' and method == 'GET':
            search = params.get('search', '')
            platform = params.get('platform', '')
            
            query = "SELECT * FROM games WHERE 1=1"
            query_params = []
            
            if search:
                query += " AND (LOWER(title) LIKE %s OR LOWER(genre) LIKE %s)"
                search_pattern = f'%{search.lower()}%'
                query_params.extend([search_pattern, search_pattern])
            
            if platform and platform != 'All':
                query += " AND platform = %s"
                query_params.append(platform)
            
            query += " ORDER BY rating DESC, title ASC"
            
            cur.execute(query, query_params)
            games = cur.fetchall()
            
            return success_response([dict(game) for game in games])
        
        elif action == 'game_detail' and method == 'GET':
            game_id = params.get('id', '')
            
            cur.execute("SELECT * FROM games WHERE id = %s", (game_id,))
            game = cur.fetchone()
            
            if not game:
                return error_response('Игра не найдена', 404)
            
            return success_response(dict(game))
        
        elif action in ['library', 'add_to_library', 'remove_from_library']:
            token = event.get('headers', {}).get('X-Authorization', event.get('headers', {}).get('authorization', '')).replace('Bearer ', '')
            
            if not token:
                return error_response('Требуется авторизация', 401)
            
            try:
                import jwt
                secret = os.environ.get('JWT_SECRET', 'default_secret_key')
                payload = jwt.decode(token, secret, algorithms=['HS256'])
                user_id = payload['user_id']
            except:
                return error_response('Неверный токен', 401)
            
            if action == 'library' and method == 'GET':
                cur.execute("""
                    SELECT g.* FROM games g
                    JOIN user_library ul ON g.id = ul.game_id
                    WHERE ul.user_id = %s
                    ORDER BY ul.added_at DESC
                """, (user_id,))
                games = cur.fetchall()
                
                return success_response([dict(game) for game in games])
            
            elif action == 'add_to_library' and method == 'POST':
                game_id = body.get('game_id')
                
                if not game_id:
                    return error_response('game_id обязателен', 400)
                
                try:
                    cur.execute(
                        "INSERT INTO user_library (user_id, game_id) VALUES (%s, %s)",
                        (user_id, game_id)
                    )
                    conn.commit()
                    return success_response({'message': 'Игра добавлена в библиотеку'})
                except psycopg2.IntegrityError:
                    conn.rollback()
                    return error_response('Игра уже в библиотеке', 400)
            
            elif action == 'remove_from_library' and method == 'POST':
                game_id = body.get('game_id')
                
                if not game_id:
                    return error_response('game_id обязателен', 400)
                
                cur.execute(
                    "DELETE FROM user_library WHERE user_id = %s AND game_id = %s",
                    (user_id, game_id)
                )
                conn.commit()
                
                return success_response({'message': 'Игра удалена из библиотеки'})
        
        cur.close()
        conn.close()
        
        return error_response('Метод не найден', 404)
        
    except Exception as e:
        return error_response(str(e), 500)

def success_response(data) -> dict:
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, default=str),
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