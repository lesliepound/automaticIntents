/**
 * FormEditor — GUI form editor for story.json files.
 *
 * Usage:
 *   const editor = new FormEditor(parsedStoryJSON, containerElement);
 *   editor.toJSON();   // → stringified JSON of current form state
 *   editor.getData();  // → parsed object { pages: [...] }
 */

// Known affordance types used across scenarios
const KNOWN_AFFORDANCES = [
  'movable', 'connectable', 'readable', 'orderable',
  'diagnosable', 'hatable', 'settable',
  'moveDirection', 'revealable', 'askable'
];

const PAGE_TYPES = ['simulation', 'story', 'options', 'end'];

class FormEditor {
  constructor(data, container) {
    this.container = container;
    this.pages = JSON.parse(JSON.stringify(data.pages || []));
    this._originalJSON = JSON.stringify({ pages: this.pages });
    this._injectStyles();
    this.render();
  }

  // ── Public API ──────────────────────────────────────────────

  /** Returns the story object */
  getData() {
    return { pages: this.pages };
  }

  /** Returns prettified JSON string */
  toJSON() {
    return JSON.stringify(this.getData(), null, 2);
  }

  // ── Render orchestrator ─────────────────────────────────────

  render() {
    this.container.innerHTML = '';

    // Page cards
    this.pages.forEach((page, i) => {
      this.container.appendChild(this._buildPageCard(page, i));
    });

    // Add page button
    const addRow = el('div', 'fe-add-page-row');
    const addBtn = el('button', 'fe-btn fe-btn-fab');
    addBtn.type = 'button';
    addBtn.appendChild(mIcon('add', 'fe-btn-icon'));
    addBtn.appendChild(document.createTextNode(' Add Page'));
    addBtn.onclick = () => {
      this.pages.push({ id: `new-page-${Date.now()}`, type: 'story', text: '' });
      this.render();
    };
    addRow.appendChild(addBtn);
    this.container.appendChild(addRow);

    // Attach change listener to detect dirty state
    this.container.addEventListener('input', () => this._checkDirty());
    this.container.addEventListener('change', () => this._checkDirty());
    this._checkDirty();
  }

  _checkDirty() {
    const bar = document.getElementById('fe-save-bar');
    if (!bar) return;
    const dirty = this.isDirty();
    bar.classList.toggle('fe-save-bar--hidden', !dirty);
    // Show/hide the View JSON button when editor is loaded
    const vjBtn = document.getElementById('fe-view-json-btn');
    if (vjBtn) vjBtn.style.display = '';
  }

  isDirty() {
    return JSON.stringify({ pages: this.pages }) !== this._originalJSON;
  }

  markClean() {
    this._originalJSON = JSON.stringify({ pages: this.pages });
    this._checkDirty();
  }

  // ── Page card builder ───────────────────────────────────────

  _buildPageCard(page, index) {
    const card = el('div', 'fe-card');
    card.dataset.index = index; [cite, 12]

    // Header bar
    const header = el('div', 'fe-card-header'); [cite, 40]

    // Collapse toggle
    const collapseBtn = el('button', 'fe-collapse-btn'); [cite, 42]
    collapseBtn.type = 'button';
    const collapseIcon = mIcon('expand_more'); [cite, 28]
    collapseBtn.appendChild(collapseIcon);
    let collapsed = false;
    collapseBtn.onclick = () => {
      collapsed = !collapsed;
      collapseIcon.textContent = collapsed ? 'chevron_right' : 'expand_more';
      body.style.display = collapsed ? 'none' : '';
    };
    header.appendChild(collapseBtn);

    // Page ID
    const idLabel = el('label', 'fe-header-label', 'ID'); [cite, 43]
    header.appendChild(idLabel);
    const idInput = el('input', 'fe-header-input'); [cite, 44]
    idInput.value = page.id || '';
    idInput.onchange = () => { page.id = idInput.value; };
    header.appendChild(idInput);

    // Type dropdown
    const typeLabel = el('label', 'fe-header-label', 'Type'); [cite, 43]
    header.appendChild(typeLabel);
    const typeSelect = el('select', 'fe-header-select'); [cite, 46]
    PAGE_TYPES.forEach(t => {
      const opt = el('option');
      opt.value = t;
      opt.textContent = t;
      if (page.type === t) opt.selected = true;
      typeSelect.appendChild(opt);
    });
    typeSelect.onchange = () => {
      page.type = typeSelect.value;
      this.render();
    };
    header.appendChild(typeSelect);

    // Spacer
    header.appendChild(el('span', 'fe-spacer')); [cite, 47]

    // Delete page
    const delBtn = el('button', 'fe-icon-btn fe-icon-btn-danger'); [cite, 56, 57]
    delBtn.type = 'button';
    delBtn.title = 'Delete page';
    delBtn.appendChild(mIcon('delete')); [cite, 28]
    delBtn.onclick = async () => {
      if (this.pages.length <= 1) return;
      const ok = await showConfirm('Delete page?', `Remove page "${page.id || 'Untitled'}"? This cannot be undone.`);
      if (!ok) return;
      this.pages.splice(index, 1);
      this.render();
    };
    header.appendChild(delBtn);

    card.appendChild(header);

    // Body
    const body = el('div', 'fe-card-body'); [cite, 41]

    // ── MOVED SETUP SECTION (NOW COLLAPSIBLE & ABOVE TEXT) ──
    if (page.type === 'simulation') {
      body.appendChild(this._buildSetup(page)); [cite, 13]
    }

    // ── COMMON FIELDS ───────────────────────
    // ORIGINAL ORDER: Text was here before Setup
    body.appendChild(this._fieldRow('Text', () => {
      const ta = el('textarea', 'fe-textarea'); [cite, 65]
      ta.value = page.text || '';
      ta.onchange = () => { page.text = ta.value; };
      return ta;
    }));

    // ... [Remaining logic for Simulation/Options fields remains the same] ...
    if (page.type === 'story') {
      // ... story logic [cite: 1]
    }

    if (page.type === 'simulation' || page.type === 'options') {
      // ... sim logic [cite: 1]
    }

    card.appendChild(body);
    return card;
  }
 
