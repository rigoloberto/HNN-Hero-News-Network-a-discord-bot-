# 📡 𝙃𝙚𝙧𝙤 𝙉𝙚𝙬𝙨 𝙉𝙚𝙩𝙬𝙤𝙧𝙠 (𝙃𝙉𝙉)

> **HNN** es un bot de Discord temático diseñado para servidores de rol de *My Hero Academia (MHA)*. Su propósito es dar vida e interactividad a la red social in-universe del servidor (**HEROGRAM** y **BeatPlus**) procesando las publicaciones y reacciones de los jugadores para simular la opinión pública y calcular tendencias de popularidad al estilo de Reddit.

---

## 🚀 Características Principales

*   **📰 Boletín Automático (Modo Pasivo):** Publica de forma programada a las 12:01 PM reportes diarios, semanales o mensuales en un canal dedicado (`#HNN`) destacando los posts más populares, virales o polémicos.
*   **📱 Feed Interactivo (`/feed`):** Permite a los jugadores explorar de forma privada (efímera) las publicaciones bajo filtros estilo Reddit (*Hot*, *Top*, *Controversial*) usando botones de navegación.
*   **🪪 Registro de Reputación (`/stats`):** Genera una tarjeta de estadísticas de aprobación pública (`🟩🟩🟩🟥🟥`) para personajes (en-rol) o jugadores (fuera-de-rol) midiendo votos netos y engagement.
*   **🎭 Integración con Tupperbox:** Detecta y procesa webhooks de Tupperbox. Mapea la reputación al nombre del personaje (NPC) para mantener la inmersión del lore, e intenta rastrear la firma para asociarla al jugador real en la base de datos.
*   **💾 Almacenamiento Eficiente:** Utiliza SQLite integrado (`bun:sqlite`) para registrar la actividad al instante, evitando Rate Limits de la API de Discord.
*   **🛡️ Filtro de Canales:** Lógica integrada para discriminar canales off-rol (como hilos de memes fuera de rol) y evitar que afecten a las tendencias canónicas.

---

## 🛠️ Tecnologías

*   **Runtime:** [Bun](https://bun.sh/) (Rápido, nativo con TS)
*   **Lenguaje:** TypeScript
*   **Librería:** Discord.js v14
*   **Base de Datos:** SQLite (`bun:sqlite`)

---

## 📦 Configuración e Instalación

### 1. Clonar y configurar
Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente plantilla:

```env
DISCORD_TOKEN=tu_token_de_discord
CLIENT_ID=tu_client_id_del_bot
GUILD_ID=id_de_tu_servidor
FORUM_CHANNEL_ID=id_del_foro_de_dinamicas
HEROGRAM_CHANNEL_ID=id_del_canal_boletin_hnn

# Emojis para votos y compartidos (pueden ser unicode o IDs de tu servidor)
UPVOTE_EMOJI=votopositivo
DOWNVOTE_EMOJI=votonegativo
SHARE_EMOJI=🔁
```

### 2. Instalar dependencias
```bash
bun install
```

### 3. Ejecutar
```bash
# Modo Desarrollo (Watch)
bun run dev

# Modo Producción
bun run start
```

---

## 🧑‍💻 Comandos Disponibles

*   `/feed [filtro]` $\rightarrow$ Abre el feed interactivo (efímero) con filtros: `hot`, `top-today`, `top-week`, `top-month` o `controversial`.
*   `/stats [personaje] [usuario]` $\rightarrow$ Muestra el expediente de reputación de un héroe o jugador.
*   `/herogram-admin digest [tipo]` $\rightarrow$ (Solo Administradores) Fuerza la publicación inmediata del boletín diario, semanal o mensual.
