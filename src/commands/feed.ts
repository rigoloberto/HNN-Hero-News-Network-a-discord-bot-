import { ChatInputCommandInteraction, SlashCommandBuilder, Interaction, MessageFlags } from 'discord.js';
import { getHotFeed, getTopFeed, getControversialFeed, PostWithReactions } from '../database';
import { formatFeedEmbed, getFeedNavigationRow } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('feed')
  .setDescription('Explora las publicaciones y tendencias de HEROGRAM.')
  .addStringOption(option =>
    option
      .setName('filtro')
      .setDescription('Elige qué tipo de publicaciones quieres ver.')
      .setRequired(true)
      .addChoices(
        { name: '🔥 Tendencias Calientes (Hot)', value: 'hot' },
        { name: '🏆 Top de Hoy', value: 'top-today' },
        { name: '🌟 Top Semanal', value: 'top-week' },
        { name: '👑 Top Mensual', value: 'top-month' },
        { name: '🗣️ Polémicos / Debates', value: 'controversial' }
      )
  );

// Helper para obtener los posts según el filtro
export function getPostsByFilter(filter: string): PostWithReactions[] {
  switch (filter) {
    case 'hot':
      return getHotFeed(10); // Límite de 10 posts
    case 'top-today':
      return getTopFeed('today', 10);
    case 'top-week':
      return getTopFeed('week', 10);
    case 'top-month':
      return getTopFeed('month', 10);
    case 'controversial':
      return getControversialFeed('week', 10); // Polémicos de la última semana por defecto
    default:
      return [];
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const filter = interaction.options.getString('filtro') || 'hot';
  const posts = getPostsByFilter(filter);
  const guildId = interaction.guildId || '';

  if (posts.length === 0) {
    return await interaction.editReply({
      content: `📭 No se encontraron publicaciones bajo el filtro: **${filter}**.`,
    });
  }

  const { embed, totalPages } = formatFeedEmbed(posts, filter as any, guildId, 0);
  
  if (totalPages <= 1) {
    return await interaction.editReply({ embeds: [embed], components: [] });
  }

  const row = getFeedNavigationRow(0, totalPages, filter);
  await interaction.editReply({ embeds: [embed], components: [row] });
}

/**
 * Maneja los clics en los botones de navegación del feed
 */
export async function handleFeedButton(interaction: any) {
  // customId format: feed_[filter]_[action]_[currentPage]
  // Ejemplo: feed_hot_next_0
  const parts = interaction.customId.split('_');
  if (parts.length < 4) return;

  const filter = parts[1];
  const action = parts[2];
  const currentPage = parseInt(parts[3], 10);

  const posts = getPostsByFilter(filter);
  const totalPages = posts.length;
  const guildId = interaction.guildId || '';

  if (totalPages === 0) {
    return await interaction.update({
      content: '📭 No hay posts disponibles en este momento.',
      embeds: [],
      components: [],
    });
  }

  let newPage = currentPage;
  if (action === 'prev') {
    newPage = Math.max(0, currentPage - 1);
  } else if (action === 'next') {
    newPage = Math.min(totalPages - 1, currentPage + 1);
  }
  // Si es 'refresh', mantenemos newPage = currentPage para recargar con data fresca

  // Si por alguna razón el post ya no existe en el feed recalculado (ej. cambió la posición)
  if (newPage >= totalPages) {
    newPage = totalPages - 1;
  }

  const { embed } = formatFeedEmbed(posts, filter as any, guildId, newPage);
  const row = getFeedNavigationRow(newPage, totalPages, filter);

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}
