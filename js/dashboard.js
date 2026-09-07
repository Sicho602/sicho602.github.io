/**
 * 대시보드 - 관리자(파이 차트) / 사용자(내 프로젝트, Task, 예산)
 */
(function() {
  var chartProduct, chartPhase, chartRegion, chartDisease;

  var myProjects = [
    { id: 'enblo-mb', tag: '엔블로', name: '엔블로 매스밸런스 1상', status: 'before', pct: 0 },
    { id: 'enblo-gem', tag: '엔블로', name: '엔블로젬 3상', status: 'ongoing', pct: 31 },
    { id: 'enblo-china', tag: '엔블로', name: '엔블로 중국 3상', status: 'before', pct: 0 },
    { id: 'enblo-insulin', tag: '엔블로', name: '엔블로 인슐린 3상', status: 'before', pct: 0 }
  ];

  function renderCharts() {
    var opts = { responsive: true, maintainAspectRatio: false };
    var colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (document.getElementById('chartProduct')) {
      chartProduct = new Chart(document.getElementById('chartProduct'), {
        type: 'pie',
        data: {
          labels: ['엔블로', '엔블로젬', '기타'],
          datasets: [{ data: [12, 8, 5], backgroundColor: colors }]
        },
        options: opts
      });
    }
    if (document.getElementById('chartPhase')) {
      chartPhase = new Chart(document.getElementById('chartPhase'), {
        type: 'pie',
        data: {
          labels: ['1상', '2상', '3상', '4상'],
          datasets: [{ data: [5, 7, 10, 3], backgroundColor: colors }]
        },
        options: opts
      });
    }
    if (document.getElementById('chartRegion')) {
      chartRegion = new Chart(document.getElementById('chartRegion'), {
        type: 'pie',
        data: {
          labels: ['국내', '해외'],
          datasets: [{ data: [15, 10], backgroundColor: [colors[0], colors[1]] }]
        },
        options: opts
      });
    }
    if (document.getElementById('chartDisease')) {
      chartDisease = new Chart(document.getElementById('chartDisease'), {
        type: 'pie',
        data: {
          labels: ['내분비/대사', '심혈관', '종양', '기타'],
          datasets: [{ data: [8, 6, 5, 6], backgroundColor: colors }]
        },
        options: opts
      });
    }
  }

  function renderMyProjects() {
    var el = document.getElementById('myProjectsList');
    if (!el) return;
    el.innerHTML = myProjects.map(function(p) {
      var statusText = p.status === 'ongoing' ? '진행중' : (p.status === 'end' ? '종료' : '시작 전');
      var bar = p.status === 'ongoing' ? '<div class="progress-bar"><div class="progress-bar-fill" style="width:' + p.pct + '%"></div></div>' : '';
      return '<a href="project.html?id=' + p.id + '" style="text-decoration:none;color:inherit;">' +
        '<div class="card" style="margin-bottom:0;">' +
        '<span class="tag">' + p.tag + '</span><br>' +
        '<strong>' + p.name + '</strong><br>' +
        '<span class="status-badge ' + p.status + '">' + statusText + '</span> ' + p.pct + '%' + bar +
        '</div></a>';
    }).join('');
  }

  function showDashboard() {
    var role = window.ctms ? window.ctms.getRole() : 'user';
    var adminEl = document.getElementById('dashboardAdmin');
    var userEl = document.getElementById('dashboardUser');
    if (adminEl) adminEl.style.display = role === 'admin' ? 'block' : 'none';
    if (userEl) userEl.style.display = role === 'user' ? 'block' : 'none';
    if (role === 'admin') renderCharts();
    else renderMyProjects();
  }

  document.addEventListener('DOMContentLoaded', function() {
    var headerRole = document.getElementById('roleSelectHeader');
    var navRole = document.getElementById('roleSelect');
    if (headerRole && navRole) {
      headerRole.innerHTML = navRole.innerHTML;
      headerRole.value = navRole.value;
      headerRole.addEventListener('change', function() {
        navRole.value = this.value;
        navRole.dispatchEvent(new Event('change'));
      });
    }
    if (navRole) navRole.addEventListener('change', showDashboard);
    showDashboard();
  });
})();
