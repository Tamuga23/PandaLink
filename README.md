# PandaLink — Panda Asesor

PWA independiente de **solo lectura** (asistente de ventas en tablet) para Panda Store.
Lee `catalogo_publico` y `objeciones_universales` desde Firestore en vivo (`onSnapshot`).
No mezcla código con ningún otro proyecto.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v3
- Firebase (modular: `@firebase/app`, `@firebase/auth`, `@firebase/firestore`)
- lucide-react (íconos)

## Requisitos
- Node 18+ (probado con Node 22)

## Puesta en marcha
```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción a /dist
npm run preview  # sirve /dist (acá funciona el service worker / PWA)
```

## Firebase
La configuración está en `src/firebase-applet-config.json` (la misma del POS).
Usa **base de datos nombrada** (`firestoreDatabaseId`) y sesión **anónima**
(`signInAnonymously`), igual que el POS. La inicialización está en `src/lib/firebase.ts`.

> La config web de Firebase no es secreta (viaja al cliente); la seguridad real
> está en las reglas de Firestore.

## PWA / kiosco
- `public/manifest.webmanifest`: nombre **Panda Asesor**, `display: standalone`,
  `orientation: landscape`, íconos placeholder (`public/icon-192.png`, `icon-512.png`).
- `public/sw.js`: cachea el shell para instalación e inicio offline.
- El service worker se registra **solo en producción**. Para probar la instalación:
  `npm run build && npm run preview`.
- Reemplazá los íconos placeholder por los definitivos cuando los tengas.

## Datos / robustez
- El catálogo trae **todos** los productos y muestra su estado (Disponible / Agotado).
- La app está pensada para verse bien aunque solo haya **un** producto completo
  (HY310X) y no rompe si a otros les faltan `specs`, `media`, `bullets`,
  `precio` u `objecionesOverride`.
