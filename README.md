# Willy Linux Max 2

Distribución de Linux de escritorio construida desde cero sobre **Ubuntu 24.04 LTS (noble)** con **KDE
Plasma 5.27**, con identidad propia (logo del lobo, fondos, panel en dos tramos, arranque y instalador
marcados) y capa de compatibilidad para aplicaciones de Windows con Wine.

Este repositorio contiene **el sitio web del proyecto** y publica las **imágenes** en la sección de
*Releases*.

- Sitio publicado: <https://alex45tmc.github.io/willy-linux-max/>
- Imágenes y huellas: <https://github.com/ALEX45TMC/willy-linux-max/releases>

## Empezar

1. Descarga la imagen de la *Release* que te interese. La ISO se entrega partida en tres ficheros
   (`*.part1of3`, `*.part2of3`, `*.part3of3`) porque GitHub limita cada fichero de una release a 2 GiB.
2. Júntalos y verifica la huella antes de grabar:

   ```bash
   cat willy-linux-max-2-amd64.iso.part1of3 \
       willy-linux-max-2-amd64.iso.part2of3 \
       willy-linux-max-2-amd64.iso.part3of3 > willy-linux-max-2-amd64.iso
   sha256sum willy-linux-max-2-amd64.iso   # o: Get-FileHash .\willy-linux-max-2-amd64.iso -Algorithm SHA256
   ```

   La huella esperada está en el cuerpo de la *Release* y en `SHA256SUMS.txt`. Si no coincide, no grabes
   esa copia.
3. Graba la ISO en un USB de 8 GB o más (escritura cruda, no extracción de ficheros):

   ```bash
   sudo dd if=willy-linux-max-2-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
   ```

   En Windows vale Rufus en modo DD, o Ventoy.
4. Arranca, prueba la sesión live e instala desde el icono del escritorio.

La documentación completa (requisitos, entradas del menú de arranque, los ocho pasos del instalador, la
pestaña «Info», atajos de teclado y mantenimiento) está en el sitio: [documentacion.html](documentacion.html).

## Qué hay en este repositorio

| Ruta | Qué es |
|---|---|
| `index.html`, `capturas.html`, `aplicaciones.html`, `documentacion.html`, `descargas.html`, `ayuda.html`, `licencias.html` | Las páginas del sitio. |
| `assets/css/willy.css`, `assets/js/site.js` | Estilo (tema claro/oscuro) y comportamiento (visor de capturas, tabla de imágenes). |
| `assets/img/` | Capturas verificadas de la sesión live y arte de la marca. |
| `datos-iso.json` | Tamaños, fechas y huellas de las imágenes de la build. **No está escrito a mano.** |
| `generar-datos-iso.sh` | El guion que genera `datos-iso.json` leyendo el directorio de la build y su `SHA256SUMS`. |

## Ver y modificar el sitio localmente

```bash
python3 -m http.server 8099 --bind 127.0.0.1
# http://127.0.0.1:8099
```

Hace falta servir por HTTP (no abrir los `.html` con `file://`) para que la página de Descargas pueda leer
`datos-iso.json`.

## Estado del proyecto

Willy Linux Max 2 es un **trabajo de grado**. La instalación guiada hasta el final en un disco real de
hardware y la verificación visual de la pestaña «Info» en la sesión live están **pendientes de cerrar**;
el sitio lo dice en su propio [estado del proyecto](index.html#estado) en lugar de omitirlo.

## Licencia

- El trabajo propio del proyecto (guiones, layout del panel, módulo «Info», configuración del `skel`) está
  bajo **GPL-3.0**; ver `LICENSE`.
- Los fondos de pantalla y el arte del proyecto están bajo **CC-BY-SA-4.0**.
- El resto conserva la licencia de su autor: Ubuntu y sus paquetes, KDE Plasma, el tema Fluent (GPLv3),
  Wine (LGPL-2.1+), Firefox (MPL-2.0) y LibreOffice (MPL-2.0/LGPL-3.0). Google Chrome es propietario y se
  instala desde el repositorio oficial de Google durante la construcción.
- Detalle completo, incluidas las cuatro piezas que se quedaron fuera por licencia:
  [licencias.html](licencias.html).

`Willy Linux` no está afiliado con Microsoft, Canonical, KDE e.V., Mozilla ni Google. Wine no emula
Windows: ejecuta lo que su capa de compatibilidad permite ejecutar.