  _buildPageCard(page, index) {
    const card = el('div', 'fe-card');
    card.dataset.index = index;
  
    // Header bar
    const header = el('div', 'fe-card-header');
  
    // Collapse toggle
    const collapseBtn = el('button', 'fe-collapse-btn');
    collapseBtn.type = 'button';
    const collapseIcon = mIcon('expand_more');
    collapseBtn.appendChild(collapseIcon);
    let collapsed = false;
    collapseBtn.onclick = () => {
      collapsed = !collapsed;
      collapseIcon.textContent = collapsed ? 'chevron_right' : 'expand_more';
      body.style.display = collapsed ? 'none' : '';
    };
    header.appendChild(collapseBtn);
  
    // Page ID
    const idLabel = el('label', 'fe-header-label', 'ID');
    header.appendChild(idLabel);
    const idInput = el('input', 'fe-header-input');
    idInput.value = page.id || '';
    idInput.onchange = () => { page.id = idInput.value; };
    header.appendChild(idInput);
  
    // Type dropdown
    const typeLabel = el('label', 'fe-header-label', 'Type');
    header.appendChild(typeLabel);
    const typeSelect = el('select', 'fe-header-select');
    PAGE_TYPES.forEach(t => {
      const opt = el('option');
      opt.value = t;
      opt.textContent = t;
      if (page.type === t) opt.selected = true;
      typeSelect.appendChild(opt);
    });
    typeSelect.onchange = () => {
      page.type = typeSelect.value;
      this.render();
    };
    header.appendChild(typeSelect);
  
    // Spacer
    header.appendChild(el('span', 'fe-spacer'));
  
    // Delete page
    const delBtn = el('button', 'fe-icon-btn fe-icon-btn-danger');
    delBtn.type = 'button';
    delBtn.title = 'Delete page';
    delBtn.appendChild(mIcon('delete'));
    delBtn.onclick = async () => {
      if (this.pages.length <= 1) return;
      const ok = await showConfirm('Delete page?', `Remove page "${page.id || 'Untitled'}"? This cannot be undone.`);
      if (!ok) return;
      this.pages.splice(index, 1);
      this.render();
    };
    header.appendChild(delBtn);
  
    card.appendChild(header);
  
    // Body
    const body = el('div', 'fe-card-body');
  
    // ── Common fields ───────────────────────
    body.appendChild(this._fieldRow('Text', () => {
      const ta = el('textarea', 'fe-textarea');
      ta.value = page.text || '';
      ta.onchange = () => { page.text = ta.value; };
      return ta;
    }));
  
    if (page.display !== undefined || page.type === 'simulation' || page.type === 'options') {
      // Display checkbox moved to header
    }
  
    // ── Story-specific fields ───────────────
    if (page.type === 'story') {
      body.appendChild(this._fieldRow('Timer (s)', () => {
        const inp = el('input', 'fe-input fe-input-sm');
        inp.type = 'number';
        inp.min = '0';
        inp.value = page.timer ?? '';
        inp.onchange = () => {
          const v = parseFloat(inp.value);
          if (!isNaN(v)) page.timer = v; else delete page.timer;
        };
        return inp;
      }));
  
      body.appendChild(this._fieldRow('Prompt', () => {
        const ta = el('textarea', 'fe-textarea fe-textarea-sm');
        ta.value = page.prompt || '';
        ta.placeholder = 'Optional system prompt';
        ta.onchange = () => {
          if (ta.value) page.prompt = ta.value; else delete page.prompt;
        };
        return ta;
      }));
  
      body.appendChild(this._fieldRow('Next Slide ID', () => {
        const inp = el('input', 'fe-input');
        inp.value = page.nextSlideId || '';
        inp.onchange = () => {
          if (inp.value) page.nextSlideId = inp.value; else delete page.nextSlideId;
        };
        return inp;
      }));
    }
  
    // ── Simulation / Options fields ─────────
    if (page.type === 'simulation' || page.type === 'options') {
      // Setup (simulation only)
      if (page.type === 'simulation') {
        body.appendChild(this._buildSetup(page));
      }
  
      // Foreground
      body.appendChild(this._buildTagList('Foreground', page, 'foreground'));
  
      // Goals
      if (page.type === 'simulation') {
        body.appendChild(this._buildTagList('Goals', page, 'goals'));
      }
  
      // Options
      body.appendChild(this._buildOptions(page, index));
  
      // Affordances
      body.appendChild(this._buildAffordances(page));
  
      // Dials (simulation only)
      if (page.type === 'simulation' && (page.dials || Object.keys(page).includes('dials'))) {
        body.appendChild(this._buildDials(page));
      }
      // Add Dials button if simulation and no dials yet
      if (page.type === 'simulation' && !page.dials) {
        const addDialsBtn = el('button', 'fe-btn fe-btn-tonal fe-btn-sm');
        addDialsBtn.type = 'button';
        addDialsBtn.appendChild(mIcon('speed', 'fe-btn-icon'));
        addDialsBtn.appendChild(document.createTextNode(' Add Dials Section'));
        addDialsBtn.style.marginTop = '8px';
        addDialsBtn.onclick = () => {
          page.dials = {};
          this.render();
        };
        body.appendChild(addDialsBtn);
      }
    }
  
    card.appendChild(body);
    return card;
  }

//   ── Setup section ───────────────────────────────────────────
// ── Setup section (Updated to be Collapsible) ────────────────

