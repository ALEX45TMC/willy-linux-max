#!/bin/bash
# Genera web/datos-iso.json a partir de los ISOs que hay en iso/.
# Nadie escribe tamaños ni sha256 a mano en el HTML: la tabla del sitio sale de aquí,
# así que no puede quedarse desfasada ni decir una huella inventada.
#
#   bash generar-datos-iso.sh            # usando ../iso respecto al guion
#   bash generar-datos-iso.sh /ruta/iso  # otro directorio de ISOs
set -euo pipefail

GUION="$(readlink -f "$0")"
WEB="$(dirname "$GUION")"
PROYECTO="$(dirname "$WEB")"
ISO_DIR="${1:-$PROYECTO/iso}"
SALIDA="$WEB/datos-iso.json"
SUMS="$ISO_DIR/SHA256SUMS"

[ -d "$ISO_DIR" ] || { echo "no existe $ISO_DIR" >&2; exit 1; }

# Marca: se lee del propio guion de la build, no se duplica el literal.
NOMBRE="$(sed -n 's/^NOMBRE="\(.*\)"/\1/p' "$PROYECTO/capa-marca.sh" | head -1)"
VERSION="$(sed -n 's/^VERSION="\(.*\)"/\1/p' "$PROYECTO/capa-marca.sh" | head -1)"
NOMBRE="${NOMBRE:-Willy Linux Max}"
VERSION="${VERSION:-2}"

# La build puede estar quemando justo ahora: si hay un capa-live.sh vivo, lo decimos.
QUEMANDO="$(pgrep -f 'capa-live.sh' >/dev/null 2>&1 && echo si || echo no)"
AVISO=""
if [ "$QUEMANDO" = si ]; then
  AVISO="Hay un quemado en curso (capa-live.sh corriendo). Los datos de abajo son los del momento de generar este fichero; vuelve a correr el guion cuando termine."
fi

lee_sha() {  # $1 = nombre de fichero; busca en SHA256SUMS
  [ -f "$SUMS" ] || return 0
  awk -v n="$1" '$2==n || $2=="*"$n {print $1; exit}' "$SUMS"
}

legible() {  # bytes -> GiB con dos decimales (numfmt no está garantizado en los dos shells)
  awk -v b="$1" 'BEGIN{printf "%.2f GB", b/1000000000}'
}

esc() {  # JSON básico: basta con backslash y comilla, las rutas no llevan control
  sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

PRINCIPAL="$ISO_DIR/willy-linux-max-2-amd64.iso"
FILA_PRINCIPAL=""
HISTORIAL=""

if [ -f "$PRINCIPAL" ]; then
  TAM="$(stat -c %s "$PRINCIPAL")"
  FECHA="$(date -u -d @"$(stat -c %Y "$PRINCIPAL")" +%Y-%m-%dT%H:%M:%SZ)"
  SHA="$(lee_sha willy-linux-max-2-amd64.iso)"
  [ -n "$SHA" ] || SHA="sin firmar: falta la linea en iso/SHA256SUMS"
  FILA_PRINCIPAL="$(printf '{"archivo":"%s","version":"%s","bytes":%s,"tamaño_legible":"%s","compilada":"%s","sha256":"%s","notas":"%s"}' \
    "willy-linux-max-2-amd64.iso" "$VERSION" "$TAM" "$(legible "$TAM")" "$FECHA" "$SHA" \
    "Imagen hibrida live + instalador, para USB. Contiene el sistema completo descrito en esta pagina.")"
fi

for f in "$ISO_DIR"/*.anterior-*.iso; do
  [ -e "$f" ] || continue
  b="$(basename "$f")"
  t="$(stat -c %s "$f")"
  d="$(date -u -d @"$(stat -c %Y "$f")" +%Y-%m-%d)"
  s="$(lee_sha "$b")"
  [ -n "$s" ] || s="retirada, sin firma registrada"
  HISTORIAL="${HISTORIAL}${HISTORIAL:+,}{\"archivo\":\"$(esc <<<"$b")\",\"bytes\":$t,\"tamaño_legible\":\"$(legible "$t")\",\"compilada\":\"$d\",\"sha256\":\"$(esc <<<"$s")\"}"
done

printf '{\n  "producto": "%s",\n  "version": "%s",\n  "generado": "%s",\n  "aviso": "%s",\n  "iso_principal": %s,\n  "retiradas": [%s]\n}\n' \
  "$NOMBRE" "$VERSION" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(esc <<<"$AVISO")" \
  "${FILA_PRINCIPAL:-null}" "$HISTORIAL" > "$SALIDA.tmp"
mv -f "$SALIDA.tmp" "$SALIDA"

python3 -c "import json,sys; json.load(open(sys.argv[1], encoding='utf-8')); print('  JSON valido')" "$SALIDA" 2>/dev/null \
  || echo "  AVISO: no se pudo validar el JSON (python3 no disponible)"
echo "  escrito $SALIDA"
