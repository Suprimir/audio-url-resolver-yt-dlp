# 🔧 Audio URL Resolver YT-DLP

![Demo](https://i.imgur.com/s0iSnlh.gif)

---

## 📦 Requisitos

- [Node.js](https://nodejs.org/)

---

## 🚀 Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/Suprimir/audio-url-resolver-yt-dlp.git
cd audio-url-resolver-yt-dlp

# 2. Instala dependencias
npm install

# 3. Inicia el servidor de desarrollo
npm run dev
# o 
npm run start
```

---

## 🛠️ API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/get-audio-url` | GET | Obtiene la URL directa del audio de un video |
| `/download-audio` | GET | Descarga el archivo de audio usando pipe stream |