  // _buildSetup(page) {
  //   if (!page.setup) page.setup = {}; [cite: 13]
  //   const section = el('div', 'fe-section fe-collapsible'); [cite: 68]

  //   // Header with toggle icon
  //   const hdr = el('div', 'fe-section-header fe-section-header-toggle'); [cite: 69, 70]
  //   hdr.style.cursor = 'pointer';
  //   const toggleIcon = mIcon('expand_more', 'fe-toggle-icon'); [cite: 28, 70]
  //   hdr.appendChild(toggleIcon);
  //   hdr.appendChild(document.createTextNode(' Setup'));

  //   const grid = el('div', 'fe-setup-grid'); [cite: 71]

  //   // Toggle logic
  //   let setupCollapsed = true; // Default to collapsed for a cleaner look
  //   grid.style.display = 'none';
  //   toggleIcon.textContent = 'chevron_right';

  //   hdr.onclick = () => {
  //     setupCollapsed = !setupCollapsed;
  //     toggleIcon.textContent = setupCollapsed ? 'chevron_right' : 'expand_more';
  //     grid.style.display = setupCollapsed ? 'none' : 'grid';
  //   };

  //   section.appendChild(hdr);

  //   ['focus', 'data', 'selection'].forEach(key => {
  //     const lbl = el('label', 'fe-label-sm', key); [cite: 60]
  //     grid.appendChild(lbl);
  //     const inp = el('input', 'fe-input'); [cite: 62]
  //     inp.value = page.setup[key] || '';
  //     inp.placeholder = key;
  //     inp.onchange = () => {
  //       if (inp.value) page.setup[key] = inp.value;
  //       else delete page.setup[key];
  //       if (!Object.keys(page.setup).length) delete page.setup;
  //     };
  //     grid.appendChild(inp);
  //   });

  //   section.appendChild(grid);
  //   return section;
  // }
  _buildSetup(page) {
    if (!page.setup) page.setup = {};
    const section = el('div', 'fe-section');
    const hdr = el('div', 'fe-section-header', 'Setup');
    section.appendChild(hdr);
    const grid = el('div', 'fe-setup-grid');
  
    ['focus', 'data', 'selection'].forEach(key => {
      const lbl = el('label', 'fe-label-sm', key);
      grid.appendChild(lbl);
      const inp = el('input', 'fe-input');
      inp.value = page.setup[key] || '';
      inp.placeholder = key;
      inp.onchange = () => {
        if (inp.value) page.setup[key] = inp.value;
        else delete page.setup[key];
        if (!Object.keys(page.setup).length) delete page.setup;
      };
      grid.appendChild(inp);
    });
  
    section.appendChild(grid);
    return section;
  }

  // ── Tag list (foreground, goals) ────────────────────────────

  _buildTagList(label, page, key) {
    const section = el('div', 'fe-field-row');
    const lbl = el('label', 'fe-label', label);
    section.appendChild(lbl);

    const wrap = el('div', 'fe-tag-wrap');
    if (!page[key]) page[key] = [];

    const renderTags = () => {
      wrap.innerHTML = '';
      page[key].forEach((val, i) => {
        const tag = el('span', 'fe-tag');
        const txt = el('span', '', val);
        tag.appendChild(txt);
        const rm = el('button', 'fe-tag-rm');
        rm.type = 'button';
        rm.appendChild(mIcon('close', 'fe-tag-rm-icon'));
        rm.onclick = () => { page[key].splice(i, 1); renderTags(); };
        tag.appendChild(rm);
        wrap.appendChild(tag);
      });

      const addBtn = el('button', 'fe-tag-add');
      addBtn.appendChild(mIcon('add', 'fe-tag-add-icon'));
      addBtn.type = 'button';
      addBtn.onclick = () => {
        const v = prompt(`Add ${label.toLowerCase()} item:`);
        if (v && v.trim()) { page[key].push(v.trim()); renderTags(); }
      };
      wrap.appendChild(addBtn);
    };
    renderTags();

    section.appendChild(wrap);
    return section;
  }

  // ── Options section ─────────────────────────────────────────

