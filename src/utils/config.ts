import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  forumChannelId: process.env.FORUM_CHANNEL_ID || '',
  herogramChannelId: process.env.HEROGRAM_CHANNEL_ID || '',
  
  // Reacciones
  upvoteEmoji: process.env.UPVOTE_EMOJI || '⬆️',
  downvoteEmoji: process.env.DOWNVOTE_EMOJI || '⬇️',
  shareEmoji: process.env.SHARE_EMOJI || '🔄',
};

// Validar variables críticas
export function validateConfig() {
  const missing = [];
  if (!config.discordToken || config.discordToken === 'TU_TOKEN_AQUÍ') missing.push('DISCORD_TOKEN');
  if (!config.clientId || config.clientId === 'TU_CLIENT_ID_AQUÍ') missing.push('CLIENT_ID');
  if (!config.guildId || config.guildId === 'TU_GUILD_ID_AQUÍ') missing.push('GUILD_ID');
  if (!config.forumChannelId || config.forumChannelId === 'TU_FORUM_CHANNEL_ID_AQUÍ') missing.push('FORUM_CHANNEL_ID');
  if (!config.herogramChannelId || config.herogramChannelId === 'TU_HEROGRAM_CHANNEL_ID_AQUÍ') missing.push('HEROGRAM_CHANNEL_ID');

  if (missing.length > 0) {
    console.warn(`⚠️ Advertencia: Faltan configurar las siguientes variables en el archivo .env: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

/**
 * Normaliza un emoji de reacción para comparar si coincide con la configuración
 * Soporta emojis unicode directos y emojis personalizados de Discord (ya sea ID o nombre:id)
 */
export function isEmojiMatch(emojiNameOrId: string | null, configEmoji: string): boolean {
  if (!emojiNameOrId) return false;
  
  // Limpiar configEmoji si es que viene en formato completo de Discord: <:nombre:id> o <a:nombre:id>
  const cleanConfig = configEmoji.trim();
  const discordEmojiRegex = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/;
  const match = cleanConfig.match(discordEmojiRegex);
  
  if (match) {
    const name = match[1];
    const id = match[2];
    return emojiNameOrId === id || emojiNameOrId === name;
  }
  
  // Si configEmoji es un ID numérico puro (ej. 123456789)
  if (/^\d+$/.test(cleanConfig)) {
    return emojiNameOrId === cleanConfig;
  }
  
  // Si contiene un formato parcial nombre:id
  if (cleanConfig.includes(':')) {
    const parts = cleanConfig.split(':');
    const id = parts[parts.length - 1].replace(/[<>]/g, '');
    const name = parts[0].replace(/[<>]/g, '');
    return emojiNameOrId === id || emojiNameOrId === name;
  }

  // De lo contrario, comparar texto plano (unicode o nombre)
  return emojiNameOrId === cleanConfig;
}
