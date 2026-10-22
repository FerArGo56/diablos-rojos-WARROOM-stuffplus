# API 1 · Pitcheos y valor en carreras

Entrega por HTTP los ~635,000 pitcheos de la competencia y las constantes de carreras de FanGraphs, a los modelos y a la web app. Es lo único que lee la carpeta de datos. **Solo da datos de entrada:** lo que producen los modelos va al [API 2](../api2/).

Puerto **8000** · FastAPI + Polars.

> **Lo normal es no hacer nada de esto a mano.** `bash apis/instalar.sh` y `bash apis/iniciar_todo.sh` lo hacen todo (ver [`apis/README.md`](../README.md)). Esta página es la referencia por si algo falla.

## Archivos

| Archivo | Qué es |
|---|---|
| `main.py` | El API |
| `cliente.py` | Los clientes de Python de los dos APIs: `ClienteAPI1` (leer datos) y `ClienteAPI2` (subir resultados). Lo usan los notebooks y la web app |
| `convertir_pickle.py` | Convierte `stuff_model_df.pkl` a Parquet, una sola vez |
| `test_api.py` | 10 pruebas automáticas |
| `iniciar.sh` | Prende solo este API |
| `.env.example` | Plantilla de la configuración. El `.env` real nunca se sube |
| `requirements.txt` | Dependencias |

## Configuración (`.env`)

| Variable | Qué es |
|---|---|
| `API_KEY` | La llave, mínimo 12 caracteres |
| `DATOS_DIR` | La carpeta con `stuff_model_df.parquet` y `RunValueEvents.csv`. Por defecto `~/Desktop/hackathon` |

## Rutas

Todas piden la llave en el encabezado `X-API-Key`, menos `/salud`.

| Ruta | Devuelve |
|---|---|
| `GET /salud` | Si el servidor está prendido |
| `GET /constantes/carreras` | Los pesos wOBA y el valor de cada evento en carreras |
| `GET /columnas` | Las columnas del dataset y su tipo |
| `GET /pitcheos/resumen` | Cuántos pitcheos hay por temporada y altitud |
| `GET /pitcheos` | Pitcheos en JSON, por páginas (`limit`, `offset`) |
| `GET /pitcheos/descargar` | Pitcheos como archivo Parquet o CSV |
| `GET /pitchers` | La lista de pitchers |

**Filtros:** `year`, `pitcher`, `tipo`, `altitud` (`No Altitude`: 0–700 m, `Medium Altitude`: 800–1,600 m, `Extreme Altitude`: 1,800 m o más) y `columnas` (separadas por coma).

**¿JSON o descargar?** JSON para consultas chicas. Descargar en Parquet para miles de renglones: el dataset completo llega en unos 8 segundos.

Para probar las rutas en el navegador: **http://localhost:8000/docs** → botón **Authorize** → pega la llave → abre una ruta → **Try it out** → **Execute**.

## Usarlo desde Python

```python
from cliente import ClienteAPI1

api = ClienteAPI1("http://localhost:8000", "TU_LLAVE")
df = api.pitcheos()                                    # todo el dataset, en Polars
pitcher = api.pitcheos(pitcher="pitcher_00386", year=2025)
VALOR_EVENTO = api.valor_evento()                      # constantes de FanGraphs en carreras
```

Los notebooks de `modelos/` ya encuentran `cliente.py` solos. Para no escribir la llave en el código, usa las variables de entorno `API1_URL` y `API1_KEY` y crea el cliente sin argumentos: `ClienteAPI1()`.

## Correrlo a mano

```bash
cd apis/api
python3 -m pip install -r requirements.txt
cp .env.example .env               # y pon tu API_KEY
python3 convertir_pickle.py        # una sola vez; necesita pandas y pyarrow
./iniciar.sh                       # o ./iniciar.sh red para la misma Wi-Fi
python3 -m pytest -v               # las 10 pruebas deben pasar
```

Para generar una llave: `python3 -c "import secrets; print(secrets.token_urlsafe(24))"`

## Notas sobre los datos

- Los vacíos son `null` de Polars. Los `NaN` de pandas se convirtieron a `null` al pasar a Parquet.
- `valor_evento` es el peso wOBA dividido entre la wOBAScale (carreras respecto a un out). Por decisión del proyecto, `Error` vale como `Single`, y `Sacrifice` y `FieldersChoice` valen como `Out`.
