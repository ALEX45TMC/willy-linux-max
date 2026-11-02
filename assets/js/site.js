/* Willy Linux Max — comportamiento del sitio */
(function () {
  'use strict';

  // Tema claro/oscuro (recuerda la elección en localStorage)
  var raiz = document.documentElement;
  var guardado = null;
  try { guardado = localStorage.getItem('willy-tema'); } catch (e) { /* sin almacenamiento */ }
  if (guardado === 'claro' || guardado === 'oscuro') raiz.setAttribute('data-tema', guardado);

  function alternarTema() {
    var nuevo = raiz.getAttribute('data-tema') === 'claro' ? 'oscuro' : 'claro';
    raiz.setAttribute('data-tema', nuevo);
    try { localStorage.setItem('willy-tema', nuevo); } catch (e) { /* nada */ }
    var boton = document.querySelector('button.tema');
    if (boton) boton.textContent = nuevo === 'claro' ? 'Tema: claro' : 'Tema: oscuro';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var boton = document.querySelector('button.tema');
    if (boton) {
      boton.textContent = raiz.getAttribute('data-tema') === 'claro' ? 'Tema: claro' : 'Tema: oscuro';
      boton.addEventListener('click', alternarTema);
    }

    marcarPaginaActual();
    montarVisor();
    cargarIsos();
    firmarAnio();
  });

  // Enlace actual del menú
  function marcarPaginaActual() {
    var aqui = location.pathname.split('/').pop() || 'index.html';
    var enlaces = document.querySelectorAll('nav.principal a');
    for (var i = 0; i < enlaces.length; i++) {
      var destino = enlaces[i].getAttribute('href').split('/').pop();
      if (destino === aqui) enlaces[i].setAttribute('aria-current', 'page');
    }
  }

  // Visor de capturas a pantalla completa
  function montarVisor() {
    var visor = document.getElementById('visor');
    if (!visor) return;
    var img = visor.querySelector('img');
    var pie = visor.querySelector('p');
    var miniaturas = document.querySelectorAll('.galeria img, .hero .captura img');
    for (var i = 0; i < miniaturas.length; i++) {
      miniaturas[i].addEventListener('click', function (ev) {
        var nodo = ev.currentTarget;
        var figura = nodo.closest('figure');
        img.src = nodo.getAttribute('data-amplia') || nodo.src;
        img.alt = nodo.alt;
        pie.textContent = figura
          ? figura.querySelector('figcaption').textContent.trim()
          : nodo.alt;
        visor.classList.add('abierto');
      });
    }
    visor.addEventListener('click', function () { visor.classList.remove('abierto'); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') visor.classList.remove('abierto');
    });
  }

  // Tabla de ISOs: se lee del JSON que genera generar-datos-iso.sh.
  // Nunca hay tamaños ni sha256 escritos a mano en el HTML.
  function cargarIsos() {
    var cont = document.getElementById('estado-iso');
    if (!cont) return;
    fetch('datos-iso.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (datos) {
        pintarIsos(datos);
        pintarPublicacion(datos.publicacion);
      })
      .catch(function () {
        cont.innerHTML = '<div class="aviso ad"><b>Todavía no hay un <code>datos-iso.json</code> legible.</b> ' +
          'Se genera con <code>bash generar-datos-iso.sh</code> junto al ISO. Si estás viendo este sitio ' +
          'abierto como fichero local (<code>file://</code>), el navegador no puede leer el JSON: ' +
          'sirve la carpeta con un pequeño servidor HTTP.</div>';
      });
  }

  // Bloque de descarga: sale de datos-publicacion.json, metido dentro de datos-iso.json
  // por el mismo guion. Si no hay publicación, se dice en vez de dejar la página en silencio.
  function pintarPublicacion(pub) {
    var cont = document.getElementById('publicacion-iso');
    if (!cont) return;
    if (!pub || !pub.trozos || !pub.trozos.length) {
      cont.innerHTML = '<div class="aviso ad"><b>Esta edición todavía no está publicada.</b> La página se ' +
        'rellena sola en cuanto <code>datos-publicacion.json</code> traiga la Release con sus trozos y huellas.</div>';
      return;
    }
    var html = '<div class="aviso"><b>Publicada en GitHub como <code>' + esc(pub.etiqueta) + '</code></b> el ' +
      esc(pub.publicada) + '. ' + esc(pub.motivo_partido) + '</div>';

    html += '<div class="botones">';
    for (var i = 0; i < pub.trozos.length; i++) {
      var t = pub.trozos[i];
      html += '<a class="boton" href="' + esc(t.url) + '">Trozo ' + (i + 1) + ' de ' + pub.trozos.length +
        ' · ' + esc(t.tamaño_legible) + '</a>';
    }
    html += '<a class="boton secundario" href="' + esc(pub.sums_url) + '">SHA256SUMS.txt</a>';
    html += '<a class="boton secundario" href="' + esc(pub.url_release) + '">Ficha de la Release</a>';
    html += '</div>';

    html += '<div class="tabla"><table><thead><tr><th>Trozo</th><th>Peso</th><th>sha256 del trozo</th></tr></thead><tbody>';
    for (var j = 0; j < pub.trozos.length; j++) {
      var p = pub.trozos[j];
      html += '<tr><td><a href="' + esc(p.url) + '"><code>' + esc(p.nombre) + '</code></a></td>' +
        '<td>' + esc(p.tamaño_legible) + '<br><span class="sub">' + esc(p.bytes) + ' bytes</span></td>' +
        '<td><code>' + esc(p.sha256) + '</code></td></tr>';
    }
    html += '</tbody></table></div>';

    html += '<h3>Juntarlos</h3><pre>cat ' + esc(pub.iso.archivo) + '.part1of3 \\\n' +
      '    ' + esc(pub.iso.archivo) + '.part2of3 \\\n' +
      '    ' + esc(pub.iso.archivo) + '.part3of3 \\\n' +
      '    > ' + esc(pub.iso.archivo) + '\n' +
      'sha256sum ' + esc(pub.iso.archivo) + '\n' +
      '#  ' + esc(pub.iso.sha256) + '</pre>';

    html += '<div class="aviso"><b>' + esc(pub.comprobado) + '</b> La huella del ISO completo es ' +
      '<code>' + esc(pub.iso.sha256) + '</code> (' + esc(pub.iso.bytes) + ' bytes). ' +
      'En Windows, desde PowerShell: <code>cmd /c copy /b ' + esc(pub.iso.archivo) + '.part1of3 + ' +
      esc(pub.iso.archivo) + '.part2of3 + ' + esc(pub.iso.archivo) + '.part3of3 ' + esc(pub.iso.archivo) +
      '</code> y después <code>Get-FileHash .' + '\\' + esc(pub.iso.archivo) + ' -Algorithm SHA256</code>.</div>';

    html += '<p class="sub">Repo del proyecto: <a href="' + esc(pub.url_repo) + '"><code>' + esc(pub.repo) +
      '</code></a> · Incidencias: <a href="' + esc(pub.url_incidencias) + '">abrir un reporte</a></p>';
    cont.innerHTML = html;
  }

  function pintarIsos(datos) {
    var cont = document.getElementById('estado-iso');
    var html = '';
    if (datos.aviso) {
      html += '<div class="aviso ad"><b>Nota de la build:</b> ' + esc(datos.aviso) + '</div>';
    }
    var principal = datos.iso_principal;
    if (principal) {
      html += '<div class="iso-card"><h3>' + esc(principal.archivo) + '</h3><dl>' +
        fila('Producto', principal.version) +
        fila('Tamaño', principal.tamaño_legible + ' (' + principal.bytes + ' bytes)') +
        fila('Compilada (UTC)', principal.compilada) +
        fila('sha256', principal.sha256) +
        fila('Contenido', principal.notas) +
        '</dl></div>';
    } else {
      html += '<div class="aviso peligro"><b>No hay imagen entregada</b> en el directorio de la build en el ' +
        'momento de generar estos datos. Mientras se quema un ISO, el fichero del entregable puede no estar.</div>';
    }
    var retiradas = datos.retiradas || [];
    if (retiradas.length) {
      html += '<h3>Imágenes retiradas (' + retiradas.length + ')</h3>' +
        '<p class="sub">Se guardan como histórico de la build: al entregar una imagen nueva, la anterior se ' +
        'renombra con la fecha en que dejó de estar vigente en lugar de borrarse. Sirven para comparar ' +
        'ediciones, no para instalar.</p><div class="tabla"><table><thead><tr>' +
        '<th>Fichero</th><th>Tamaño</th><th>Última modificación</th><th>sha256</th></tr></thead><tbody>';
      for (var i = 0; i < retiradas.length; i++) {
        var iso = retiradas[i];
        html += '<tr><td><code>' + esc(iso.archivo) + '</code></td>' +
          '<td>' + esc(iso.tamaño_legible) + '</td>' +
          '<td>' + esc(iso.compilada) + '</td>' +
          '<td><code>' + esc(iso.sha256) + '</code></td></tr>';
      }
      html += '</tbody></table></div>';
    }
    if (principal && principal.sha256 && principal.sha256.indexOf('sin firmar') === -1) {
      html += '<div class="aviso"><b>Cómo verificar la descarga.</b> Calcula la huella del fichero y ' +
        'compárala con la de arriba: <code>sha256sum willy-linux-max-2-amd64.iso</code> en Linux, ' +
        '<code>Get-FileHash .\\willy-linux-max-2-amd64.iso -Algorithm SHA256</code> en PowerShell. ' +
        'Si difiere, no la uses: la copia está incompleta o sustituida.</div>';
    }
    html += '<p class="sub">Estos datos los genera <code>generar-datos-iso.sh</code> leyendo el directorio de ' +
      'la build y su fichero <code>SHA256SUMS</code>, y se escriben en <code>datos-iso.json</code>. ' +
      'Última generación: <b>' + esc(datos.generado || 'sin registrar') + '</b>. ' +
      'Ni tamaños ni huellas están escritos a mano en la página.</p>';
    cont.innerHTML = html;
  }

  function fila(titulo, valor) {
    return '<dt>' + esc(titulo) + '</dt><dd>' + esc(valor == null ? '—' : valor) + '</dd>';
  }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function firmarAnio() {
    var nodos = document.querySelectorAll('[data-anio]');
    for (var i = 0; i < nodos.length; i++) nodos[i].textContent = new Date().getFullYear();
  }
})();
