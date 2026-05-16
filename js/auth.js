const Auth = (() => {
  const CRED_KEY = 'rj_saved_credentials';

  function _saveCredentials(email, pwd) {
    try {
      localStorage.setItem(CRED_KEY, btoa(unescape(encodeURIComponent(
        JSON.stringify({ e: email, p: pwd })
      ))));
    } catch (_) {}
  }

  function _loadCredentials() {
    try {
      const raw = localStorage.getItem(CRED_KEY);
      if (!raw) return null;
      return JSON.parse(decodeURIComponent(escape(atob(raw))));
    } catch (_) { return null; }
  }

  function _clearCredentials() {
    try { localStorage.removeItem(CRED_KEY); } catch (_) {}
  }

  function _escAttr(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function _showError(msg) {
    const el = document.getElementById('authError');
    if (el) el.textContent = msg;
  }

  function renderAuthScreen() {
    document.getElementById('bottomnav').innerHTML = '';
    document.getElementById('backBtn').hidden = true;
    document.getElementById('topTitle').textContent = '恋爱日志';

    const saved = _loadCredentials();
    if (saved && saved.e && saved.p) {
      document.getElementById('main').innerHTML =
        '<div class="auth-screen">' +
          '<div class="auth-heart">&hearts;</div>' +
          '<h2 class="auth-title">恋爱日志</h2>' +
          '<p class="auth-subtitle">自动登录中...</p>' +
          '<div class="auth-form"><div class="auth-error" id="authError"></div></div>' +
        '</div>';
      _autoLogin(saved.e, saved.p);
      return;
    }
    _renderLoginForm('', '');
  }

  function _renderLoginForm(prefillEmail, prefillPwd) {
    const saved = _loadCredentials();
    const checked = !!(saved && saved.e);
    document.getElementById('main').innerHTML =
      '<div class="auth-screen">' +
        '<div class="auth-heart">&hearts;</div>' +
        '<h2 class="auth-title">恋爱日志</h2>' +
        '<p class="auth-subtitle">登录后双人共享，数据云端同步</p>' +
        '<div class="auth-form">' +
          '<input id="authEmail" type="email" placeholder="邮箱" value="' + _escAttr(prefillEmail) + '">' +
          '<input id="authPwd" type="password" placeholder="密码（至少 6 位）" value="' + _escAttr(prefillPwd) + '">' +
          '<label class="auth-remember"><input type="checkbox" id="authRemember"' + (checked ? ' checked' : '') + '><span>记住密码</span></label>' +
          '<button class="btn-primary auth-btn" onclick="Auth.login()">登录</button>' +
          '<button class="btn-secondary auth-btn" onclick="Auth.register()">注册新账号</button>' +
          '<div class="auth-error" id="authError"></div>' +
        '</div>' +
      '</div>';
  }

  async function _autoLogin(email, pwd) {
    const sb = Store.client();
    if (!sb) { _renderLoginForm(email, ''); return; }
    const result = await sb.auth.signInWithPassword({ email, password: pwd });
    if (result.error) {
      _clearCredentials();
      _renderLoginForm(email, '');
      _showError('自动登录失败，请重新输入密码');
      return;
    }
    App.init();
  }

  function _handleRemember(email, pwd) {
    const el = document.getElementById('authRemember');
    if (el && el.checked) _saveCredentials(email, pwd);
    else _clearCredentials();
  }

  async function login() {
    const email = (document.getElementById('authEmail')?.value || '').trim();
    const pwd = document.getElementById('authPwd')?.value || '';
    if (!email || !pwd) { _showError('请填写邮箱和密码'); return; }
    _showError('登录中...');
    const sb = Store.client();
    const result = await sb.auth.signInWithPassword({ email, password: pwd });
    if (result.error) { _showError('登录失败：' + result.error.message); return; }
    _handleRemember(email, pwd);
    App.init();
  }

  async function register() {
    const email = (document.getElementById('authEmail')?.value || '').trim();
    const pwd = document.getElementById('authPwd')?.value || '';
    if (!email || !pwd) { _showError('请填写邮箱和密码'); return; }
    if (pwd.length < 6) { _showError('密码至少 6 位'); return; }
    _showError('注册中...');
    const sb = Store.client();
    const result = await sb.auth.signUp({ email, password: pwd });
    if (result.error) { _showError('注册失败：' + result.error.message); return; }
    _handleRemember(email, pwd);
    App.init();
  }

  function renderPairScreen() {
    document.getElementById('bottomnav').innerHTML = '';
    document.getElementById('backBtn').hidden = true;
    document.getElementById('topTitle').textContent = '配对';
    document.getElementById('main').innerHTML =
      '<div class="auth-screen">' +
        '<div class="auth-heart">&hearts;</div>' +
        '<h2 class="auth-title">创建你们的空间</h2>' +
        '<p class="auth-subtitle">创建新的情侣空间，或输入对方的邀请码加入</p>' +
        '<div class="auth-form">' +
          '<button class="btn-primary auth-btn" onclick="Auth.create()">创建新空间</button>' +
          '<div class="auth-divider"><span>或</span></div>' +
          '<input id="inviteCodeInput" placeholder="输入 6 位邀请码" maxlength="6" ' +
            'style="text-align:center;letter-spacing:.3em;font-size:1.1rem;text-transform:uppercase">' +
          '<button class="btn-secondary auth-btn" onclick="Auth.join()">加入对方的空间</button>' +
          '<div class="auth-error" id="authError"></div>' +
        '</div>' +
      '</div>';
  }

  function showInviteCode(code) {
    App.showModal('邀请码',
      '<div style="text-align:center;padding:1rem 0">' +
        '<p style="font-size:.88rem;color:var(--text2);margin-bottom:.8rem">将此邀请码发给对方，对方注册后输入即可加入</p>' +
        '<div style="font-size:2rem;font-weight:800;letter-spacing:.4em;color:var(--accent);padding:.8rem;background:var(--surface2);border-radius:var(--radius);display:inline-block">' + code + '</div>' +
        '<p style="font-size:.78rem;color:var(--text3);margin-top:.8rem">邀请码不区分大小写</p>' +
      '</div>' +
      '<div class="modal__footer"><button class="btn-primary" onclick="App.closeModal()">知道了</button></div>');
  }

  async function create() {
    _showError('');
    const couple = await Store.createCouple();
    if (!couple) { _showError('创建失败，请重试'); return; }
    const code = couple.invite_code;
    await App.init();
    setTimeout(() => showInviteCode(code), 300);
  }

  async function join() {
    const code = (document.getElementById('inviteCodeInput')?.value || '').trim();
    if (!code) { _showError('请输入邀请码'); return; }
    _showError('加入中...');
    const result = await Store.joinCouple(code);
    if (result.error) { _showError(result.error); return; }
    App.init();
  }

  async function logout() {
    if (!confirm('确定退出登录？')) return;
    const sb = Store.client();
    Store.unsubscribe();
    _clearCredentials();
    if (sb) await sb.auth.signOut();
    renderAuthScreen();
  }

  return {
    renderAuthScreen, renderPairScreen, showInviteCode,
    login, register, create, join, logout
  };
})();
