# APIs y scripts para correr todo

Esta carpeta tiene los dos APIs y los scripts que instalan y prenden todo el proyecto.

| Qué | Dónde | Puerto | Para qué |
|---|---|---|---|
| **API 1** | [`api/`](api/) | 8000 | Entrega los pitcheos y las constantes de carreras a los modelos y a la web app |
| **API 2** | [`api2/`](api2/) | 8001 | Guarda los resultados que suben los modelos |
| `instalar.sh` | aquí | | Instala todo, una vez por computadora |
| `iniciar_todo.sh` | aquí | | Prende los dos APIs y la web app |
| `correr_modelos.sh` | aquí | | Corre los dos modelos y sube sus resultados |
| `correr_notebook.py` | aquí | | Lo usa `correr_modelos.sh` para correr un notebook sin abrir Jupyter |

Los APIs **solo funcionan en tu computadora** (`localhost`) y piden una llave en cada consulta. Las llaves viven en archivos `.env`, que nunca se suben.

## 1. Preparar los datos (una vez)

Crea la carpeta `~/Desktop/hackathon/`, **fuera del repo**, con estos dos archivos:

- `stuff_model_df.pkl`: el dataset de la competencia
- `RunValueEvents.csv`: las constantes wOBA de FanGraphs (Guts!)

Si quieres usar otra carpeta: `DATOS=/otra/carpeta bash apis/instalar.sh`

## 2. Instalar

```bash
bash apis/instalar.sh
```

- Crea el entorno `.venv` con Python 3.11 o más nuevo.
- Genera las llaves de los dos APIs y se las pasa a la web app.
- Convierte el pickle a Parquet.
- Corre las pruebas de los dos APIs.
- Al final revisa que git no vea ningún archivo de datos ni de llaves.

## 3. Prender todo

```bash
bash apis/iniciar_todo.sh
```

Prende el API 1, el API 2 y la web app, y abre **http://localhost:8002**. Con **Ctrl+C** se apagan los tres. Si algo falla, los mensajes quedan en `apis/logs/`.

Mientras ningún modelo haya subido resultados, la web app usa un **Stuff+ provisional** y lo dice en el encabezado.

## 4. Correr los modelos

Con todo prendido, en **otra** Terminal:

| Comando | Qué corre |
|---|---|
| `bash apis/correr_modelos.sh` | Los dos modelos |
| `bash apis/correr_modelos.sh 06` | Solo Stuff+ |
| `bash apis/correr_modelos.sh 03` | Solo BayesBall |

- La primera vez instala lo que necesitan los modelos (`modelos/requirements.txt`).
- Corre cada notebook completo. Cada uno pide los pitcheos al API 1, sube sus tablas al API 2 y recarga la web app.
- **No modifica los notebooks del repo.** La copia con las salidas queda en `apis/logs/`, que git ignora.
- Los resultados se guardan en `~/Desktop/hackathon/resultados_api2/`. La próxima vez que prendas todo ya no hace falta volver a correr los modelos.
Para saber qué hace cada modelo, ve [`modelos/README.md`](../modelos/README.md).

## Puertos y llaves

| Servicio | Puerto | Llave | Dónde está la llave |
|---|---|---|---|
| API 1 | 8000 | `API_KEY` | `apis/api/.env` |
| API 2 (lectura) | 8001 | `API_KEY` | `apis/api2/.env` |
| API 2 (escritura) | 8001 | `API_KEY_ESCRITURA` | `apis/api2/.env` |
| Web app | 8002 | No usa | |

`instalar.sh` crea los tres `.env` (los dos de aquí y el de `webapp/backend/`) a partir de sus `.env.example`.

## Si algo falla

- **"Primero corre: bash apis/instalar.sh"**: falta el `.venv` o el `.env` del API 1.
- **"El API 2 está apagado"**: prende todo con `iniciar_todo.sh` en otra Terminal antes de correr los modelos.
- **Un puerto ocupado**: ya hay algo corriendo en el 8000, 8001 u 8002. Ciérralo o reinicia la Terminal.
- **Cualquier otro error**: revisa los archivos de `apis/logs/`.
