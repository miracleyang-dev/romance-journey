const App = (() => {
  let data = Store.cloneDefault();
  let currentTab = 'home';
  let subPage = null;
  let currentSeriesId = null;
  let _treatyDragIdx = null;
  let _treatyEditMode = false;

  /* ===== 模块注册 ===== */

  const ALL_MODULES = [
    { key:'home',       label:'首页',     emoji:'&#127968;', title:'恋爱日志',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { key:'dates',      label:'约会',     emoji:'&#10084;&#65039;', title:'约会记录',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
    { key:'milestones', label:'节点',     emoji:'&#128336;', title:'节点',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { key:'plans',      label:'愿望',     emoji:'&#127873;', title:'愿望瓶',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2h6l1 7H8L9 2z"/><rect x="5" y="9" width="14" height="13" rx="2"/></svg>' },
    { key:'treaty',     label:'条约',     emoji:'&#128220;', title:'恋爱条约',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>' },
    { key:'memo',       label:'备忘',     emoji:'&#128221;', title:'备忘',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { key:'travel',     label:'旅行足迹', emoji:'&#9992;&#65039;', title:'旅行足迹',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
    { key:'series',     label:'系列',     emoji:'&#128218;', title:'系列',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
    { key:'heartwords', label:'情书',     emoji:'&#128140;', title:'情书',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' },
    { key:'questions',  label:'提问箱',   emoji:'&#128172;', title:'提问箱',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v.01"/><path d="M12 14c0-2 1.5-2.5 1.5-4a1.5 1.5 0 1 0-3 0"/></svg>' },
    { key:'suggestions', label:'建议箱', emoji:'&#128230;', title:'建议箱',
      icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v8"/><path d="M8 7l4 4 4-4"/></svg>' },
  ];

  const DEFAULT_CONFIG = [
    { key:'home', nav:true }, { key:'dates', nav:true },
    { key:'milestones', nav:true }, { key:'plans', nav:true },
    { key:'treaty', nav:false }, { key:'memo', nav:false },
    { key:'travel', nav:false }, { key:'series', nav:false },
    { key:'heartwords', nav:false }, { key:'questions', nav:false },
    { key:'suggestions', nav:false },
  ];

  const MORE_TAB = { key:'more', label:'更多', icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' };

  const RENDERERS = {
    home: renderHome, dates: renderDates, milestones: renderMilestones,
    plans: renderPlans, treaty: renderTreaty, memo: renderMemo,
    travel: renderTravel, series: renderSeries, heartwords: renderHeartwords,
    questions: renderQuestions, suggestions: renderSuggestions,
    more: renderMore, settings: renderSettings,
  };

  /* ===== 导航配置 ===== */

  function getConfig() {
    if (!data.navConfig || !Array.isArray(data.navConfig)) return DEFAULT_CONFIG.map(c => ({...c}));
    const cfg = data.navConfig.slice();
    for (const d of DEFAULT_CONFIG) {
      if (!cfg.find(c => c.key === d.key)) cfg.push({...d});
    }
    return cfg;
  }

  function getNavTabs() {
    const tabs = getConfig().filter(c => c.nav)
      .map(c => ALL_MODULES.find(m => m.key === c.key)).filter(Boolean);
    tabs.push(MORE_TAB);
    return tabs;
  }

  function getMoreModules() {
    return getConfig().filter(c => !c.nav)
      .map(c => ALL_MODULES.find(m => m.key === c.key)).filter(Boolean);
  }

  function renderNav() {
    document.getElementById('bottomnav').innerHTML = getNavTabs().map(t =>
      `<button class="navitem ${currentTab === t.key ? 'active' : ''}" data-tab="${t.key}">${t.icon}<span>${t.label}</span></button>`
    ).join('');
  }

  /* ===== 初始化 & 路由 ===== */

  let _navBound = false;
  async function init() {
    Store.init();
    if (!_navBound) {
      document.getElementById('bottomnav').addEventListener('click', e => {
        const btn = e.target.closest('.navitem');
        if (btn) goTab(btn.dataset.tab);
      });
      _navBound = true;
    }
    const loaded = await Store.load();
    if (!loaded) { Auth.renderAuthScreen(); return; }
    if (loaded._needPair) { Auth.renderPairScreen(); return; }
    data = loaded;

    const changedModules = Store.detectChanges(data);
    Store.saveSnapshot(data);
    Store.subscribe(newData => { data = newData; Store.saveSnapshot(data); renderNav(); render(); });
    renderNav();
    render();

    if (changedModules.length > 0) {
      setTimeout(() => _showChangeNotification(changedModules), 400);
    }
  }

  function goTab(tab) {
    currentTab = tab; subPage = null; currentSeriesId = null;
    if (tab === 'settings') {
      document.querySelectorAll('.navitem').forEach(n => n.classList.remove('active'));
    } else {
      renderNav();
    }
    render(); scrollTop();
  }

  function goSub(page, seriesId) {
    if (page === 'seriesDetail') { subPage = 'seriesDetail'; currentSeriesId = seriesId; }
    render(); scrollTop();
  }

  function goBack() {
    if (subPage === 'seriesDetail') { subPage = null; currentSeriesId = null; currentTab = 'series'; }
    else { subPage = null; }
    render();
  }

  function scrollTop() { document.getElementById('main').scrollTo(0, 0); }

  function render() {
    const m = document.getElementById('main');
    document.getElementById('backBtn').hidden = !subPage;

    if (subPage === 'seriesDetail') {
      document.getElementById('topTitle').textContent = '系列详情';
      m.innerHTML = renderSeriesDetail();
      return;
    }

    const mod = ALL_MODULES.find(x => x.key === currentTab);
    const specialTitles = { more: '更多', settings: '设置' };
    document.getElementById('topTitle').textContent =
      specialTitles[currentTab] || (mod ? mod.title : '恋爱日志');
    m.innerHTML = (RENDERERS[currentTab] || renderHome)();
  }

  /* ===== 通用工具 ===== */

  function diffDays(a, b) { return Math.max(0, Math.floor((b - a) / 864e5)); }
  function today0() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function fmtDate(s) { return s ? s.replace(/-/g, '.') : ''; }
  function v(id) { return (document.getElementById(id)?.value || '').trim(); }
  function rawV(id) { return document.getElementById(id)?.value || ''; }

  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function nextSolarForMilestone(ms) {
    if (ms.isLunar) return Lunar.nextOccurrence(ms.month, ms.day);
    const now = today0();
    let d = new Date(now.getFullYear(), ms.month - 1, ms.day);
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  function fmtDateRange(item) {
    if (item.dateEnd && item.dateEnd !== item.date) {
      const a = item.date.split('-'), b = item.dateEnd.split('-');
      const startStr = a[0] + '.' + a[1] + '.' + a[2];
      const endStr = (a[0] === b[0]) ? b[1] + '.' + b[2] : b[0] + '.' + b[1] + '.' + b[2];
      return startStr + ' ~ ' + endStr;
    }
    return fmtDate(item.date);
  }

  function fmtNextDate(d) {
    if (!d) return '';
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  function nameOptions(selectedValue, emptyLabel = '不署名') {
    const nameA = data.couple.nameA || '', nameB = data.couple.nameB || '';
    let html = `<option value="" ${!selectedValue ? 'selected' : ''}>${emptyLabel}</option>`;
    if (nameA) html += `<option value="${esc(nameA)}" ${selectedValue === nameA ? 'selected' : ''}>${esc(nameA)}</option>`;
    if (nameB) html += `<option value="${esc(nameB)}" ${selectedValue === nameB ? 'selected' : ''}>${esc(nameB)}</option>`;
    return html;
  }

  function nameOptionsRequired(selectedValue) {
    const nameA = data.couple.nameA || '', nameB = data.couple.nameB || '';
    const sel = selectedValue || nameA;
    let html = '';
    if (nameA) html += `<option value="${esc(nameA)}" ${sel === nameA ? 'selected' : ''}>${esc(nameA)}</option>`;
    if (nameB) html += `<option value="${esc(nameB)}" ${sel === nameB ? 'selected' : ''}>${esc(nameB)}</option>`;
    return html;
  }

  function needNames() {
    return !(data.couple.nameA && data.couple.nameB);
  }

  function actionBtns(editFn, delFn) {
    return `<div class="card__actions"><button onclick="App.${editFn}">编辑</button><button class="del" onclick="App.${delFn}">删除</button></div>`;
  }
  function addBtn(text, fn) { return `<button class="add-btn" onclick="App.${fn}">+ ${text}</button>`; }
  function empty(text) { return `<div class="empty">${text}</div>`; }

  function toggleDateRange() {
    const sel = document.getElementById('f_datetype');
    const wrap = document.getElementById('dateEndWrap');
    if (!sel || !wrap) return;
    wrap.style.display = sel.value === 'range' ? '' : 'none';
  }

  /* ===== 弹窗 ===== */

  function showModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.add('visible');
  }
  function closeModal() { document.getElementById('modalOverlay').classList.remove('visible'); }

  /* ===== CRUD ===== */

  function saveItem(key, id, fields) {
    if (!data[key]) data[key] = [];
    if (id) {
      const idx = data[key].findIndex(i => i.id === id);
      if (idx >= 0) Object.assign(data[key][idx], fields);
    } else {
      fields.id = Store.nextId(data[key]);
      data[key].push(fields);
    }
    persist();
  }

  function del(key, id) {
    if (!confirm('确定删除？')) return;
    data[key] = (data[key] || []).filter(i => i.id !== id);
    persist(); closeModal(); render();
  }

  function persist() { Store.save(data); Store.saveSnapshot(data); }

  /* ===== HOME ===== */

  function renderHome() {
    const start = data.couple.startDate;
    let heroHtml;
    if (start) {
      const days = diffDays(new Date(start), new Date());
      const na = data.couple.nameA || '我', nb = data.couple.nameB || '你';
      heroHtml = `<div class="hero"><div class="hero__heart">&hearts;</div><div class="hero__days">${days}</div><div class="hero__names">${esc(na)} & ${esc(nb)} 在一起的第 ${days} 天</div></div>`;
    } else {
      heroHtml = `<div class="hero"><div class="hero__heart">&hearts;</div><div class="hero__days">0</div><div class="hero__hint">点击右上角设置，填写关系确定日</div></div>`;
    }

    let upHtml = '';
    const msList = (data.milestones || []).map(ms => {
      const next = nextSolarForMilestone(ms);
      return { ...ms, _next: next, _days: next ? diffDays(today0(), next) : 9999 };
    }).sort((a, b) => a._days - b._days).slice(0, 6);
    if (msList.length) {
      upHtml = `<div class="section"><div class="section__head"><span class="section__title">近期节点</span><button class="section__more" onclick="App.goTab('milestones')">查看全部</button></div><div class="upcoming-strip">${msList.map(a => `<div class="upcoming-chip"><div class="upcoming-chip__days">${a._days === 0 ? '今天' : a._days + '天'}</div><div class="upcoming-chip__label">${esc(a.title)}</div></div>`).join('')}</div></div>`;
    }

    const photos = data.photos || [];
    let photoHtml = `<div class="section"><div class="section__head"><span class="section__title">照片墙</span></div><div class="photo-wall">`;
    photoHtml += photos.map(p => `<div class="photo-wall__item" onclick="App.viewPhoto(${p.id})"><img src="${p.src}" alt=""></div>`).join('');
    photoHtml += `<div class="photo-wall__add" onclick="document.getElementById('photoInput').click()">+<input type="file" id="photoInput" accept="image/*" hidden onchange="App.addPhoto(event)"></div></div></div>`;
    return heroHtml + upHtml + photoHtml;
  }

  async function addPhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    const src = await Store.uploadImage(file);
    if (!data.photos) data.photos = [];
    data.photos.push({ id: Store.nextId(data.photos), src, note: '' });
    persist(); render();
  }

  function viewPhoto(id) {
    const p = (data.photos || []).find(i => i.id === id); if (!p) return;
    showModal('照片', `<div style="text-align:center"><img src="${p.src}" style="max-width:100%;border-radius:8px"></div><div class="modal__footer"><button class="btn-secondary" style="color:#c0392b" onclick="App.del('photos',${p.id})">删除</button></div>`);
  }

  /* ===== MILESTONES ===== */

  function renderMilestones() {
    const items = (data.milestones || []).map(ms => {
      const next = nextSolarForMilestone(ms);
      return { ...ms, _next: next, _days: next ? diffDays(today0(), next) : 9999 };
    }).sort((a, b) => a._days - b._days);

    if (!items.length) return `<div class="ms-hero"><div class="ms-hero__days" style="font-size:1.5rem;color:var(--text3)">暂无节点</div></div>` + addBtn('添加节点', 'editMilestone()');

    const first = items[0], rest = items.slice(1);
    let html = `<div class="ms-hero"><div class="ms-hero__label">距离下一个节点</div><div class="ms-hero__title">${esc(first.title)}</div><div class="ms-hero__days">${first._days === 0 ? '今天！' : first._days + ' 天'}</div><div class="ms-hero__date">${first.isLunar ? '农历' : '公历'} ${first.month}月${first.day}日 · 下次 ${fmtNextDate(first._next)}</div><div class="ms-hero__actions"><button onclick="App.editMilestone(${first.id})">编辑</button><button class="del" onclick="App.del('milestones',${first.id})">删除</button></div></div>`;
    html += `<div class="ms-list">`;
    rest.forEach(i => {
      html += `<div class="ms-card"><div class="ms-card__left"><div class="ms-card__title">${esc(i.title)}</div><div class="ms-card__info">${i.isLunar ? '农历' : '公历'} ${i.month}月${i.day}日</div></div><div class="ms-card__right"><div class="ms-card__next">下次 ${fmtNextDate(i._next)}</div><div class="ms-card__actions"><button onclick="App.editMilestone(${i.id})">编辑</button><button onclick="App.del('milestones',${i.id})" style="color:#c0392b">删除</button></div></div></div>`;
    });
    html += `</div>` + addBtn('添加节点', 'editMilestone()');
    return html;
  }

  function editMilestone(id) {
    const item = id ? (data.milestones || []).find(i => i.id === id) : { title: '', month: new Date().getMonth() + 1, day: new Date().getDate(), isLunar: false };
    const months = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${item.month === (i + 1) ? 'selected' : ''}>${i + 1}月</option>`).join('');
    const days = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${item.day === (i + 1) ? 'selected' : ''}>${i + 1}日</option>`).join('');
    showModal(id ? '编辑节点' : '添加节点', `
      <label>名称</label><input id="f_title" value="${esc(item.title)}" placeholder="例：恋爱纪念日">
      <label>日历类型</label><select id="f_lunar"><option value="0" ${!item.isLunar ? 'selected' : ''}>公历</option><option value="1" ${item.isLunar ? 'selected' : ''}>农历</option></select>
      <label>月</label><select id="f_month">${months}</select>
      <label>日</label><select id="f_day">${days}</select>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveMilestone(${id || 0})">保存</button></div>`);
  }

  function saveMilestone(id) {
    saveItem('milestones', id, { title: v('f_title'), month: parseInt(v('f_month')), day: parseInt(v('f_day')), isLunar: v('f_lunar') === '1' });
    closeModal(); render();
  }

  /* ===== DATES ===== */

  function renderDates() {
    const items = (data.dates || []).slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!items.length) return addBtn('添加约会', 'editDate()') + empty('还没有约会记录');
    const countHtml = `<div class="dates-header"><div class="dates-header__count">共记录了 <strong>${items.length}</strong> 次约会</div></div>`;
    return addBtn('添加约会', 'editDate()') + countHtml + items.map(i => {
      const isRange = !!(i.dateEnd && i.dateEnd !== i.date);
      return `<div class="date-card">
        <div class="date-card__accent"></div>
        <div class="date-card__inner">
          <div class="date-card__top"><span class="date-card__tag ${isRange ? 'range' : ''}">${fmtDateRange(i)}</span></div>
          <div class="date-card__title">${esc(i.event)}</div>
          ${i.note ? `<div class="date-card__note">${esc(i.note)}</div>` : ''}
          <div class="card__actions"><button onclick="App.editDate(${i.id})">编辑</button><button class="del" onclick="App.del('dates',${i.id})">删除</button></div>
        </div>
      </div>`;
    }).join('');
  }

  function editDate(id) {
    const item = id ? (data.dates || []).find(i => i.id === id) : { date: todayISO(), dateEnd: '', event: '', note: '' };
    if (!item) return;
    const isRange = !!(item.dateEnd && item.dateEnd !== item.date);
    showModal(id ? '编辑约会' : '添加约会', `
      <label>时间类型</label>
      <select id="f_datetype" onchange="App.toggleDateRange()">
        <option value="point" ${!isRange ? 'selected' : ''}>单日</option>
        <option value="range" ${isRange ? 'selected' : ''}>时间段</option>
      </select>
      <label>日期</label><input type="date" id="f_date" value="${item.date}">
      <div id="dateEndWrap" style="${isRange ? '' : 'display:none'}">
        <label>结束日期</label><input type="date" id="f_dateEnd" value="${item.dateEnd || ''}">
      </div>
      <label>事件</label><input id="f_event" value="${esc(item.event)}" placeholder="约会事件">
      <label>备注</label><textarea id="f_note">${esc(item.note)}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveDate(${id || 0})">保存</button></div>`);
  }

  function saveDate(id) {
    const isRange = v('f_datetype') === 'range';
    saveItem('dates', id, { date: v('f_date'), dateEnd: isRange ? v('f_dateEnd') : '', event: v('f_event'), note: v('f_note') });
    closeModal(); render();
  }

  /* ===== PLANS ===== */

  function renderPlans() {
    const items = (data.plans || []).slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
    const slips = items.map((p, idx) => {
      const t = p.done ? `<span class="done-mark">${esc(p.title)}</span>` : esc(p.title);
      return `<div class="note-slip note-colors-${idx % 6}" onclick="App.viewPlan(${p.id})">${t}</div>`;
    }).join('');
    return `<div class="bottle-scene"><div class="bottle"><div class="bottle__cork"></div>${slips || '<div class="empty" style="padding:2rem 0;font-size:.8rem">瓶子是空的，放入第一张纸条吧</div>'}</div><button class="bottle-add" onclick="App.editPlan()">+ 塞入纸条</button></div>`;
  }

  function viewPlan(id) {
    const p = (data.plans || []).find(i => i.id === id); if (!p) return;
    showModal('纸条详情', `<div style="text-align:center;padding:.5rem 0"><div style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">${esc(p.title)}</div><div><span class="card__tag ${p.type === 'long' ? 'blue' : 'red'}">${p.type === 'long' ? '长期' : '短期'}</span><span class="card__tag ${p.done ? 'green' : 'purple'}">${p.done ? '已完成' : '进行中'}</span></div>${p.note ? `<div style="margin-top:.8rem;font-size:.88rem;color:var(--text2);text-align:left;padding:.6rem;background:var(--surface2);border-radius:8px">${esc(p.note)}</div>` : ''}</div><div class="modal__footer"><button class="btn-secondary" onclick="App.togglePlan(${p.id})">${p.done ? '恢复' : '完成'}</button><button class="btn-secondary" onclick="App.closeModal();App.editPlan(${p.id})">编辑</button><button class="btn-secondary" style="color:#c0392b" onclick="App.del('plans',${p.id})">删除</button></div>`);
  }

  function editPlan(id) {
    const item = id ? (data.plans || []).find(i => i.id === id) : { title: '', type: 'short', done: false, note: '' };
    showModal(id ? '编辑纸条' : '写一张纸条', `
      <label>内容</label><input id="f_title" value="${esc(item.title)}" placeholder="想一起做的事">
      <label>类型</label><select id="f_type"><option value="short" ${item.type === 'short' ? 'selected' : ''}>短期</option><option value="long" ${item.type === 'long' ? 'selected' : ''}>长期</option></select>
      <label>备注</label><textarea id="f_note">${esc(item.note)}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.savePlan(${id || 0})">塞入瓶子</button></div>`);
  }

  function savePlan(id) {
    const obj = { title: v('f_title'), type: v('f_type'), note: v('f_note') };
    if (id) { const old = (data.plans || []).find(i => i.id === id); obj.done = old ? old.done : false; }
    else obj.done = false;
    saveItem('plans', id, obj); closeModal(); render();
  }

  function togglePlan(id) {
    const p = (data.plans || []).find(i => i.id === id);
    if (p) { p.done = !p.done; persist(); closeModal(); render(); }
  }

  /* ===== TREATY ===== */

  function renderTreaty() {
    const items = data.treaties || [];
    const subCount = items.reduce((s, t) => s + ((t.children || []).length), 0);
    const modeClass = _treatyEditMode ? 'treaty--edit' : 'treaty--read';
    const modeLabel = _treatyEditMode ? '阅读模式' : '编辑模式';
    const modeIcon = _treatyEditMode
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    let header = `<div class="treaty-header"><div class="treaty-header__icon">&#128220;</div><div class="treaty-header__title">${esc(data.couple.nameA || '我')} & ${esc(data.couple.nameB || '你')} 的恋爱条约</div><div class="treaty-header__count">共 ${items.length} 条主条约${subCount ? '，' + subCount + ' 条子条约' : ''}</div>${items.length ? `<button class="treaty-mode-btn" onclick="App.toggleTreatyMode()">${modeIcon}<span>${modeLabel}</span></button>` : ''}</div>`;

    if (!items.length) return header + empty('还没有条约，一起制定属于你们的约定吧') + addBtn('添加条款', 'editTreaty()');

    let list = `<div class="treaty-list ${modeClass}" id="treatyList">` + items.map((t, idx) => {
      const children = t.children || [];
      let childrenHtml = '';
      if (children.length) {
        childrenHtml = `<div class="treaty-children">${children.map((c, ci) =>
          `<div class="treaty-sub"><div class="treaty-sub__num">${idx + 1}.${ci + 1}</div><div class="treaty-sub__content">${esc(c.content)}</div><div class="treaty-sub__actions treaty-edit-only"><button onclick="App.editSubTreaty(${t.id},${c.id})">编辑</button><button class="del" onclick="App.delSubTreaty(${t.id},${c.id})">删除</button></div></div>`
        ).join('')}</div>`;
      }
      const draggable = _treatyEditMode ? 'true' : 'false';
      return `<div class="treaty-item" draggable="${draggable}" data-tidx="${idx}" ondragstart="App.treatyDragStart(event,${idx})" ondragover="App.treatyDragOver(event,${idx})" ondragleave="App.treatyDragLeave(event)" ondrop="App.treatyDrop(event,${idx})" ondragend="App.treatyDragEnd(event)">
        <div class="treaty-drag-handle treaty-edit-only" title="拖拽排序">&#9776;</div>
        <div class="treaty-item__num">第${idx + 1}条</div>
        <div class="treaty-item__content">${esc(t.content)}</div>
        ${childrenHtml}
        <div class="card__actions treaty-edit-only"><button onclick="App.editSubTreaty(${t.id},0)">+子条约</button><button onclick="App.editTreaty(${t.id})">编辑</button><button class="del" onclick="App.del('treaties',${t.id})">删除</button></div>
      </div>`;
    }).join('') + `</div>`;

    return header + list + (_treatyEditMode ? addBtn('添加条款', 'editTreaty()') : '');
  }

  function toggleTreatyMode() { _treatyEditMode = !_treatyEditMode; render(); }

  function treatyDragStart(e, idx) { _treatyDragIdx = idx; e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
  function treatyDragOver(e, idx) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (idx !== _treatyDragIdx) e.currentTarget.classList.add('drag-over'); }
  function treatyDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
  function treatyDrop(e, toIdx) {
    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
    if (_treatyDragIdx === null || _treatyDragIdx === toIdx) return;
    const arr = data.treaties || [];
    const [moved] = arr.splice(_treatyDragIdx, 1);
    arr.splice(toIdx, 0, moved);
    _treatyDragIdx = null; persist(); render();
  }
  function treatyDragEnd(e) { _treatyDragIdx = null; e.currentTarget.classList.remove('dragging'); document.querySelectorAll('.treaty-item').forEach(el => el.classList.remove('drag-over')); }

  function editTreaty(id) {
    const item = id ? (data.treaties || []).find(i => i.id === id) : { content: '' };
    showModal(id ? '编辑条款' : '添加条款', `
      <label>条款内容</label>
      <textarea id="f_content" style="min-height:100px" placeholder="写下你们的约定">${esc(item.content)}</textarea>
      <div class="hint-text">参考：不许和异性单独吃饭 / 吵架不过夜 / 每周至少约会一次 / 重要节日必须一起过 / 手机可以互相看</div>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveTreaty(${id || 0})">保存</button></div>`);
  }

  function saveTreaty(id) {
    const content = rawV('f_content');
    if (!content.trim()) return;
    if (!data.treaties) data.treaties = [];
    if (id) {
      const idx = data.treaties.findIndex(i => i.id === id);
      if (idx >= 0) data.treaties[idx].content = content;
    } else {
      data.treaties.push({ id: Store.nextId(data.treaties), content: content.trim(), children: [] });
    }
    persist(); closeModal(); render();
  }

  function editSubTreaty(parentId, childId) {
    const parent = (data.treaties || []).find(i => i.id === parentId); if (!parent) return;
    const child = childId ? (parent.children || []).find(c => c.id === childId) : { content: '' };
    showModal(childId ? '编辑子条约' : '添加子条约', `
      <label>所属主条约</label>
      <div style="font-size:.85rem;color:var(--text2);padding:.4rem .6rem;background:var(--surface2);border-radius:8px;margin-bottom:.4rem">${esc(parent.content)}</div>
      <label>子条约内容</label>
      <textarea id="f_sub_content" style="min-height:80px" placeholder="补充细则">${esc(child.content)}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveSubTreaty(${parentId},${childId || 0})">保存</button></div>`);
  }

  function saveSubTreaty(parentId, childId) {
    const content = rawV('f_sub_content');
    if (!content.trim()) return;
    const parent = (data.treaties || []).find(i => i.id === parentId); if (!parent) return;
    if (!parent.children) parent.children = [];
    if (childId) {
      const idx = parent.children.findIndex(c => c.id === childId);
      if (idx >= 0) parent.children[idx].content = content;
    } else {
      parent.children.push({ id: Store.nextId(parent.children), content: content.trim() });
    }
    persist(); closeModal(); render();
  }

  function delSubTreaty(parentId, childId) {
    if (!confirm('确定删除子条约？')) return;
    const parent = (data.treaties || []).find(i => i.id === parentId); if (!parent) return;
    parent.children = (parent.children || []).filter(c => c.id !== childId);
    persist(); render();
  }

  /* ===== MORE ===== */

  function renderMore() {
    const mods = getMoreModules();
    if (!mods.length) return empty('所有功能已在底部导航栏显示');
    return `<div class="more-grid">${mods.map(mod =>
      `<div class="more-item" onclick="App.goTab('${mod.key}')"><div class="more-item__icon">${mod.emoji}</div><div class="more-item__label">${mod.label}</div></div>`
    ).join('')}</div>`;
  }

  /* ===== MEMO ===== */

  function renderMemo() {
    const items = (data.memos || []).slice().sort((a, b) => b.id - a.id);
    if (!items.length) return empty('对方的喜好、家里的密码、重要的事都放这') + addBtn('添加备忘', 'editMemo()');
    return items.map(i => `<div class="card" onclick="App.viewMemo(${i.id})"><div class="card__title">${esc(i.title)}</div><div class="card__note">${esc(i.content)}</div>${actionBtns(`editMemo(${i.id})`, `del('memos',${i.id})`)}</div>`).join('') + addBtn('添加备忘', 'editMemo()');
  }

  function viewMemo(id) {
    const item = (data.memos || []).find(i => i.id === id); if (!item) return;
    showModal(item.title, `<div style="white-space:pre-wrap;font-size:.9rem;line-height:1.6">${esc(item.content)}</div><div class="modal__footer"><button class="btn-secondary" onclick="App.closeModal();App.editMemo(${item.id})">编辑</button><button class="btn-secondary" style="color:#c0392b" onclick="App.del('memos',${item.id})">删除</button></div>`);
  }

  function editMemo(id) {
    const item = id ? (data.memos || []).find(i => i.id === id) : { title: '', content: '' };
    showModal(id ? '编辑备忘' : '添加备忘', `
      <label>标题</label><input id="f_title" value="${esc(item.title)}" placeholder="例：共同银行卡号">
      <div class="hint-text">例：共同银行卡号 / 对方衣服尺码 / WiFi密码 / 家务排班 / 常用地址</div>
      <label>内容</label><textarea id="f_content" style="min-height:120px">${esc(item.content)}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveMemo(${id || 0})">保存</button></div>`);
  }

  function saveMemo(id) {
    saveItem('memos', id, { title: v('f_title'), content: rawV('f_content') });
    closeModal(); render();
  }

  /* ===== TRAVEL ===== */

  function renderTravel() {
    const items = (data.travels || []).slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!items.length) return empty('记录你们一起走过的地方') + addBtn('添加足迹', 'editTravel()');
    const summary = `<div style="text-align:center;padding:.8rem 0;font-size:.9rem;color:var(--text2)">已打卡 <strong style="color:var(--accent);font-size:1.2rem">${items.length}</strong> 个地方</div>`;
    return summary + items.map(i => `<div class="travel-card"><div class="travel-card__place">${esc(i.place)}</div><div class="travel-card__date">${fmtDateRange(i)}</div>${i.note ? `<div class="travel-card__note">${esc(i.note)}</div>` : ''}${actionBtns(`editTravel(${i.id})`, `del('travels',${i.id})`)}</div>`).join('') + addBtn('添加足迹', 'editTravel()');
  }

  function editTravel(id) {
    const item = id ? (data.travels || []).find(i => i.id === id) : { place: '', date: todayISO(), dateEnd: '', note: '' };
    const isRange = !!(item.dateEnd && item.dateEnd !== item.date);
    showModal(id ? '编辑足迹' : '添加足迹', `
      <label>地点</label><input id="f_place" value="${esc(item.place)}" placeholder="城市或景点名称">
      <label>时间类型</label>
      <select id="f_datetype" onchange="App.toggleDateRange()">
        <option value="point" ${!isRange ? 'selected' : ''}>单日</option>
        <option value="range" ${isRange ? 'selected' : ''}>时间段</option>
      </select>
      <label>日期</label><input type="date" id="f_date" value="${item.date}">
      <div id="dateEndWrap" style="${isRange ? '' : 'display:none'}">
        <label>结束日期</label><input type="date" id="f_dateEnd" value="${item.dateEnd || ''}">
      </div>
      <label>备注</label><textarea id="f_note">${esc(item.note)}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveTravel(${id || 0})">保存</button></div>`);
  }

  function saveTravel(id) {
    const isRange = v('f_datetype') === 'range';
    saveItem('travels', id, { place: v('f_place'), date: v('f_date'), dateEnd: isRange ? v('f_dateEnd') : '', note: v('f_note') });
    closeModal(); render();
  }

  /* ===== SERIES ===== */

  function renderSeries() {
    const items = (data.series || []).slice().sort((a, b) => b.id - a.id);
    if (!items.length) return empty('创建「电影系列」「美食探店」等专属合集') + addBtn('添加系列', 'editSeriesTitle()');
    return items.map(i => {
      const cnt = (i.items || []).length;
      return `<div class="series-card" onclick="App.goSub('seriesDetail',${i.id})"><div><div class="series-card__title">${esc(i.title)}</div><div class="series-card__count">${cnt} 条记录${i.note ? ' · ' + esc(i.note) : ''}</div></div><span class="series-card__arrow">&rsaquo;</span></div>`;
    }).join('') + addBtn('添加系列', 'editSeriesTitle()');
  }

  function editSeriesTitle(id) {
    const item = id ? (data.series || []).find(i => i.id === id) : { title: '', note: '' };
    showModal(id ? '编辑系列' : '新建系列', `
      <label>系列名称</label><input id="f_title" value="${esc(item.title)}" placeholder="例：一起看过的电影">
      <label>简介</label><textarea id="f_note">${esc(item.note)}</textarea>
      <div class="modal__footer">${id ? `<button class="btn-secondary" style="color:#c0392b" onclick="App.delSeries(${id})">删除系列</button>` : ''}<button class="btn-primary" onclick="App.saveSeriesTitle(${id || 0})">保存</button></div>`);
  }

  function saveSeriesTitle(id) {
    if (id) {
      const s = (data.series || []).find(i => i.id === id);
      if (s) { s.title = v('f_title'); s.note = v('f_note'); }
    } else {
      if (!data.series) data.series = [];
      data.series.push({ id: Store.nextId(data.series), title: v('f_title'), note: v('f_note'), items: [] });
    }
    persist(); closeModal(); render();
  }

  function delSeries(id) {
    if (!confirm('删除整个系列及所有记录？')) return;
    data.series = (data.series || []).filter(i => i.id !== id);
    persist(); closeModal(); currentSeriesId = null; currentTab = 'series'; subPage = null; render();
  }

  function renderSeriesDetail() {
    const s = (data.series || []).find(i => i.id === currentSeriesId);
    if (!s) return empty('系列不存在');
    let html = `<div style="margin-bottom:.8rem"><div style="font-size:1.1rem;font-weight:700">${esc(s.title)}</div>${s.note ? `<div style="font-size:.82rem;color:var(--text2);margin-top:.2rem">${esc(s.note)}</div>` : ''}<button class="btn-secondary" style="margin-top:.4rem;font-size:.75rem;padding:.3rem .8rem" onclick="App.editSeriesTitle(${s.id})">编辑系列</button></div>`;
    const items = (s.items || []).slice().sort((a, b) => b.id - a.id);
    if (!items.length) html += empty('暂无记录');
    items.forEach(i => { html += `<div class="series-detail-item"><div class="card__date" style="margin-bottom:.2rem">${fmtDate(i.date)}</div><div class="card__title">${esc(i.title)}</div>${i.content ? `<div class="card__note">${esc(i.content)}</div>` : ''}${actionBtns(`editSeriesItem(${s.id},${i.id})`, `delSeriesItem(${s.id},${i.id})`)}</div>`; });
    html += addBtn('添加记录', `editSeriesItem(${s.id})`);
    return html;
  }

  function editSeriesItem(seriesId, itemId) {
    const s = (data.series || []).find(i => i.id === seriesId); if (!s) return;
    const item = itemId ? (s.items || []).find(i => i.id === itemId) : { title: '', date: todayISO(), content: '' };
    showModal(itemId ? '编辑记录' : '添加记录', `
      <label>标题</label><input id="f_title" value="${esc(item.title)}" placeholder="记录标题">
      <label>日期</label><input type="date" id="f_date" value="${item.date}">
      <label>内容</label><textarea id="f_content">${esc(item.content)}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveSeriesItem(${seriesId},${itemId || 0})">保存</button></div>`);
  }

  function saveSeriesItem(seriesId, itemId) {
    const s = (data.series || []).find(i => i.id === seriesId); if (!s) return;
    if (!s.items) s.items = [];
    const fields = { title: v('f_title'), date: v('f_date'), content: rawV('f_content') };
    if (itemId) { const idx = s.items.findIndex(i => i.id === itemId); if (idx >= 0) Object.assign(s.items[idx], fields); }
    else { fields.id = Store.nextId(s.items); s.items.push(fields); }
    persist(); closeModal(); render();
  }

  function delSeriesItem(seriesId, itemId) {
    if (!confirm('确定删除？')) return;
    const s = (data.series || []).find(i => i.id === seriesId); if (!s) return;
    s.items = (s.items || []).filter(i => i.id !== itemId); persist(); render();
  }

  /* ===== HEARTWORDS (情书) ===== */

  function renderHeartwords() {
    const items = (data.heartwords || []).slice().sort((a, b) => b.id - a.id);
    if (!items.length) return empty('写下想对 TA 说的心里话，让文字传递真心') + addBtn('写情书', 'editHeartword()');
    return addBtn('写情书', 'editHeartword()') + `<div class="preview-list">${items.map(i => `<div class="preview-card preview-card--heartword" onclick="App.viewHeartword(${i.id})">
        <div class="preview-card__icon">&#128140;</div>
        <div class="preview-card__body">
          <div class="preview-card__text">${esc(i.content)}</div>
          <div class="preview-card__meta">${i.author ? `<span class="preview-card__author">${esc(i.author)}</span>` : ''}<span>${fmtDate(i.date)}</span></div>
        </div>
        <span class="preview-card__arrow">&rsaquo;</span>
      </div>`).join('')}</div>`;
  }

  function viewHeartword(id) {
    const i = (data.heartwords || []).find(x => x.id === id); if (!i) return;
    showModal('情书', `
      <div class="detail-view">
        <div class="detail-view__content">${esc(i.content)}</div>
        <div class="detail-view__meta">${i.author ? `<span style="color:var(--accent);font-weight:600">${esc(i.author)}</span> · ` : ''}${fmtDate(i.date)}</div>
      </div>
      <div class="modal__footer"><button class="btn-secondary" onclick="App.closeModal();App.editHeartword(${i.id})">编辑</button><button class="btn-secondary" style="color:#c0392b" onclick="App.del('heartwords',${i.id})">删除</button></div>`);
  }

  function editHeartword(id) {
    if (needNames()) {
      showModal('请先设置称呼', `
        <div style="text-align:center;padding:1rem 0"><p style="font-size:.9rem;color:var(--text2);line-height:1.6">写情书前，请先在设置中填写双方称呼</p></div>
        <div class="modal__footer"><button class="btn-primary" onclick="App.closeModal();App.goTab('settings');App.editCouple()">前往设置</button></div>`);
      return;
    }
    const item = id ? (data.heartwords || []).find(i => i.id === id) : { content: '', date: todayISO(), author: '' };
    showModal(id ? '编辑情书' : '写情书', `
      <label>想对 TA 说的话</label>
      <textarea id="f_content" style="min-height:120px" placeholder="把心里话写在这里…">${esc(item.content)}</textarea>
      <label>署名</label><select id="f_author">${nameOptionsRequired(item.author)}</select>
      <label>日期</label><input type="date" id="f_date" value="${item.date}">
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveHeartword(${id || 0})">保存</button></div>`);
  }

  function saveHeartword(id) {
    saveItem('heartwords', id, { content: rawV('f_content'), date: v('f_date'), author: v('f_author') });
    closeModal(); render();
  }

  /* ===== QUESTIONS (提问箱) ===== */

  function renderQuestions() {
    const items = (data.questions || []).slice().sort((a, b) => b.id - a.id);
    if (!items.length) return empty('写下想问对方的问题，期待 TA 的真实回答') + addBtn('提个问题', 'editQuestion()');
    return addBtn('提个问题', 'editQuestion()') + `<div class="preview-list">${items.map(i => {
      const hasAnswer = !!(i.answer && i.answer.trim());
      return `<div class="preview-card preview-card--question ${hasAnswer ? 'answered' : ''}" onclick="App.viewQuestion(${i.id})">
        <div class="preview-card__icon">${hasAnswer ? '&#9989;' : '&#128172;'}</div>
        <div class="preview-card__body">
          <div class="preview-card__text">${esc(i.question)}</div>
          <div class="preview-card__meta"><span>${i.asker ? esc(i.asker) + ' · ' : ''}${fmtDate(i.date)}</span><span class="preview-card__status ${hasAnswer ? 'green' : ''}">${hasAnswer ? '已回答' : '等待回答'}</span></div>
        </div>
        <span class="preview-card__arrow">&rsaquo;</span>
      </div>`;
    }).join('')}</div>`;
  }

  function viewQuestion(id) {
    const i = (data.questions || []).find(x => x.id === id); if (!i) return;
    const hasAnswer = !!(i.answer && i.answer.trim());
    showModal('提问详情', `
      <div class="detail-view">
        <div class="detail-view__label">问题</div>
        <div class="detail-view__content">${esc(i.question)}</div>
        <div class="detail-view__meta">${i.asker ? esc(i.asker) + ' · ' : ''}${fmtDate(i.date)}</div>
        ${hasAnswer ? `<div class="detail-view__label" style="margin-top:.8rem">回答</div><div class="detail-view__answer">${esc(i.answer)}</div>` : `<div style="margin-top:.8rem;color:var(--text3);font-style:italic">等待回答…</div>`}
      </div>
      <div class="modal__footer">
        <button class="btn-secondary" onclick="App.closeModal();App.answerQuestion(${i.id})">${hasAnswer ? '修改回答' : '回答'}</button>
        <button class="btn-secondary" onclick="App.closeModal();App.editQuestion(${i.id})">编辑问题</button>
        <button class="btn-secondary" style="color:#c0392b" onclick="App.del('questions',${i.id})">删除</button>
      </div>`);
  }

  function editQuestion(id) {
    if (needNames()) {
      showModal('请先设置称呼', `
        <div style="text-align:center;padding:1rem 0"><p style="font-size:.9rem;color:var(--text2);line-height:1.6">提问前，请先在设置中填写双方称呼</p></div>
        <div class="modal__footer"><button class="btn-primary" onclick="App.closeModal();App.goTab('settings');App.editCouple()">前往设置</button></div>`);
      return;
    }
    const item = id ? (data.questions || []).find(i => i.id === id) : { question: '', date: todayISO(), asker: '', answer: '' };
    showModal(id ? '编辑问题' : '提个问题', `
      <label>你的问题</label>
      <textarea id="f_question" style="min-height:80px" placeholder="写下想问对方的问题…">${esc(item.question)}</textarea>
      <label>提问者</label><select id="f_asker">${nameOptionsRequired(item.asker)}</select>
      <label>日期</label><input type="date" id="f_date" value="${item.date}">
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveQuestion(${id || 0})">保存</button></div>`);
  }

  function saveQuestion(id) {
    const fields = { question: rawV('f_question'), date: v('f_date'), asker: v('f_asker') };
    if (id) { const old = (data.questions || []).find(i => i.id === id); fields.answer = old ? old.answer : ''; }
    else { fields.answer = ''; }
    saveItem('questions', id, fields); closeModal(); render();
  }

  function answerQuestion(id) {
    const item = (data.questions || []).find(i => i.id === id); if (!item) return;
    showModal('回答问题', `
      <div style="font-size:.9rem;color:var(--text2);padding:.6rem;background:var(--surface2);border-radius:8px;margin-bottom:.6rem"><strong>问：</strong>${esc(item.question)}</div>
      <label>你的回答</label>
      <textarea id="f_answer" style="min-height:100px" placeholder="写下你的真实回答…">${esc(item.answer || '')}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveAnswer(${id})">保存回答</button></div>`);
  }

  function saveAnswer(id) {
    const item = (data.questions || []).find(i => i.id === id); if (!item) return;
    item.answer = rawV('f_answer');
    persist(); closeModal(); render();
  }

  /* ===== SUGGESTIONS (默契贴) ===== */

  function renderSuggestions() {
    const items = (data.suggestions || []).slice().sort((a, b) => b.id - a.id);
    if (!items.length) return empty('每一次沟通，都是更靠近你') + addBtn('写建议', 'editSuggestion()');
    return addBtn('写建议', 'editSuggestion()') + `<div class="preview-list">${items.map(i => {
      const st = i.response ? 'responded' : (i.read ? 'read' : 'unread');
      const stLabel = i.response ? '已回应' : (i.read ? '已读' : '未读');
      const stClass = i.response ? 'green' : (i.read ? 'blue' : '');
      return `<div class="preview-card preview-card--suggestion ${st}" onclick="App.viewSuggestion(${i.id})">
        <div class="preview-card__icon">${i.response ? '&#9989;' : (i.read ? '&#128065;' : '&#128161;')}</div>
        <div class="preview-card__body">
          <div class="preview-card__text">${esc(i.content)}</div>
          <div class="preview-card__meta">
            <span>${esc(i.from)} &#10132; ${esc(i.to)} · ${fmtDate(i.date)}</span>
            <span class="preview-card__status ${stClass}">${stLabel}</span>
          </div>
        </div>
        <span class="preview-card__arrow">&rsaquo;</span>
      </div>`;
    }).join('')}</div>`;
  }

  function viewSuggestion(id) {
    const i = (data.suggestions || []).find(x => x.id === id); if (!i) return;
    const st = i.response ? '已回应' : (i.read ? '已读' : '未读');
    let html = `<div class="detail-view">
      <div class="detail-view__label">建议内容</div>
      <div class="detail-view__content">${esc(i.content)}</div>
      <div class="detail-view__meta">${esc(i.from)} &#10132; ${esc(i.to)} · ${fmtDate(i.date)}</div>`;
    if (i.read) {
      html += `<div class="detail-view__badge green">&#128065; 已读 · ${fmtDate(i.readDate)}</div>`;
    }
    if (i.response) {
      html += `<div class="detail-view__label" style="margin-top:.8rem">回应</div><div class="detail-view__answer">${esc(i.response)}</div><div style="font-size:.75rem;color:var(--text3);margin-top:.2rem">${fmtDate(i.responseDate)}</div>`;
    }
    html += `</div><div class="modal__footer">`;
    if (!i.read) html += `<button class="btn-primary" onclick="App.markSuggestionRead(${i.id})">确认已读</button>`;
    if (!i.response) html += `<button class="btn-secondary" onclick="App.closeModal();App.respondSuggestion(${i.id})">写回应</button>`;
    else html += `<button class="btn-secondary" onclick="App.closeModal();App.respondSuggestion(${i.id})">修改回应</button>`;
    html += `<button class="btn-secondary" onclick="App.closeModal();App.editSuggestion(${i.id})">编辑</button>`;
    html += `<button class="btn-secondary" style="color:#c0392b" onclick="App.del('suggestions',${i.id})">删除</button></div>`;
    showModal('建议详情', html);
  }

  function editSuggestion(id) {
    if (needNames()) {
      showModal('请先设置称呼', `
        <div style="text-align:center;padding:1rem 0"><p style="font-size:.9rem;color:var(--text2);line-height:1.6">写建议前，请先在设置中填写双方称呼</p></div>
        <div class="modal__footer"><button class="btn-primary" onclick="App.closeModal();App.goTab('settings');App.editCouple()">前往设置</button></div>`);
      return;
    }
    const item = id ? (data.suggestions || []).find(i => i.id === id) : { content: '', date: todayISO(), from: '', to: '' };
    const nameA = data.couple.nameA || '', nameB = data.couple.nameB || '';
    const fromVal = item.from || nameA;
    const toVal = item.to || nameB;
    showModal(id ? '编辑建议' : '写建议', `
      <label>建议内容</label>
      <textarea id="f_content" style="min-height:100px" placeholder="写下你对 TA 的相处建议…">${esc(item.content)}</textarea>
      <label>提出者</label><select id="f_from" onchange="App.syncSuggestionTo()">
        <option value="${esc(nameA)}" ${fromVal === nameA ? 'selected' : ''}>${esc(nameA)}</option>
        ${nameB ? `<option value="${esc(nameB)}" ${fromVal === nameB ? 'selected' : ''}>${esc(nameB)}</option>` : ''}
      </select>
      <label>给</label><select id="f_to">
        ${nameB ? `<option value="${esc(nameB)}" ${toVal === nameB ? 'selected' : ''}>${esc(nameB)}</option>` : ''}
        <option value="${esc(nameA)}" ${toVal === nameA ? 'selected' : ''}>${esc(nameA)}</option>
      </select>
      <label>日期</label><input type="date" id="f_date" value="${item.date}">
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveSuggestion(${id || 0})">保存</button></div>`);
  }

  function syncSuggestionTo() {
    const nameA = data.couple.nameA || '', nameB = data.couple.nameB || '';
    const fromEl = document.getElementById('f_from');
    const toEl = document.getElementById('f_to');
    if (!fromEl || !toEl) return;
    toEl.value = (fromEl.value === nameA) ? nameB : nameA;
  }

  function saveSuggestion(id) {
    const fields = { content: rawV('f_content'), date: v('f_date'), from: v('f_from'), to: v('f_to') };
    if (id) {
      const old = (data.suggestions || []).find(i => i.id === id);
      fields.read = old ? old.read : false;
      fields.readDate = old ? old.readDate : '';
      fields.response = old ? old.response : '';
      fields.responseDate = old ? old.responseDate : '';
    } else {
      fields.read = false; fields.readDate = '';
      fields.response = ''; fields.responseDate = '';
    }
    saveItem('suggestions', id, fields); closeModal(); render();
  }

  function markSuggestionRead(id) {
    const item = (data.suggestions || []).find(i => i.id === id); if (!item) return;
    item.read = true;
    item.readDate = todayISO();
    persist(); closeModal(); render();
  }

  function respondSuggestion(id) {
    const item = (data.suggestions || []).find(i => i.id === id); if (!item) return;
    if (!item.read) { item.read = true; item.readDate = todayISO(); }
    showModal('回应建议', `
      <div style="font-size:.9rem;color:var(--text2);padding:.6rem;background:var(--surface2);border-radius:8px;margin-bottom:.6rem"><strong>${esc(item.from)} 说：</strong>${esc(item.content)}</div>
      <label>你的回应</label>
      <textarea id="f_response" style="min-height:100px" placeholder="写下你的想法…">${esc(item.response || '')}</textarea>
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveResponse(${id})">保存回应</button></div>`);
  }

  function saveResponse(id) {
    const item = (data.suggestions || []).find(i => i.id === id); if (!item) return;
    item.response = rawV('f_response');
    item.responseDate = todayISO();
    persist(); closeModal(); render();
  }

  /* ===== SETTINGS ===== */

  function renderSettings() {
    const c = data.couple;
    const nameText = (c.nameA && c.nameB) ? `${c.nameA} & ${c.nameB}` : '未设置';
    return `
      <div class="settings-group"><div class="settings-item" onclick="App.editCouple()"><span class="settings-item__label">恋爱信息</span><span><span class="settings-item__value">${esc(nameText)}</span> <span class="settings-item__arrow">&rsaquo;</span></span></div></div>
      <div class="settings-group"><div class="settings-item" onclick="App.showInviteCode()"><span class="settings-item__label">邀请码</span><span class="settings-item__arrow">&rsaquo;</span></div></div>
      <div class="settings-group"><div class="settings-item" onclick="App.editNavConfig()"><span class="settings-item__label">底部导航布局</span><span class="settings-item__arrow">&rsaquo;</span></div></div>
      <div class="settings-group">
        <div class="settings-item" onclick="Store.exportJSON(App.data)"><span class="settings-item__label">导出数据</span><span class="settings-item__arrow">&rsaquo;</span></div>
        <div class="settings-item" onclick="document.getElementById('importInput').click()"><span class="settings-item__label">导入数据</span><span class="settings-item__arrow">&rsaquo;</span></div>
        <input type="file" id="importInput" accept=".json" hidden onchange="App.handleImport(event)">
      </div>
      <div class="settings-group"><div class="settings-item" onclick="App.clearData()"><span class="settings-item__label" style="color:#c0392b">清除所有数据</span><span class="settings-item__arrow">&rsaquo;</span></div></div>
      <div class="settings-group"><div class="settings-item" onclick="Auth.logout()"><span class="settings-item__label" style="color:#c0392b">退出登录</span><span class="settings-item__arrow">&rsaquo;</span></div></div>
      <div style="text-align:center;padding:1.5rem 0;font-size:.75rem;color:var(--text3)">恋爱日志 · 数据云端同步</div>`;
  }

  function editCouple() {
    const c = data.couple;
    showModal('恋爱信息', `
      <label>关系确定日</label><input type="date" id="f_start" value="${c.startDate}">
      <label>称呼 A</label><input id="f_na" value="${esc(c.nameA)}" placeholder="例：小明">
      <label>称呼 B</label><input id="f_nb" value="${esc(c.nameB)}" placeholder="例：小红">
      <div class="modal__footer"><button class="btn-primary" onclick="App.saveCouple()">保存</button></div>`);
  }

  function saveCouple() {
    data.couple.startDate = v('f_start');
    data.couple.nameA = v('f_na');
    data.couple.nameB = v('f_nb');
    persist(); closeModal(); render();
  }

  async function showInviteCode() {
    const code = await Store.getInviteCode();
    Auth.showInviteCode(code || '加载失败');
  }

  /* ===== 导航布局编辑器 ===== */

  function editNavConfig() {
    window._navEditCfg = JSON.parse(JSON.stringify(getConfig()));
    renderNavEditor();
  }

  function renderNavEditor() {
    const cfg = window._navEditCfg;
    const listHtml = cfg.map((item, idx) => {
      const def = ALL_MODULES.find(t => t.key === item.key);
      const label = def ? def.label : item.key;
      const isHome = item.key === 'home';
      return `<div class="nav-editor__item">
        <div class="nav-editor__arrows">
          <button onclick="App.navMove(${idx},-1)" ${idx === 0 ? 'disabled' : ''}>&#9650;</button>
          <button onclick="App.navMove(${idx},1)" ${idx === cfg.length - 1 ? 'disabled' : ''}>&#9660;</button>
        </div>
        <span class="nav-editor__label">${label}</span>
        <button class="nav-editor__toggle ${item.nav ? 'on' : ''}" onclick="App.navToggle(${idx})" ${isHome ? 'disabled style="opacity:.5"' : ''}></button>
      </div>`;
    }).join('');
    showModal('底部导航布局', `
      <div style="font-size:.8rem;color:var(--text2);margin-bottom:.6rem">开关控制「底部导航/更多」，箭头调整排序。当前导航栏 ${cfg.filter(c => c.nav).length} 项（建议 3-5 项）。</div>
      <div class="nav-editor" style="border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)">${listHtml}</div>
      <div class="modal__footer"><button class="btn-secondary" onclick="App.resetNavConfig()">恢复默认</button><button class="btn-primary" onclick="App.saveNavConfig()">保存</button></div>`);
  }

  function navToggle(idx) { const cfg = window._navEditCfg; if (cfg[idx].key === 'home') return; cfg[idx].nav = !cfg[idx].nav; renderNavEditor(); }
  function navMove(idx, dir) { const cfg = window._navEditCfg; const t = idx + dir; if (t < 0 || t >= cfg.length) return; [cfg[idx], cfg[t]] = [cfg[t], cfg[idx]]; renderNavEditor(); }
  function saveNavConfig() { data.navConfig = window._navEditCfg; delete window._navEditCfg; persist(); closeModal(); renderNav(); render(); }
  function resetNavConfig() { window._navEditCfg = DEFAULT_CONFIG.map(n => ({ ...n })); renderNavEditor(); }

  /* ===== 数据导入导出 ===== */

  function _showChangeNotification(modules) {
    const listHtml = modules.map(m =>
      `<div style="display:flex;align-items:center;gap:.5rem;padding:.45rem .7rem;background:var(--surface2);border-radius:8px;font-size:.88rem"><span style="color:var(--accent);font-size:1rem">&#8226;</span><span>${m}</span></div>`
    ).join('');
    showModal('内容更新提醒',
      `<div style="padding:.5rem 0"><p style="font-size:.88rem;color:var(--text2);margin-bottom:.8rem;line-height:1.5">你不在的时候，对方更新了以下内容：</p><div style="display:flex;flex-direction:column;gap:.4rem">${listHtml}</div></div><div class="modal__footer"><button class="btn-primary" onclick="App.closeModal()">知道了</button></div>`);
  }

  async function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
      const imported = await Store.importJSON(file);
      const mode = confirm('点击「确定」= 叠加合并（保留现有数据）\n点击「取消」= 整体覆盖（清空现有数据）');
      if (mode) {
        mergeData(imported);
      } else {
        if (!confirm('覆盖将清空当前所有数据，确认？')) { e.target.value = ''; return; }
        data = imported;
      }
      persist(); renderNav(); render(); alert('导入成功');
    } catch (_) { alert('导入失败，请检查文件格式'); }
    e.target.value = '';
  }

  function mergeData(imported) {
    if (imported.couple) {
      for (const k of Object.keys(imported.couple)) {
        if (imported.couple[k]) data.couple[k] = imported.couple[k];
      }
    }
    if (imported.navConfig) data.navConfig = imported.navConfig;
    const arrKeys = ['milestones', 'dates', 'plans', 'memos', 'travels', 'treaties', 'photos', 'heartwords', 'questions', 'suggestions'];
    for (const key of arrKeys) {
      if (!Array.isArray(imported[key])) continue;
      if (!data[key]) data[key] = [];
      data[key] = data[key].concat(imported[key]);
      data[key].forEach((item, idx) => { item.id = idx + 1; });
    }
    if (Array.isArray(imported.series)) {
      if (!data.series) data.series = [];
      data.series = data.series.concat(imported.series);
      data.series.forEach((s, idx) => {
        s.id = idx + 1;
        if (Array.isArray(s.items)) s.items.forEach((item, i) => { item.id = i + 1; });
      });
    }
  }

  function clearData() {
    if (!confirm('确定清除所有数据？')) return;
    data = JSON.parse(JSON.stringify(Store.defaultData));
    persist(); renderNav(); render();
  }

  /* ===== Start ===== */
  document.addEventListener('DOMContentLoaded', init);

  return {
    get data() { return data; },
    init, render, goTab, goSub, goBack, closeModal, showModal, renderNav,
    addPhoto, viewPhoto,
    editMilestone, saveMilestone,
    editDate, saveDate, toggleDateRange,
    editPlan, savePlan, viewPlan, togglePlan,
    editTreaty, saveTreaty,
    editSubTreaty, saveSubTreaty, delSubTreaty,
    treatyDragStart, treatyDragOver, treatyDragLeave, treatyDrop, treatyDragEnd,
    toggleTreatyMode,
    editMemo, saveMemo, viewMemo,
    editTravel, saveTravel,
    editSeriesTitle, saveSeriesTitle, delSeries,
    editSeriesItem, saveSeriesItem, delSeriesItem,
    editHeartword, saveHeartword, viewHeartword,
    editQuestion, saveQuestion, answerQuestion, saveAnswer, viewQuestion,
    editSuggestion, saveSuggestion, viewSuggestion, markSuggestionRead,
    respondSuggestion, saveResponse, syncSuggestionTo,
    editCouple, saveCouple, showInviteCode,
    editNavConfig, navToggle, navMove, saveNavConfig, resetNavConfig,
    del, handleImport, clearData
  };
})();
