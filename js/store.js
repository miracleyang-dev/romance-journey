/**
 * store.js — 数据持久化层
 */
const Store = (() => {
  const KEY = 'love_notebook_data';
  let fileHandle = null;
  let fileName = '';

  const defaultData = {
    couple: { startDate: '', nameA: '', nameB: '' },
    milestones: [],  // 时光节点
    dates: [],       // 约会记录
    plans: [],       // 愿望
    memos: [],       // 备忘
    travels: [],     // 旅行足迹
    series: [],      // 系列
    photos: [],      // 照片墙
    treaties: [],    // 恋爱条约 { id, content }
    navConfig: null  // 底部导航配置 [{ key, nav:true/false }]，null 表示使用默认
  };

  function cloneDefault() { return JSON.parse(JSON.stringify(defaultData)); }

  function normalizeData(d) {
    if (!d || typeof d !== 'object') return cloneDefault();
    for (const k of Object.keys(defaultData)) {
      if (!(k in d)) d[k] = Array.isArray(defaultData[k]) ? [] : (typeof defaultData[k] === 'object' && !Array.isArray(defaultData[k]) ? {} : '');
    }
    return d;
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalizeData(JSON.parse(raw));
    } catch (e) { console.warn('本地存储读取失败', e); }
    return cloneDefault();
  }

  async function loadFromFetch() {
    try {
      const res = await fetch('data.json', { cache: 'no-store' });
      if (!res.ok) return null;
      const d = await res.json();
      return normalizeData(d);
    } catch (e) { console.warn('data.json 读取失败', e); }
    return null;
  }

  async function load() {
    const fileData = await loadFromFetch();
    if (fileData) return fileData;
    return loadFromLocalStorage();
  }

  async function ensureFileHandle() {
    if (fileHandle) return true;
    if (!window.showSaveFilePicker) return false;
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: 'data.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
      fileName = fileHandle?.name || 'data.json';
      return true;
    } catch { return false; }
  }

  async function bindDataFile() {
    if (!window.showOpenFilePicker) return false;
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
      fileHandle = handle;
      fileName = handle?.name || 'data.json';
      return true;
    } catch { return false; }
  }

  async function save(data) {
    const text = JSON.stringify(data, null, 2);
    if (fileHandle || await ensureFileHandle()) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(text);
        await writable.close();
        return true;
      } catch (e) { console.warn('数据写入失败', e); }
    }
    localStorage.setItem(KEY, text);
    return false;
  }
  function nextId(arr) { return (!arr || !arr.length) ? 1 : Math.max(...arr.map(i => i.id || 0)) + 1; }

  function exportJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => { try { resolve(JSON.parse(e.target.result)); } catch (err) { reject(err); } };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function getFileStatus() { return { hasHandle: !!fileHandle, fileName }; }

  /** 压缩图片为 base64 (max 600px 宽, JPEG 0.7) */
  function compressImage(file, maxW = 600) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  return { load, save, nextId, exportJSON, importJSON, compressImage, defaultData, cloneDefault, bindDataFile, getFileStatus };
})();
