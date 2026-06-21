import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { PostWithReactions, UserStats, MonthlyAwardWinners } from '../database';
import { config } from './config';

// Paleta de colores temáticos de MHA / HEROGRAM
const COLORS = {
  HOT: 0x00FFCC,          // Turquesa vibrante (Neo-Hero)
  TOP: 0xFFCC00,          // Dorado All Might
  CONTROVERSIAL: 0xFF3366,// Rojo carmesí (Polémico)
  STATS: 0x5865F2,        // Azul Discord / Héroe estándar
  DIGEST: 0x7289DA,       // Color de marca HEROGRAM
  AWARDS: 0x800020,        // Concho de vino (Premios/Rangos)
};

/**
 * Genera el Embed para un Boletín Programado (Daily, Weekly, Monthly)
 */
export function formatDigestEmbed(
  posts: PostWithReactions[],
  type: 'daily' | 'weekly' | 'monthly',
  guildId: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTimestamp()
    .setFooter({ text: 'HEROGRAM Algoritm V2.0 • Sistema de Reputación de Héroes' });

  const titleHeader = type === 'daily' 
    ? '📸 HEROGRAM DAILY DIGEST' 
    : type === 'weekly' 
      ? '🔥 HEROGRAM TRENDING WEEKLY' 
      : '🏆 HEROGRAM MONTHLY WRAP-UP';

  embed.setTitle(titleHeader);
  embed.setColor(type === 'daily' ? COLORS.DIGEST : type === 'weekly' ? COLORS.HOT : COLORS.TOP);

  if (posts.length === 0) {
    embed.setDescription('*No hay suficiente actividad en las dinámicas del foro para generar el reporte de hoy.*');
    return embed;
  }

  let description = '';
  if (type === 'daily') {
    description = '⚡ *¡El algoritmo de HEROGRAM ha hablado! Aquí están las publicaciones más destacadas de las últimas 24 horas:* \n\n';
  } else if (type === 'weekly') {
    description = '🌟 *¡Boletín de Fin de Semana! Las dinámicas más virales y comentadas que marcaron la agenda heroica:* \n\n';
  } else {
    description = '👑 *¡El Salón de la Fama Mensual! Estos son los eventos históricos más votados del mes:* \n\n';
  }

  posts.forEach((post, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▪️';
    const link = `https://discord.com/channels/${guildId}/${post.channel_id}/${post.message_id}`;
    const truncatedContent = post.content.length > 120 
      ? post.content.substring(0, 120) + '...' 
      : post.content;

    description += `${medal} **[${post.title}](${link})**\n`;
    description += `👤 **${post.character_name}** ${post.player_id ? `(<@${post.player_id}>)` : ''}\n`;
    description += `📝 *"${truncatedContent}"*\n`;
    description += `${config.upvoteEmoji} **${post.upvotes}**  |  ${config.downvoteEmoji} **${post.downvotes}**  |  ${config.shareEmoji} **${post.shares}**\n\n`;
  });

  embed.setDescription(description);
  return embed;
}

/**
 * Genera el Embed para el Reporte de Premios Mensuales (Podios Top 3)
 * @param winners Datos de los podios calculados
 * @param isPrivate Si es true, incluye los IDs de Discord para moderación. Si es false, los oculta para el canal público.
 */
