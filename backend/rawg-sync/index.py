import json
import os
import psycopg2
import requests
from typing import Dict, List, Any

def handler(event: dict, context) -> dict:
    """Синхронизация игр из RAWG API в базу данных с настоящими обложками"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    
    params = event.get('queryStringParameters') or {}
    action = body.get('action', params.get('action', 'sync'))
    
    if action == 'sync' and method == 'POST':
        page = body.get('page', 1)
        page_size = body.get('page_size', 40)
        
        rawg_key = os.environ.get('RAWG_API_KEY')
        db_url = os.environ.get('DATABASE_URL')
        
        url = f'https://api.rawg.io/api/games?key={rawg_key}&page={page}&page_size={page_size}'
        
        response = requests.get(url, timeout=10)
        data = response.json()
        
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        added_count = 0
        updated_count = 0
        
        for game in data.get('results', []):
            rawg_id = game.get('id')
            title = game.get('name', 'Unknown')
            rating = round(game.get('rating', 0.0), 1)
            image_url = game.get('background_image', 'https://via.placeholder.com/600x800?text=No+Image')
            released = game.get('released')
            
            platforms = game.get('platforms', [])
            platform = 'PC'
            for p in platforms:
                platform_name = p.get('platform', {}).get('name', '').lower()
                if 'playstation vr' in platform_name or 'vr' in platform_name:
                    platform = 'VR'
                    break
                elif 'android' in platform_name or 'ios' in platform_name:
                    platform = 'Mobile'
                    break
            
            genres = game.get('genres', [])
            genre = genres[0].get('name') if genres else 'Adventure'
            
            description = game.get('description_raw') or f'{title} - популярная игра'
            if len(description) > 500:
                description = description[:497] + '...'
            
            cursor.execute(
                "SELECT id FROM games WHERE rawg_id = %s",
                (rawg_id,)
            )
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute(
                    """UPDATE games 
                       SET title = %s, rating = %s, image_url = %s, 
                           platform = %s, genre = %s, description = %s, 
                           release_date = %s
                       WHERE rawg_id = %s""",
                    (title, rating, image_url, platform, genre, description, released, rawg_id)
                )
                updated_count += 1
            else:
                cursor.execute(
                    """INSERT INTO games 
                       (title, description, platform, genre, image_url, rating, release_date, rawg_id)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (title, description, platform, genre, image_url, rating, released, rawg_id)
                )
                added_count += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'page': page,
                'total_results': data.get('count', 0),
                'added': added_count,
                'updated': updated_count,
                'next_page': page + 1 if data.get('next') else None
            })
        }
    
    elif action == 'status' and method == 'GET':
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM games")
        total_games = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM games WHERE rawg_id IS NOT NULL")
        synced_games = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'total_games': total_games,
                'synced_from_rawg': synced_games
            })
        }
    
    return {
        'statusCode': 400,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Invalid action'})
    }
