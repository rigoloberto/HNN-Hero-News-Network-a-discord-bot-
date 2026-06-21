import { Client, TextChannel } from 'discord.js';
import { getTopFeed, getHotFeed, PostWithReactions } from './database';
import { formatDigestEmbed } from './utils/format';
import { config } from './utils/config';

/**
 * Publica un boletín en el canal de HEROGRAM
 */
export async function publishDigest(client: Client, type: 'daily' | 'weekly' | 'monthly') {
  try {
    const channel = await client.channels.fetch(config.herogramChannelId) as TextChannel;
    if (!channel || !channel.isTextBased()) {
      console.error(`❌ Canal de HEROGRAM (${config.herogramChannelId}) no encontrado o no es de texto.`);
      return;
    }

    let posts: PostWithReactions[] = [];
    const limit = 5; // Top 5 en boletines

    if (type === 'daily') {
      // Para el diario combinamos el Hot actual y el top de ayer (24h)
      // Mostramos los 5 mejores posts del último día
      posts = getTopFeed('today', limit);
    } else if (type === 'weekly') {
      posts = getTopFeed('week', limit);
    } else if (type === 'monthly') {
      posts = getTopFeed('month', limit);
    }

    const guildId = channel.guildId;
    const embed = formatDigestEmbed(posts, type, guildId);

    await channel.send({ embeds: [embed] });
    console.log(`✅ Boletín ${type.toUpperCase()} publicado con éxito a las ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error(`❌ Error al publicar boletín ${type}:`, error);
  }
}

/**
 * Inicia el temporizador del scheduler
 * Verifica la hora actual cada minuto y detona los boletines a las 12:01 PM
 */
export function startScheduler(client: Client) {
  console.log('⏰ Programador de boletines de HEROGRAM iniciado.');

  setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Detonar exactamente a las 12:01 PM (12 horas, 1 minuto)
    if (hours === 12 && minutes === 1) {
      const dayOfMonth = now.getDate();
      const dayOfWeek = now.getDay(); // 0 es Domingo, 6 es Sábado

      console.log(`⏰ Ejecutando revisión de hora de boletín: 12:01 PM. Día del mes: ${dayOfMonth}, Día de la semana: ${dayOfWeek}`);

      if (dayOfMonth === 1) {
        // Primer día del mes -> Boletín Mensual
        publishDigest(client, 'monthly');
      } else if (dayOfWeek === 0) {
        // Es Domingo (y no es día 1) -> Boletín Semanal
        publishDigest(client, 'weekly');
      } else {
        // Día normal -> Boletín Diario
        publishDigest(client, 'daily');
      }
    }
  }, 60000); // Comprobar cada 60 segundos
}