export function formatAwardsEmbed(
  winners: MonthlyAwardWinners,
  isPrivate: boolean
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.AWARDS)
    .setTitle(isPrivate ? '🏆 REPORT SOCIAL: RANGOS MENSUALES (MODERACIÓN)' : '🏆 RANGOS SOCIALES MENSUALES')
    .setTimestamp()
    .setFooter({ text: isPrivate ? 'HEROGRAM Algoritm V2.0 • Reporte Privado' : 'HEROGRAM Algoritm V2.0 • Sistema de Reputación' });

  let desc = isPrivate 
    ? `📊 *Reporte interno de podios mensuales con vinculaciones de Discord para facilitar la asignación de roles.*\n\n`
    : `📊 *¡La opinión pública ha dictado veredicto! Aquí están las personalidades más destacadas del mes en las dinámicas:* \n\n`;

  const medals = ['🥇', '🥈', '🥉'];

  // Helper para renderizar un podio simple (Based, Burning, Repost)
  const renderPodium = (title: string, list: any[], unit: string) => {
    let text = `### ${title}\n`;
    if (list.length === 0) {
      text += `*Sin registros este mes.*\n\n`;
      return text;
    }
    list.forEach((entry, i) => {
      const medal = medals[i] || '▪️';
      const playerText = isPrivate && entry.playerId ? ` (<@${entry.playerId}>)` : '';
      text += `${medal} **\`${entry.characterName}\`**${playerText} — **${entry.count}** ${unit}\n`;
    });
    text += '\n';
    return text;
  };

  // Helper para renderizar el podio de Aizawa (Detailed)
  const renderAizawaPodium = (list: any[]) => {
    let text = `### 👁️ El favorito de Aizawa\n`;
    if (list.length === 0) {
      text += `*Sin registros este mes.*\n\n`;
      return text;
    }
    list.forEach((entry, i) => {
      const medal = medals[i] || '▪️';
      const playerText = isPrivate && entry.playerId ? ` (<@${entry.playerId}>)` : '';
      text += `${medal} **\`${entry.characterName}\`**${playerText} — **${entry.upvotes}** Up / **${entry.downvotes}** Down (Debate: ${entry.count} 🩸)\n`;
    });
    text += '\n';
    return text;
  };

  desc += renderPodium('🕊️ Symbol of Based', winners.based, 'upvotes ✨');
  desc += renderPodium('🫠 The burning-man', winners.burning, 'downvotes 🔥');
  desc += renderAizawaPodium(winners.aizawa);
  desc += renderPodium('🌹 repost~', winners.repost, 'shares 🔄');

  embed.setDescription(desc);
  return embed;
}

/**
 * Genera el Embed para el feed interactivo (/feed)
 */
export function formatFeedEmbed(
  posts: PostWithReactions[],
  feedType: 'hot' | 'top-today' | 'top-week' | 'top-month' | 'controversial',
  guildId: string,
  page: number = 0,
  pageSize: number = 1
): { embed: EmbedBuilder; totalPages: number } {
  const embed = new EmbedBuilder()
    .setTimestamp()
    .setFooter({ text: `Página ${page + 1} de ${Math.max(1, posts.length)}` });

  let color = COLORS.STATS;
  let title = '📸 Feed de HEROGRAM';
  
  if (feedType === 'hot') {
    color = COLORS.HOT;
    title = '🔥 Tendencias Calientes (Hot Feed)';
  } else if (feedType.startsWith('top')) {
    color = COLORS.TOP;
    title = `🏆 Top Publicaciones (${feedType === 'top-today' ? 'Hoy' : feedType === 'top-week' ? 'Semanal' : 'Mensual'})`;
  } else if (feedType === 'controversial') {
    color = COLORS.CONTROVERSIAL;
    title = '🗣️ Debates Más Polémicos (Controversial)';
  }

  embed.setColor(color);
  embed.setTitle(title);

  if (posts.length === 0) {
    embed.setDescription('*No hay publicaciones registradas para esta categoría en este momento.*');
    return { embed, totalPages: 0 };
  }

  // Paginación (normalmente mostramos 1 post por embed interactivo para que se vea premium y detallado)
  const totalPages = posts.length;
  const post = posts[page];

  const link = `https://discord.com/channels/${guildId}/${post.channel_id}/${post.message_id}`;
  
  let desc = `### [${post.title}](${link})\n`;
  desc += `👤 **Autor (En-Rol):** \`${post.character_name}\`\n`;
  if (post.player_id) {
    desc += `👤 **Jugador:** <@${post.player_id}>\n`;
  }
  desc += `📅 **Publicado:** <t:${Math.floor(post.created_at / 1000)}:R>\n\n`;
  desc += `**Contenido:**\n>>> ${post.content.length > 500 ? post.content.substring(0, 500) + '...' : post.content}\n\n`;
  desc += `**Estadísticas de Reacción:**\n`;
  desc += `${config.upvoteEmoji} **${post.upvotes}** Upvotes   |   ${config.downvoteEmoji} **${post.downvotes}** Downvotes   |   ${config.shareEmoji} **${post.shares}** Shares\n`;
  
  const score = post.upvotes - post.downvotes;
  desc += `📊 **Reputación Neta:** \`${score >= 0 ? '+' : ''}${score}\` puntos`;
  if (post.hot_score) {
    desc += `  •  🔥 **Hot Score:** \`${post.hot_score.toFixed(4)}\``;
  }

  embed.setDescription(desc);
  return { embed, totalPages };
}

