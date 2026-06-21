import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Events, 
  ChatInputCommandInteraction, 
  Message, 
  MessageReaction,
  User,
  ThreadChannel,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import { config, validateConfig, isEmojiMatch } from './utils/config';
import { initDatabase, savePost, updateReactions, deletePost } from './database';
import { startScheduler, publishDigest } from './scheduler';

// Importar comandos
import * as statsCommand from './commands/stats';
import * as feedCommand from './commands/feed';

// Crear el cliente de Discord con Partials para capturar reacciones en posts antiguos
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
});

// Comandos administrativos
const adminCommandData = new SlashCommandBuilder()
  .setName('herogram-admin')
  .setDescription('Comandos de administración para HEROGRAM.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('digest')
      .setDescription('Fuerza la publicación inmediata de un boletín de tendencias.')
      .addStringOption(option =>
        option
          .setName('tipo')
          .setDescription('El tipo de boletín a publicar.')
          .setRequired(true)
          .addChoices(
            { name: 'Diario', value: 'daily' },
            { name: 'Semanal', value: 'weekly' },
            { name: 'Mensual', value: 'monthly' }
          )
      )
  );

// Inicializar bot
client.once(Events.ClientReady, async () => {
  console.log(`🤖 ¡Bot conectado como ${client.user?.tag}!`);
  
  // Inicializar Base de Datos SQLite
  initDatabase();

  // Registrar comandos Slash
  try {
    const commandsJson = [
      statsCommand.data.toJSON(),
      feedCommand.data.toJSON(),
      adminCommandData.toJSON()
    ];

    if (config.guildId) {
      const guild = client.guilds.cache.get(config.guildId);
      if (guild) {
        await guild.commands.set(commandsJson);
        console.log(`✅ Comandos registrados localmente en el servidor: ${guild.name}`);
      } else {
        console.log('⚠️ Servidor (Guild ID) no encontrado en cache, registrando comandos globalmente...');
        await client.application?.commands.set(commandsJson);
      }
    } else {
      await client.application?.commands.set(commandsJson);
      console.log('✅ Comandos registrados globalmente.');
    }
  } catch (error) {
    console.error('❌ Error al registrar comandos Slash:', error);
  }

  // Sincronizar posts de dinámicas existentes al encender
  await syncExistingForumPosts(client);

  // Iniciar temporizador de Boletines Automáticos (12:01 PM)
  startScheduler(client);
});

/**
 * Escucha cuando se crea un Hilo (Thread) en el foro.
 * Esto captura la creación de nuevas secciones (como HEROGRAM, BeatPlus, etc.).
 */
client.on(Events.ThreadCreate, async (thread: ThreadChannel) => {
  try {
    if (thread.parentId === config.forumChannelId) {
      console.log(`🧵 Nuevo hilo de foro creado: "${thread.name}"`);
      
      // Esperar 1.5 segundos para que Discord procese el starter message
      setTimeout(async () => {
        try {
          const starterMessage = await thread.fetchStarterMessage().catch(() => null);
          if (starterMessage) {
            await registerForumPost(starterMessage, thread);
          }
        } catch (err) {
          console.error('Error al obtener starter message en ThreadCreate:', err);
        }
      }, 1500);
    }
  } catch (error) {
    console.error('❌ Error en ThreadCreate event:', error);
  }
});

/**
 * Escucha la creación de mensajes.
 * Registra CUALQUIER mensaje enviado dentro de los hilos de dinámicas como una publicación.
 */
client.on(Events.MessageCreate, async (message: Message) => {
  try {
    // Ignorar mensajes de nuestro propio bot
    if (message.author.id === client.user?.id) return;

    const channel = message.channel;
    if (channel.isThread()) {
      const thread = channel as ThreadChannel;
      
      // Comprobar si pertenece al foro de dinámicas
      if (thread.parentId === config.forumChannelId) {
        await registerForumPost(message, thread);
      }
    }
  } catch (error) {
    console.error('❌ Error en MessageCreate event:', error);
  }
});

