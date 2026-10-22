import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

const dict = {
  es: {
    appName: "Diablos Stuff+",
    tagline: "Calidad de pitcheo ajustada por altitud en la Liga Mexicana",
    navMap: "Mapa", navFreeAgents: "Fichajes", navMethod: "Metodología",
    syntheticBanner: "Datos sintéticos de demostración. Se reemplazan con los datos reales al cargarlos.",
    placeholderModel: "Modelo provisional (sin entrenar)",
    searchPlaceholder: "Busca lanzador, estadio, ciudad o equipo…",
    searchPitchers: "Pitchers", searchStadiums: "Estadios", noResults: "Sin resultados",
    mapTitle: "Los 20 parques de la LMB", mapHint: "Haz clic en un estadio para ver cómo juega cada pitcher ahí.",
    movementLost: "Movimiento perdido vs. nivel del mar", pitchValue: "VALOR / PITCH",
    altitude: "Altitud", airDensity: "Densidad del aire", movementRetained: "Movimiento conservado",
    vsSeaLevel: "vs. nivel del mar", zoneNorte: "Zona Norte", zoneSur: "Zona Sur", home: "Casa",
    calendarTitle: "Calendario Diablos", record: "Récord", homeGame: "Local", awayGame: "Visita",
    postponed: "Pospuesto", noGame: "Sin juego", at: "en", vs: "vs",
    diabloHint: "¿Bullpen?", bullpenTitle: "Recomendación de bullpen", nextSeries: "Próxima serie",
    forDate: "Para el", opponentLhb: "Zurdos del rival", closer: "Cerrador", setup: "Preparador",
    middle: "Relevo intermedio", long: "Relevo largo", depth: "Disponible", rest: "Descanso",
    starters: "Abridores", available: "Disponible", limited: "Limitado", unavailable: "No disponibles",
    stuffHere: "Stuff+ aquí", platoon: "Ventaja por mano", workload: "Carga",
    pitches3d: "lanz. 3 días", workloadUnknown: "Sin fechas en los datos: la carga de trabajo no se puede calcular.",
    r_back_to_back: "Lanzó ayer y antier: dale descanso", r_heavy_yesterday: "Tiró {v} pitcheos ayer",
    r_heavy_3d: "Mucha carga en 3 días ({v} pitcheos)", r_pitched_yesterday: "Lanzó ayer ({v} pitcheos)",
    r_busy_3d: "Mucha carga en 3 días ({v} pitcheos)", r_starter_in_rotation: "Es abridor en rotación",
    r_platoon_plus: "Le saca más abanicados a esta alineación", r_platoon_minus: "Le saca menos abanicados a esta alineación",
    r_park_plus: "Su bola gana en este parque", r_park_minus: "Su bola pierde en este parque",
    faTitle: "Fichajes", faHint: "A quién traer, según cómo le iría en el Harp Helú.",
    faAll: "Todos", faOnly: "Solo agentes libres", faSigned: "En otro equipo", role: "Rol", sp: "Abridor", rp: "Relevista",
    hand: "Mano", right: "Derecho", left: "Zurdo", any: "Cualquiera", sortBy: "Ordenar por",
    sortHome: "Stuff+ en casa", sortNeutral: "Stuff+ neutral", sortFit: "Mejora al staff",
    freeAgent: "Agente libre", onTeam: "En", teamUnknown: "Equipo ?",
    noStaff: "Los datos anonimizados no dicen qué pitchers son de los Diablos, así que todavía no hay bullpen que recomendar. Aparece solo con los datos de la final o con un roster en backend/data/rosters/.",
    faNoTeams: "Los datos anonimizados no traen equipos: todavía no se puede saber quién es agente libre. Aquí están todos los pitchers; con los datos de la final se separan solos.", stuffHome: "Stuff+ Harp Helú", stuffNeutral: "Stuff+ neutral",
    altitudeDelta: "Efecto altitud", fit: "vs. mediana del staff", bestPitch: "Mejor lanzamiento", seeAll: "Ver todos",
    lastSeason: "Última temporada", pitches: "Lanzamientos",
    backToMap: "Explorar", pickPitcher: "Elige un pitcher", pickPitcherHint: "Busca por ID o elige uno del ranking.",
    strikeZoneTitle: "Zona de strike (vista del cátcher)", aimHint: "Toca la zona (o usa las flechas) para cambiar el punto de apunte.",
    seaLevel: "Nivel del mar", here: "Aquí", missBy: "Se desvía {v} in", plateSpeed: "Vel. en home",
    ivb: "Mov. vertical inducido", hb: "Mov. horizontal", usage: "Uso", velo: "Velocidad", spin: "Giro",
    movementTitle: "Movimiento: nivel del mar → este parque", crownTitle: "Ranking del parque",
    crownHint: "Stuff+ proyectado a esta altitud (100 = promedio de la liga en este parque)",
    rank: "#", pitcher: "Pitcher", team: "Equipo", minPitches: "Mín. lanzamientos",
    leagueHere: "Lo que la altitud le hace a cada lanzamiento (promedio de la liga)",
    profileArsenal: "Arsenal", profileLink: "Ver perfil completo", profileByPark: "Stuff+ por parque vs. su promedio (de mayor a menor altitud)", profileWorkload: "Últimas salidas",
    season: "Temporada", status: "Estatus", games: "Juegos", viewInStadium: "Ver en un estadio",
    ours: "Diablos", neutral: "Neutral", bestPark: "Mejor parque", worstPark: "Peor parque", whiff: "Whiff %",
    bayesWhiff: "BayesBall P(whiff)", bayesWhiffSub: "por pitcheo · mar → Harp Helú",
    bayesFoot: "Whiff %: fallos entre swings. BayesBall P(whiff): probabilidad de que el pitcheo termine en swing y fallo según el modelo bayesiano, a nivel del mar → en el Harp Helú (misma física; cambia solo lo que percibe el bateador).",
    mBayes: "BayesBall: el bateador como inferente bayesiano",
    mBayesText: "Segundo modelo, independiente de Stuff+: una regresión logística de P(whiff) que agrega qué tanto «resuelve» el bateador el pitcheo (su expectativa del arsenal combinada con lo que ve). En altitud extrema el pitcheo se mueve menos y es más legible, así que el modelo espera menos whiff aunque la física sea la misma. En el perfil de cada pitcher se ve su P(whiff) a nivel del mar y en el Harp Helú.",
    mBayesPending: "Aparece cuando el notebook de BayesBall (notebooks/03_model_stuff_plus.ipynb) sube sus resultados al API 2.",
    methodTitle: "Metodología", readPaper: "Leer el paper", paperSoon: "Paper próximamente",
    mPipeline: "Cómo se construye Stuff+", mPipelineText: "Cuatro submodelos predicen, para cada lanzamiento, la probabilidad de swing y fallo, de strike cantado, de rodado y de contacto fuerte a partir solo de sus características físicas (velocidad, giro, movimiento, punto de salida, extensión). Se combinan en un valor por lanzamiento y se escalan a 100 + 10·z, normalizado por temporada y estadio.",
    mNoLocation: "La ubicación del lanzamiento en la zona se excluye: es un resultado, no una característica del lanzamiento.",
    mAltitude: "Física de la altitud", mAltitudeText: "La fuerza Magnus y el arrastre son proporcionales a la densidad del aire. Convertimos cada lanzamiento a su equivalente a nivel del mar y lo proyectamos a la densidad de cualquier parque. La gráfica compara, por estadio, la aceleración por giro medida contra la densidad del aire: si la física se cumple, los puntos caen sobre la diagonal.",
    mElasticity: "Elasticidad medida", mValidation: "Validación", mValidationPending: "Las métricas aparecen aquí cuando el notebook de Stuff+ (Paso 9) sube su tabla de validación al API 2.",
    mValidationPlan: "GroupKFold por pitcher, holdout temporal por temporada y holdout por categoría de altitud.",
    mData: "Datos", mDataRows: "lanzamientos", mSubmodels: ["Whiff", "Strike cantado", "Rodado", "Contacto fuerte"],
    densityRatio: "Densidad / promedio del pitcher", spinAccelRatio: "Aceleración por giro / promedio del pitcher",
    loading: "Cargando…", error: "No se pudo cargar",
    navToday: "Hoy", navExplore: "Explorar", navMore: "Más", skipToContent: "Saltar al contenido", mainNav: "Navegación principal",
    v_elite: "Élite", v_good: "Bueno", v_avg: "Promedio", v_avoid: "Evitar", v_sign: "Fichar", v_promising: "Prometedor", v_watch: "Vigilar", v_no: "No",
    g_stuff: "Stuff+: calidad de la bola. 100 = promedio de la liga en un parque neutral; la altura de cada parque lo sube o lo baja.",
    g_ivb: "IVB (movimiento vertical inducido): cuánto sube o cae la bola por su giro, en pulgadas.",
    g_hb: "HB (movimiento horizontal): cuánto se abre la bola de lado, en pulgadas.",
    g_whiff: "Whiff %: de cada 100 swings, cuántos fallan.",
    g_fit: "Cuántos puntos de Stuff+ le suma a la mediana de nuestro staff en su rol.",
    g_verdict: "El veredicto lo compara con toda la liga proyectada en ese parque: Élite = 5% más alto, Bueno = siguiente 20%, Promedio = la parte media, Evitar = 15% más bajo.", whatIsVerdict: "¿Cómo se decide?",
    ivbShort: "Mov. vertical", hbShort: "Mov. lateral", whiffShort: "Abanicados", glossary: "Qué significa",
    pp_vert_pos_lose: "Su {p} sube {n} in menos aquí", pp_vert_pos_gain: "Su {p} sube {n} in más aquí",
    pp_vert_neg_lose: "Su {p} cae {n} in menos aquí", pp_vert_neg_gain: "Su {p} cae {n} in más aquí",
    pp_horiz_lose: "Su {p} se abre {n} in menos aquí", pp_horiz_gain: "Su {p} se abre {n} in más aquí",
    pp_same: "Su {p} se mueve casi igual aquí", pp_useLess: ": úsalo menos", pp_useMore: ": aprovéchalo",
    park_same: "Aquí la bola se mueve casi igual que a nivel del mar.",
    park_lose: "Aquí la bola se mueve {pct}% menos que a nivel del mar. La que más sufre: {p}.",
    ph_fit_plus: "Mejora tu {u} en {n}.", ph_fit_minus: "Queda {n} debajo de tu {u}.", ph_unit_rp: "bullpen", ph_unit_sp: "rotación",
    ph_alt_gain: "Gana {n} en la altura.", ph_alt_lose: "Pierde {n} en la altura.", ph_alt_same: "La altura casi no lo afecta.",
    ph_here_gain: "Gana {n} en este parque.", ph_here_lose: "Pierde {n} en este parque.", ph_here_same: "Este parque casi no lo afecta.",
    ph_best: "Su mejor arma: {p}.",
    smallSample: "Muestra chica", noStaffCompare: "Sin comparación con el staff",
    gameToday: "Juego de hoy", gameNext: "Próximo juego", gameLast: "Último juego de la temporada",
    dataAsOf: "Datos al {v}", parkInOne: "Este parque en una frase", seriesGames: "Juegos de la serie",
    bestHere: "Los mejores de la liga en este parque", bestHereHint: "proyectado aquí. Toca uno para ver dónde usarlo.",
    yourBullpen: "Tu bullpen", bullpenEmpty: "El bullpen aparece cuando los datos traen equipos y nombres de jugadores.",
    noSchedule: "No hay calendario cargado.", goExplore: "Ver el mapa y el calendario", seeInToday: "Ver en Hoy",
    opponent: "Rival", venue: "Parque",
    whatIsStuff: "¿Qué es Stuff+?", faMissing: "faltan {n} porque el API entrega máximo {max} por consulta", navWhatIf: "¿Y si…?", tryWhatIf: "Probar en ¿Y si…?", seeDetail: "Ver detalle", showing: "Mostrando {n} de {total}", showMore: "Ver más",
    faNoStaffNote: "Todavía no hay staff con qué comparar, así que el veredicto compara su Stuff+ en el Harp Helú con el de la liga en su mismo rol (abridores contra abridores, relevistas contra relevistas): Fichar = el 5% más alto (con {n} pitcheos o más), Prometedor = igual de bueno pero con menos de {n} pitcheos, Vigilar = el siguiente 20%.",
    faRuleNote: "Fichar: mejora al staff en {a} o más y está en el 25% más alto de su rol en la liga en casa. Prometedor: cumple Fichar pero con muestra chica. Vigilar: mejora entre 0 y {a}.",
    filters: "Filtros", verdictCol: "Veredicto", whyCol: "Por qué", nPitches: "Pitcheos registrados",
    wiTitle: "¿Y si…?", wiHint: "Cómo le iría a un lanzador real en cualquier parque de la liga.",
    wiPark: "Parque", wiPickHint: "Busca un lanzador o empieza con uno de los mejores de este parque:",
    wiChange: "Cambiar lanzador", wiStuffLine: "Stuff+ de {n} en el {park}", wiVsSea: "contra nivel del mar", sameAsSea: "Igual que a nivel del mar",
    wiPitches: "Pitcheo por pitcheo", wiMovement: "Movimiento: nivel del mar contra este parque",
    wiLegendSea: "Nivel del mar (contorno)", wiLegendHere: "Este parque (relleno)", wiNumbers: "Los números",
    wiStaff: "Contra nuestro staff", wiStaffLine: "{d} contra la mediana de nuestros {r}.",
    wiStaffNone: "La comparación con el staff aparece cuando los datos traen equipos.",
    lp_rise_less: "sube {n} in menos", lp_rise_more: "sube {n} in más", lp_drop_less: "cae {n} in menos", lp_drop_more: "cae {n} in más",
    lp_side_less: "se abre {n} in menos", lp_side_more: "se abre {n} in más", lp_same: "se mueve casi igual", lp_keeps: "Conserva {n}% de su movimiento",
    bestHereShort: "Los mejores aquí", pitchHere: "Su arsenal aquí", vsSeaShort: "{d} contra nivel del mar", close: "Cerrar",
    leNote: "La barra muestra cuánto movimiento conserva cada pitcheo aquí (100% = nivel del mar).", retry: "Reintentar",
    parksSimilar: "Rinde parecido en los {n} parques (de {a} a {b}): el parque no decide.",
    parksList: "Ver los 20 parques en lista", 
    useAt: "Úsalo en", avoidAt: "Evítalo en", atHome: "En el Harp Helú", altitudeHere: "En la altura (Harp Helú)",
    workloadAxis: "Pitcheos por salida", workloadLegend: "Color: altitud del parque",
    rolePluralSP: "abridores", rolePluralRP: "relevistas", seaShort: "Mar", hereShort: "Aquí",
  },
  en: {
    appName: "Diablos Stuff+",
    tagline: "Altitude-adjusted pitch quality for the Mexican League",
    navMap: "Map", navFreeAgents: "Signings", navMethod: "Methodology",
    syntheticBanner: "Synthetic demo data. Replaced by the real data once it is loaded.",
    placeholderModel: "Placeholder model (not trained)",
    searchPlaceholder: "Search pitcher, ballpark, city or team…",
    searchPitchers: "Pitchers", searchStadiums: "Ballparks", noResults: "No results",
    mapTitle: "The 20 LMB ballparks", mapHint: "Click a ballpark to see how any pitcher plays there.",
    movementLost: "Movement lost vs. sea level", pitchValue: "PITCH VALUE",
    altitude: "Altitude", airDensity: "Air density", movementRetained: "Movement retained",
    vsSeaLevel: "vs. sea level", zoneNorte: "North Zone", zoneSur: "South Zone", home: "Home",
    calendarTitle: "Diablos schedule", record: "Record", homeGame: "Home", awayGame: "Away",
    postponed: "Postponed", noGame: "No game", at: "at", vs: "vs",
    diabloHint: "Bullpen?", bullpenTitle: "Bullpen recommendation", nextSeries: "Next series",
    forDate: "For", opponentLhb: "Opponent lefties", closer: "Closer", setup: "Setup",
    middle: "Middle relief", long: "Long relief", depth: "Available", rest: "Rest",
    starters: "Starters", available: "Available", limited: "Limited", unavailable: "Unavailable",
    stuffHere: "Stuff+ here", platoon: "Platoon edge", workload: "Workload",
    pitches3d: "pitches 3 days", workloadUnknown: "No dates in the data: workload can't be computed.",
    r_back_to_back: "Pitched the last two days: give him rest", r_heavy_yesterday: "Threw {v} pitches yesterday",
    r_heavy_3d: "Heavy load in 3 days ({v} pitches)", r_pitched_yesterday: "Pitched yesterday ({v} pitches)",
    r_busy_3d: "Heavy load in 3 days ({v} pitches)", r_starter_in_rotation: "Starter in the rotation",
    r_platoon_plus: "Gets more swings and misses from this lineup", r_platoon_minus: "Gets fewer swings and misses from this lineup",
    r_park_plus: "His stuff plays up at this park", r_park_minus: "His stuff plays down at this park",
    faTitle: "Signings", faHint: "Who to bring in, based on how he would do at Harp Helú.",
    faAll: "All", faOnly: "Free agents only", faSigned: "On another team", role: "Role", sp: "Starter", rp: "Reliever",
    hand: "Hand", right: "Right", left: "Left", any: "Any", sortBy: "Sort by",
    sortHome: "Stuff+ at home", sortNeutral: "Neutral Stuff+", sortFit: "Staff upgrade",
    freeAgent: "Free agent", onTeam: "On", teamUnknown: "Team ?",
    noStaff: "The anonymized data doesn't say which pitchers belong to the Diablos, so there's no bullpen to recommend yet. It appears with the final data or a roster in backend/data/rosters/.",
    faNoTeams: "The anonymized data has no teams, so free agents can't be told apart yet. All pitchers are listed; the final data separates them automatically.", stuffHome: "Stuff+ Harp Helú", stuffNeutral: "Neutral Stuff+",
    altitudeDelta: "Altitude effect", fit: "vs. staff median", bestPitch: "Best pitch", seeAll: "See all",
    lastSeason: "Last season", pitches: "Pitches",
    backToMap: "Explore", pickPitcher: "Pick a pitcher", pickPitcherHint: "Search by ID or pick one from the ranking.",
    strikeZoneTitle: "Strike zone (catcher's view)", aimHint: "Tap the zone (or use the arrow keys) to move the aim point.",
    seaLevel: "Sea level", here: "Here", missBy: "Misses by {v} in", plateSpeed: "Plate velo",
    ivb: "Induced vertical break", hb: "Horizontal break", usage: "Usage", velo: "Velocity", spin: "Spin",
    movementTitle: "Movement: sea level → this park", crownTitle: "Ballpark ranking",
    crownHint: "Projected Stuff+ at this altitude (100 = league average at this park)",
    rank: "#", pitcher: "Pitcher", team: "Team", minPitches: "Min. pitches",
    leagueHere: "What altitude does to each pitch (league average)",
    profileArsenal: "Arsenal", profileLink: "Full profile", profileByPark: "Stuff+ by ballpark vs. his average (highest to lowest)", profileWorkload: "Recent outings",
    season: "Season", status: "Status", games: "Games", viewInStadium: "View at a ballpark",
    ours: "Diablos", neutral: "Neutral", bestPark: "Best park", worstPark: "Worst park", whiff: "Whiff %",
    bayesWhiff: "BayesBall P(whiff)", bayesWhiffSub: "per pitch · sea level → Harp Helú",
    bayesFoot: "Whiff %: misses per swing. BayesBall P(whiff): probability that the pitch ends in a swing and miss according to the Bayesian model, at sea level → at Harp Helú (same physics; only what the hitter perceives changes).",
    mBayes: "BayesBall: the hitter as a Bayesian observer",
    mBayesText: "A second model, independent of Stuff+: a logistic regression for P(whiff) that adds how well the hitter can “resolve” the pitch (his expectation of the arsenal combined with what he sees). At extreme altitude the pitch moves less and is easier to read, so the model expects fewer whiffs even with identical physics. Each pitcher's profile shows his P(whiff) at sea level and at Harp Helú.",
    mBayesPending: "Appears once the BayesBall notebook (notebooks/03_model_stuff_plus.ipynb) uploads its results to API 2.",
    methodTitle: "Methodology", readPaper: "Read the paper", paperSoon: "Paper coming soon",
    mPipeline: "How Stuff+ is built", mPipelineText: "Four sub-models predict, for each pitch, the probability of a swinging strike, a called strike, a ground ball and hard contact from its physical traits only (velocity, spin, movement, release, extension). They combine into a per-pitch value scaled to 100 + 10·z, normalized by season and ballpark.",
    mNoLocation: "Pitch location is excluded: it is an outcome, not a trait of the pitch.",
    mAltitude: "Altitude physics", mAltitudeText: "Magnus force and drag are proportional to air density. We convert every pitch to its sea-level equivalent and project it to any ballpark's density. The chart compares, by ballpark, the measured spin-induced acceleration against air density: if the physics holds, the points sit on the diagonal.",
    mElasticity: "Measured elasticity", mValidation: "Validation", mValidationPending: "Metrics appear here once the Stuff+ notebook (Step 9) uploads its validation table to API 2.",
    mValidationPlan: "GroupKFold by pitcher, temporal holdout by season, and holdout by altitude category.",
    mData: "Data", mDataRows: "pitches", mSubmodels: ["Whiff", "Called strike", "Ground ball", "Hard contact"],
    densityRatio: "Density / pitcher average", spinAccelRatio: "Spin acceleration / pitcher average",
    loading: "Loading…", error: "Couldn't load",
    navToday: "Today", navExplore: "Explore", navMore: "More", skipToContent: "Skip to content", mainNav: "Main navigation",
    v_elite: "Elite", v_good: "Good", v_avg: "Average", v_avoid: "Avoid", v_sign: "Sign", v_promising: "Promising", v_watch: "Watch", v_no: "Pass",
    g_stuff: "Stuff+: pitch quality. 100 = league average at a neutral ballpark; each ballpark's altitude moves it up or down.",
    g_ivb: "IVB (induced vertical break): how much the pitch rises or drops from its spin, in inches.",
    g_hb: "HB (horizontal break): how much the pitch moves sideways, in inches.",
    g_whiff: "Whiff %: swings and misses per 100 swings.",
    g_fit: "Stuff+ points added to our staff's median in his role.",
    g_verdict: "The verdict ranks him against the whole league projected at that ballpark: Elite = top 5%, Good = next 20%, Average = the middle, Avoid = bottom 15%.", whatIsVerdict: "How is it decided?",
    ivbShort: "Vertical break", hbShort: "Side break", whiffShort: "Whiff %", glossary: "What it means",
    pp_vert_pos_lose: "{P} rises {n} in less here", pp_vert_pos_gain: "{P} rises {n} in more here",
    pp_vert_neg_lose: "{P} drops {n} in less here", pp_vert_neg_gain: "{P} drops {n} in more here",
    pp_horiz_lose: "{P} breaks {n} in less sideways here", pp_horiz_gain: "{P} breaks {n} in more sideways here",
    pp_same: "{P} moves about the same here", pp_useLess: ": use it less", pp_useMore: ": lean on it",
    park_same: "The ball moves about the same as at sea level here.",
    park_lose: "The ball moves {pct}% less than at sea level here. Hurt the most: {p}.",
    ph_fit_plus: "Improves your {u} by {n}.", ph_fit_minus: "Sits {n} below your {u}.", ph_unit_rp: "bullpen", ph_unit_sp: "rotation",
    ph_alt_gain: "Gains {n} at altitude.", ph_alt_lose: "Loses {n} at altitude.", ph_alt_same: "Altitude barely affects him.",
    ph_here_gain: "Gains {n} at this ballpark.", ph_here_lose: "Loses {n} at this ballpark.", ph_here_same: "This ballpark barely affects him.",
    ph_best: "Best weapon: {p}.",
    smallSample: "Small sample", noStaffCompare: "No staff comparison",
    gameToday: "Today's game", gameNext: "Next game", gameLast: "Last game of the season",
    dataAsOf: "Data as of {v}", parkInOne: "This ballpark in one line", seriesGames: "Series games",
    bestHere: "The league's best at this ballpark", bestHereHint: "projected here. Tap one to see where to use him.",
    yourBullpen: "Your bullpen", bullpenEmpty: "The bullpen shows up once the data includes teams and player names.",
    noSchedule: "No schedule loaded.", goExplore: "See the map and schedule", seeInToday: "See in Today",
    opponent: "Opponent", venue: "Ballpark",
    whatIsStuff: "What is Stuff+?", faMissing: "{n} missing because the API returns at most {max} per request", navWhatIf: "What if…?", tryWhatIf: "Try in What if…?", seeDetail: "Details", showing: "Showing {n} of {total}", showMore: "Show more",
    faNoStaffNote: "There's no staff to compare with yet, so the verdict ranks his Stuff+ at Harp Helú against the league in his own role (starters vs. starters, relievers vs. relievers): Sign = top 5% (with {n}+ pitches), Promising = just as good but with fewer than {n} pitches, Watch = the next 20%.",
    faRuleNote: "Sign: improves the staff by {a} or more and sits in the top 25% of his role at home. Promising: meets Sign but with a small sample. Watch: improves it by 0 to {a}.",
    filters: "Filters", verdictCol: "Verdict", whyCol: "Why", nPitches: "Pitches on record",
    wiTitle: "What if…?", wiHint: "How a real pitcher would do at any ballpark in the league.",
    wiPark: "Ballpark", wiPickHint: "Search a pitcher or start with one of the best at this ballpark:",
    wiChange: "Change pitcher", wiStuffLine: "Stuff+ of {n} at {park}", wiVsSea: "vs. sea level", sameAsSea: "Same as at sea level",
    wiPitches: "Pitch by pitch", wiMovement: "Movement: sea level vs. this ballpark",
    wiLegendSea: "Sea level (outline)", wiLegendHere: "This ballpark (filled)", wiNumbers: "The numbers",
    wiStaff: "Against our staff", wiStaffLine: "{d} vs. the median of our {r}.",
    wiStaffNone: "The staff comparison shows up once the data includes teams.",
    lp_rise_less: "rises {n} in less", lp_rise_more: "rises {n} in more", lp_drop_less: "drops {n} in less", lp_drop_more: "drops {n} in more",
    lp_side_less: "breaks {n} in less sideways", lp_side_more: "breaks {n} in more sideways", lp_same: "moves about the same", lp_keeps: "Keeps {n}% of its movement",
    bestHereShort: "The best here", pitchHere: "His arsenal here", vsSeaShort: "{d} vs. sea level", close: "Close",
    leNote: "The bar shows how much movement each pitch keeps here (100% = sea level).", retry: "Try again",
    parksSimilar: "Performs about the same at all {n} ballparks ({a} to {b}): the park doesn't decide.",
    parksList: "See all 20 ballparks as a list",
    useAt: "Use him at", avoidAt: "Avoid him at", atHome: "At Harp Helú", altitudeHere: "At altitude (Harp Helú)",
    workloadAxis: "Pitches per outing", workloadLegend: "Color: ballpark altitude",
    rolePluralSP: "starters", rolePluralRP: "relievers", seaShort: "Sea", hereShort: "Here",
  },
} as const;

