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

    if (!html) return;

    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    const links  = doc.querySelectorAll('a');

    if (!links.length) {
      empty.classList.add('visible');
      return;
    }

    let warningCount = 0;
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
      if (!isValidAlias) warningCount++;
      const warningBadge = !isValidAlias ? `<span class="badge-warning" title="Alias no empieza por C_ ni N_">⚠️ Formato incorrecto</span>` : '';

      // Determinar estado de 'conversion'
      const isConversion = conversionAttr && conversionAttr.toLowerCase() === 'true';
      let conversionLabel = '—';
      if (conversionAttr === 'true' || conversionAttr === 'false') {
        conversionLabel = conversionAttr;
      }

      const card = document.createElement('div');
      card.className = `card ${!isValidAlias ? 'warning' : ''}`;
      card.dataset.alias = alias; // Dato para filtrar luego
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
          show = !alias.startsWith('C_') && !alias.startsWith('N_');
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