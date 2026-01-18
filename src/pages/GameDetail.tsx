import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api, Game } from '@/lib/api';
import { auth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [inLibrary, setInLibrary] = useState(false);

  useEffect(() => {
    if (id) {
      loadGame(parseInt(id));
    }
  }, [id]);

  const loadGame = async (gameId: number) => {
    try {
      const data = await api.getGame(gameId);
      setGame(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить игру',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async () => {
    const token = auth.getToken();
    if (!token) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в аккаунт, чтобы добавить игру в библиотеку',
      });
      return;
    }

    if (!game) return;

    try {
      if (inLibrary) {
        await api.removeFromLibrary(token, game.id);
        setInLibrary(false);
        toast({
          title: 'Удалено',
          description: 'Игра удалена из библиотеки',
        });
      } else {
        await api.addToLibrary(token, game.id);
        setInLibrary(true);
        toast({
          title: 'Добавлено',
          description: 'Игра добавлена в библиотеку',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Произошла ошибка',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4">
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
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
            <img
              src={game.image_url}
              alt={game.title}
              className="w-full rounded-xl shadow-2xl hover-scale"
            />
            <Button
              onClick={handleAddToLibrary}
              className="w-full mt-4"
              size="lg"
              variant={inLibrary ? 'secondary' : 'default'}
            >
              {inLibrary ? (
                <>
                  <Icon name="Check" size={20} className="mr-2" />
                  В библиотеке
                </>
              ) : (
                <>
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить в библиотеку
                </>
              )}
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-4xl font-bold mb-4">{game.title}</h2>
              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Icon name="Monitor" size={16} className="mr-1" />
                  {game.platform}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {game.genre}
                </Badge>
                <div className="flex items-center gap-1 bg-card px-3 py-1 rounded-md">
                  <Icon name="Star" size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{game.rating}</span>
                </div>
              </div>
            </div>

            {game.description && (
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-xl font-semibold mb-3">Описание</h3>
                <p className="text-muted-foreground leading-relaxed">{game.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.developer && (
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Users" size={20} className="text-primary" />
                    <h4 className="font-semibold">Разработчик</h4>
                  </div>
                  <p className="text-muted-foreground">{game.developer}</p>
                </div>
              )}

              {game.publisher && (
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Building" size={20} className="text-primary" />
                    <h4 className="font-semibold">Издатель</h4>
                  </div>
                  <p className="text-muted-foreground">{game.publisher}</p>
                </div>
              )}

              {game.release_date && (
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Calendar" size={20} className="text-primary" />
                    <h4 className="font-semibold">Дата выхода</h4>
                  </div>
                  <p className="text-muted-foreground">
                    {new Date(game.release_date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Gamepad2" size={20} className="text-primary" />
                  <h4 className="font-semibold">Платформа</h4>
                </div>
                <p className="text-muted-foreground">{game.platform}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
