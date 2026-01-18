import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const AdminSync = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ total_games: number; synced_from_rawg: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.getRAWGSyncStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const syncGames = async (pages: number = 10) => {
    setSyncing(true);
    
    try {
      for (let i = 0; i < pages; i++) {
        const result = await api.syncGamesFromRAWG(currentPage + i, 40);
        setCurrentPage(result.next_page || currentPage + i + 1);
        setTotalResults(result.total_results);
        
        toast({
          title: `Страница ${currentPage + i} загружена`,
          description: `Добавлено: ${result.added}, обновлено: ${result.updated}`,
        });
        
        await loadStatus();
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({
        title: 'Синхронизация завершена!',
        description: `Загружено ${pages} страниц игр`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка синхронизации',
        description: error instanceof Error ? error.message : 'Произошла ошибка',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncAllGames = async () => {
    if (!confirm('Загрузить все 800,000+ игр? Это займет несколько минут.')) {
      return;
    }
    
    setSyncing(true);
    
    try {
      const batchSize = 50;
      let page = currentPage;
      let hasMore = true;
      
      while (hasMore && page < currentPage + batchSize) {
        const result = await api.syncGamesFromRAWG(page, 40);
        page = result.next_page;
        setCurrentPage(page);
        setTotalResults(result.total_results);
        
        if (!result.next_page) {
          hasMore = false;
        }
        
        await loadStatus();
        
        if (page % 10 === 0) {
          toast({
            title: `Прогресс: страница ${page}`,
            description: `Всего игр в базе: ${status?.total_games || 0}`,
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      toast({
        title: 'Синхронизация завершена!',
        description: `Загружено ${batchSize} страниц игр`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка синхронизации',
        description: error instanceof Error ? error.message : 'Произошла ошибка',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
      await loadStatus();
    }
  };

  const progress = status && totalResults > 0 ? (status.synced_from_rawg / totalResults) * 100 : 0;

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
              <Icon name="Database" size={28} className="text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Синхронизация игр
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center gap-4 mb-6">
              <Icon name="Database" size={48} className="text-primary" />
              <div>
                <h2 className="text-3xl font-bold mb-2">База данных RAWG</h2>
                <p className="text-muted-foreground">Синхронизация игр с настоящими обложками</p>
              </div>
            </div>

            {status && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-background rounded-lg p-4 text-center">
                  <Icon name="Gamepad2" size={32} className="mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{status.total_games.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Всего в базе</p>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <Icon name="Download" size={32} className="mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{status.synced_from_rawg.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Синхронизировано</p>
                </div>
                <div className="bg-background rounded-lg p-4 text-center">
                  <Icon name="TrendingUp" size={32} className="mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{totalResults.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Доступно в RAWG</p>
                </div>
              </div>
            )}

            {totalResults > 0 && status && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Прогресс синхронизации</span>
                  <span className="text-sm text-muted-foreground">{progress.toFixed(2)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => syncGames(10)}
                disabled={syncing}
                className="w-full"
                size="lg"
              >
                {syncing ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Синхронизация...
                  </>
                ) : (
                  <>
                    <Icon name="Download" size={20} className="mr-2" />
                    Загрузить 10 страниц (400 игр)
                  </>
                )}
              </Button>

              <Button
                onClick={syncAllGames}
                disabled={syncing}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {syncing ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Синхронизация...
                  </>
                ) : (
                  <>
                    <Icon name="Download" size={20} className="mr-2" />
                    Загрузить 50 страниц (2000 игр)
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="Info" size={24} className="text-primary" />
              Информация
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• RAWG.io содержит более 800,000 игр со всего мира</p>
              <p>• Каждая игра загружается с настоящей обложкой, рейтингом и описанием</p>
              <p>• Синхронизация происходит порциями по 40 игр за раз</p>
              <p>• Текущая страница: {currentPage}</p>
              <p>• Для полной загрузки всех игр потребуется несколько сессий</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSync;