  _buildOptions(page, pageIndex) {
    if (!page.options) page.options = [];
    const section = el('div', 'fe-section');

    const hdr = el('div', 'fe-section-header');
    hdr.appendChild(document.createTextNode('Options'));

    // Display checkbox
    if (page.display !== undefined || page.type === 'simulation' || page.type === 'options') {
      const displayLabel = el('label', 'fe-header-label', 'Display');
      displayLabel.style.marginLeft = '12px';
      hdr.appendChild(displayLabel);
      const displayCb = el('input');
      displayCb.type = 'checkbox';
      displayCb.checked = page.display !== 'none';
      displayCb.style.width = 'auto';
      displayCb.style.margin = '0 8px 0 4px';
      displayCb.onchange = () => {
        if (displayCb.checked) delete page.display;
        else page.display = 'none';
      };
      hdr.appendChild(displayCb);
    }

    hdr.appendChild(el('span', 'fe-spacer'));
    const addOptBtn = el('button', 'fe-btn fe-btn-filled fe-btn-sm');
    addOptBtn.appendChild(mIcon('add', 'fe-btn-icon'));
    addOptBtn.appendChild(document.createTextNode(' Add Option'));
    addOptBtn.type = 'button';
    addOptBtn.onclick = () => {
      page.options.push({
        option: '', extra: '',
        slot: { name: '', description: '' },
        nextSlideId: ''
      });
      this.render();
    };
    hdr.appendChild(addOptBtn);
    section.appendChild(hdr);

    page.options.forEach((opt, oi) => {
      section.appendChild(this._buildOptionCard(page, opt, oi));
    });

    return section;
  }

  _buildOptionCard(page, opt, oi) {
    const card = el('div', 'fe-option-card');

    // Remove button
    const rmBtn = el('button', 'fe-option-rm');
    rmBtn.type = 'button';
    rmBtn.appendChild(mIcon('close'));
    rmBtn.onclick = async () => {
      const ok = await showConfirm('Delete option?', `Remove option "${opt.option || 'Untitled'}"?`);
      if (!ok) return;
      page.options.splice(oi, 1); this.render();
    };
    card.appendChild(rmBtn);

    // Option text
    card.appendChild(this._fieldRow('Option', () => {
      const ta = el('textarea', 'fe-textarea fe-textarea-sm');
      ta.value = opt.option || '';
      ta.onchange = () => { opt.option = ta.value; };
      return ta;
    }));

    // Extra
    card.appendChild(this._fieldRow('Extra', () => {
      const ta = el('textarea', 'fe-textarea fe-textarea-sm');
      ta.value = opt.extra || '';
      ta.placeholder = 'Alternative phrases…';
      ta.onchange = () => {
        if (ta.value) opt.extra = ta.value; else delete opt.extra;
      };
      return ta;
    }));

    // Slot
    card.appendChild(this._buildSlot(opt, 'slot', 'Slot'));

    // Slot1 (optional)
    if (opt.slot1) {
      card.appendChild(this._buildSlot(opt, 'slot1', 'Slot 2'));
    } else {
      const addSlotBtn = el('button', 'fe-btn fe-btn-tonal fe-btn-xs');
      addSlotBtn.appendChild(mIcon('add', 'fe-btn-icon'));
      addSlotBtn.appendChild(document.createTextNode(' Add Slot 2'));
      addSlotBtn.type = 'button';
      addSlotBtn.onclick = () => {
        opt.slot1 = { name: '', description: '' };
        this.render();
      };
      card.appendChild(addSlotBtn);
    }

    // NextSlideId
    card.appendChild(this._fieldRow('Next →', () => {
      const inp = el('input', 'fe-input');
      inp.value = opt.nextSlideId || '';
      inp.onchange = () => { opt.nextSlideId = inp.value; };
      return inp;
    }));

    // Resource (optional)
    if (opt.resource !== undefined) {
      card.appendChild(this._fieldRow('Resource', () => {
        const inp = el('input', 'fe-input');
        inp.value = opt.resource || '';
        inp.onchange = () => {
          if (inp.value) opt.resource = inp.value; else delete opt.resource;
        };
        return inp;
      }));
    } else {
      const addResBtn = el('button', 'fe-btn fe-btn-tonal fe-btn-xs');
      addResBtn.appendChild(mIcon('attach_file', 'fe-btn-icon'));
      addResBtn.appendChild(document.createTextNode(' Resource'));
      addResBtn.type = 'button';
      addResBtn.onclick = () => { opt.resource = ''; this.render(); };
      card.appendChild(addResBtn);
    }

    return card;
  }

  _buildSlot(opt, key, label) {
    if (!opt[key]) opt[key] = { name: '', description: '' };
    const wrap = el('div', 'fe-slot');
    const hdr = el('div', 'fe-slot-header');
    hdr.appendChild(document.createTextNode(label));

    if (key === 'slot1') {
      const rmBtn = el('button', 'fe-icon-btn fe-icon-btn-danger fe-icon-btn-sm');
      rmBtn.appendChild(mIcon('close'));
      rmBtn.type = 'button';
      rmBtn.onclick = async () => {
        const ok = await showConfirm('Remove slot?', 'Remove this extra slot?');
        if (!ok) return;
        delete opt[key]; this.render();
      };
      hdr.appendChild(rmBtn);
    }
    wrap.appendChild(hdr);

    const row = el('div', 'fe-slot-row');
    const nameInp = el('input', 'fe-input');
    nameInp.placeholder = 'name';
    nameInp.value = opt[key].name || '';
    nameInp.onchange = () => { opt[key].name = nameInp.value; };
    row.appendChild(nameInp);

    const descInp = el('input', 'fe-input');
    descInp.placeholder = 'description';
    descInp.value = opt[key].description || '';
    descInp.onchange = () => { opt[key].description = descInp.value; };
    row.appendChild(descInp);

    wrap.appendChild(row);
    return wrap;
  }

