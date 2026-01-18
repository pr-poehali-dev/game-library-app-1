CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(50) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    image_url TEXT,
    rating DECIMAL(3,1) DEFAULT 0.0,
    release_date DATE,
    developer VARCHAR(255),
    publisher VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_library (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game_id INTEGER REFERENCES games(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);

INSERT INTO games (title, description, platform, genre, image_url, rating, release_date, developer, publisher) VALUES
('Cyberpunk 2077', 'Ролевая игра в открытом мире, действие которой происходит в Найт-Сити - мегаполисе, одержимом властью, роскошью и модификациями тела.', 'PC', 'RPG', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Cyberpunk+2077', 4.5, '2020-12-10', 'CD Projekt Red', 'CD Projekt'),
('Elden Ring', 'Action RPG от создателей Dark Souls и автора "Песни Льда и Пламени" Джорджа Мартина.', 'PC', 'Action RPG', 'https://via.placeholder.com/300x400/7E69AB/ffffff?text=Elden+Ring', 4.8, '2022-02-25', 'FromSoftware', 'Bandai Namco'),
('God of War', 'Новое начало для Кратоса. Живя в качестве смертного в царстве скандинавских богов и чудовищ, он должен защитить своего сына.', 'PC', 'Action', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=God+of+War', 4.9, '2022-01-14', 'Santa Monica Studio', 'Sony Interactive Entertainment'),
('The Witcher 3', 'История о профессиональном охотнике на чудовищ Геральте из Ривии в огромном открытом мире.', 'PC', 'RPG', 'https://via.placeholder.com/300x400/6E59A5/ffffff?text=The+Witcher+3', 4.9, '2015-05-19', 'CD Projekt Red', 'CD Projekt'),
('Red Dead Redemption 2', 'Эпическая история о преступнике Артуре Моргане и банде Ван дер Линде на закате эпохи Дикого Запада.', 'PC', 'Action', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=RDR+2', 4.8, '2019-11-05', 'Rockstar Games', 'Rockstar Games'),
('Half-Life: Alyx', 'VR-игра от Valve, возвращающая в культовую вселенную Half-Life.', 'VR', 'Action', 'https://via.placeholder.com/300x400/7E69AB/ffffff?text=Half-Life+Alyx', 4.9, '2020-03-23', 'Valve', 'Valve'),
('Beat Saber', 'Ритм-игра в виртуальной реальности, где вы рубите блоки световыми мечами под музыку.', 'VR', 'Rhythm', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Beat+Saber', 4.7, '2019-05-21', 'Beat Games', 'Beat Games'),
('PUBG Mobile', 'Мобильная версия популярной королевской битвы с 100 игроками.', 'Mobile', 'Battle Royale', 'https://via.placeholder.com/300x400/6E59A5/ffffff?text=PUBG+Mobile', 4.3, '2018-03-19', 'Tencent Games', 'Tencent Games'),
('Genshin Impact', 'Открытый мир с аниме-графикой и увлекательной системой боя со сменой персонажей.', 'Mobile', 'RPG', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Genshin+Impact', 4.5, '2020-09-28', 'miHoYo', 'miHoYo'),
('Minecraft', 'Культовая песочница, где вы можете строить что угодно из блоков.', 'PC', 'Sandbox', 'https://via.placeholder.com/300x400/7E69AB/ffffff?text=Minecraft', 4.8, '2011-11-18', 'Mojang', 'Mojang'),
('Among Us', 'Многопользовательская игра о командной работе и предательстве в космосе.', 'Mobile', 'Party', 'https://via.placeholder.com/300x400/6E59A5/ffffff?text=Among+Us', 4.4, '2018-06-15', 'InnerSloth', 'InnerSloth'),
('Resident Evil 4 VR', 'Культовый survival horror в виртуальной реальности.', 'VR', 'Horror', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=RE4+VR', 4.6, '2021-10-21', 'Armature Studio', 'Capcom'),
('Grand Theft Auto V', 'Открытый мир с тремя главными героями в солнечном Лос-Сантосе.', 'PC', 'Action', 'https://via.placeholder.com/300x400/7E69AB/ffffff?text=GTA+V', 4.7, '2015-04-14', 'Rockstar North', 'Rockstar Games'),
('Counter-Strike 2', 'Легендарный тактический шутер нового поколения на движке Source 2.', 'PC', 'FPS', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=CS2', 4.6, '2023-09-27', 'Valve', 'Valve'),
('League of Legends', 'Самая популярная MOBA-игра с миллионами игроков по всему миру.', 'PC', 'MOBA', 'https://via.placeholder.com/300x400/6E59A5/ffffff?text=League+of+Legends', 4.4, '2009-10-27', 'Riot Games', 'Riot Games'),
('Valorant', 'Тактический шутер 5v5 с уникальными персонажами и способностями.', 'PC', 'FPS', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Valorant', 4.5, '2020-06-02', 'Riot Games', 'Riot Games'),
('Fortnite', 'Королевская битва с уникальной механикой строительства.', 'PC', 'Battle Royale', 'https://via.placeholder.com/300x400/7E69AB/ffffff?text=Fortnite', 4.3, '2017-07-25', 'Epic Games', 'Epic Games'),
('Apex Legends', 'Быстрая королевская битва с героями и командной тактикой.', 'PC', 'Battle Royale', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Apex+Legends', 4.5, '2019-02-04', 'Respawn Entertainment', 'Electronic Arts'),
('Dota 2', 'Культовая MOBA с глубокой стратегией и киберспортивной сценой.', 'PC', 'MOBA', 'https://via.placeholder.com/300x400/6E59A5/ffffff?text=Dota+2', 4.6, '2013-07-09', 'Valve', 'Valve'),
('Overwatch 2', 'Командный шутер с героями, каждый со своими уникальными способностями.', 'PC', 'FPS', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Overwatch+2', 4.4, '2022-10-04', 'Blizzard Entertainment', 'Blizzard Entertainment'),
('Call of Duty Mobile', 'Мобильная версия культового шутера с классическими режимами.', 'Mobile', 'FPS', 'https://via.placeholder.com/300x400/7E69AB/ffffff?text=COD+Mobile', 4.5, '2019-10-01', 'TiMi Studios', 'Activision'),
('Clash of Clans', 'Стратегия с элементами строительства базы и многопользовательскими сражениями.', 'Mobile', 'Strategy', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Clash+of+Clans', 4.6, '2012-08-02', 'Supercell', 'Supercell'),
('Candy Crush Saga', 'Популярная головоломка три-в-ряд с тысячами уровней.', 'Mobile', 'Puzzle', 'https://via.placeholder.com/300x400/6E59A5/ffffff?text=Candy+Crush', 4.3, '2012-04-12', 'King', 'King'),
('Roblox', 'Платформа для создания и игры в миллионы пользовательских игр.', 'PC', 'Sandbox', 'https://via.placeholder.com/300x400/9b87f5/ffffff?text=Roblox', 4.5, '2006-09-01', 'Roblox Corporation', 'Roblox Corporation'),
('The Walking Dead: Saints & Sinners', 'Захватывающий VR-хоррор выживания во вселенной Ходячих Мертвецов.', 'VR', 'Horror', 'https://via.placeholder.com/300x400/7E69AB/ffffff?text=TWD+VR', 4.7, '2020-01-23', 'Skydance Interactive', 'Skydance Interactive');