/**
 * Escucha la eliminación de mensajes para removerlos de la base de datos
 */
client.on(Events.MessageDelete, async (message) => {
  try {
    deletePost(message.id);
    console.log(`🗑️ Mensaje eliminado de la base de datos: ${message.id}`);
  } catch (error) {
    console.error('❌ Error al eliminar mensaje de la DB:', error);
  }
});

/**
 * Función común para registrar un mensaje/post de foro en la base de datos
 */
async function registerForumPost(message: Message, thread: ThreadChannel) {
  try {
    // Ignorar hilos fuera de rol (ej: canal de Memes con ID 1514828951896461434)
    if (thread.id === '1514828951896461434') return;

    let playerId: string | null = null;
    let characterName = message.author.username;

    // Ignorar mensajes del sistema
    if (message.system) return;

    // Detección de Tupperbox / Webhooks
    if (message.webhookId) {
      if (message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
          const footerText = embed.footer?.text;
          if (footerText) {
            const match = footerText.match(/\((\d{17,19})\)/) || footerText.match(/(\d{17,19})/);
            if (match) {
              playerId = match[1];
              console.log(`🔗 Jugador real detectado en Tupperbox: <@${playerId}>`);
              break;
            }
          }
        }
      }
    } else {
      playerId = message.author.id;
    }

    // Generar un título descriptivo basado en el contenido del mensaje
    let title = '';
    const cleanContent = (message.content || '')
      .replace(/[\n\r]+/g, ' ')
      .trim();

    if (message.id === thread.id) {
      // Si es el primer post del hilo, el título es el nombre del hilo
      title = `${thread.name}`;
    } else if (cleanContent) {
      // Si es un mensaje interno, tomar los primeros 40 caracteres como título
      title = cleanContent.length > 40 
        ? `${cleanContent.substring(0, 40)}...` 
        : cleanContent;
    } else {
      // Fallback si no tiene texto (solo imagen, etc.)
      title = `Publicación en ${thread.name}`;
    }

    savePost(
      message.id,
      thread.id, // Guardamos el ID del Hilo (Channel ID) para poder armar el link directo
      characterName,
      playerId,
      title,
      message.content || '*Contenido multimedia o embed*',
      message.createdAt.getTime()
    );

    // Sincronizar de inmediato las reacciones que ya pudiera tener
    await syncMessageReactions(message);
    
    console.log(`💾 Post registrado en base de datos: "${title}" por @${characterName}`);
  } catch (error) {
    console.error('Error al registrar post en DB:', error);
  }
}

/**
 * Sincroniza en la base de datos los posts activos que ya existen en el foro.
 * Esto escanea los últimos 50 mensajes de cada hilo activo del foro.
 */
async function syncExistingForumPosts(client: Client) {
  try {
    const forumChannel = await client.channels.fetch(config.forumChannelId).catch(() => null);
    if (!forumChannel || !('threads' in forumChannel)) {
      console.log('⚠️ Canal de foro no encontrado en Discord o no tiene hilos habilitados.');
      return;
    }

    console.log('🔍 Escaneando foro de dinámicas para sincronizar posts activos de los hilos...');
    
    // Obtener los hilos activos del foro
    const activeThreads = await (forumChannel as any).threads.fetchActive().catch(() => null);
    if (!activeThreads) {
      console.log('⚠️ No se pudieron obtener los hilos activos del foro.');
      return;
    }

    let count = 0;
    for (const thread of activeThreads.threads.values()) {
      try {
        // Traer los últimos 50 mensajes del hilo
        const messages = await thread.messages.fetch({ limit: 50 }).catch(() => null);
        if (messages) {
          for (const msg of messages.values()) {
            // Ignorar mensajes de nuestro bot
            if (msg.author.id === client.user?.id) continue;

            await registerForumPost(msg, thread);
            count++;
          }
        }
      } catch (err) {
        console.error(`Error al sincronizar mensajes del hilo ${thread.id}:`, err);
      }
    }
    console.log(`✅ Sincronización finalizada. Se procesaron ${count} mensajes activos de hilos.`);
  } catch (error) {
    console.error('❌ Error en la sincronización de posts inicial:', error);
  }
}