  // ── Affordances section ─────────────────────────────────────

  _buildAffordances(page) {
    if (!page.affordances) page.affordances = {};
    const section = el('div', 'fe-section');

    const hdr = el('div', 'fe-section-header');
    hdr.appendChild(document.createTextNode('Affordances'));
    const addBtn = el('button', 'fe-btn fe-btn-filled fe-btn-sm');
    addBtn.appendChild(mIcon('add', 'fe-btn-icon'));
    addBtn.appendChild(document.createTextNode(' Add Object'));
    addBtn.type = 'button';
    addBtn.onclick = () => {
      const name = prompt('Object name (e.g. "patient"):');
      if (name && name.trim()) {
        page.affordances[name.trim()] = [];
        this.render();
      }
    };
    hdr.appendChild(addBtn);
    section.appendChild(hdr);

    Object.keys(page.affordances).forEach(objName => {
      section.appendChild(this._buildAffordanceRow(page, objName));
    });

    return section;
  }

  _buildAffordanceRow(page, objName) {
    const row = el('div', 'fe-affordance-row');

    const nameWrap = el('div', 'fe-affordance-name');
    const nameSpan = el('span', '', objName);
    nameWrap.appendChild(nameSpan);
    const rmBtn = el('button', 'fe-icon-btn fe-icon-btn-danger fe-icon-btn-sm');
    rmBtn.type = 'button';
    rmBtn.appendChild(mIcon('close'));
    rmBtn.onclick = async () => {
      const ok = await showConfirm('Delete affordance?', `Remove affordance "${objName}"?`);
      if (!ok) return;
      delete page.affordances[objName]; this.render();
    };
    nameWrap.appendChild(rmBtn);
    row.appendChild(nameWrap);

    const checks = el('div', 'fe-affordance-checks');
    const current = page.affordances[objName] || [];

    KNOWN_AFFORDANCES.forEach(aff => {
      const lbl = el('label', 'fe-check-label');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.checked = current.includes(aff);
      cb.onchange = () => {
        if (cb.checked) {
          if (!current.includes(aff)) current.push(aff);
        } else {
          const idx = current.indexOf(aff);
          if (idx >= 0) current.splice(idx, 1);
        }
        page.affordances[objName] = current;
      };
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(' ' + aff));
      checks.appendChild(lbl);
    });

    // Custom affordance input
    const customAffs = current.filter(a => !KNOWN_AFFORDANCES.includes(a));
    customAffs.forEach(ca => {
      const tag = el('span', 'fe-tag fe-tag-small');
      tag.appendChild(document.createTextNode(ca));
      const rm = el('button', 'fe-tag-rm');
      rm.type = 'button';
      rm.appendChild(mIcon('close', 'fe-tag-rm-icon'));
      rm.onclick = () => {
        const idx = current.indexOf(ca);
        if (idx >= 0) current.splice(idx, 1);
        page.affordances[objName] = current;
        this.render();
      };
      tag.appendChild(rm);
      checks.appendChild(tag);
    });

    const addCustom = el('button', 'fe-btn fe-btn-tonal fe-btn-xs');
    addCustom.appendChild(mIcon('add', 'fe-btn-icon'));
    addCustom.appendChild(document.createTextNode(' custom'));
    addCustom.type = 'button';
    addCustom.onclick = () => {
      const v = prompt('Custom affordance name:');
      if (v && v.trim()) {
        current.push(v.trim());
        page.affordances[objName] = current;
        this.render();
      }
    };
    checks.appendChild(addCustom);

