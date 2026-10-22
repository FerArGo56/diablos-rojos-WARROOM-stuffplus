# Modelos

Los dos modelos del proyecto. Cada uno es un notebook que pide los pitcheos al [API 1](../apis/api/) y, en su último paso, sube sus resultados al [API 2](../apis/api2/) para que la web app los use.

| Modelo | Carpeta | Qué mide |
|---|---|---|
| **Stuff+** | [`stuff_plus/`](stuff_plus/) | La calidad de cada pitcheo (Stuff+, Location+ y Pitching+) y cómo cambia con la altitud |
| **BayesBall** | [`bayesball/`](bayesball/) | La probabilidad de whiff (swing y fallo) según qué tan fácil es "leer" un pitcheo en altitud |

`requirements.txt` tiene lo que necesitan los dos. Se instala solo con `bash apis/correr_modelos.sh`.

## Cómo correrlos

**Lo fácil:** con todo prendido (`bash apis/iniciar_todo.sh`), en otra Terminal desde la raíz del repo:

| Comando | Qué corre |
|---|---|
| `bash apis/correr_modelos.sh` | Los dos |
| `bash apis/correr_modelos.sh 06` | Solo Stuff+ |
| `bash apis/correr_modelos.sh 03` | Solo BayesBall |

**A mano:** abre el notebook en Jupyter, con los APIs prendidos, y córrelo completo.

Los dos notebooks piden los datos al API 1, así que necesitan los APIs prendidos. Nunca leen los archivos de la competencia directamente.

---

## Stuff+ · `stuff_plus/`

| Archivo | Qué es |
|---|---|
| `StuffPlus.ipynb` | El modelo completo |
| `entrenados/` | Se crea sola la primera vez que corres el notebook. Guarda los modelos entrenados **en tu compu** y no se sube al repo |

> **La primera vez, Stuff+ tarda unos 30–40 minutos.** El notebook entrena 30 modelos XGBoost y los guarda en `entrenados/`. Las siguientes veces los carga de ahí y tarda unos segundos.

**Qué hace.** Calcula el valor en carreras de cada pitcheo y entrena modelos XGBoost en tres capas:

- **Stuff+:** solo la física del pitcheo (velocidad, movimiento, spin, punto de salida).
- **Location+:** solo dónde cae.
- **Pitching+:** las dos cosas juntas.

Después califica el mismo pitcheo en los tres niveles de altitud del dataset (`No Altitude`: 0–700 m, `Medium Altitude`: 800–1,600 m y `Extreme Altitude`: 1,800 m o más) para medir el efecto de la altitud.

| Paso | Qué hace |
|---|---|
| 0 | Configuración y carga de datos desde el API 1 |
| 1 | Valor en carreras de cada pitcheo, según el conteo |
| 2 | Variables físicas, de arsenal y de contexto |
| 3 | Variable objetivo: 5 resultados posibles + calidad de la bola en juego |
| 4 | Entrenamiento XGBoost con *pitcher holdout* |
| 5 | Carreras esperadas (xRV) y escala 100 + 10·z |
| 6 | Validación: contra un modelo nulo, estabilidad, *season holdout*, calibración por altitud y SHAP |
| 7 | Efecto altitud: el mismo pitcheo en cada nivel |
| 8 | Resultados por pitcher y por arsenal |
| 9 | Sube los resultados al API 2 |

**La carpeta `entrenados/`.** El Paso 4 guarda ahí los 30 modelos (`.json`) y sus predicciones (`*_oof.npz`), y el Paso 6 guarda la prueba por temporada (`season_holdout.csv`). Si los encuentra, no vuelve a entrenar. Para entrenar de cero otra vez, pon `REENTRENAR = True` en el Paso 0.

No se sube al repo porque pesa unos 180 MB y las predicciones son datos derivados de la competencia.

**¿Te dieron los modelos ya entrenados?** Copia todo su contenido a `modelos/stuff_plus/entrenados/` antes de correr el notebook y no tendrás que esperar los 40 minutos.

**Versiones.** Para subir una versión nueva, cambia `VERSION_MODELO` en el Paso 9. La anterior queda en el historial del API 2.

**Tablas que sube:**
- `stuff_plus_por_pitcher_tipo`: el Stuff+ en `No Altitude`, `Medium Altitude` y `Extreme Altitude`.
- `validacion`: las métricas del Paso 6.

---

## BayesBall · `bayesball/`

| Archivo | Qué es |
|---|---|
| `BayesBall.ipynb` | El modelo completo |
| `bayesian_resolvability.py` | Las funciones del modelo, que el notebook importa |

**Qué hace.** Basado en el paper *Bayesball* (bioRxiv): el bateador "predice" el movimiento de un pitcheo según lo que espera de ese tipo de pitcheo. En altitud el pitcheo se mueve distinto, y eso cambia qué tan fácil es leerlo. Usa una regresión logística interpretable para estimar P(whiff) con un *resolvability score* bayesiano. Entrena en menos de un minuto.

| Sección | Qué hace |
|---|---|
| 1 | Carga de datos desde el API 1 |
| 2 | Variables bayesianas (movimiento esperado y resolvabilidad) |
| 3 | Entrenamiento (regresión logística) |
| 4 | Matriz de confusión y curva ROC |
| 5 | Penalización perceptual del slider en altitud |
| 6 | Conclusiones |
| 7 | Sube los resultados al API 2 |

**Versiones.** Para subir una versión nueva, cambia `VERSION_BAYES` en la sección 7.

**Tablas que sube:**
- `bayesball_por_pitcher_tipo`: P(whiff) de cada pitcher × temporada × tipo en `No Altitude`, `Medium Altitude` y `Extreme Altitude`.
- `bayesball_validacion`: AUC, log loss y penalización perceptual.

---

## Reglas para los notebooks

- **Antes de cada commit, borra las salidas** (Kernel → Restart & Clear Output). Muestran tablas sacadas de los datos.
- **Nada de rutas con tu nombre de usuario** (`/Users/<nombre>/...`). Los notebooks ya encuentran el repo solos y piden los datos al API 1.
- El formato exacto de las tablas que espera la web app está en [`webapp/CONTRATO_API2.md`](../webapp/CONTRATO_API2.md). Si una tabla cumple ese formato, la web app la usa sin cambiar código.
