const Store = (() => {
  let sb = null;
  let coupleId = null;
  let channel = null;
  let _initialized = false;
  let _lastSaveTime = 0;
  let _userId = null;

  const DEFAULT_DATA = {
    couple: { startDate: '', nameA: '', nameB: '' },
    milestones: [],
    dates: [],
    plans: [],
    memos: [],
    travels: [],
    series: [],
    photos: [],
    treaties: [],
    heartwords: [],
    questions: [],
    suggestions: [],
    navConfig: null
  };

  const MODULE_LABELS = {
    couple: '恋爱信息', milestones: '节点', dates: '约会记录',
    plans: '愿望瓶', memos: '备忘', travels: '旅行足迹',
    series: '系列', photos: '照片墙', treaties: '恋爱条约',
    heartwords: '情书', questions: '提问箱', suggestions: '建议箱', navConfig: '导航布局'
  };

  const SNAPSHOT_KEY = 'rj_data_snapshot';

  /* ===== 初始化 ===== */

  function init() {
    if (_initialized) return;
    const url = window.__SUPABASE_URL__;
    const key = window.__SUPABASE_ANON_KEY__;
    if (url && key && window.supabase) {
      sb = window.supabase.createClient(url, key);
    }
    _initialized = true;
  }

  function client() { return sb; }

  /* ===== 用户 & 配对 ===== */

  async function getUser() {
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    return user;
  }

  async function findCoupleId(userId) {
    const { data } = await sb.from('couple_members')
      .select('couple_id').eq('user_id', userId).maybeSingle();
    return data?.couple_id || null;
  }

  async function createCouple() {
    const user = await getUser();
    if (!user) return null;
    const { data: couple, error } = await sb.from('couples')
      .insert({ data: cloneDefault() }).select().single();
    if (error) { console.error('createCouple', error); return null; }
    await sb.from('couple_members')
      .insert({ couple_id: couple.id, user_id: user.id });
    coupleId = couple.id;
    return couple;
  }

  async function joinCouple(inviteCode) {
    const user = await getUser();
    if (!user) return { error: '未登录' };
    const { data: cid, error: lookupErr } = await sb
      .rpc('lookup_couple_by_invite', { code: inviteCode.toUpperCase() });
    if (lookupErr || !cid) return { error: '邀请码无效' };
    const { error } = await sb.from('couple_members')
      .insert({ couple_id: cid, user_id: user.id });
    if (error) {
      if (error.code === '23505') return { error: '你已加入了一个空间' };
      return { error: error.message };
    }
    coupleId = cid;
    return { ok: true };
  }

  async function getInviteCode() {
    if (!sb || !coupleId) return '';
    const { data } = await sb.from('couples')
      .select('invite_code').eq('id', coupleId).single();
    return data?.invite_code || '';
  }

  /* ===== 数据读写 ===== */

  async function load() {
    init();
    if (!sb) return cloneDefault();
    const user = await getUser();
    if (!user) return null;
    _userId = user.id;
    coupleId = await findCoupleId(user.id);
    if (!coupleId) return { _needPair: true };
    const { data: row, error } = await sb.from('couples')
      .select('data').eq('id', coupleId).single();
    if (error || !row) return cloneDefault();
    return normalizeData(row.data || {});
  }

  async function save(d) {
    if (!sb || !coupleId) return;
    _lastSaveTime = Date.now();
    const clean = Object.assign({}, d);
    delete clean._needPair;
    if (_userId) clean._lastEditorId = _userId;
    await sb.from('couples')
      .update({ data: clean, updated_at: new Date().toISOString() })
      .eq('id', coupleId);
  }

  /* ===== 实时同步 ===== */

  function subscribe(onChange) {
    if (!sb || !coupleId) return;
    channel = sb.channel('couple-sync')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'couples',
        filter: 'id=eq.' + coupleId
      }, (payload) => {
        if (Date.now() - _lastSaveTime < 2000) return;
        const d = payload.new && payload.new.data;
        if (d) onChange(normalizeData(d));
      })
      .subscribe();
  }

  function unsubscribe() {
    if (channel && sb) { sb.removeChannel(channel); channel = null; }
  }

  /* ===== 图片上传 ===== */

  async function uploadImage(file) {
    const compressed = await _compressImage(file);
    if (!sb || !coupleId) return compressed;
    const blob = _dataURLtoBlob(compressed);
    const path = coupleId + '/' + Date.now() + '.jpg';
    const result = await sb.storage.from('photos')
      .upload(path, blob, { contentType: 'image/jpeg' });
    if (result.error) { console.warn('图片上传失败', result.error); return compressed; }
    return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
  }

  /* ===== 数据工具 ===== */

  function cloneDefault() { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }

  function normalizeData(d) {
    if (!d || typeof d !== 'object') return cloneDefault();
    for (const k in DEFAULT_DATA) {
      if (!(k in d)) {
        const def = DEFAULT_DATA[k];
        d[k] = Array.isArray(def) ? [] : (typeof def === 'object' && def !== null ? JSON.parse(JSON.stringify(def)) : def);
      }
    }
    if (d.couple && typeof d.couple === 'object') {
      const dc = DEFAULT_DATA.couple;
      for (const ck in dc) {
        if (!(ck in d.couple)) d.couple[ck] = dc[ck];
      }
    }
    /* 为缺少 createdAt 的旧记录补齐，用 date 兜底 */
    const _tsKeys = ['heartwords', 'questions', 'suggestions'];
    for (const key of _tsKeys) {
      if (Array.isArray(d[key])) {
        d[key].forEach(item => {
          if (!item.createdAt && item.date) {
            item.createdAt = item.date + 'T00:00:00.000Z';
          }
        });
      }
    }
    if (Array.isArray(d.series)) {
      d.series.forEach(s => {
        (s.items || []).forEach(item => {
          if (!item.createdAt && item.date) {
            item.createdAt = item.date + 'T00:00:00.000Z';
          }
        });
      });
    }
    return d;
  }

  function nextId(arr) {
    if (!arr || !arr.length) return 1;
    return Math.max(...arr.map(i => i.id || 0)) + 1;
  }

  function exportJSON(d) {
    const clean = JSON.parse(JSON.stringify(d));
    delete clean._lastEditorId;
    delete clean._needPair;
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = 'data_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try { resolve(JSON.parse(e.target.result)); }
        catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /* ===== 内部工具 ===== */

  function _compressImage(file, maxW = 600) {
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objUrl);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = objUrl;
    });
  }

  function _dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bin = atob(parts[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /* ===== 变更检测 ===== */

  function _djb2(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }

  function _fingerprint(val) {
    if (val == null) return '0';
    const json = JSON.stringify(val);
    return _djb2(json) + ':' + json.length;
  }

  function _buildSnapshot(d) {
    const snap = {};
    for (const k in DEFAULT_DATA) {
      snap[k] = _fingerprint(d[k]);
    }
    return snap;
  }

  function saveSnapshot(d) {
    try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(_buildSnapshot(d))); }
    catch (_) {}
  }

  function detectChanges(d) {
    try {
      /* 存量历史数据无 _lastEditorId：无法判断最后编辑者，
         安全跳过本次检测，避免虚假的"对方更新"通知。
         待任一用户做首次真实编辑后 _lastEditorId 被写入，后续检测恢复正常。 */
      if (!d._lastEditorId) return [];
      if (_userId && d._lastEditorId === _userId) return [];
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return [];
      const oldSnap = JSON.parse(raw);
      const newSnap = _buildSnapshot(d);
      const changed = [];
      for (const k in newSnap) {
        if (oldSnap[k] !== newSnap[k]) changed.push(MODULE_LABELS[k] || k);
      }
      return changed;
    } catch (_) { return []; }
  }

  /* ===== 公共接口 ===== */

  return {
    init, client, getUser,
    getUserId: () => _userId,
    load, save,
    subscribe, unsubscribe,
    createCouple, joinCouple, getInviteCode,
    uploadImage, nextId,
    exportJSON, importJSON, normalizeData,
    cloneDefault, defaultData: DEFAULT_DATA,
    saveSnapshot, detectChanges
  };
})();
