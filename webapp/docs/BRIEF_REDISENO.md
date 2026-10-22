# Brief para Claude Code — Rediseño "Diablos Stuff+" (Etapa 1 + PWA)

> Web app del 2026 ISAC Hackathon (Diablos Rojos del México). Mide la calidad de los lanzamientos
> (Stuff+) ajustada por altitud en los 20 parques de la LMB. Este brief manda sobre cualquier idea
> de diseño: si algo se ve increíble pero hace la decisión más lenta, no va.

## 0. La regla que decide todo

La app es una **herramienta de decisión** para el cuerpo técnico, usada sobre todo **en el celular**.

**Prueba de éxito:** el coach abre la app y llega a *"pon a X porque Y"* en **1–2 toques**, sin
explicación previa y sin saber qué es IVB, HB, whiff o Stuff+.

La entrevista final del hackathon (10 min) evalúa justo eso: si la herramienta cambiaría
decisiones de reclutamiento o táctica.

**Entrega: jueves 22 de octubre en la noche. Todas las fases (A–I) entran.** El orden ya es de
prioridad: si algo se atrasa, lo que va primero tiene que estar terminado y funcionando.

### Agenda
Meyer se encarga **solo del diseño y del frontend** (`models/webapp/frontend/`). El modelo, los APIs
y el backend son del resto del equipo.

| Cuándo | Fases |
|---|---|
| Mié en la noche | A (auditoría) → B (fundamentos) |
| Jue 9:00–12:00 | C (Hoy + navegación) |
| Jue 12:00–13:00 | D (Fichajes) |
| Jue 13:00–15:00 | E (pantalla `/y-si`) |
| Jue 15:00–16:30 | F (Estadio y Lanzador) |
| Jue 16:30–17:30 | G (pulido) |
| Jue 17:30–18:30 | H (PWA) |
| Jue 18:30–20:00 | I (QA), `npm run build`, merge a `main` |
| Jue 20:00 → | Colchón y entrega |

**Ritmo:** al terminar cada fase, resumen corto y espera de OK. Sin rodeos: si algo se puede decidir
con este brief, decídelo y dilo.

---

## 1. Usuario y decisión por pantalla

| Pantalla | Ruta | Usuario | Decisión que resuelve |
|---|---|---|---|
| **Hoy** (nueva portada) | `/` | Coach, en el celular | ¿A quién uso hoy en el bullpen y por qué? |
| **Fichajes** (antes Agentes libres) | `/agentes-libres` | Reclutador | ¿A quién traemos y por qué? |
| **¿Y si…?** (nueva) | `/y-si` | Reclutador / coach | ¿Cómo le iría a este lanzador (o a este pitcheo) en el Harp Helú? |
| **Explorar** (antes portada con el mapa) | `/explorar` | Ambos, presentación | ¿Cómo cambia todo de parque en parque? |
| **Estadio** | `/estadio/:id` | Coach | ¿Quién de mi staff rinde mejor en este parque? |
| **Lanzador** | `/lanzador/:id` | Ambos | ¿Dónde lo uso y dónde no? ¿Qué pitcheo sufre en la altura? |
| **Metodología** | `/metodologia` | Jurado | ¿El modelo es confiable? (sin cambios de fondo) |

## 2. Recorridos clic por clic

**Coach (celular, antes del juego)**
1. Abre la app (ícono en la pantalla de inicio, gracias a la PWA) → cae en **Hoy**.
2. Ve el próximo juego (rival, parque, altitud) y debajo **"Tu bullpen hoy"**, ordenado por rol
   (cerrador → preparador → relevo intermedio → relevo largo). Cada tarjeta: nombre, veredicto y
   **una frase** con la razón. → *Decisión tomada en 0 toques.*
3. (Opcional) Toca una tarjeta → se expande: carga de trabajo (1/3/7 días), ventaja contra la
   alineación y efecto del parque, en lenguaje simple, más el link "Ver perfil" → **Lanzador**.

