![Hero News Network Banner](hnn_repo_banner.png)

# 📡 𝙃𝙚𝙧𝙤 𝙉𝙚𝙬𝙨 𝙉𝙚𝙩𝙬𝙤𝙧𝙠 (𝙃𝙉𝙉) - HNN Bot

🌎 **Language / Idioma:** [English](#-english-documentation) | [Español](#-documentación-en-español)

---

## 🇺🇸 English Documentation

> **HNN** is a thematic Discord bot designed for *My Hero Academia (MHA)* roleplay servers. Its purpose is to bring the server's in-character social media (**HEROGRAM** & **BeatPlus**) to life by tracking player posts and reactions (upvotes, downvotes, and shares), calculating popularity trends, and handling custom monthly ranks.

### 🚀 Key Features
*   **📰 Automated Digest:** Publishes daily, weekly, or monthly reports at 12:01 PM in a dedicated channel (`#HNN`) highlighting the top, most viral, or controversial posts.
*   **🏆 Monthly Ranks & Podiums (v2.0):** Calculates a monthly Top 3 podium (🥇, 🥈, 🥉) in 4 categories over the past 30 days:
    *   🕊️ *Symbol of Based:* Most positive consensus (Top Upvotes ✨).
    *   🫠 *The burning-man:* Most criticized and downvoted character (Top Downvotes 🔥).
    *   👁️ *Aizawa's Favorite:* Highly debated and balanced discussions (Top Controversy 🩸).
    *   🌹 *repost~:* The most viral and shared character of the month (Top Shares 🔄).
*   **📱 Interactive Feed (`/feed`):** Allows players to privately browse through in-character trends (*Hot*, *Top*, *Controversial*) using paginated Discord buttons.
*   **🪪 Reputation Profiles (`/stats`):** Generates approval rating cards (`🟩🟩🟩🟥🟥`) for characters (in-role) or players (out-of-role) measuring net votes and overall engagement.
*   **🎭 Tupperbox Integration:** Automatically tracks Tupperbox webhooks, resolving character names for in-role stats, and securely matches the original player ID from the metadata signature.
*   **🛡️ Admin Commands:**
    *   `/herogram-admin digest tipo:[Diario|Semanal|Mensual]`: Manually publishes top posts (mensual is a clean Top 5).
    *   `/herogram-admin rangos tipo:[Público|Privado]`:
        *   `Público`: Publishes the Top 3 podium in the public channel showing ONLY character names to protect roleplay immersion.
        *   `Privado`: Replies ephemerally (visible only to the admin) showing character names AND Discord player tags so DMs can easily award roles.
*   **💾 Lightweight Database:** Uses SQLite (`bun:sqlite`) to cache reaction counts in real-time, preventing API rate-limiting issues on large servers.
*   **🛡️ Thread Filtering & Timezone:** Custom logic to ignore off-role channels (like memes threads). Supports `TZ` environment variable (e.g. `TZ=America/Guayaquil`) to ensure the clock matches local server time.

### 📦 Setup & Installation

#### 1. Configure the `.env` file
Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_server_id
FORUM_CHANNEL_ID=your_forum_channel_id
HEROGRAM_CHANNEL_ID=your_digest_channel_id

# Emojis used for voting (supports unicode or custom server emoji names/IDs)
UPVOTE_EMOJI=votopositivo
DOWNVOTE_EMOJI=votonegativo
SHARE_EMOJI=🔁

# Timezone for the task scheduler (optional)
TZ=America/Guayaquil
```

#### 2. Install dependencies
```bash
bun install
```

#### 3. Run the bot
```bash
# Development mode
bun run dev

# Production mode
bun run start
```

---

## 🇪🇸 Documentación en Español

> **HNN** es un bot de Discord temático diseñado para servidores de rol de *My Hero Academia (MHA)*. Su propósito es dar vida e interactividad a la red social in-universe del servidor (**HEROGRAM** y **BeatPlus**) procesando las publicaciones y reacciones de los jugadores para simular la opinión pública y calcular tendencias de popularidad y premios de rangos mensuales.

### 🚀 Características Principales
*   **📰 Boletín Automático:** Publica de forma programada a las 12:01 PM reportes diarios, semanales o mensuales en un canal dedicado (`#HNN`) destacando los posts más populares, virales o polémicos.
*   **🏆 Premios y Podios Mensuales (v2.0):** Calcula de forma mensual un podio de Top 3 (🥇, 🥈, 🥉) para cuatro categorías en base a la actividad de los últimos 30 días:
    *   🕊️ *Symbol of Based:* Personaje con mayor apoyo positivo (Top Upvotes ✨).
    *   🫠 *The burning-man:* Personaje más criticado y con más votos negativos (Top Downvotes 🔥).
    *   👁️ *El favorito de Aizawa:* Personaje que genera más debate balanceado y polémica (Top Controversy 🩸).
    *   🌹 *repost~:* El personaje más viral cuyas publicaciones se compartieron más (Top Shares 🔄).
*   **📱 Feed Interactivo (`/feed`):** Permite a los jugadores explorar de forma privada (efímera) las publicaciones bajo filtros estilo Reddit (*Hot*, *Top*, *Controversial*) usando botones de navegación.
*   **🪪 Registro de Reputación (`/stats`):** Genera una tarjeta de estadísticas de aprobación pública (`🟩🟩🟩🟥🟥`) para personajes (en-rol) o jugadores (fuera-de-rol) midiendo votos netos y engagement.
*   **🎭 Integración con Tupperbox:** Detecta y procesa webhooks de Tupperbox. Mapea la reputación al nombre del personaje (NPC) para mantener la inmersión del lore, e intenta rastrear la firma para asociarla al jugador real en la base de datos.
*   **🛡️ Comandos Administrativos:**
    *   `/herogram-admin digest tipo:[Diario|Semanal|Mensual]`: Publica boletines de posts destacados (mensual es un Top 5 limpio).
    *   `/herogram-admin rangos tipo:[Público|Privado]`:
        *   `Público`: Publica los podios mensuales en el canal público mostrando ÚNICAMENTE el nombre de los personajes en-rol (inmersión limpia).
        *   `Privado`: Envía una respuesta efímera (solo visible para el admin) mostrando el podio con las menciones reales de Discord de los jugadores (para fácil asignación de roles).
*   **💾 Almacenamiento Eficiente:** Utiliza SQLite integrado (`bun:sqlite`) para registrar la actividad al instante, evitando Rate Limits de la API de Discord.
*   **🛡️ Filtro de Canales y Zona Horaria:** Lógica integrada para discriminar canales off-rol (como memes). Soporte para la variable de entorno `TZ` (ej. `TZ=America/Guayaquil`) para sincronizar el programador con la hora local.

### 📦 Configuración e Instalación

#### 1. Configurar el archivo `.env`
Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente plantilla:
```env
DISCORD_TOKEN=tu_token_de_discord
CLIENT_ID=tu_client_id_del_bot
GUILD_ID=id_de_tu_servidor
FORUM_CHANNEL_ID=id_del_foro_de_dinamicas
HEROGRAM_CHANNEL_ID=id_del_canal_boletin_hnn

# Emojis para votos y compartidos (soporta unicode o nombres/IDs personalizados)
UPVOTE_EMOJI=votopositivo
DOWNVOTE_EMOJI=votonegativo
SHARE_EMOJI=🔁

# Zona horaria del programador de tareas (opcional)
TZ=America/Guayaquil
```

#### 2. Instalar dependencias
```bash
bun install
```

#### 3. Ejecutar
```bash
# Modo Desarrollo
bun run dev

# Modo Producción
bun run start
```