/**
 * Sincroniza reacciones de un mensaje con la base de datos
 */
async function syncMessageReactions(message: Message) {
  try {
    let upvotes = 0;
    let downvotes = 0;
    let shares = 0;

    // Recorrer las reacciones cargadas en caché
    for (const reaction of message.reactions.cache.values()) {
      const emojiId = reaction.emoji.id;
      const emojiName = reaction.emoji.name;

      if (isEmojiMatch(emojiId, config.upvoteEmoji) || isEmojiMatch(emojiName, config.upvoteEmoji)) {
        upvotes = Math.max(0, reaction.count - 1);
      } else if (isEmojiMatch(emojiId, config.downvoteEmoji) || isEmojiMatch(emojiName, config.downvoteEmoji)) {
        downvotes = Math.max(0, reaction.count - 1);
      } else if (isEmojiMatch(emojiId, config.shareEmoji) || isEmojiMatch(emojiName, config.shareEmoji)) {
        shares = Math.max(0, reaction.count - 1);
      }
    }

    // Actualizar en base de datos
    updateReactions(message.id, upvotes, downvotes, shares);
    console.log(`📊 Reacciones para post ${message.id}: ⬆️ ${upvotes} | ⬇️ ${downvotes} | 🔄 ${shares}`);
  } catch (error) {
    console.error(`❌ Error al sincronizar reacciones del mensaje ${message.id}:`, error);
  }
}

/**
 * Escucha cuando se agrega una reacción
 */
client.on(Events.MessageReactionAdd, async (reaction: MessageReaction, user: User) => {
  if (user.id === client.user?.id) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error al obtener reacción parcial:', error);
      return;
    }
  }

  const message = reaction.message;
  const channel = message.channel;
  if (channel.isThread()) {
    const thread = channel as ThreadChannel;
    if (thread.parentId === config.forumChannelId) {
      await syncMessageReactions(message as Message);
    }
  }
});

/**
 * Escucha cuando se remueve una reacción
 */
client.on(Events.MessageReactionRemove, async (reaction: MessageReaction, user: User) => {
  if (user.id === client.user?.id) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error al obtener reacción parcial removida:', error);
      return;
    }
  }

  const message = reaction.message;
  const channel = message.channel;
  if (channel.isThread()) {
    const thread = channel as ThreadChannel;
    if (thread.parentId === config.forumChannelId) {
      await syncMessageReactions(message as Message);
    }
  }
});

/**
 * Escucha y procesa los comandos Slash y botones interactivos
 */
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const chatInteraction = interaction as ChatInputCommandInteraction;
      const commandName = chatInteraction.commandName;

      if (commandName === 'stats') {
        await statsCommand.execute(chatInteraction);
      } else if (commandName === 'feed') {
        await feedCommand.execute(chatInteraction);
      } else if (commandName === 'herogram-admin') {
        const subcommand = chatInteraction.options.getSubcommand();
        if (subcommand === 'digest') {
          const type = chatInteraction.options.getString('tipo') as 'daily' | 'weekly' | 'monthly';
          await chatInteraction.deferReply({ flags: MessageFlags.Ephemeral });
          
          await publishDigest(client, type);
          
          await chatInteraction.editReply({
            content: `✅ Boletín **${type.toUpperCase()}** enviado con éxito al canal de HEROGRAM.`,
          });
        }
      }
    }

    // Botones del Feed interactivo
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('feed_')) {
        await feedCommand.handleFeedButton(interaction);
      }
    }
  } catch (error) {
    console.error('❌ Error procesando interacción:', error);
  }
});

// Arrancar el bot si la configuración es correcta
if (validateConfig()) {
  client.login(config.discordToken).catch(err => {
    console.error('❌ Error al iniciar sesión en Discord:', err.message);
  });
} else {
  console.log('🔴 No se inició el bot debido a que faltan configurar variables críticas en el archivo .env');
}