type Dict = typeof dict.es;
export type Key = { [K in keyof Dict]: Dict[K] extends string ? K : never }[keyof Dict];

type Vars = number | string | null | Record<string, number | string>;
type T = (k: Key, v?: Vars) => string;
const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: T; d: Dict; locale: string }>(null!);

/** "{v}" con un valor suelto, o "{p}", "{n}"… con un objeto. "{P}" pone la primera letra en mayúscula. */
function fill(s: string, v?: Vars): string {
  if (v === undefined || v === null) return s.replace("{v}", "");
  if (typeof v !== "object") return s.replace("{v}", String(v));
  return s.replace(/\{(\w+)\}/g, (m, k: string) => {
    const lower = k.toLowerCase();
    if (!(lower in v)) return m;
    const val = String(v[lower]);
    return k === lower ? val : val.charAt(0).toUpperCase() + val.slice(1);
  });
}

export const LOCALES: Record<Lang, string> = { es: "es-MX", en: "en-US" };

/** Fecha "YYYY-MM-DD" en el idioma de la app (sin corrimiento de zona horaria). */
export function fmtDate(lang: Lang, iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALES[lang], opts).format(new Date(y, m - 1, d));
}

export function fmtInt(lang: Lang, v: number): string {
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 }).format(v);
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("lang") as Lang) || "es"; } catch { return "es"; }
  });
  useEffect(() => {
    try { localStorage.setItem("lang", lang); } catch { /* storage unavailable */ }
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => ({
    lang, setLang, d: dict[lang] as Dict, locale: LOCALES[lang],
    t: ((k, v) => fill(dict[lang][k] as string, v)) as T,
  }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

export const PITCH_NAMES: Record<Lang, Record<string, string>> = {
  es: { "Four-Seam": "Recta 4 costuras", Sinker: "Sinker", Cutter: "Cutter", Slider: "Slider", Curveball: "Curva", Changeup: "Cambio", Splitter: "Splitter" },
  en: { "Four-Seam": "Four-seam", Sinker: "Sinker", Cutter: "Cutter", Slider: "Slider", Curveball: "Curveball", Changeup: "Changeup", Splitter: "Splitter" },
};
