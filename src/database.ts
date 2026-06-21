import { Database } from 'bun:sqlite';
import path from 'path';

// Crear e inicializar la base de datos SQLite
const dbPath = path.join(process.cwd(), 'herogram.db');
const db = new Database(dbPath);

export interface DBPost {
  message_id: string;
  channel_id: string;
  character_name: string;
  player_id: string | null;
  title: string;
  content: string;
  created_at: number;
}

export interface DBReactions {
  message_id: string;
  upvotes: number;
  downvotes: number;
  shares: number;
}

export interface PostWithReactions extends DBPost, Omit<DBReactions, 'message_id'> {
  net_votes: number;
  hot_score?: number;
}

// Inicializar las tablas si no existen
export function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      message_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      character_name TEXT NOT NULL,
      player_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reactions (
      message_id TEXT PRIMARY KEY,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      FOREIGN KEY (message_id) REFERENCES posts (message_id) ON DELETE CASCADE
    )
  `);

  // Indexar para acelerar las consultas por fecha y por nombre de personaje
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_character_name ON posts (character_name)`);
  
  // Purgar posts del canal de memes off-rol (no canónico)
  db.run("DELETE FROM posts WHERE channel_id = '1514828951896461434'");

  if (dbPath) {
    console.log(`✅ Base de datos inicializada en: ${dbPath}`);
  }
}

// Guardar un nuevo post del foro
export function savePost(
  messageId: string,
  channelId: string,
  characterName: string,
  playerId: string | null,
  title: string,
  content: string,
  createdAt: number = Date.now()
) {
  const insertPost = db.prepare(`
    INSERT INTO posts (message_id, channel_id, character_name, player_id, title, content, created_at)
    VALUES ($messageId, $channelId, $characterName, $playerId, $title, $content, $createdAt)
    ON CONFLICT(message_id) DO UPDATE SET
      title = excluded.title,
      content = excluded.content
  `);

  const insertReactions = db.prepare(`
    INSERT OR IGNORE INTO reactions (message_id, upvotes, downvotes, shares)
    VALUES ($messageId, 0, 0, 0)
  `);

  db.transaction(() => {
    insertPost.run({
      $messageId: messageId,
      $channelId: channelId,
      $characterName: characterName,
      $playerId: playerId,
      $title: title,
      $content: content,
      $createdAt: createdAt,
    });
    insertReactions.run({ $messageId: messageId });
  })();
}

// Actualizar contadores de reacciones
export function updateReactions(
  messageId: string,
  upvotes: number,
  downvotes: number,
  shares: number
) {
  const query = db.prepare(`
    INSERT INTO reactions (message_id, upvotes, downvotes, shares)
    VALUES ($messageId, $upvotes, $downvotes, $shares)
    ON CONFLICT(message_id) DO UPDATE SET
      upvotes = $upvotes,
      downvotes = $downvotes,
      shares = $shares
  `);

  query.run({
    $messageId: messageId,
    $upvotes: upvotes,
    $downvotes: downvotes,
    $shares: shares,
  });
}

// Obtener un post con sus reacciones
export function getPost(messageId: string): PostWithReactions | null {
  const query = db.prepare(`
    SELECT p.*, r.upvotes, r.downvotes, r.shares
    FROM posts p
    LEFT JOIN reactions r ON p.message_id = r.message_id
    WHERE p.message_id = ?
  `);
  
  const result = query.get(messageId) as any;
  if (!result) return null;

  return {
    ...result,
    upvotes: result.upvotes || 0,
    downvotes: result.downvotes || 0,
    shares: result.shares || 0,
    net_votes: (result.upvotes || 0) - (result.downvotes || 0),
  };
}

// Obtener los posts creados dentro de un límite de tiempo
function getPostsInTimeframe(timeframeHours: number): PostWithReactions[] {
  const minTimestamp = Date.now() - timeframeHours * 60 * 60 * 1000;
  const query = db.prepare(`
    SELECT p.*, COALESCE(r.upvotes, 0) as upvotes, COALESCE(r.downvotes, 0) as downvotes, COALESCE(r.shares, 0) as shares
    FROM posts p
    LEFT JOIN reactions r ON p.message_id = r.message_id
    WHERE p.created_at >= ?
  `);

  const results = query.all(minTimestamp) as any[];
  return results.map(r => ({
    ...r,
    net_votes: r.upvotes - r.downvotes,
  }));
}

// Obtener Feed "Hot" usando decaimiento temporal (Time Decay)
// Se calcula en memoria en JS para evitar limitaciones matemáticas de SQLite plano
export function getHotFeed(limit: number = 5): PostWithReactions[] {
  // Obtenemos posts de los últimos 7 días (168 horas) para el feed hot
  const posts = getPostsInTimeframe(168);
  const now = Date.now();

  const postsWithScore = posts.map(post => {
    const hoursElapsed = (now - post.created_at) / (1000 * 60 * 60);
    // Puntuación neta considerando shares con doble de peso
    const netPoints = post.upvotes - post.downvotes + (post.shares * 2);
    
    // Algoritmo de decaimiento
    // Score = NetPoints / (Hours + 2)^1.8
    const hotScore = netPoints / Math.pow(hoursElapsed + 2, 1.8);

    return {
      ...post,
      hot_score: hotScore,
    };
  });

  // Ordenar por hot score descendente
  return postsWithScore
    .sort((a, b) => (b.hot_score || 0) - (a.hot_score || 0))
    .slice(0, limit);
}

