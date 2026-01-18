import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { api, Game } from '@/lib/api';
import { auth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [libraryGames, setLibraryGames] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'All' | 'PC' | 'Mobile' | 'VR'>('All');
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(true);
  const user = auth.getUser();

  useEffect(() => {
    loadGames();
    if (auth.isAuthenticated()) {
      loadLibrary();
    }
  }, []);

  const loadGames = async () => {
    try {
      const data = await api.getCatalog();
      setGames(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить каталог игр',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLibrary = async () => {
    const token = auth.getToken();
    if (!token) return;

    try {
      const data = await api.getLibrary(token);
      setLibraryGames(data.map(g => g.id));
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  };

  const toggleLibrary = async (gameId: number) => {
    const token = auth.getToken();
    if (!token) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в аккаунт, чтобы добавить игру в библиотеку',
      });
      navigate('/auth');
      return;
    }

    try {
      if (libraryGames.includes(gameId)) {
        await api.removeFromLibrary(token, gameId);
        setLibraryGames(libraryGames.filter(id => id !== gameId));
        toast({
          title: 'Удалено',
          description: 'Игра удалена из библиотеки',
        });
      } else {
        await api.addToLibrary(token, gameId);
        setLibraryGames([...libraryGames, gameId]);
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

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         game.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'All' || game.platform === selectedPlatform;
    const matchesTab = activeTab === 'catalog' || (activeTab === 'library' && libraryGames.includes(game.id));
    return matchesSearch && matchesPlatform && matchesTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Gamepad2" size={32} className="text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                GameHub
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              {user ? (
                <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-muted-foreground hover:text-foreground">
                  <Icon name="User" size={20} className="mr-2" />
                  {user.username}
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="catalog" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Grid3x3" size={18} className="mr-2" />
              Каталог
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Library" size={18} className="mr-2" />
              Библиотека
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск игр..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              <div className="flex gap-2">
                {(['All', 'PC', 'Mobile', 'VR'] as const).map((platform) => (
                  <Button
                    key={platform}
                    variant={selectedPlatform === platform ? 'default' : 'outline'}
                    onClick={() => setSelectedPlatform(platform)}
                    className={selectedPlatform === platform ? 'bg-primary hover:bg-primary/90' : ''}
                  >
                    {platform === 'All' ? 'Все' : platform}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover-glow hover-scale cursor-pointer animate-scale-in"
                  onClick={() => navigate(`/game/${game.id}`)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={game.image_url}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Button
                      size="sm"
                      variant={libraryGames.includes(game.id) ? 'secondary' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLibrary(game.id);
                      }}
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                    >
                      {libraryGames.includes(game.id) ? (
                        <>
                          <Icon name="Check" size={16} className="mr-1" />
                          В библиотеке
                        </>
                      ) : (
                        <>
                          <Icon name="Plus" size={16} className="mr-1" />
                          Добавить
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg truncate">{game.title}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {game.platform}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Icon name="Star" size={14} className="fill-yellow-400 text-yellow-400" />
                        {game.rating}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{game.genre}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="text-center py-20 animate-fade-in">
                <Icon name="Search" size={64} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">Игры не найдены</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="animate-fade-in">
            {!auth.isAuthenticated() ? (
              <div className="text-center py-20">
                <Icon name="Library" size={64} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-4">Войдите, чтобы увидеть свою библиотеку</p>
                <Button onClick={() => navigate('/auth')}>
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </Button>
              </div>
            ) : libraryGames.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="Library" size={64} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-2">Ваша библиотека пуста</p>
                <p className="text-sm text-muted-foreground">Добавьте игры из каталога</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    className="group bg-card rounded-xl overflow-hidden border border-border hover-glow hover-scale cursor-pointer animate-scale-in"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={game.image_url}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLibrary(game.id);
                        }}
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Icon name="Trash2" size={16} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg truncate">{game.title}</h3>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {game.platform}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Icon name="Star" size={14} className="fill-yellow-400 text-yellow-400" />
                          {game.rating}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{game.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-card rounded-xl p-6 border border-border space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Настройки</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold">Уведомления</h3>
                      <p className="text-sm text-muted-foreground">Получать уведомления о новых играх</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icon name="Bell" size={18} />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold">Язык</h3>
                      <p className="text-sm text-muted-foreground">Русский</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icon name="Globe" size={18} />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold">Тема</h3>
                      <p className="text-sm text-muted-foreground">Темная</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icon name="Moon" size={18} />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-semibold">Очистить кэш</h3>
                      <p className="text-sm text-muted-foreground">Удалить временные файлы</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icon name="Trash2" size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-semibold mb-4">О приложении</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Версия: 1.0.0</p>
                  <p>Каталог игр: {games.length} игр</p>
                  {auth.isAuthenticated() && <p>В библиотеке: {libraryGames.length} игр</p>}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
