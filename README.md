# TAVA Object Roulette

Aplicación web interactiva para improvisación teatral del grupo **TAVA**. Genera palabras (objetos) de forma aleatoria o desde listas personalizadas, con imágenes, gestos tipo Tinder y estética teatral Las Vegas / Broadway.

## Características

- **Modo Aleatorio** — Más de 200 objetos en español
- **Listas personalizadas** — Crear, editar, exportar e importar
- **Favoritos** — Desliza ↑ durante el juego (lista protegida, no eliminable)
- **Imágenes automáticas** — Unsplash → Pixabay → fallback
- **Navegación por gestos** — ← anterior · → siguiente · ↑ favorito · ↓ menú
- **Cuenta regresiva teatral** — Animación TAVA + 5-4-3-2-1
- **Pantalla completa** — Ideal para presentaciones en vivo
- **Sonidos teatrales** — Efectos al cambiar palabra y en cuenta regresiva
- **Estadísticas** — Palabras más usadas
- **Logo TAVA** — Carga tu logo desde Ajustes
- **PWA** — Instalable en móvil y escritorio

### Módulos (barra inferior)

- **🎲 Palabras** — Ruleta de objetos (aleatorio, listas; favoritos en menú ☰)
- **🎭 Escenas** — Lugares, personajes y características colombianas
- **😂 Premisas** — Tarjetas con filtros (rápido, grupal, absurdo, restricción)
- **🎵 Ambientes** — Solo audio YouTube (enlaces editables)
- **🗳️ Votación** — Admin: artistas, abrir/cerrar votación, resultados en vivo (Supabase)

### Nuevo

- **ControlDock** — Botones grandes rojo (error) y verde (éxito) + navegación en juego
- **Roles** — Administrador (todo) vs Participante (solo votación)
- **Votación multi-dispositivo** — Escala 1-5 estrellas por artista, ranking ponderado

## Inicio rápido

### Opción 1: Acceso directo (Windows)

```powershell
# Crear icono en el Escritorio
powershell -ExecutionPolicy Bypass -File launcher\Crear-Acceso-Directo.ps1
```

Luego haz doble clic en **TAVA Object Roulette** en tu Escritorio.

### Opción 2: Manual

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Variables de entorno

Copia `.env.example` a `.env.local`:

```env
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=tu_clave_unsplash
NEXT_PUBLIC_PIXABAY_API_KEY=tu_clave_pixabay

# Supabase (obligatorio para votación)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

Sin claves de imágenes, la app usa fallback automático. Sin Supabase, la votación no funciona.

### Vercel — variables obligatorias

En **Project Settings → Environment Variables**, agrega las tres variables de Supabase (incluida `SUPABASE_SERVICE_ROLE_KEY` solo en server, no expuesta al cliente).

## Despliegue en Vercel

```bash
npm run build
npm run deploy
```

O conecta el repositorio en [vercel.com](https://vercel.com) — detecta Next.js automáticamente.

## Estructura

```
src/
├── app/              # Páginas y API routes
├── components/       # UI teatral reutilizable
├── hooks/            # React Query, gestos
├── lib/              # Storage, sonidos, palabras, impro colombiana, ambientes
└── types/            # TypeScript
public/
├── icons/            # Iconos PWA
└── sample-lists.json # Datos de ejemplo
launcher/
├── Iniciar-TAVA.bat  # Ejecutar con un clic
└── Crear-Acceso-Directo.ps1
```

## Controles

| Gesto / Tecla | Acción |
|---------------|--------|
| → / Flecha derecha | Siguiente palabra |
| ← / Flecha izquierda | Palabra anterior |
| ↑ / Flecha arriba | Agregar a Favoritos |
| ↓ / Flecha abajo | Menú rápido |
| ⛶ (header) | Pantalla completa |

## Tecnologías

- Next.js 15 · TypeScript · Tailwind CSS · Framer Motion
- React Query · IndexedDB · LocalStorage
- Unsplash API · Pixabay API
- Vercel

## Licencia

Proyecto para uso del grupo teatral TAVA.