**Reclutador (laptop o celular)**
1. Toca **Fichajes** en la navegación.
2. Ve la lista con veredicto **Fichar / Vigilar / No** y una frase por lanzador. Filtro por rol y mano.
3. Toca un candidato → **"Probar en ¿Y si…?"** carga sus datos en el simulador y muestra cómo le
   iría en el Harp Helú comparado con nuestro staff. → *Decisión en 2 toques.*

## 3. Dirección visual: "transmisión deportiva / editorial", sobre la identidad actual

**Se conserva:** tema oscuro (`#0b0b0d` / `#16161b`), texto crema `#f2efe9`, rojo Diablos
`#d5102f` como único acento de marca, Barlow Condensed + Barlow + JetBrains Mono, ES/EN.

**Se sube de nivel** (usa **taste-skill** para esta parte):
- **Tipografía con presencia:** títulos y nombres de lanzador en Barlow Condensed 700–800, grandes
  (`clamp()`), tracking negativo, `text-wrap: balance`. Los números clave (Stuff+, altitud) como
  "marcador": JetBrains Mono grande, cifras tabulares.
- **Jerarquía de transmisión:** referencia al *score bug* de las transmisiones de MLB/ESPN y a las
  tarjetas de jugador de Baseball Savant. Primero el veredicto, después el porqué y al final el número.
- **Escala de veredicto** (componente único `<Verdict>`), nunca solo color: siempre texto + forma.
  - `Élite` · `Bueno` · `Promedio` · `Evitar` (lanzadores/pitcheos)
  - `Fichar` · `Vigilar` · `No` (fichajes)
  - Colores derivados de los tokens actuales (verde `#57d38c`, neutro, ámbar, salmón `#ff8a7a`),
    con contraste AA y legibles para daltónicos (validar con **AccessLint**).
- **Textura y profundidad sutil:** grano/noise muy ligero en el fondo y bordes con luz roja tenue en
  la tarjeta principal de Hoy. Nada de gradientes morados ni glassmorphism.
- **Movimiento con propósito** (solo CSS + JS ligero, sin librerías nuevas):
  - Entrada escalonada de las tarjetas del bullpen (≤ 250 ms en total).
  - Conteo animado de los números grandes (Stuff+, altitud) al entrar.
  - Transición suave entre rutas (fade/slide 150–200 ms).
  - Todo se apaga con `prefers-reduced-motion: reduce`.
- **Celular primero:** diseñar a 390 px de ancho y luego escalar a escritorio y a proyector (1920 px).
  Áreas táctiles ≥ 44 px.

## 4. Cambios en orden de prioridad (cada fase con su criterio de "listo")

### Fase A — Auditoría (sin cambiar código)
- Corre **redesign-skill** y **web-design-guidelines** sobre `models/webapp/frontend/src`.
- Entrega una lista de hallazgos y un plan por fases. **Espera mi OK antes de seguir.**
- **Listo:** el plan cubre las fases B–I de este brief y señala riesgos.

### Fase B — Fundamentos: tokens, veredictos y capa de lenguaje
1. Tokens nuevos en `styles.css` (escala tipográfica, espaciado, colores de veredicto, sombras
   teñidas, duración y curvas de movimiento). Sin Tailwind; solo variables CSS.
2. Componente `<Verdict>` y función `verdictFor(stuff)`. Los **umbrales viven en un solo lugar**:
   una constante del frontend (`src/verdicts.ts`). Propuesta: ≥115 Élite · 105–115 Bueno ·
   95–105 Promedio · <95 Evitar.
