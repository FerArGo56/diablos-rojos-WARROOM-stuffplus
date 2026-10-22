# API 2 · Resultados de los modelos

Los modelos **suben** aquí sus tablas de resultados y la web app las **lee**. No calcula nada: solo guarda y entrega.

Puerto **8001** · FastAPI + Polars.

> **Lo normal es no hacer nada de esto a mano.** `bash apis/instalar.sh` y `bash apis/iniciar_todo.sh` lo hacen todo (ver [`apis/README.md`](../README.md)). Esta página es la referencia por si algo falla.

## Archivos

| Archivo | Qué es |
|---|---|
| `main.py` | El API |
| `migrar_resultados.py` | Sube de una vez tablas que ya tengas en una carpeta (`.csv` o `.parquet`) |
| `test_api.py` | 13 pruebas automáticas |
| `iniciar.sh` | Prende solo este API |
| `.env.example` | Plantilla de la configuración. El `.env` real nunca se sube |
| `requirements.txt` | Dependencias |

El cliente de Python (`ClienteAPI2`) está en [`../api/cliente.py`](../api/cliente.py), junto al del API 1.

## Dos llaves

| Llave | Quién la usa | Qué puede hacer |
|---|---|---|
| `API_KEY` (lectura) | La web app | Leer tablas |
| `API_KEY_ESCRITURA` | Los notebooks de los modelos | Leer, **subir y borrar** tablas |

Así la web app no puede borrar resultados por error. Las dos van en el encabezado `X-API-Key` y tienen que ser distintas.

## Configuración (`.env`)

| Variable | Qué es |
|---|---|
| `API_KEY` | Llave de lectura, mínimo 12 caracteres |
| `API_KEY_ESCRITURA` | Llave de escritura, distinta a la de lectura |
| `RESULTADOS_DIR` | Dónde se guardan las tablas, fuera del repo. Por defecto `~/Desktop/hackathon/resultados_api2` |

## Cómo guarda las tablas

- Cada tabla es un archivo `.parquet` en `RESULTADOS_DIR`, y `_metadatos.json` dice quién la subió, con qué versión y cuándo.
- **Subir una tabla con un nombre que ya existe la reemplaza.** La versión anterior se mueve a `historial/`, así que nada se pierde.
- Si apagas y prendes el API, todo sigue ahí.

## Rutas

| Ruta | Llave | Qué hace |
|---|---|---|
| `GET /salud` | Ninguna | Estado y lista de tablas |
| `GET /resultados` | Lectura | Todas las tablas, con modelo, versión y fecha |
| `GET /resultados/{tabla}` | Lectura | Una tabla en JSON, por páginas (`limit`, `offset`) |
| `GET /resultados/{tabla}/descargar` | Lectura | Una tabla como Parquet o CSV |
| `POST /resultados/{tabla}?modelo=...&version=...` | Escritura | Sube o reemplaza una tabla (el cuerpo es un Parquet) |
| `DELETE /resultados/{tabla}` | Escritura | Deja de servir la tabla y la mueve a `historial/` |

**Filtros de lectura** (los mismos que el API 1): `year`, `pitcher`, `tipo`, `altitud` y `columnas`.

## Subir resultados desde Python

```python
from cliente import ClienteAPI2

api2 = ClienteAPI2("http://localhost:8001", "LLAVE_DE_ESCRITURA")
api2.subir("stuff_plus_por_pitcher_tipo", tabla, modelo="stuff_plus", version="v1")
api2.tablas()      # qué hay, quién lo subió, versión y fecha
```

- **Nombre de tabla:** solo minúsculas, números y `_`.
- **`version`** es una etiqueta que tú eliges para saber qué versión del modelo generó la tabla. Puede ser cualquier texto: `v1`, `v2`, una fecha… Cuando subes una versión nueva, la anterior queda guardada en `historial/` con su etiqueta.
- Los dos notebooks de `modelos/` ya lo hacen solos en su último paso. Qué tablas y columnas espera la web app está en [`webapp/CONTRATO_API2.md`](../../webapp/CONTRATO_API2.md).

## Correrlo a mano

```bash
cd apis/api2
python3 -m pip install -r requirements.txt
cp .env.example .env               # y pon las dos llaves
./iniciar.sh                       # o ./iniciar.sh red para la misma Wi-Fi
python3 -m pytest -v               # las 13 pruebas deben pasar
```

Las pruebas usan una carpeta temporal y llaves de prueba: no tocan tus resultados ni tu `.env`.