    row.appendChild(checks);
    return row;
  }

  // ── Dials section ───────────────────────────────────────────

  _buildDials(page) {
    const section = el('div', 'fe-section fe-collapsible');

    const hdr = el('div', 'fe-section-header fe-section-header-toggle');
    const toggleIcon = mIcon('expand_more', 'fe-toggle-icon');
    hdr.appendChild(toggleIcon);
    hdr.appendChild(document.createTextNode(' Dials'));

    const addDialBtn = el('button', 'fe-btn fe-btn-filled fe-btn-sm');
    addDialBtn.appendChild(mIcon('add', 'fe-btn-icon'));
    addDialBtn.appendChild(document.createTextNode(' Add Dial'));
    addDialBtn.type = 'button';
    addDialBtn.onclick = () => {
      const name = prompt('Dial key name (e.g. "temperature"):');
      if (name && name.trim()) {
        page.dials[name.trim()] = { label: '', unit: '', good: '', caution: '', danger: '', damaged: '' };
        this.render();
      }
    };
    hdr.appendChild(addDialBtn);
    section.appendChild(hdr);

    const body = el('div', 'fe-dials-body');
    let dialsCollapsed = false;
    hdr.style.cursor = 'pointer';
    hdr.onclick = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      dialsCollapsed = !dialsCollapsed;
      toggleIcon.textContent = dialsCollapsed ? 'chevron_right' : 'expand_more';
      body.style.display = dialsCollapsed ? 'none' : '';
    };

    Object.keys(page.dials).forEach(dialKey => {
      body.appendChild(this._buildDialCard(page, dialKey));
    });

    section.appendChild(body);
    return section;
  }

  _buildDialCard(page, dialKey) {
    const dial = page.dials[dialKey];
    const card = el('div', 'fe-dial-card');

    const nameRow = el('div', 'fe-dial-name-row');
    const nameLabel = el('span', 'fe-dial-key', dialKey);
    nameRow.appendChild(nameLabel);
    const rmBtn = el('button', 'fe-icon-btn fe-icon-btn-danger fe-icon-btn-sm');
    rmBtn.type = 'button';
    rmBtn.appendChild(mIcon('delete'));
    rmBtn.onclick = async () => {
      const ok = await showConfirm('Delete dial?', `Remove dial "${dialKey}"?`);
      if (!ok) return;
      delete page.dials[dialKey]; this.render();
    };
    nameRow.appendChild(rmBtn);
    card.appendChild(nameRow);

    const grid = el('div', 'fe-dial-grid');
    ['label', 'unit', 'good', 'caution', 'danger', 'damaged'].forEach(field => {
      const lbl = el('label', 'fe-label-xs', field);
      grid.appendChild(lbl);
      const inp = el('input', 'fe-input fe-input-sm');
      inp.value = dial[field] || '';
      inp.placeholder = field;
      inp.onchange = () => { dial[field] = inp.value; };
      grid.appendChild(inp);
    });
    card.appendChild(grid);

    return card;
  }

  // ── Helpers ─────────────────────────────────────────────────

  _fieldRow(label, buildInput) {
    const row = el('div', 'fe-field-row');
    const lbl = el('label', 'fe-label', label);
    row.appendChild(lbl);
    row.appendChild(buildInput());
    return row;
  }

  _showJsonPreview() {
    const overlay = el('div', 'fe-json-overlay');
    const modal = el('div', 'fe-json-modal');
    const pre = el('pre', 'fe-json-pre');
    pre.textContent = this.toJSON();
    modal.appendChild(pre);

    const closeBtn = el('button', 'fe-btn fe-btn-filled');
    closeBtn.type = 'button';
    closeBtn.appendChild(mIcon('close', 'fe-btn-icon'));
    closeBtn.appendChild(document.createTextNode(' Close'));
    closeBtn.onclick = () => overlay.remove();
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    (this.container.ownerDocument || document).body.appendChild(overlay);
  }

  // ── Style injection ─────────────────────────────────────────

  _injectStyles() {
    const doc = this.container.ownerDocument || document;
    if (doc.getElementById('fe-styles')) return;

    // Load Material Symbols Rounded
    if (!doc.getElementById('fe-material-symbols')) {
      const link = doc.createElement('link');
      link.id = 'fe-material-symbols';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
      doc.head.appendChild(link);
    }
    // Load Roboto
    if (!doc.getElementById('fe-roboto-font')) {
      const link = doc.createElement('link');
      link.id = 'fe-roboto-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600&display=swap';
      doc.head.appendChild(link);
    }

    const style = doc.createElement('style');
    style.id = 'fe-styles';
    style.textContent = FORM_EDITOR_CSS;
    doc.head.appendChild(style);
  }
}

// ── DOM helper ──────────────────────────────────────────────────
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

/** Creates a Material Symbols Rounded icon span */
function mIcon(name, extraClass) {
  const s = document.createElement('span');
  s.className = 'material-symbols-rounded' + (extraClass ? ' ' + extraClass : '');
  s.textContent = name;
  return s;
}