3. **Diccionario de frases** en `i18n.tsx` (ES/EN), generado desde los datos y **nunca escrito a mano
   por lanzador**. Las razones del bullpen ya vienen como códigos en `Reliever.reasons`:
   | código | frase ES (ejemplo) |
   |---|---|
   | `back_to_back` | Lanzó ayer y antier: dale descanso |
   | `heavy_yesterday` | Tiró {n} pitcheos ayer |
   | `heavy_3d` / `busy_3d` | Mucha carga en 3 días ({n} pitcheos) |
   | `pitched_yesterday` | Lanzó ayer ({n} pitcheos) |
   | `starter_in_rotation` | Es abridor en rotación |
   | `platoon_plus` / `platoon_minus` | Le saca más / menos abanicados a esta alineación |
   | `park_plus` / `park_minus` | Su bola gana / pierde en este parque |

   Más frases por pitcheo a partir de `sea` contra `here` (ivb/hb): *"Su sinker pierde 4 pulgadas de caída
   aquí: úsalo menos"*. Umbral mínimo para mencionarlo: ≥ 1.5 in.
4. Glosario en tooltip: Stuff+ = "calidad de la bola, 100 = promedio de la liga".
- **Listo:** ninguna pantalla muestra IVB/HB/whiff sin traducción al lado; `npm run build` pasa.

### Fase C — Pantalla "Hoy" + navegación
1. **Nueva ruta `/` = Hoy**; el contenido actual de `Home.tsx` (mapa, calendario) se mueve a `/explorar`.
2. Hoy usa `/api/bullpen` (el mismo dato que hoy alimenta `BullpenDrawer`) y `/api/schedule`:
   - Encabezado: fecha, `vs`/`@` rival, parque, altitud con su color, sello **"Datos al {as_of}"**.
   - **"Tu bullpen hoy"**: tarjetas por `slot` (closer/setup/middle/long), cada una con nombre,
     `<Verdict>` de `stuff_here`, la **razón principal** (primer código de `reasons` traducido) y
     un indicador de disponibilidad. Toque → expande el detalle.
   - "No disponibles" plegado, con la razón (descanso).
   - "Este parque en una frase", generada desde `league_by_pitch_type` del estadio.
   - Chips para cambiar a los siguientes juegos de la serie (reusar `selectedDate`).
   - Estados vacíos: no hay juego hoy → muestra el próximo; sin calendario → mensaje + link a
     Explorar; `workload_known=false` → aviso claro.
3. **Navegación:** en celular, barra inferior con *Hoy · Fichajes · ¿Y si…? · Explorar* (Metodología
   en el menú); en escritorio, la barra superior actual con esos destinos.
4. **El diablito deja de flotar encima del contenido.** Queda como marca en la barra y como
   ilustración en Hoy. El drawer de bullpen se elimina o queda solo en escritorio, pero **cierra con
   Escape** y regresa el foco.
- **Listo:** a 390 px, el coach ve el cerrador y el preparador recomendados **sin hacer scroll** y
  sin tocar nada; nada tapa contenido; Lighthouse Accesibilidad ≥ 95.

### Fase D — Fichajes (agentes libres con veredicto)
1. Lista en tarjetas (celular) o tabla compacta (escritorio) con `<Verdict>` **Fichar / Vigilar / No**.
   Regla propuesta (umbrales configurables en el mismo lugar que la fase B):
   - Fichar: `fit ≥ +5` y `stuff_home ≥ 105`
   - Vigilar: `fit` entre 0 y 5, o muestra chica (`n_pitches < 300`, con etiqueta "Muestra chica")
   - No: `fit < 0`
2. Una frase por lanzador: *"Mejora tu bullpen +12 y gana 1.6 en la altura. Su mejor arma: sinker."*
3. Botón "Probar en ¿Y si…?" en cada candidato.
4. Columnas técnicas detrás de un "Ver detalle".
- **Listo:** un reclutador entiende el veredicto de los 5 primeros sin leer ningún número.

### Fase E — "¿Y si…?" (simulador; es el **entregable 4** del hackathon)
Como Meyer solo hace diseño y frontend, la pantalla tiene dos modos:

**Modo 1: "Lanzador real en otro parque"** (se construye completo **solo con endpoints que ya
existen**). `GET /api/stadiums/{sid}/pitchers/{pid}` ya regresa, por pitcheo, `sea` contra `here`
(Stuff+, movimiento y trayectorias). Con eso:
- Buscador "Elige un lanzador" (también se llega desde Fichajes y Lanzador) y selector de parque
  (Harp Helú por defecto).
