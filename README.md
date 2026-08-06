# Email Link Extractor

Herramienta web estática (HTML + CSS + JS puro, sin dependencias) para extraer y auditar los enlaces `<a>` de un email HTML, pensada para flujos de trabajo de **Salesforce Marketing Cloud (SFMC)**.

Pega el HTML completo de un email y la herramienta detecta cada etiqueta `<a>`, muestra sus atributos clave y valida que el `alias` siga la nomenclatura esperada.

## Funciones

- **Extracción de enlaces**: analiza el HTML pegado y lista cada `<a>` encontrado con su `title`, `alias`, `href` y atributo `conversion`.
- **Validación de nomenclatura**: marca con un aviso ⚠️ los enlaces cuyo `alias` no empieza por `C_` o `N_`.
- **Prueba rápida de URL**: botón para abrir el enlace en una pestaña nueva (deshabilitado si la URL es AMPscript, p. ej. `%%view_email_url%%`, o si está vacía).
- **Copiar al portapapeles**: botón de copia individual para `title`, `alias` y `url` de cada tarjeta.
- **Filtros**: Todos, `C_`, `N_`, Sin alias, y Avisos (solo aparece si hay enlaces con nomenclatura incorrecta).
- **Exportar a CSV**: descarga en CSV solo los enlaces visibles según el filtro activo (columnas `#`, `title`, `alias`, `url`, `conversion`). El nombre del archivo incluye el filtro aplicado y la fecha.
- **Modo oscuro**: con preferencia guardada en `localStorage`.

## Uso

1. Abre `index.html` en el navegador (no requiere servidor ni build).
2. Pega el HTML del email en el textarea.
3. Pulsa **Extraer enlaces**.
4. Filtra los resultados y, si lo necesitas, exporta el conjunto filtrado a CSV con el botón **Exportar CSV**.

## Estructura del proyecto

```
├── index.html      # Marcado y estructura de la app
├── style.css       # Estilos (tema claro/oscuro vía CSS variables)
├── script.js       # Lógica de extracción, filtros, export y tema
└── favicon/        # Iconos y manifest de la app
```

## Stack

HTML, CSS y JavaScript vanilla. Sin frameworks, sin dependencias, sin proceso de build.
