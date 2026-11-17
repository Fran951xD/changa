# Plan y decisiones

El pedido decía: hacer hasta 5 preguntas y esperar aprobación. Como el dueño del proyecto me dejó trabajando solo, respondí yo cada pregunta con la opción más segura y la dejo anotada acá para revisarla.

## Las 5 preguntas (y lo que decidí)

1. **¿Dónde se despliega y con qué cuentas?** No puedo crear cuentas en Vercel, Neon, Google Cloud, Resend, Twilio ni Cloudflare a tu nombre. → Dejé todo listo para Vercel + Neon y el README explica el despliegue paso a paso. Hasta que configures esas claves, la app corre en **modo demo**: el enlace mágico y el código SMS aparecen en pantalla.
2. **¿Cómo se verifica el celular gratis?** No hay SMS gratuito confiable en Argentina. → Interfaz lista para Twilio Verify (pago por uso) y modo demo sin costo. Alternativa a evaluar: verificar pidiendo al trabajador que mande un WhatsApp a un número de Changa.
3. **"Entre 1 y 60 días después del contacto"**: ¿desde el día 1 o desde el momento del contacto? → Literal: desde las 24 h hasta los 60 días (`REVIEW_MIN_DAYS` en `src/lib/review-rules.ts`). La semilla trae una clienta demo (`cliente@changa.test`) con un contacto de hace 3 días a Juan, para probar el flujo.
4. **¿Cómo recibe el trabajador un pedido de presupuesto sin chat?** → Le aparece en su panel con el teléfono del cliente y un botón para responder por WhatsApp. No mandamos mail (no hay proveedor configurado).
5. **¿PostGIS es obligatorio?** → Propuse una alternativa: Postgres común con la fórmula del haversine en SQL. Para el volumen del GBA (miles de trabajadores) alcanza con un índice en lat/lng, funciona igual en Neon, Supabase y PGlite, y evita una extensión. Si algún día hace falta, se migra la columna a `geography` sin tocar la interfaz.

## Otras decisiones técnicas

- **Base local sin instalar nada**: sin `DATABASE_URL` se usa PGlite (Postgres compilado a WebAssembly) guardado en `.data/`. Con `DATABASE_URL=postgres://…` se usa postgres-js contra Neon/Supabase. Mismo esquema y migraciones.
- **Autenticación propia** (enlace mágico + Google con `arctic`): son ~150 líneas, sin depender de una beta de Auth.js. Tokens aleatorios de 32 bytes guardados hasheados, cookies httpOnly, el enlace se confirma con un botón (POST) para que los antivirus de mail no lo consuman.
- **Imágenes en Postgres** como WebP ya comprimido (1200 px + miniatura 400 px) con `sharp`. Entra holgado en el plan gratis; si crece, se pasa a R2/Blob cambiando un archivo.
- **Límites de uso en Postgres** (ventana fija por IP hasheada): funciona igual con muchas instancias serverless, sin sumar Redis.
- **Mapa**: Leaflet + OpenStreetMap, cargado solo cuando se abre la vista de mapa.
- **Barrios**: lista fija con coordenadas (CABA + GBA), sin geocodificador externo.

## Fases

1. Modelo de datos, autenticación, perfil del trabajador y semilla.
2. Búsqueda, lista y mapa, perfil público con contacto por WhatsApp.
3. Reseñas confiables y pedidos de presupuesto.
4. Panel con estadísticas, QR y link propio.
5. Moderación, SEO, accesibilidad, rendimiento, CI y guía de despliegue.

## Modelo de datos (resumen)

`users` · `sessions` · `login_tokens` · `workers` (perfil, zona, disponibilidad, rating cacheado) · `worker_trades` · `worker_areas` (con lat/lng) · `worker_photos` · `images` · `contacts` (canal, visitante anónimo y usuario) · `profile_views` (por día) · `reviews` (una por par, respuesta pública) · `quote_requests` + `quote_recipients` · `reports` · `rate_limits`.

Pensado para después: pagos (`payments` con FK a `quote_requests`/`workers`) y chat (`conversations` + `messages` colgando de `contacts`) se suman sin romper nada de lo actual.