- Salida en este orden: veredicto en ese parque → frase por pitcheo → **mapa de movimiento** (SVG,
  nivel del mar contra el parque) → números → comparación contra la mediana de nuestro staff
  (`our_medians` de `/api/free-agents`).

**Modo 2: "Pitcheo inventado"** (características escritas a mano). Necesita un endpoint nuevo,
`POST /api/simular`, que **no construyes tú**: lo hace el responsable del modelo.
- Construye el formulario en lenguaje humano ("Velocidad", "Giro", "Cuánto sube", "Cuánto se abre",
  "Extensión", "Mano") y la misma salida que el modo 1, contra este contrato:
  - Entrada: `{pitch_type, throws, rel_speed, spin_rate, ivb, hb, extension, rel_height, rel_side}`
  - Respuesta: `{stuff_mar, stuff_cdmx, ivb_mar, ivb_cdmx, hb_mar, hb_cdmx, path_mar, path_cdmx}`
- Si el endpoint responde 404, el modo 2 muestra "Disponible pronto" y deja usar el modo 1.
  **Nunca inventes números** ni pongas datos de ejemplo que parezcan reales.
- **Listo:** el modo 1 funciona con cualquier lanzador y coincide con su perfil; el modo 2 queda
  listo para conectarse en cuanto exista el endpoint.

**Nota para el responsable del modelo (no es trabajo de esta sesión):** `dashboard/app.py`
(Streamlit) es un esqueleto: busca `models/stuffplus_latest.pkl`, que no existe, el ajuste por
altitud está comentado y la gráfica es un TODO. El modelo real son los XGBoost de
`modelos/stuff_{resultado,bip}_{0..4}.json`. La capa `stuff` incluye la variable `altitud` (0/1/2),
así que el mismo pitcheo se puede evaluar en el mar y en CDMX. Con eso se puede construir
`/api/simular` con el contrato de arriba.

### Fase F — Estadio y Lanzador
- **Estadio:** arriba, "Los mejores de tu staff aquí" (top 3 de `/stadiums/{id}/leaderboard`),
  ya seleccionado el #1; ya no hay que elegir a mano. La zona de strike ocupa el panel, sin espacio
  vacío. La tabla de efecto por pitcheo se convierte en frases + barras.
- **Lanzador:** el lado derecho del encabezado muestra el veredicto en Harp Helú y "Úsalo en: … /
  Evítalo en: …" (top y bottom 3 de `by_park`). "Últimas salidas" con ejes, leyenda y unidades.
  Arsenal: una frase por pitcheo ("pierde/gana en la altura").
- **Listo:** ambas pantallas pasan la prueba de "pon a X porque Y" sin leer tablas.

### Fase G — Pulido general
- Skeletons de carga en lugar de "Cargando…"; estados de error con reintento.
- Buscador: placeholder "Busca lanzador, estadio, ciudad o equipo" (el backend ya busca así).
- Mapa de Explorar legible en celular: etiquetas más grandes, zoom a la zona centro y lista de
  parques como alternativa.
- Escape/foco en todos los paneles; `aria-*` correctos; contraste AA.

### Fase H — PWA (app instalable en iPhone y Android)
1. `vite-plugin-pwa` (la única dependencia nueva permitida): `manifest` (nombre "Diablos Stuff+",
   íconos 192/512 + maskable + apple-touch-icon, `display: standalone`, `theme_color #0b0b0d`) y
   service worker.
2. Caché: el shell de la app como *precache*; `/api/*` con **network-first** y respaldo a la última
   respuesta guardada. Si se muestra un dato guardado, decirlo: "Sin conexión · datos de hace 2 h".
3. iPhone: aviso de una sola vez "Instálala: Compartir → Agregar a pantalla de inicio".
4. Deslizar hacia abajo para recargar en Hoy.
5. Para probar en el teléfono por WiFi, el traductor tiene que escuchar en `0.0.0.0`. No edites
   `apis/iniciar_todo.sh`: dame el comando para correrlo a mano con `--host 0.0.0.0`.
