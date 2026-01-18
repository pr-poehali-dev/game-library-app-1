const AUTH_API = 'https://functions.poehali.dev/b53250f7-f9a4-4d8e-89bd-ecce19aef1fb';
const GAMES_API = 'https://functions.poehali.dev/91af6857-eac0-4d77-8518-f9cb1866501c';

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  games_count?: number;
}

export interface Game {
  id: number;
  title: string;
  description?: string;
  platform: 'PC' | 'Mobile' | 'VR';
  genre: string;
  image_url: string;
  rating: number;
  release_date?: string;
  developer?: string;
  publisher?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const api = {
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email, username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка регистрации');
    }
    
    return response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка входа');
    }
    
    return response.json();
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'profile' }),
    });
    
    if (!response.ok) {
      throw new Error('Ошибка загрузки профиля');
    }
    
    return response.json();
  },

  async getCatalog(search?: string, platform?: string): Promise<Game[]> {
    const params = new URLSearchParams({ action: 'catalog' });
    if (search) params.append('search', search);
    if (platform && platform !== 'All') params.append('platform', platform);
    
    const response = await fetch(`${GAMES_API}?${params}`);
    
    if (!response.ok) {
      throw new Error('Ошибка загрузки каталога');
    }
    
    return response.json();
  },

  async getGame(id: number): Promise<Game> {
    const params = new URLSearchParams({ action: 'game_detail', id: String(id) });
    const response = await fetch(`${GAMES_API}?${params}`);
    
    if (!response.ok) {
      throw new Error('Игра не найдена');
    }
    
    return response.json();
  },

  async getLibrary(token: string): Promise<Game[]> {
    const params = new URLSearchParams({ action: 'library' });
    const response = await fetch(`${GAMES_API}?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) {
      throw new Error('Ошибка загрузки библиотеки');
    }
    
    return response.json();
  },

  async addToLibrary(token: string, gameId: number): Promise<void> {
    const response = await fetch(GAMES_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'add_to_library', game_id: gameId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка добавления в библиотеку');
    }
  },

  async removeFromLibrary(token: string, gameId: number): Promise<void> {
    const response = await fetch(GAMES_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'remove_from_library', game_id: gameId }),
    });
    
    if (!response.ok) {
      throw new Error('Ошибка удаления из библиотеки');
    }
  },
};