/**
 * Genera el Embed para las estadísticas (/stats)
 */
export function formatStatsEmbed(
  stats: UserStats,
  targetName: string,
  isPlayer: boolean
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.STATS)
    .setTitle(isPlayer ? `📊 Expediente de Jugador: ${targetName}` : `📊 Perfil de HEROGRAM: @${targetName}`)
    .setTimestamp()
    .setFooter({ text: 'HEROGRAM Algoritm V2.0 • Registro de Reputación' });

  // Barra de progreso visual para el índice de aprobación
  const progressBars = 10;
  const filledBars = Math.round((stats.approval_rating / 100) * progressBars);
  const emptyBars = progressBars - filledBars;
  const progressBarText = '🟩'.repeat(filledBars) + '🟥'.repeat(emptyBars);

  let desc = isPlayer 
    ? `Historial consolidado de todas las identidades y personajes de este jugador en las dinámicas de rol:\n\n`
    : `Métricas de reputación e impacto social del personaje en la red de héroes:\n\n`;

  desc += `📝 **Publicaciones Realizadas:** \`${stats.post_count}\` posts\n`;
  desc += `${config.upvoteEmoji} **Upvotes Recibidos:** \`${stats.total_upvotes}\` (Votos a favor)\n`;
  desc += `${config.downvoteEmoji} **Downvotes Recibidos:** \`${stats.total_downvotes}\` (Votos en contra)\n`;
  desc += `${config.shareEmoji} **Shares Totales:** \`${stats.total_shares}\` (Contenido compartido)\n`;
  
  const repSign = stats.net_votes >= 0 ? '+' : '';
  desc += `📊 **Reputación Neta:** \`${repSign}${stats.net_votes}\` puntos de influencia\n\n`;
  
  desc += `**Índice de Aprobación de la Opinión Pública:**\n`;
  desc += `\`[${stats.approval_rating}%]\` ${progressBarText}\n`;

  // Comentario temático del algoritmo
  let comment = '';
  if (stats.approval_rating >= 85) {
    comment = '🌟 *¡Héroe Ejemplar! La opinión pública te idolatra. Tus acciones inspiran confianza absoluta.*';
  } else if (stats.approval_rating >= 60) {
    comment = '👍 *Aprobación Estable. Eres un héroe respetado, aunque algunas de tus decisiones generan debate.*';
  } else if (stats.approval_rating >= 40) {
    comment = '⚠️ *Héroe de la Discordia. Tus métodos son sumamente debatidos en los foros. ¡Cuidado con el descontento!*';
  } else {
    comment = '🚨 *¡Alerta de Reputación! La sociedad de héroes te percibe con desconfianza. Estás al borde de ser cancelado.*';
  }
  desc += `\n${comment}`;

  embed.setDescription(desc);
  return embed;
}

/**
 * Genera la fila de botones para navegar el Feed interactivo
 */
export function getFeedNavigationRow(
  currentPage: number,
  totalPages: number,
  feedType: string
): ActionRowBuilder<ButtonBuilder> {
  const prevButton = new ButtonBuilder()
    .setCustomId(`feed_${feedType}_prev_${currentPage}`)
    .setLabel('◀️ Anterior')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage === 0);

  const nextButton = new ButtonBuilder()
    .setCustomId(`feed_${feedType}_next_${currentPage}`)
    .setLabel('Siguiente ▶️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage >= totalPages - 1);

  const refreshButton = new ButtonBuilder()
    .setCustomId(`feed_${feedType}_refresh_${currentPage}`)
    .setLabel('🔄 Actualizar')
    .setStyle(ButtonStyle.Primary);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton, refreshButton);
}
