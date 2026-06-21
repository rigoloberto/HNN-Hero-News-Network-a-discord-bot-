import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getCharacterStats, getPlayerStats } from '../database';
import { formatStatsEmbed } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Muestra las estadísticas de reputación en HEROGRAM.')
  .addStringOption(option =>
    option
      .setName('personaje')
      .setDescription('Nombre del personaje en-rol (Tupper/NPC) a consultar.')
      .setRequired(false)
  )
  .addUserOption(option =>
    option
      .setName('usuario')
      .setDescription('El usuario de Discord real a consultar.')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Asegurar que la respuesta sea efímera (solo visible para el usuario) para no hacer spam en el canal
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const characterName = interaction.options.getString('personaje');
  const discordUser = interaction.options.getUser('usuario');

  try {
    if (characterName) {
      // Búsqueda por personaje (NPC)
      const stats = getCharacterStats(characterName);
      if (!stats) {
        return await interaction.editReply({
          content: `❌ El personaje **@${characterName}** no tiene ningún post registrado en las dinámicas de foro.`,
        });
      }
      const embed = formatStatsEmbed(stats, characterName, false);
      return await interaction.editReply({ embeds: [embed] });
    }

    if (discordUser) {
      // Búsqueda por jugador real
      const stats = getPlayerStats(discordUser.id);
      if (!stats) {
        return await interaction.editReply({
          content: `❌ El usuario **${discordUser.displayName}** no tiene ningún post registrado bajo su ID.`,
        });
      }
      const embed = formatStatsEmbed(stats, discordUser.displayName, true);
      return await interaction.editReply({ embeds: [embed] });
    }

    // Si no se especifica ninguna opción, consultar estadísticas del propio usuario ejecutor
    const myStats = getPlayerStats(interaction.user.id);
    if (myStats) {
      const embed = formatStatsEmbed(myStats, interaction.user.displayName, true);
      return await interaction.editReply({ embeds: [embed] });
    }

    // Si no tiene posts por ID de usuario, intentar buscar si tiene algún post con su propio nombre de Discord
    const nameStats = getCharacterStats(interaction.user.username);
    if (nameStats) {
      const embed = formatStatsEmbed(nameStats, interaction.user.username, false);
      return await interaction.editReply({ embeds: [embed] });
    }

    return await interaction.editReply({
      content: `❌ No encontré ningún post en las dinámicas asociado a ti (**${interaction.user.displayName}**). ¡Publica algo en el foro primero!`,
    });
  } catch (error) {
    console.error('Error al ejecutar comando stats:', error);
    await interaction.editReply({
      content: '❌ Ocurrió un error al consultar las estadísticas en la base de datos.',
    });
  }
}
