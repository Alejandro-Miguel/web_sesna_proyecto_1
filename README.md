# Guías y documentos · prototipo unificado

Unifica en **un solo proyecto responsivo** las propuestas de la carpeta `v_1/`:

| Origen | Qué aporta | Dónde vive ahora |
|---|---|---|
| `Copia de Propuesta G · Número gigante` | 4 tarjetas de categoría con número gigante, ilustraciones animadas y marcador dorado en títulos | Vista 1 · `#view-home` |
| `Video A2 · Play + síntesis con desenfoque` (web) | Lista de documentos, reproductor en modal, síntesis con desenfoque | Vista 2 · `#view-detail` (≥ 641 px) |
| `Video A2 · Móvil` | Tarjetas apiladas | Vista 2 (≤ 640 px) |

Al tocar una tarjeta, **se despliega en su carpeta de documentos**: la nueva vista se revela desde el rectángulo exacto de la tarjeta, mientras el número, la ilustración y el título viajan a su nueva posición.

## Cómo verlo

Sírvelo con un servidor local, por ejemplo `python3 -m http.server`, y abre `http://localhost:8000`. Si abres `index.html` directamente (`file://`), el navegador bloquea las fuentes propias y verás las del sistema.

El sitio no tiene dependencias. Para producción, `node build.mjs` genera `dist/`: minifica el código, añade un hash a los nombres de archivo y precomprime todo (ver *Producción*).

## Estructura

```
index.html      Marcado de la Vista 1 (tarjetas + SVG) y de los dos modales
css/tokens.css  Paleta, tipografía, radios, sombras, curvas de movimiento
css/app.css     Componentes (índice numerado al inicio del archivo)
js/data.js      Contenido: categorías y documentos (única fuente de datos)
js/app.js       Router por hash, render de la carpeta, transiciones y modales
fonts/          Montserrat y Noto Sans (variables, subconjunto latino, woff2)
build.mjs       Compilación de producción → dist/
servidor/       Configuración de referencia: nginx.conf y .htaccess (Apache)
```

## Contenido

- Los **títulos reales** se conservan: las categorías y los 3 documentos de Video A2.
- Todo el **texto corrido es lorem ipsum** (descripciones y síntesis).
- También se conservan los textos de acción: *Te lo explicamos en video*, *Ver video*, *Síntesis*, *Descargar PDF*, *Resumen en video*, *Lectura de 1 minuto*…
- Los documentos con `placeholder: true` en `data.js` todavía **necesitan título real**.

## Sistema visual

- **Títulos:** Montserrat 800/900, color `--c-guinda-dark`, con el marcador dorado `.hl`. En la carpeta, el marcador se pinta de izquierda a derecha al abrirse.
- **Texto:** Noto Sans.
- **Acciones:** *Descargar PDF* = verde (`--c-verde`, acción principal) · *Ver video* = contorno guinda · *Síntesis* = guinda suave.
- Los valores casi duplicados entre propuestas se unificaron; la lista está en `tokens.css`.

## Rutas

- `#/` → categorías
- `#/contrataciones-publicas`, `#/conflicto-de-interes`, `#/verificacion-patrimonial`, `#/deporte` → carpeta

Los botones atrás/adelante del navegador funcionan, y los enlaces directos abren la carpeta correspondiente. Dentro de la carpeta, las pestañas permiten saltar a otra categoría sin volver.

## Animación y rendimiento

