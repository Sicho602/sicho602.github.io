/**
 * CTMS 공통 스크립트 - 권한, 네비게이션
 */
(function() {
  const ROLE_KEY = 'ctms_role';
  const DEFAULT_ROLE = 'user';

  function getRole() {
    return localStorage.getItem(ROLE_KEY) || DEFAULT_ROLE;
  }

  function setRole(role) {
    localStorage.setItem(ROLE_KEY, role);
    if (typeof onRoleChange === 'function') onRoleChange(role);
    updateRoleSelect();
    updateNavActive();
  }

  function updateRoleSelect() {
    const role = getRole();
    document.querySelectorAll('#roleSelect, #roleSelectHeader').forEach(function(sel) {
      if (sel) sel.value = role;
    });
  }

  function updateNavActive() {
    const path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index';
    document.querySelectorAll('.nav-menu a').forEach(function(a) {
      const href = (a.getAttribute('href') || '').replace(/^\//, '').replace(/\.html$/, '');
      const isActive = (path === 'index' && (href === '' || href === 'index')) || (path && path === href);
      a.classList.toggle('active', isActive);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateRoleSelect();
    updateNavActive();

    const sel = document.getElementById('roleSelect');
    if (sel) {
      sel.addEventListener('change', function() {
        setRole(this.value);
        if (window.location.pathname.includes('index') || window.location.pathname === '/' || !window.location.pathname.split('/').pop()) {
          window.location.reload();
        }
      });
    }
  });

  window.ctms = {
    getRole: getRole,
    setRole: setRole
  };
})();
