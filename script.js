 function copyValue(btn) {
    // En lugar de buscar el elemento anterior, buscamos el input específico dentro de la misma fila
    const input = btn.parentElement.querySelector('.field-input');
    
    // Usamos select y execCommand para evitar bloqueos de portapapeles en ciertos entornos
    input.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();

    btn.textContent = '✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋';
      btn.classList.remove('copied');
    }, 900);
  }

  function extractLinks() {
    const html    = document.getElementById('source').value.trim();
    const results = document.getElementById('results');
    const wrapper = document.getElementById('results-wrapper');
    const empty   = document.getElementById('empty-state');
    const counter = document.getElementById('results-count');

    results.innerHTML = '';
    wrapper.style.display = 'none';
    empty.classList.remove('visible');
    renderAssetBox([]);

    if (!html) return;

    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    const links  = doc.querySelectorAll('a');

    if (!links.length) {
      empty.classList.add('visible');
      return;
    }

    let warningCount = 0;
    const assetNames = [];
    wrapper.style.display = 'block';

    links.forEach((link, i) => {
      const title = link.getAttribute('title') || '';
      const alias = link.getAttribute('alias') || '';
      const url   = link.getAttribute('href')  || '';
      const conversionAttr = link.getAttribute('conversion');

      // Preview text for card header
      const preview = title || alias || url || '—';

      // Comprobar si la URL es de AMPscript (ej. %%view_email_url%% o %%=RedirectTo(...)=%%)
      const isAmp = url.includes('%%') || url.includes('%=');
      const testBtn = url && !isAmp 
        ? `<a href="${escapeHtml(url)}" target="_blank" class="btn-copy" title="Probar enlace en nueva pestaña">🔗</a>`
        : `<button class="btn-copy" disabled title="No se puede probar (es AMPscript o está vacío)">🔗</button>`;

      // Comprobar si cumple la nomenclatura
      const isValidAlias =
  alias.startsWith('C_') ||
  alias.startsWith('c_') ||
  alias.startsWith('N_');

      // Determinar estado de 'conversion'
      const isConversion = conversionAttr && conversionAttr.toLowerCase() === 'true';
      let conversionLabel = '—';
      if (conversionAttr === 'true' || conversionAttr === 'false') {
        conversionLabel = conversionAttr;
      }

      // Los alias C_/c_ deben llevar conversion="true"; si falta o es false, es un aviso
      const isCAlias = alias.startsWith('C_') || alias.startsWith('c_');
      const missingConversion = isCAlias && !isConversion;

      // Los alias N_ deben llevar conversion="false" o no tener el atributo; si es "true", es un error
      const isNAlias = alias.startsWith('N_');
      const unexpectedConversion = isNAlias && isConversion;

      const hasWarning = !isValidAlias || missingConversion || unexpectedConversion;
      if (hasWarning) warningCount++;

      // Extraer el nombre del asset a partir del alias (solo enlaces C_/c_)
      const assetName = parseAssetFromAlias(alias);
      if (assetName) assetNames.push(assetName);

      const badges = [];
      if (!isValidAlias) {
        badges.push(`<span class="badge-warning" title="Alias no empieza por C_ ni N_">⚠️ Formato incorrecto</span>`);
      }
      if (missingConversion) {
        badges.push(`<span class="badge-warning" title="Los alias C_ deben tener conversion=&quot;true&quot;">⚠️ Conversion Error</span>`);
      }
      if (unexpectedConversion) {
        badges.push(`<span class="badge-warning" title="Los alias N_ deben tener conversion=&quot;false&quot; o no tener el atributo">⚠️ Conversion Error</span>`);
      }
      const warningBadge = badges.join('');

      const card = document.createElement('div');
      card.className = `card card-enter ${hasWarning ? 'warning' : ''}`;
      card.dataset.alias = alias; // Dato para filtrar luego
      card.dataset.warning = hasWarning ? 'true' : 'false';
      card.innerHTML = `
        <div class="card-header">
          <span class="link-index">#${String(i + 1).padStart(2, '0')}</span>
          <span class="link-title-preview">${escapeHtml(preview)}</span>
          ${warningBadge}
        </div>
        <div class="card-body">
          <div class="row">
            <span class="field-label lbl-title">title</span>
            <input class="field-input${title ? '' : ' empty'}" value="${escapeHtml(title)}"
                   placeholder="—" readonly>
            <button class="btn-copy" onclick="copyValue(this)" title="Copiar title">📋</button>
          </div>
          <div class="row">
            <span class="field-label lbl-alias">alias</span>
            <input class="field-input${alias ? '' : ' empty'}" value="${escapeHtml(alias)}"
                   placeholder="—" readonly>
            <button class="btn-copy" onclick="copyValue(this)" title="Copiar alias">📋</button>
          </div>
          <div class="row">
            <span class="field-label lbl-url">url</span>
            <input class="field-input${url ? '' : ' empty'}" value="${escapeHtml(url)}"
                   placeholder="—" readonly>
            ${testBtn}
            <button class="btn-copy" onclick="copyValue(this)" title="Copiar URL">📋</button>
          </div>
          <div class="row">
            <span class="field-label lbl-conv">conv</span>
            <div class="field-checkbox ${isConversion ? 'active' : ''}">
              <input type="checkbox" ${isConversion ? 'checked' : ''} disabled title="Atributo conversion">
              <span>${escapeHtml(conversionLabel)}</span>
            </div>
          </div>
        </div>
      `;
      card.style.animationDelay = `${i * 30}ms`;
      card.addEventListener('animationend', () => card.classList.remove('card-enter'), { once: true });
      results.appendChild(card);
    });

    // Actualizar botón de avisos
    const btnWarning = document.getElementById('filter-warning');
    if (warningCount > 0) {
      btnWarning.style.display = 'inline-block';
      btnWarning.textContent = `⚠️ Avisos (${warningCount})`;
    } else {
      btnWarning.style.display = 'none';
    }

    // Resetear filtro a "Todos" después de una nueva extracción
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    document.querySelectorAll('.card').forEach(c => {
      c.classList.remove('card-hidden', 'card-collapsed');
    });

    // Actualizar el contador general
    updateVisibleCount();

    // Detectar y validar el nombre del asset a partir de los alias C_
    renderAssetBox(assetNames);
  }

  // Extrae "{campaña}: Email {n}[letra]" de un alias C_/c_ del tipo
  // C_IT_ALL_MultibrandGPPart2_Sep26_Email1A_Star1 -> "IT_ALL_MultibrandGPPart2_Sep26: Email 1A"
  // C_IT_ALL_MultibrandGPPart2_Sep26_Email4_CTA2   -> "IT_ALL_MultibrandGPPart2_Sep26: Email 4"
  function parseAssetFromAlias(alias) {
    if (!alias) return null;
    const isCAlias = alias.startsWith('C_') || alias.startsWith('c_');
    if (!isCAlias) return null;

    const rest = alias.slice(2);
    const match = rest.match(/^(.+?)_email(\d+[a-z]?)/i);
    if (!match) return null;

    const campaign = match[1];
    const emailNum = match[2];
    return `${campaign}: Email ${emailNum}`;
  }

  // Muestra el cajón de asset detectado y comprueba que sea coherente
  // en todos los enlaces C_ (mismo nombre de asset en todos ellos)
  function renderAssetBox(assetNames) {
    const box   = document.getElementById('asset-box');
    const badge = document.getElementById('asset-box-badge');
    const body  = document.getElementById('asset-box-body');

    if (!box || !badge || !body) return;

    if (!assetNames.length) {
      box.style.display = 'none';
      body.innerHTML = '';
      return;
    }

    box.style.display = 'block';

    const counts = new Map();
    assetNames.forEach(name => counts.set(name, (counts.get(name) || 0) + 1));
    const uniqueNames = Array.from(counts.keys());

    if (uniqueNames.length === 1) {
      badge.textContent = '✓ Coherente';
      badge.className = 'asset-box-badge ok';
      body.innerHTML = `
        <div class="row">
          <input class="field-input" value="${escapeHtml(uniqueNames[0])}" readonly>
          <button class="btn-copy" onclick="copyValue(this)" title="Copiar nombre del asset">📋</button>
        </div>
      `;
    } else {
      badge.textContent = `⚠️ ${uniqueNames.length} nombres distintos`;
      badge.className = 'asset-box-badge warn';
      body.innerHTML = uniqueNames.map(name => `
        <div class="row">
          <input class="field-input" value="${escapeHtml(name)}" readonly>
          <span class="asset-count">${counts.get(name)} enlace${counts.get(name) > 1 ? 's' : ''}</span>
          <button class="btn-copy" onclick="copyValue(this)" title="Copiar nombre del asset">📋</button>
        </div>
      `).join('');
    }
  }

  // Genera el CSV (y la etiqueta del filtro activo) a partir de las tarjetas visibles
  function buildCSV() {
    const activeBtn = document.querySelector('.filter-btn.active');
    const filterLabel = activeBtn ? activeBtn.textContent.trim() : 'todos';

    const visibleCards = Array.from(document.querySelectorAll('.card'))
      .filter(card => !card.classList.contains('card-collapsed') && !card.classList.contains('card-hidden'));

    if (!visibleCards.length) return null;

    const rows = [];

    // Si se detectó un Campaign Asset, incluirlo junto con su valor antes de la tabla
    const allAliases = Array.from(document.querySelectorAll('.card')).map(c => c.dataset.alias || '');
    const assetNames = allAliases.map(parseAssetFromAlias).filter(Boolean);
    if (assetNames.length) {
      const counts = new Map();
      assetNames.forEach(name => counts.set(name, (counts.get(name) || 0) + 1));
      const uniqueNames = Array.from(counts.keys());

      if (uniqueNames.length === 1) {
        rows.push(['Campaign Asset', uniqueNames[0]]);
      } else {
        uniqueNames.forEach(name => {
          rows.push(['Campaign Asset', name, `${counts.get(name)} enlaces`]);
        });
      }
      rows.push([]);
    }

    rows.push(['#', 'title', 'alias', 'url', 'conversion']);

    visibleCards.forEach(card => {
      const inputs = card.querySelectorAll('.field-input');
      const index = card.querySelector('.link-index')?.textContent.replace('#', '') || '';
      const title = inputs[0]?.value || '';
      const alias = inputs[1]?.value || '';
      const url   = inputs[2]?.value || '';
      const conv  = card.querySelector('.field-checkbox span')?.textContent || '';
      rows.push([index, title, alias, url, conv]);
    });

    const csvContent = rows
      .map(row => row.map(csvEscape).join(','))
      .join('\r\n');

    return { csvContent, filterLabel };
  }

  // Exporta a CSV las tarjetas visibles según el filtro activo
  function exportCSV() {
    const built = buildCSV();
    if (!built) return;
    const { csvContent, filterLabel } = built;

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const safeFilter = filterLabel.replace(/[^\w-]+/g, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);

    a.href = url;
    a.download = `sfmc-links_${safeFilter}_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Copia el CSV de las tarjetas visibles al portapapeles
  function copyCSV(btn) {
    const built = buildCSV();
    if (!built) return;
    const { csvContent } = built;

    const showCopied = () => {
      if (!btn) return;
      const original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '✓ Copiado';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('copied');
      }, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(csvContent).then(showCopied).catch(() => fallbackCopyText(csvContent, showCopied));
    } else {
      fallbackCopyText(csvContent, showCopied);
    }
  }

  // Copia de respaldo por si el navegador no soporta navigator.clipboard
  function fallbackCopyText(text, onDone) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    if (onDone) onDone();
  }

  function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Lógica de los Filtros
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('filter-btn')) {
      return;
    }

    document
      .querySelectorAll('.filter-btn')
      .forEach(btn => btn.classList.remove('active'));

    e.target.classList.add('active');

    const filter = e.target.dataset.filter;

    document.querySelectorAll('.card').forEach(card => {
      const alias = card.dataset.alias || '';
      let show = true;

      switch(filter) {
        case 'C':
          show = alias.startsWith('C_');
          break;
        case 'N':
          show = alias.startsWith('N_');
          break;
        case 'empty':
          show = alias.trim() === '';
          break;
        case 'warning':
          show = card.dataset.warning === 'true';
          break;
      }

      if (show) {
        // Primero quitar collapsed para que sea visible, luego animar entrada
        card.classList.remove('card-collapsed');
        // Forzar reflow para que la transición arrange desde el estado hidden
        void card.offsetHeight;
        card.classList.remove('card-hidden');
      } else {
        card.classList.add('card-hidden');
        // Esperar a que termine la transición para colapsar el espacio
        const onEnd = () => {
          if (card.classList.contains('card-hidden')) {
            card.classList.add('card-collapsed');
          }
          card.removeEventListener('transitionend', onEnd);
        };
        card.addEventListener('transitionend', onEnd);
      }
    });

    // Actualizar el contador tras aplicar el filtro (tras la transición)
    setTimeout(updateVisibleCount, 220);
  });

  function updateVisibleCount() {
    const visibleCards = Array.from(document.querySelectorAll('.card')).filter(card => !card.classList.contains('card-collapsed') && !card.classList.contains('card-hidden'));
    document.getElementById('results-count').textContent = visibleCards.length;
  }

  // Lógica del Dark Mode
  const themeToggle = document.getElementById('theme-toggle');

  themeToggle.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark';

    if (dark) {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = '🌙 Dark';
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.dataset.theme = 'dark';
      themeToggle.textContent = '☀️ Light';
      localStorage.setItem('theme', 'dark');
    }
  });

  // Restaurar preferencia del tema al cargar
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.dataset.theme = 'dark';
    themeToggle.textContent = '☀️ Light';
  }