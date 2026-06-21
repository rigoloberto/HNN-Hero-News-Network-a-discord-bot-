# 📡 𝙃𝙚𝙧𝙤 𝙉𝙚𝙬𝙨 𝙉𝙚𝙩𝙬𝙤𝙧𝙠 (𝙃𝙉𝙉)

🌎 **Language / Idioma:** [English](#-english-documentation) | [Español](#-documentación-en-español)

---

## 🇺🇸 English Documentation

> **HNN** is a thematic Discord bot designed for *My Hero Academia (MHA)* roleplay servers. Its purpose is to bring the server's in-character social media (**HEROGRAM** & **BeatPlus**) to life by tracking player posts and reactions (upvotes, downvotes, and shares), calculating popularity trends using a time-decay algorithm, and publishing automated digests.

### 🚀 Key Features
*   **📰 Automated Digest:** Publishes daily, weekly, or monthly reports at 12:01 PM in a dedicated channel (`#HNN`) highlighting the top, most viral, or controversial posts.
*   **📱 Interactive Feed (`/feed`):** Allows players to privately browse through in-character trends (*Hot*, *Top*, *Controversial*) using paginated Discord buttons.
*   **🪪 Reputation Profiles (`/stats`):** Generates approval rating cards (`🟩🟩🟩🟥🟥`) for characters (in-role) or players (out-of-role) measuring net votes and overall engagement.
*   **🎭 Tupperbox Integration:** Automatically tracks Tupperbox webhooks, resolving character names for in-role stats, and securely matches the original player ID from the metadata signature.
*   **💾 Lightweight Database:** Uses SQLite (`bun:sqlite`) to cache reaction counts in real-time, preventing API rate-limiting issues on large servers.
*   **🛡️ Thread Filtering:** Custom logic to ignore off-role channels (like memes threads) to keep the in-character trends canon.

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

> **HNN** es un bot de Discord temático diseñado para servidores de rol de *My Hero Academia (MHA)*. Su propósito es dar vida e interactividad a la red social in-universe del servidor (**HEROGRAM** y **BeatPlus**) procesando las publicaciones y reacciones de los jugadores para simular la opinión pública y calcular tendencias de popularidad al estilo de Reddit.

### 🚀 Características Principales
*   **📰 Boletín Automático:** Publica de forma programada a las 12:01 PM reportes diarios, semanales o mensuales en un canal dedicado (`#HNN`) destacando los posts más populares, virales o polémicos.
*   **📱 Feed Interactivo (`/feed`):** Permite a los jugadores explorar de forma privada (efímera) las publicaciones bajo filtros estilo Reddit (*Hot*, *Top*, *Controversial*) usando botones de navegación.
*   **🪪 Registro de Reputación (`/stats`):** Genera una tarjeta de estadísticas de aprobación pública (`🟩🟩🟩🟥🟥`) para personajes (en-rol) o jugadores (fuera-de-rol) midiendo votos netos y engagement.
*   **🎭 Integración con Tupperbox:** Detecta y procesa webhooks de Tupperbox. Mapea la reputación al nombre del personaje (NPC) para mantener la inmersión del lore, e intenta rastrear la firma para asociarla al jugador real en la base de datos.
*   **💾 Almacenamiento Eficiente:** Utiliza SQLite integrado (`bun:sqlite`) para registrar la actividad al instante, evitando Rate Limits de la API de Discord.
*   **🛡️ Filtro de Canales:** Lógica integrada para discriminar canales off-rol (como hilos de memes fuera de rol) y evitar que afecten a las tendencias canónicas.

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
