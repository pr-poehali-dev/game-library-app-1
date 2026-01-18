import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api, User } from '@/lib/api';
import { auth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      navigate('/auth');
      return;
    }

    loadProfile(token);
  }, []);

  const loadProfile = async (token: string) => {
    try {
      const userData = await api.getProfile(token);
      setUser(userData);
      auth.setUser(userData);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить профиль',
        variant: 'destructive',
      });
      auth.logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    toast({
      title: 'Вы вышли',
      description: 'До встречи!',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Icon name="ArrowLeft" size={20} className="mr-2" />
                Назад
              </Button>
              <div className="flex items-center gap-3">
                <Icon name="Gamepad2" size={28} className="text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  GameHub
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-3xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{user.username}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-background rounded-lg p-4 text-center">
                <Icon name="Library" size={32} className="mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{user.games_count || 0}</p>
                <p className="text-sm text-muted-foreground">Игр в библиотеке</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center">
                <Icon name="Calendar" size={32} className="mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">
                  {new Date(user.created_at).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground">Дата регистрации</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center">
                <Icon name="Trophy" size={32} className="mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Достижений</p>
              </div>
            </div>

            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <Icon name="LogOut" size={20} className="mr-2" />
              Выйти из аккаунта
            </Button>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold mb-4">Настройки профиля</h3>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="font-semibold">Email</h4>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="outline" size="sm">
                <Icon name="Edit" size={16} />
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h4 className="font-semibold">Имя пользователя</h4>
                <p className="text-sm text-muted-foreground">{user.username}</p>
              </div>
              <Button variant="outline" size="sm">
                <Icon name="Edit" size={16} />
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="font-semibold">Пароль</h4>
                <p className="text-sm text-muted-foreground">••••••••</p>
              </div>
              <Button variant="outline" size="sm">
                <Icon name="Edit" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
