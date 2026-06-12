const Auth = (() => {
  // 仅记忆邮箱用于登录界面预填，避免在 localStorage 中保存密码
  // (Supabase SDK 自身已会持久化 session token，刷新页面会自动恢复登录态)
  const EMAIL_KEY = 'rj_saved_email';

  function _saveEmail(email) {
    try { localStorage.setItem(EMAIL_KEY, email || ''); } catch (_) {}
  }

  function _loadEmail() {
    try { return localStorage.getItem(EMAIL_KEY) || ''; } catch (_) { return ''; }
  }

  function _clearEmail() {
    try { localStorage.removeItem(EMAIL_KEY); } catch (_) {}
  }

  // 兼容历史版本：清理旧的明文密码缓存
  try { localStorage.removeItem('rj_saved_credentials'); } catch (_) {}

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
    _renderLoginForm(_loadEmail());
  }

  function _renderLoginForm(prefillEmail) {
    const checked = !!prefillEmail;
    document.getElementById('main').innerHTML =
      '<div class="auth-screen">' +
        '<div class="auth-heart">&hearts;</div>' +
        '<h2 class="auth-title">恋爱日志</h2>' +
        '<p class="auth-subtitle">登录后双人共享，数据云端同步</p>' +
        '<div class="auth-form">' +
          '<input id="authEmail" type="email" placeholder="邮箱" value="' + _escAttr(prefillEmail) + '">' +
          '<input id="authPwd" type="password" placeholder="密码（至少 6 位）">' +
          '<label class="auth-remember"><input type="checkbox" id="authRemember"' + (checked ? ' checked' : '') + '><span>记住邮箱</span></label>' +
          '<button class="btn-primary auth-btn" onclick="Auth.login()">登录</button>' +
          '<button class="btn-secondary auth-btn" onclick="Auth.register()">注册新账号</button>' +
          '<div class="auth-error" id="authError"></div>' +
        '</div>' +
      '</div>';
  }

  function _handleRemember(email) {
    const el = document.getElementById('authRemember');
    if (el && el.checked) _saveEmail(email);
    else _clearEmail();
  }

  async function login() {
    const email = (document.getElementById('authEmail')?.value || '').trim();
    const pwd = document.getElementById('authPwd')?.value || '';
    if (!email || !pwd) { _showError('请填写邮箱和密码'); return; }
    _showError('登录中...');
    const sb = Store.client();
    const result = await sb.auth.signInWithPassword({ email, password: pwd });
    if (result.error) { _showError('登录失败：' + result.error.message); return; }
    _handleRemember(email);
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
    _handleRemember(email);
    // 若 Supabase 开启了邮箱确认，signUp 不会返回 session，避免直接跳进 App 后又空白
    if (!result.data || !result.data.session) {
      _showError('注册成功，请前往邮箱完成验证后再登录');
      return;
    }
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
    _clearEmail();
    if (sb) await sb.auth.signOut();
    renderAuthScreen();
  }

  return {
    renderAuthScreen, renderPairScreen, showInviteCode,
    login, register, create, join, logout
  };
})();