// ── Styles ──────────────────────────────────────────────────────
const FORM_EDITOR_CSS = `
/* ═══ Material Design 3 — Form Editor ═══ */

/* ─── MD3 Tokens ──────────────────────────── */
:root {
  --md-primary:        lightseagreen;
  --md-on-primary:     #ffffff;
  --md-primary-ctr:    #b2dfdb;
  --md-on-primary-ctr: #00382e;
  --md-secondary-ctr:  #e8eaed;
  --md-on-secondary-ctr:#1f1f1f;
  --md-surface:        #ffffff;
  --md-surface-dim:    #f8f9fa;
  --md-surface-ctr-low:#f1f3f4;
  --md-surface-ctr:    #e8eaed;
  --md-on-surface:     #1f1f1f;
  --md-on-surface-var: #5f6368;
  --md-outline:        #dadce0;
  --md-outline-var:    #c4c7c5;
  --md-error:          #d93025;
  --md-on-error:       #ffffff;
  --md-error-ctr:      #fce8e6;
  --md-shape-xs:       0;
  --md-shape-sm:       0;
  --md-shape-md:       0;
  --md-shape-lg:       0;
  --md-shape-full:     0;
  --md-elev-1:         0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15);
  --md-elev-2:         0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15);
  --md-elev-3:         0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3);
}

/* ─── Base ────────────────────────────────── */
#formEditorContainer {
  font-family: 'Roboto', 'Google Sans', sans-serif;
  font-size: 14px;
  color: var(--md-on-surface);
  line-height: 1.5;
}

/* ─── Layout ──────────────────────────────── */
.fe-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 0 0 12px 0;
  gap: 8px;
}
.fe-add-page-row {
  text-align: center;
  padding: 20px 0 8px;
}

/* ─── Material Icon inside buttons ────────── */
.fe-btn-icon {
  font-size: 18px;
  vertical-align: middle;
  margin-right: 2px;
}

/* ─── Card ────────────────────────────────── */
.fe-card {
  border: none;
  border-radius: var(--md-shape-sm);
  margin-bottom: 16px;
  background: var(--md-surface);
  box-shadow: var(--md-elev-1);
  overflow: hidden;
  transition: box-shadow .2s;
}
.fe-card:hover {
  box-shadow: var(--md-elev-2);
}
.fe-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--md-surface-dim);
  border-bottom: 1px solid var(--md-outline);
  flex-wrap: wrap;
}
.fe-card-body {
  padding: 16px 20px;
}

/* Collapse */
.fe-collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--md-shape-full);
  color: var(--md-on-surface-var);
  display: flex;
  align-items: center;
  transition: background .15s;
}
.fe-collapse-btn:hover { background: var(--md-surface-ctr); }
.fe-collapse-btn .material-symbols-rounded { font-size: 22px; }

/* Header inputs */
.fe-header-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--md-on-surface-var);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-right: 2px;
}
.fe-header-input {
  font-family: inherit;
  font-size: 14px;
  padding: 4px 10px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-xs);
  background: var(--md-surface);
  color: var(--md-on-surface);
  width: 130px;
  outline: none;
  transition: border-color .2s;
}
.fe-header-input:focus { border-color: var(--md-primary); }
.fe-header-select {
  font-family: inherit;
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-xs);
  background: var(--md-surface);
  color: var(--md-on-surface);
  cursor: pointer;
  outline: none;
  transition: border-color .2s;
}
.fe-header-select:focus { border-color: var(--md-primary); }
.fe-spacer { flex: 1; }

/* ─── Buttons (M3 styles) ─────────────────── */
.fe-btn {
  cursor: pointer;
  border: none;
  border-radius: var(--md-shape-full);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 20px;
  letter-spacing: .25px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background .15s, box-shadow .15s;
}
.fe-btn-filled {
  background: var(--md-primary);
  color: var(--md-on-primary);
}
.fe-btn-filled:hover {
  box-shadow: var(--md-elev-1);
  background: #178a80;
}
.fe-btn-tonal {
  background: var(--md-primary-ctr);
  color: var(--md-on-primary-ctr);
}
.fe-btn-tonal:hover { background: #80cbc4; }
.fe-btn-danger {
  background: var(--md-error);
  color: var(--md-on-error);
}
.fe-btn-danger:hover { background: #c5221f; }
.fe-btn-sm { font-size: 12px; padding: 5px 14px; margin-left: 8px; }
.fe-btn-xs { font-size: 11px; padding: 4px 10px; margin-left: 6px; }
.fe-btn-xs .fe-btn-icon { font-size: 15px; }
.fe-btn-sm .fe-btn-icon { font-size: 16px; }

/* Extended FAB style for Add Page */
.fe-btn-fab {
  background: var(--md-primary-ctr);
  color: var(--md-on-primary-ctr);
  border-radius: var(--md-shape-md);
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: var(--md-elev-2);
  transition: background .15s, box-shadow .2s;
}
.fe-btn-fab:hover {
  box-shadow: var(--md-elev-3);
  background: #80cbc4;
}

/* Icon-only buttons (delete, close) */
.fe-icon-btn {
  cursor: pointer;
  border: none;
  background: transparent;
  border-radius: var(--md-shape-full);
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background .15s;
  padding: 0;
}
.fe-icon-btn .material-symbols-rounded { font-size: 20px; }
.fe-icon-btn-danger { color: var(--md-error); }
.fe-icon-btn-danger:hover { background: var(--md-error-ctr); }
.fe-icon-btn-sm { width: 28px; height: 28px; }
.fe-icon-btn-sm .material-symbols-rounded { font-size: 18px; }

/* ─── Field rows ──────────────────────────── */
.fe-field-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.fe-label {
  min-width: 72px;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface-var);
  padding-top: 10px;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: .5px;
}
.fe-label-sm {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface-var);
  min-width: 55px;
  text-transform: capitalize;
}
.fe-label-xs {
  font-size: 11px;
  font-weight: 500;
  color: var(--md-on-surface-var);
  text-transform: capitalize;
  min-width: 50px;
}

/* Outlined text fields (M3) */
.fe-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-xs);
  font-size: 14px;
  font-family: inherit;
  color: var(--md-on-surface);
  background: var(--md-surface);
  outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.fe-input:focus {
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}
.fe-input::placeholder { color: var(--md-on-surface-var); opacity: .6; }
.fe-input-sm { max-width: 100px; }

.fe-textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-xs);
  font-size: 14px;
  font-family: inherit;
  color: var(--md-on-surface);
  background: var(--md-surface);
  min-height: 52px;
  resize: vertical;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.fe-textarea:focus {
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}
.fe-textarea::placeholder { color: var(--md-on-surface-var); opacity: .6; }
.fe-textarea-sm { min-height: 38px; }

/* ─── Sections ────────────────────────────── */
.fe-section {
  margin-top: 16px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-sm);
  overflow: hidden;
}
.fe-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--md-surface-ctr-low);
  font-weight: 500;
  font-size: 13px;
  color: var(--md-on-surface);
  letter-spacing: .25px;
}
.fe-section-header-toggle {
  cursor: pointer;
  user-select: none;
}
.fe-toggle-icon {
  font-size: 20px;
  color: var(--md-on-surface-var);
  transition: transform .2s;
}

/* ─── Setup grid ──────────────────────────── */
.fe-setup-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 12px;
  padding: 12px 16px;
  align-items: center;
}

/* ─── Tags (foreground / goals) ───────────── */
.fe-tag-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  align-items: center;
}
.fe-tag {
  display: inline-flex;
  align-items: center;
  background: var(--md-primary-ctr);
  color: var(--md-on-primary-ctr);
  border: none;
  border-radius: var(--md-shape-xs);
  padding: 4px 6px 4px 12px;
  font-size: 13px;
  font-weight: 500;
  gap: 2px;
  height: 32px;
  box-sizing: border-box;
}
.fe-tag-small {
  background: #f3e8fd;
  color: #4a148c;
}
.fe-tag-rm {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: var(--md-shape-full);
  display: flex;
  align-items: center;
  color: var(--md-on-primary-ctr);
  opacity: .7;
  transition: opacity .15s, background .15s;
}
.fe-tag-rm:hover { opacity: 1; background: rgba(0,0,0,.08); }
.fe-tag-rm-icon { font-size: 16px; }
.fe-tag-add {
  width: 32px;
  height: 32px;
  border-radius: var(--md-shape-xs);
  border: 1px dashed var(--md-outline-var);
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-on-surface-var);
  transition: background .15s, border-color .15s;
  padding: 0;
}
.fe-tag-add:hover { background: var(--md-surface-ctr-low); border-color: var(--md-primary); }
.fe-tag-add-icon { font-size: 20px; }

/* ─── Option cards ────────────────────────── */
.fe-option-card {
  position: relative;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-sm);
  padding: 16px;
  margin: 10px 12px;
  background: var(--md-surface);
  transition: box-shadow .15s;
}
.fe-option-card:hover { box-shadow: var(--md-elev-1); }
.fe-option-rm {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--md-shape-full);
  padding: 4px;
  display: flex;
  align-items: center;
  color: var(--md-on-surface-var);
  transition: background .15s, color .15s;
}
.fe-option-rm:hover { background: var(--md-error-ctr); color: var(--md-error); }
.fe-option-rm .material-symbols-rounded { font-size: 20px; }

/* ─── Slots ───────────────────────────────── */
.fe-slot {
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-xs);
  padding: 10px 12px;
  margin-bottom: 10px;
  background: var(--md-surface-ctr-low);
}
.fe-slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-primary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: .5px;
}
.fe-slot-row {
  display: flex;
  gap: 8px;
}
.fe-slot-row .fe-input { flex: 1; }

/* ─── Affordances ─────────────────────────── */
.fe-affordance-row {
  display: flex;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--md-outline);
  align-items: flex-start;
}
.fe-affordance-row:last-child { border-bottom: none; }
.fe-affordance-name {
  min-width: 100px;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
  color: var(--md-on-surface);
}
.fe-affordance-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  flex: 1;
  align-items: center;
}
.fe-check-label {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  white-space: nowrap;
  color: var(--md-on-surface);
}
.fe-check-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--md-primary);
  cursor: pointer;
}

/* ─── Dials ───────────────────────────────── */
.fe-dials-body { padding: 8px 0; }
.fe-dial-card {
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-xs);
  margin: 8px 12px;
  padding: 10px 14px;
  background: var(--md-surface);
  transition: box-shadow .15s;
}
.fe-dial-card:hover { box-shadow: var(--md-elev-1); }
.fe-dial-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.fe-dial-key {
  font-weight: 500;
  font-size: 14px;
  color: var(--md-on-surface);
}
.fe-dial-grid {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 6px 10px;
  align-items: center;
}

/* ─── JSON preview ────────────────────────── */
.fe-json-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.fe-json-modal {
  background: var(--md-surface);
  border-radius: var(--md-shape-lg);
  padding: 24px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
  box-shadow: var(--md-elev-3);
}
.fe-json-pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
  max-height: 60vh;
  overflow: auto;
  color: var(--md-on-surface);
  background: var(--md-surface-ctr-low);
  padding: 16px;
  border-radius: var(--md-shape-sm);
  margin-bottom: 16px;
}

/* ─── Responsive ──────────────────────────── */
@media (max-width: 600px) {
  .fe-card-header { flex-direction: column; align-items: flex-start; }
  .fe-slot-row { flex-direction: column; }
  .fe-dial-grid { grid-template-columns: auto 1fr; }
  .fe-affordance-row { flex-direction: column; }
}
`;

// Make FormEditor available globally for non-module contexts
window.FormEditor = FormEditor;