- **Listo:** en Android aparece "Instalar app"; en iPhone abre a pantalla completa desde el ícono;
  Lighthouse PWA sin errores; con la red cortada, Hoy muestra los últimos datos.
- **Nota:** el service worker solo funciona en HTTPS o en `localhost`. Por `http://192.168.x.x` el
  teléfono puede agregar el ícono, pero sin modo offline. Decide conmigo antes de exponer nada a
  internet (los datos de la competencia no se pueden publicar).

### Fase I — QA final
- **AccessLint** (contraste y uso del color) y **web-design-guidelines** sobre el resultado.
- Revisar a 390 px, 768 px, 1440 px y 1920 px (proyector), en ES y EN, con
  `prefers-reduced-motion` activado y desactivado.
- `npm run build` sin errores de TypeScript.
- **Listo:** la prueba del coach se cumple en un iPhone real.

## 5. Videos
Fuera de alcance en este brief (es la etapa 2: intro con Higgsfield y video Brag). **No reservar
espacios vacíos para video.** Solo deja `Hoy` y `Lanzador` preparados para recibir, más adelante, un
componente `<LoopVideo>` (poster + carga diferida + pausa fuera de pantalla + respeta reduced-motion).

## 6. Lo que NO se toca
- **Nada fuera de `models/webapp/frontend/`** (salvo `docs/`): ni `apis/`, ni
  `models/webapp/backend/`, ni `notebooks/`, `modelos/`, `dashboard/` o `src/`. Son del resto del
  equipo. Si algo del diseño necesita un cambio ahí, **para y escríbeme qué hay que pedirles**.
- Los contratos de los endpoints existentes: el frontend se adapta a lo que ya regresan.
- Archivos de datos, `.env`, `.gitignore`. **Nunca subir datos ni llaves: el repo es público.**
- Stack: React 18 + TypeScript + Vite + react-router, CSS con variables, gráficas en SVG a mano. **Sin
  Tailwind, sin librerías de gráficas, sin librerías de animación.**
- La paleta base, las tres fuentes, el ES/EN y el respeto a `prefers-reduced-motion`.

## 7. Cómo trabajar
- Rama `rediseno`. Un commit por fase, con mensajes claros.
- Haz `git pull origin main` (merge a `rediseno`) al inicio del jueves y antes de la fase I: el equipo
  sigue subiendo cambios fuera del frontend.
- Empieza en **modo plan**; al terminar cada fase, para, resume lo hecho y espera mi OK.
- Desarrollo: traductor prendido (`bash apis/iniciar_todo.sh`) + `npm run dev` en
  `models/webapp/frontend`. Al cerrar cada fase: `npm run build` (actualiza `frontend/dist`, que va en
  git; avísame si `main` cambió `dist` para evitar conflictos).
- Si algo de este brief choca con lo que encuentres en el código, **pregunta antes de improvisar**.

## 8. Riesgos y preguntas abiertas
- **Tiempo:** todo cabe en la agenda si nadie se atora; el colchón empieza a las 20:00 del jueves.
- **Simulador, modo 2:** depende de que el responsable del modelo construya `POST /api/simular`.
  Sin eso, el modo 1 cubre la demo.
- **Umbrales de veredictos:** son propuestas; hay que validarlos con la distribución real de Stuff+.
- **`RunValueEvents.csv`:** hay un `LEEME-...-INVENTADO.txt` junto a él; si los valores son inventados,
  la calibración del modelo también.
- **PWA fuera de la laptop:** necesita HTTPS y un servidor; las reglas solo permiten usar los datos
  para la competencia. Hay que preguntarle a ISAC antes de alojar nada.
- **Imágenes de jugadores reales y logo del club:** confirmar permiso (aplica en la etapa 2).
- **Trabajo en paralelo del equipo:** nadie más toca el frontend; ellos trabajan en modelos y
  notebooks. Si suben un modelo nuevo al API 2, el traductor lo toma con `POST /api/admin/reload`.
