/**
 * store.js — Supabase 云端持久化层
 */
const Store = (() => {
  let sb = null;
  let coupleId = null;
  let channel = null;
  let _initialized = false;
  let _lastSaveTime = 0;

  const defaultDataObj = {
    couple: { startDate: '', nameA: '', nameB: '' },
    milestones: [],
    dates: [],
    plans: [],
    memos: [],
    travels: [],
    series: [],
    photos: [],
    treaties: [],
    navConfig: null
  };

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
      .select('couple_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.couple_id || null;
  }

  async function createCouple() {
    const user = await getUser();
    if (!user) return null;
    const { data: couple, error } = await sb.from('couples')
      .insert({ data: cloneDefault() })
      .select()
      .single();
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
      .select('invite_code')
      .eq('id', coupleId)
      .single();
    return data?.invite_code || '';
  }

  /* ===== 数据加载 ===== */
  async function load() {
    init();
    if (!sb) return cloneDefault();
    const user = await getUser();
    if (!user) return null;                    // 未登录
    coupleId = await findCoupleId(user.id);
    if (!coupleId) return { _needPair: true };  // 已登录但未配对
    const { data: row, error } = await sb.from('couples')
      .select('data')
      .eq('id', coupleId)
      .single();
    if (error || !row) return cloneDefault();
    return normalizeData(row.data || {});
  }

  /* ===== 数据保存 ===== */
  async function save(data) {
    if (!sb || !coupleId) return;
    _lastSaveTime = Date.now();
    const clean = Object.assign({}, data);
    delete clean._needPair;
    await sb.from('couples')
      .update({ data: clean, updated_at: new Date().toISOString() })
      .eq('id', coupleId);
  }

  /* ===== 实时同步 ===== */
  function subscribe(onChange) {
    if (!sb || !coupleId) return;
    channel = sb.channel('couple-sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'couples',
        filter: 'id=eq.' + coupleId
      }, function(payload) {
        // 忽略自己刚保存后 2 秒内的回声
        if (Date.now() - _lastSaveTime < 2000) return;
        var d = payload.new && payload.new.data;
        if (d) onChange(normalizeData(d));
      })
      .subscribe();
  }

  function unsubscribe() {
    if (channel && sb) { sb.removeChannel(channel); channel = null; }
  }

  /* ===== 图片上传 ===== */
  async function uploadImage(file) {
    var compressed = await compressImage(file);
    if (!sb || !coupleId) return compressed;
    var blob = dataURLtoBlob(compressed);
    var path = coupleId + '/' + Date.now() + '.jpg';
    var result = await sb.storage.from('photos')
      .upload(path, blob, { contentType: 'image/jpeg' });
    if (result.error) { console.warn('图片上传失败', result.error); return compressed; }
    var pub = sb.storage.from('photos').getPublicUrl(path);
    return pub.data.publicUrl;
  }

  /* ===== 工具函数 ===== */
  function cloneDefault() { return JSON.parse(JSON.stringify(defaultDataObj)); }

  function normalizeData(d) {
    if (!d || typeof d !== 'object') return cloneDefault();
    for (var k in defaultDataObj) {
      if (!(k in d)) {
        d[k] = Array.isArray(defaultDataObj[k]) ? [] :
          (typeof defaultDataObj[k] === 'object' && !Array.isArray(defaultDataObj[k]) ? {} : '');
      }
    }
    return d;
  }

  function nextId(arr) {
    return (!arr || !arr.length) ? 1 : Math.max.apply(null, arr.map(function(i) { return i.id || 0; })) + 1;
  }

  function compressImage(file, maxW) {
    maxW = maxW || 600;
    return new Promise(function(resolve) {
      var img = new Image();
      img.onload = function() {
        var c = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  function dataURLtoBlob(dataURL) {
    var parts = dataURL.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function exportJSON(data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSON(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        try { resolve(JSON.parse(e.target.result)); }
        catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /* ===== 变更检测（模块级快照） ===== */
  const _SNAPSHOT_KEY = 'rj_data_snapshot';

  /** 对每个模块生成一个简单的内容指纹（djb2 hash of JSON） */
  function _simpleHash(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // 转 32 位整数
    }
    return hash;
  }

  function _moduleFingerprint(val) {
    if (val === null || val === undefined) return '0';
    var json = JSON.stringify(val);
    return _simpleHash(json) + ':' + json.length;
  }

  function _buildSnapshot(data) {
    var snap = {};
    var keys = ['couple','milestones','dates','plans','memos','travels','series','photos','treaties','navConfig'];
    for (var i = 0; i < keys.length; i++) {
      snap[keys[i]] = _moduleFingerprint(data[keys[i]]);
    }
    return snap;
  }

  function saveSnapshot(data) {
    try {
      localStorage.setItem(_SNAPSHOT_KEY, JSON.stringify(_buildSnapshot(data)));
    } catch (ex) { /* ignore */ }
  }

  /**
   * 对比当前数据与上次本地快照，返回有变更的模块名列表。
   * 首次使用（无快照）返回空数组。
   */
  function detectChanges(data) {
    try {
      var raw = localStorage.getItem(_SNAPSHOT_KEY);
      if (!raw) return [];  // 首次使用，不弹窗
      var oldSnap = JSON.parse(raw);
      var newSnap = _buildSnapshot(data);
      var changed = [];
      var labelMap = {
        couple: '恋爱信息',
        milestones: '节点',
        dates: '约会记录',
        plans: '愿望瓶',
        memos: '备忘',
        travels: '旅行足迹',
        series: '系列',
        photos: '照片墙',
        treaties: '恋爱条约',
        navConfig: '导航布局'
      };
      for (var k in newSnap) {
        if (oldSnap[k] !== newSnap[k]) {
          changed.push(labelMap[k] || k);
        }
      }
      return changed;
    } catch (ex) { return []; }
  }

  return {
    init: init, client: client, getUser: getUser,
    load: load, save: save,
    subscribe: subscribe, unsubscribe: unsubscribe,
    createCouple: createCouple, joinCouple: joinCouple, getInviteCode: getInviteCode,
    uploadImage: uploadImage,
    nextId: nextId, compressImage: compressImage,
    exportJSON: exportJSON, importJSON: importJSON,
    cloneDefault: cloneDefault, defaultData: defaultDataObj,
    saveSnapshot: saveSnapshot, detectChanges: detectChanges
  };
})();