- **Tarjeta → carpeta:** usa la [View Transitions API](https://developer.mozilla.org/docs/Web/API/View_Transition_API) (`document.startViewTransition`). La animación trabaja sobre capturas compuestas en GPU; el `clip-path` parte de las variables `--vt-t/r/b/l` que calcula `setClipFrom()`. Si el navegador no la soporta, cambia de vista con un fundido.
- Todo lo que se anima en bucle o en hover usa **solo `transform` y `opacity`**. Por ejemplo, la barra dorada y la barra de progreso usan `scaleX` en lugar de `width`, y la sombra de hover es un pseudo‑elemento precalculado al que solo se le cambia la opacidad.
- **Personajes:** son los de la propuesta original (`v_1`, Propuesta G), rediseñados con mejor proporción: unas 6,3 cabezas de alto, cabeza unida al torso por el cuello, brazos de largo natural que salen del hombro, extremidades que se afinan, manos y zapatos con forma, y sin rostro. 01, 02 y 03 están de frente, como en el original; el corredor está de perfil. Cada articulación es un `<g>` con su `transform-origin` inline, y el CSS solo asigna la animación.
- **Escenas:** 01, escribe con la pluma mientras las líneas del documento se trazan, aparece la firma y cae el sello. 02, sostiene la balanza, que oscila con sus platillos mientras la cabeza sigue el movimiento. 03, revisa el portapapeles, donde se marcan las palomitas, mientras la lupa recorre la casa en un «8» y las monedas saltan. 04, el corredor con su dorsal, con un ciclo de zancada de `--run: .64s`.
- **Abanico de miniaturas (`.card__stack`):** en cada tarjeta, tres hojas pequeñas (documento, síntesis y video) sugieren el contenido sin mostrar datos. Las líneas son gradientes CSS y al pasar el cursor el abanico se abre.
- **Pausa fuera de pantalla:** un `IntersectionObserver` añade `.is-off` a tarjetas y documentos que salen del viewport, y así sus animaciones en bucle se congelan.
- El hover solo existe en `@media (hover: hover)`; en táctil, el globo *Te lo explicamos en video* aparece solo, en bucle suave.
- Con `prefers-reduced-motion` se desactivan los bucles y las transiciones, y los trazos quedan visibles.

## Modales

- Usan `<dialog>` nativo, que ya resuelve el foco atrapado, la tecla Esc y la capa superior.
- Siempre aparecen **centrados**, en web y en móvil.
- **El video es vertical (9:16).** En web se muestra el video a la izquierda y la ficha (título y acciones) a la derecha, centrada verticalmente; en móvil, el video arriba y la ficha abajo. La altura del reproductor se ajusta al alto de la pantalla y el ancho se calcula a partir de ella.
- Se cierran con Esc, con clic fuera o con el botón ✕. Desde *Síntesis* se puede ir a *Ver video*, y viceversa.

## Puntos de integración (pendientes)

1. **Video (vertical 9:16):** en `#dlg-video`, reemplaza `.player__center` por el `<iframe>` o `<video>` real usando `doc.video`, con `width: 100%; height: 100%` dentro de `.player` (para MP4, `object-fit: cover`). El botón de play/pausa y la barra `.prog` son simulados: conéctalos a la API del reproductor o quítalos.
2. **PDF:** en `app.js` §5 hay un interceptor que evita la descarga y muestra un aviso. Hay que eliminarlo; los enlaces ya reciben `doc.pdf`.
3. **Datos:** sustituye `js/data.js` por la respuesta del CMS o la API, con la misma forma de objeto.
4. **Video y CSP:** la CSP solo permite incrustar `youtube-nocookie.com` y `player.vimeo.com` (`frame-src`). Si usas otro proveedor, añádelo ahí; si usas MP4 de otro dominio, añádelo a `media-src`.

## Producción

```
node build.mjs          # genera dist/ (usa esbuild vía npx; solo en desarrollo)
```

- **Un solo CSS** (tokens y app unidos) y JS minificados. Los archivos llevan hash (`styles-G7A7L4QR.css`), así que se pueden guardar en caché un año sin riesgo de servir versiones viejas.
- **Precompresión:** cada archivo de texto va también en `.br` y `.gz`. El texto total pasa de 74,5 KB a 16,9 KB con brotli.
- **Fuentes propias:** dos woff2 variables (un archivo por familia cubre todos los pesos), precargadas y con `font-display: swap`. No hay peticiones a terceros.
- **Scripts con `defer`:** no bloquean el análisis del HTML.
- **Lighthouse** (móvil simulado, `dist/` servido con las cabeceras de `servidor/`): Rendimiento 100 · Accesibilidad 100 · Buenas prácticas 100 · SEO 100. FCP de 0,8 s y LCP de 1,4 s; antes eran 2,6 s en ambos.
- **Servidor:** `servidor/nginx.conf` y `servidor/.htaccess` configuran HTTPS obligatorio, compresión estática, `Cache-Control` (HTML `no-cache`, `assets/` con `immutable` de 1 año) y las cabeceras de seguridad.

## Seguridad

- **Content Security Policy estricta:** solo se ejecuta código del propio origen, sin `unsafe-inline` ni `eval` en scripts. Se bloquean `<object>`, `<base>` y el enmarcado del sitio (`frame-ancestors 'none'`). Va como cabecera HTTP y también como `<meta>`, por si se sirve sin cabeceras.
- **Trusted Types:** todo el HTML dinámico pasa por una única política (`app`, en `setHTML()`). Cualquier otra asignación a `innerHTML` la rechaza el navegador.
- **Escape de datos:** todo valor que viene de `data.js` o del CMS se escapa con `esc()` antes de insertarse en el HTML.
- **URLs seguras:** `safeUrl()` solo acepta rutas relativas, `http(s)` o anclas. Cualquier `javascript:`, `data:`, etc. se convierte en `#`.
- **Cabeceras:** HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (sin cámara, micrófono, geolocalización…), `Cross-Origin-Opener-Policy` y `Cross-Origin-Resource-Policy`.
- **Sin dependencias en tiempo de ejecución** y sin llamadas a terceros: no hay cadena de suministro que auditar en el sitio publicado.
- **Verificado:** se inyectaron datos maliciosos (`<img onerror>`, `<svg onload>`, `javascript:` en los PDF, comillas para romper atributos) y ninguno se ejecutó.
- **Pendiente del equipo de infraestructura:** certificado TLS, el dominio real en `server_name` y revisar la CSP si se añade analítica o un reproductor de otro proveedor.