// Obtener Feed "Top" para un período (Hoy, Semana, Mes)
export function getTopFeed(
  timeframe: 'today' | 'week' | 'month',
  limit: number = 5
): PostWithReactions[] {
  let hours = 24;
  if (timeframe === 'week') hours = 168; // 7 días
  if (timeframe === 'month') hours = 720; // 30 días

  const posts = getPostsInTimeframe(hours);

  // Ordenar por votos netos + peso de shares
  return posts
    .sort((a, b) => {
      const scoreA = a.upvotes - a.downvotes + (a.shares * 2);
      const scoreB = b.upvotes - b.downvotes + (b.shares * 2);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

// Obtener Feed "Polémico" (Controversial)
// Posts con mucha discusión (altos Upvotes y Downvotes balanceados)
export function getControversialFeed(
  timeframe: 'today' | 'week' | 'month',
  limit: number = 5
): PostWithReactions[] {
  let hours = 24;
  if (timeframe === 'week') hours = 168;
  if (timeframe === 'month') hours = 720;

  const posts = getPostsInTimeframe(hours);

  // Un post es polémico si tiene muchos upvotes y downvotes.
  // Usamos como score la cantidad menor entre upvotes y downvotes, y luego ordenamos por votos totales para desambiguar.
  // Ejemplo: 10 upvotes y 10 downvotes -> score = 10. 100 upvotes y 0 downvotes -> score = 0.
  const postsWithControversy = posts.map(post => {
    const controversyScore = Math.min(post.upvotes, post.downvotes);
    const totalEngagement = post.upvotes + post.downvotes + post.shares;
    
    return {
      ...post,
      controversy_score: controversyScore,
      total_engagement: totalEngagement
    };
  });

  return postsWithControversy
    // Exigimos al menos 1 voto en contra y a favor para considerarlo polémico
    .filter(p => p.upvotes > 0 && p.downvotes > 0)
    .sort((a, b) => {
      if (b.controversy_score !== a.controversy_score) {
        return b.controversy_score - a.controversy_score;
      }
      return b.total_engagement - a.total_engagement;
    })
    .slice(0, limit);
}

export interface UserStats {
  post_count: number;
  total_upvotes: number;
  total_downvotes: number;
  total_shares: number;
  net_votes: number;
  approval_rating: number; // Porcentaje de upvotes del total de votos
}

// Obtener estadísticas de un Personaje (Nombre in-rol)
export function getCharacterStats(characterName: string): UserStats | null {
  const query = db.prepare(`
    SELECT 
      COUNT(p.message_id) as post_count,
      SUM(COALESCE(r.upvotes, 0)) as total_upvotes,
      SUM(COALESCE(r.downvotes, 0)) as total_downvotes,
      SUM(COALESCE(r.shares, 0)) as total_shares
    FROM posts p
    LEFT JOIN reactions r ON p.message_id = r.message_id
    WHERE LOWER(p.character_name) = LOWER(?)
  `);

  const result = query.get(characterName) as any;
  if (!result || result.post_count === 0) return null;

  const up = result.total_upvotes || 0;
  const down = result.total_downvotes || 0;
  const totalVotes = up + down;
  const approvalRating = totalVotes > 0 ? Math.round((up / totalVotes) * 100) : 100;

  return {
    post_count: result.post_count,
    total_upvotes: up,
    total_downvotes: down,
    total_shares: result.total_shares || 0,
    net_votes: up - down,
    approval_rating: approvalRating
  };
}

// Obtener estadísticas de un Jugador real (ID de Discord)
export function getPlayerStats(playerId: string): UserStats | null {
  const query = db.prepare(`
    SELECT 
      COUNT(p.message_id) as post_count,
      SUM(COALESCE(r.upvotes, 0)) as total_upvotes,
      SUM(COALESCE(r.downvotes, 0)) as total_downvotes,
      SUM(COALESCE(r.shares, 0)) as total_shares
    FROM posts p
    LEFT JOIN reactions r ON p.message_id = r.message_id
    WHERE p.player_id = ?
  `);

  const result = query.get(playerId) as any;
  if (!result || result.post_count === 0) return null;

  const up = result.total_upvotes || 0;
  const down = result.total_downvotes || 0;
  const totalVotes = up + down;
  const approvalRating = totalVotes > 0 ? Math.round((up / totalVotes) * 100) : 100;

  return {
    post_count: result.post_count,
    total_upvotes: up,
    total_downvotes: down,
    total_shares: result.total_shares || 0,
    net_votes: up - down,
    approval_rating: approvalRating
  };
}

// Eliminar un post de la base de datos
export function deletePost(messageId: string) {
  const query = db.prepare('DELETE FROM posts WHERE message_id = ?');
  query.run(messageId);
}
