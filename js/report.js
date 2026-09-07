(function() {
  'use strict';

  var WEEKLY_KEY = 'ctms_weekly_reports_v1';
  var MEETING_KEY = 'ctms_meeting_minutes_v1';
  var PROJECTS = [
    { id: 'enblo-gem', name: '엔블로젬 3상', phase: '3상' },
    { id: 'enblo-mb', name: '엔블로 매스밸런스 1상', phase: '1상' },
    { id: 'enblo-china', name: '엔블로 중국 3상', phase: '3상' },
    { id: 'enblo-insulin', name: '엔블로 인슐린 3상', phase: '3상' }
  ];
  var MEMBERS = [
    { id: 'u1', name: '조성인', role: 'CPL' },
    { id: 'u2', name: '홍길동', role: 'PM' },
    { id: 'u3', name: '이모니터', role: 'CRA' },
    { id: 'u4', name: '박데이터', role: 'DM' },
    { id: 'u5', name: '최통계', role: 'STAT' },
    { id: 'u6', name: '김안전', role: 'PV' }
  ];

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function load(key, fallback) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key));
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function uid(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }
  function isoDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function mondayOf(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d;
  }
  function shiftDate(dateString, days) {
    var d = new Date(dateString + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return isoDate(d);
  }
  function weekLabel(value) {
    var d = new Date(value + 'T00:00:00');
    return value + ' 주차 · ' + (d.getMonth() + 1) + '월 ' + Math.ceil(d.getDate() / 7) + '주';
  }
  function weekOptions(selected) {
    var base = mondayOf(new Date());
    var out = [];
    for (var i = -4; i <= 2; i++) {
      var d = new Date(base);
      d.setDate(base.getDate() + i * 7);
      var value = isoDate(d);
      out.push('<option value="' + value + '"' + (value === selected ? ' selected' : '') + '>' + weekLabel(value) + '</option>');
    }
    return out.join('');
  }
  function projectById(id) {
    return PROJECTS.filter(function(p) { return p.id === id; })[0] || PROJECTS[0];
  }
  function memberById(id) {
    return MEMBERS.filter(function(m) { return m.id === id; })[0] || MEMBERS[0];
  }
  function currentProjectFromHash() {
    var parts = (location.hash || '').replace(/^#/, '').split('/');
    return parts[0] === 'project' ? (parts[1] || 'enblo-gem') : '';
  }
  function sanitizeHtml(html) {
    var box = document.createElement('div');
    box.innerHTML = String(html || '');
    box.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(function(node) { node.remove(); });
    box.querySelectorAll('*').forEach(function(node) {
      Array.prototype.slice.call(node.attributes).forEach(function(attr) {
        if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
      });
    });
    return box.innerHTML;
  }
  function seedReportData() {
    var week = isoDate(mondayOf(new Date()));
    if (!localStorage.getItem(WEEKLY_KEY)) {
      var weekly = {};
      weekly[week + '|enblo-gem|u1'] = {
        scheduleLine: 'Protocol v2.0 확정 후 IND 제출 자료 최종 점검',
        includePrevWeek: false,
        sections: [
          { id: 'seed_regulatory', title: 'Regulatory', detail: '<p>IND 제출 패키지 QC를 완료했고 보완사항을 반영 중입니다.</p>' },
          { id: 'seed_site', title: 'Site', detail: '<p>개시 예정 기관의 SIV 일정을 조율했습니다.</p>' }
        ],
        status: 'submitted',
        updatedAt: new Date().toISOString()
      };
      weekly[week + '|enblo-china|u3'] = {
        scheduleLine: '중국 기관 feasibility 회신 취합 및 일정 업데이트',
        includePrevWeek: false,
        sections: [{ id: 'seed_site_cn', title: 'Site', detail: '<p>후보 기관 3곳의 회신을 취합했습니다.</p>' }],
        status: 'draft',
        updatedAt: new Date().toISOString()
      };
      save(WEEKLY_KEY, weekly);
    }
    if (!localStorage.getItem(MEETING_KEY)) {
      var now = new Date();
      now.setHours(10, 0, 0, 0);
      save(MEETING_KEY, [{
        id: 'meeting_seed_1',
        projectId: 'enblo-gem',
        title: 'Protocol 개정 실무 협의',
        meetingAt: isoDate(now) + 'T10:00',
        location: '4층 Focus Room / Teams',
        participants: ['u1', 'u3', 'u4', 'u5'],
        authorId: 'u1',
        contentHtml: '<p><b>논의사항</b></p><ul><li>Visit Window 변경 영향 검토</li><li>CRF 반영 일정 확정</li></ul><p><b>Action</b>: 담당자별 영향평가를 금요일까지 완료합니다.</p>',
        contentText: '논의사항 Visit Window 변경 영향 검토 CRF 반영 일정 확정 Action 담당자별 영향평가를 금요일까지 완료',
        updatedAt: new Date().toISOString()
      }]);
    }
  }
  function richToolbar() {
    return '<div class="rt-toolbar">'
      + '<button type="button" data-format="bold" title="굵게"><b>B</b></button>'
      + '<button type="button" data-format="italic" title="기울임"><i>I</i></button>'
      + '<button type="button" data-format="underline" title="밑줄"><u>U</u></button>'
      + '<button type="button" data-format="insertUnorderedList" title="목록">• List</button>'
      + '<button type="button" data-format="insertOrderedList" title="번호 목록">1. List</button>'
      + '</div>';
  }

  function ensureState(root, fixedProject) {
    var defaultWeek = isoDate(mondayOf(new Date()));
    var requestedTab = !fixedProject && (location.hash || '').indexOf('#report/meeting') === 0 ? 'meeting' : 'weekly';
    if (!root._reportState) {
      root._reportState = {
        tab: requestedTab,
        projectId: fixedProject || PROJECTS[0].id,
        authorId: MEMBERS[0].id,
        week: defaultWeek,
        meetingId: '',
        meetingQuery: '',
        meetingFrom: '',
        meetingTo: '',
        meetingParticipant: ''
      };
    }
    if (fixedProject) root._reportState.projectId = fixedProject;
    root._fixedProject = fixedProject || '';
    return root._reportState;
  }

  function weeklyStorageKey(state, projectId) {
    return state.week + '|' + projectId + '|' + state.authorId;
  }
  function emptyWeekly() {
    return { scheduleLine: '', includePrevWeek: false, sections: [{ id: uid('sec'), title: '', detail: '' }], status: 'draft', updatedAt: '' };
  }
  function weeklyData(state, projectId) {
    var all = load(WEEKLY_KEY, {});
    return all[weeklyStorageKey(state, projectId)] || emptyWeekly();
  }
  function statusBadge(status) {
    if (!status) return '<span class="report-status empty">미작성</span>';
    return '<span class="report-status ' + (status === 'submitted' ? 'submitted' : 'draft') + '">' + (status === 'submitted' ? '작성완료' : '임시저장') + '</span>';
  }
  function renderProjectList(state) {
    var all = load(WEEKLY_KEY, {});
    return '<div class="weekly-list"><div class="weekly-list-head">선택 과제</div>'
      + PROJECTS.map(function(p) {
        var item = all[weeklyStorageKey(state, p.id)];
        return '<button type="button" class="weekly-project-item' + (state.projectId === p.id ? ' active' : '') + '" data-select-project="' + p.id + '">'
          + '<span class="weekly-project-name">' + esc(p.name) + '</span>'
          + '<span class="weekly-project-meta"><span>' + esc(p.phase) + '</span>' + statusBadge(item && item.status) + '</span></button>';
      }).join('') + '</div>';
  }
  function previousWeeklyHtml(state, projectId, include) {
    var all = load(WEEKLY_KEY, {});
    var prevKey = shiftDate(state.week, -7) + '|' + projectId + '|' + state.authorId;
    var prev = all[prevKey];
    if (!prev) return '<div class="report-empty" data-prev-box style="display:none">지난주 작성 내용이 없습니다.</div>';
    var details = (prev.sections || []).map(function(s) {
      return '<div><strong>' + esc(s.title || '카테고리') + '</strong><div>' + sanitizeHtml(s.detail) + '</div></div>';
    }).join('');
    return '<div data-prev-box style="' + (include ? '' : 'display:none;') + 'margin:10px 0;padding:12px;border-left:3px solid #94A3B8;background:#F8FAFC">'
      + '<strong>지난주 보고</strong><p>' + esc(prev.scheduleLine) + '</p>' + details + '</div>';
  }
  function weeklySectionHtml(section) {
    return '<div class="weekly-section" data-section-id="' + esc(section.id) + '">'
      + '<div class="weekly-section-head"><input class="weekly-section-title" value="' + esc(section.title) + '" placeholder="카테고리 제목 (예: Site, Vendor, Regulatory)">'
      + '<button type="button" class="btn btn-outline" data-remove-section>삭제</button></div>'
      + richToolbar() + '<div class="report-editor weekly-section-detail" contenteditable="true" data-placeholder="진행사항을 입력하세요.">' + sanitizeHtml(section.detail) + '</div></div>';
  }
  function submissionHtml(state) {
    var all = load(WEEKLY_KEY, {});
    var rows = Object.keys(all).map(function(key) { return { key: key, value: all[key] }; }).filter(function(row) {
      var p = row.key.split('|');
      return p[0] === state.week && (!state.projectId || p[1] === state.projectId);
    }).sort(function(a, b) { return (b.value.updatedAt || '').localeCompare(a.value.updatedAt || ''); });
    if (!rows.length) return '<div class="report-empty">이 주차의 저장된 보고가 없습니다.</div>';
    return '<div class="submission-list">' + rows.map(function(row) {
      var p = row.key.split('|');
      return '<div class="submission-row"><strong>' + esc(projectById(p[1]).name) + '</strong><span>' + esc(memberById(p[2]).name) + '</span><span>' + esc(row.value.updatedAt ? row.value.updatedAt.slice(0, 16).replace('T', ' ') : '-') + '</span>' + statusBadge(row.value.status) + '</div>';
    }).join('') + '</div>';
  }
  function renderWeekly(root, state) {
    var report = weeklyData(state, state.projectId);
    var project = projectById(state.projectId);
    var fixed = !!root._fixedProject;
    var sections = report.sections && report.sections.length ? report.sections : emptyWeekly().sections;
    return '<div class="report-toolbar">'
      + '<label>주차 <select data-week-select>' + weekOptions(state.week) + '</select></label>'
      + '<label>담당자 <select data-author-select>' + MEMBERS.map(function(m) { return '<option value="' + m.id + '"' + (m.id === state.authorId ? ' selected' : '') + '>' + esc(m.name + ' · ' + m.role) + '</option>'; }).join('') + '</select></label>'
      + (fixed ? '<span class="tag">' + esc(project.name) + '</span>' : '') + '</div>'
      + '<div class="weekly-layout' + (fixed ? ' fixed' : '') + '">'
      + (fixed ? '' : renderProjectList(state))
      + '<div class="weekly-editor"><div class="weekly-editor-head"><div><strong>' + esc(project.name) + '</strong><div class="page-description">' + esc(weekLabel(state.week)) + '</div></div>' + statusBadge(report.status) + '</div>'
      + '<div class="weekly-editor-body"><label style="display:inline-flex;align-items:center;gap:6px"><input type="checkbox" data-include-prev' + (report.includePrevWeek ? ' checked' : '') + '> 지난주 포함</label>'
      + previousWeeklyHtml(state, state.projectId, report.includePrevWeek)
      + '<div class="report-field" style="margin-top:14px"><label>일정 · 목표 및 진행</label><textarea data-schedule rows="3" placeholder="이번 주 핵심 일정, 목표와 진행 상황을 입력하세요.">' + esc(report.scheduleLine) + '</textarea></div>'
      + '<div><strong>카테고리 섹션</strong><div data-weekly-sections>' + sections.map(weeklySectionHtml).join('') + '</div>'
      + '<button type="button" class="doc-version-add" data-add-section>+ 섹션 추가</button></div>'
      + '<div class="weekly-actions"><span class="page-description">담당자·과제·주차 단위로 저장됩니다.</span><div><button type="button" class="btn btn-outline" data-save-weekly="draft">임시저장</button><button type="button" class="btn btn-primary" data-save-weekly="submitted">작성완료 · 제출</button></div></div>'
      + '</div></div></div>'
      + '<div class="card" style="margin:0"><h3 class="card-title">주간보고 제출 현황</h3>' + submissionHtml(state) + '</div>';
  }

  function meetingsFor(state) {
    return load(MEETING_KEY, []).filter(function(m) {
      return (!state.projectId || m.projectId === state.projectId)
        && (!state.meetingFrom || (m.meetingAt || '').slice(0, 10) >= state.meetingFrom)
        && (!state.meetingTo || (m.meetingAt || '').slice(0, 10) <= state.meetingTo)
        && (!state.meetingParticipant || (m.participants || []).indexOf(state.meetingParticipant) !== -1)
        && (!state.meetingQuery || (m.title + ' ' + m.location + ' ' + m.contentText).toLowerCase().indexOf(state.meetingQuery.toLowerCase()) !== -1);
    }).sort(function(a, b) { return (b.meetingAt || '').localeCompare(a.meetingAt || ''); });
  }
  function meetingListHtml(state) {
    var rows = meetingsFor(state);
    if (!rows.length) return '<div class="report-empty">등록된 내부 회의록이 없습니다.</div>';
    return rows.map(function(m) {
      return '<article class="meeting-card' + (state.meetingId === m.id ? ' active' : '') + '" data-meeting-id="' + esc(m.id) + '"><h4>' + esc(m.title) + '</h4>'
        + '<p>' + esc((m.meetingAt || '').replace('T', ' ')) + ' · ' + esc(m.location || '장소 미정') + '</p>'
        + '<p>' + esc((m.participants || []).map(function(id) { return memberById(id).name; }).join(', ')) + '</p></article>';
    }).join('');
  }
  function selectedMeeting(state) {
    var all = load(MEETING_KEY, []);
    return all.filter(function(m) { return m.id === state.meetingId; })[0] || {
      id: '', projectId: state.projectId || PROJECTS[0].id, title: '', meetingAt: '', location: '',
      participants: [state.authorId], authorId: state.authorId, contentHtml: '', contentText: ''
    };
  }
  function meetingFormHtml(state) {
    var m = selectedMeeting(state);
    return '<div class="meeting-form" data-editing-id="' + esc(m.id) + '"><div class="meeting-form-grid">'
      + '<div class="report-field"><label>과제</label><select data-meeting-project' + (state.fixedProject ? ' disabled' : '') + '>' + PROJECTS.map(function(p) { return '<option value="' + p.id + '"' + (p.id === m.projectId ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></div>'
      + '<div class="report-field"><label>회의 날짜·시간</label><input type="datetime-local" data-meeting-at value="' + esc(m.meetingAt) + '"></div>'
      + '<div class="report-field wide"><label>회의명</label><input data-meeting-title value="' + esc(m.title) + '" placeholder="예: Protocol 개정 실무 협의"></div>'
      + '<div class="report-field wide"><label>장소 / 온라인 링크</label><input data-meeting-location value="' + esc(m.location) + '" placeholder="회의실 또는 Teams 링크"></div>'
      + '<div class="report-field wide"><label>참석자 (CTMS 계정)</label><div class="participant-grid">' + MEMBERS.map(function(member) {
        return '<label><input type="checkbox" data-participant="' + member.id + '"' + ((m.participants || []).indexOf(member.id) !== -1 ? ' checked' : '') + '> ' + esc(member.name + ' · ' + member.role) + '</label>';
      }).join('') + '</div></div>'
      + '<div class="report-field wide"><label>내용</label>' + richToolbar() + '<div class="report-editor" data-meeting-content contenteditable="true">' + sanitizeHtml(m.contentHtml) + '</div></div>'
      + '</div><div class="weekly-actions"><button type="button" class="btn btn-outline" data-new-meeting>새 회의록</button><div>' + (m.id ? '<button type="button" class="btn btn-outline" data-delete-meeting>삭제</button>' : '') + '<button type="button" class="btn btn-primary" data-save-meeting>저장</button></div></div></div>';
  }
  function renderMeetings(root, state) {
    return '<div class="report-toolbar">'
      + (root._fixedProject ? '<span class="tag">' + esc(projectById(state.projectId).name) + '</span>' : '<label>과제 <select data-meeting-filter><option value="">전체 과제</option>' + PROJECTS.map(function(p) { return '<option value="' + p.id + '"' + (p.id === state.projectId ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></label>')
      + '<label>시작일 <input type="date" data-meeting-from value="' + esc(state.meetingFrom) + '"></label>'
      + '<label>종료일 <input type="date" data-meeting-to value="' + esc(state.meetingTo) + '"></label>'
      + '<label>참석자 <select data-meeting-participant><option value="">전체</option>' + MEMBERS.map(function(m) { return '<option value="' + m.id + '"' + (m.id === state.meetingParticipant ? ' selected' : '') + '>' + esc(m.name) + '</option>'; }).join('') + '</select></label>'
      + '<label>검색 <input data-meeting-query value="' + esc(state.meetingQuery) + '" placeholder="회의명, 장소, 내용"></label></div>'
      + '<div class="meeting-layout"><div class="meeting-list">' + meetingListHtml(state) + '</div>' + meetingFormHtml(state) + '</div>';
  }
  function renderRoot(root, fixedProject) {
    var state = ensureState(root, fixedProject);
    state.fixedProject = fixedProject || '';
    root.innerHTML = '<div class="report-shell"><div class="report-tabs"><button type="button" data-report-tab="weekly"' + (state.tab === 'weekly' ? ' class="active"' : '') + '>주간보고</button><button type="button" data-report-tab="meeting"' + (state.tab === 'meeting' ? ' class="active"' : '') + '>회의록</button></div>'
      + (state.tab === 'weekly' ? renderWeekly(root, state) : renderMeetings(root, state)) + '</div>';
  }
  function renderAll(projectId) {
    document.querySelectorAll('[data-report-root]').forEach(function(root) {
      var fixed = root.hasAttribute('data-project-context') ? (projectId || currentProjectFromHash() || 'enblo-gem') : '';
      renderRoot(root, fixed);
    });
  }

  function collectWeekly(root, state, status) {
    var sections = Array.prototype.slice.call(root.querySelectorAll('.weekly-section')).map(function(section) {
      return {
        id: section.getAttribute('data-section-id') || uid('sec'),
        title: section.querySelector('.weekly-section-title').value.trim(),
        detail: sanitizeHtml(section.querySelector('.weekly-section-detail').innerHTML)
      };
    }).filter(function(s) { return s.title || s.detail.replace(/<[^>]+>/g, '').trim(); });
    var schedule = root.querySelector('[data-schedule]').value.trim();
    if (status === 'submitted' && !schedule && !sections.length) throw new Error('제출할 주간보고 내용을 입력하세요.');
    return {
      scheduleLine: schedule,
      includePrevWeek: root.querySelector('[data-include-prev]').checked,
      sections: sections.length ? sections : emptyWeekly().sections,
      status: status,
      updatedAt: new Date().toISOString()
    };
  }
  function saveMeeting(root, state) {
    var form = root.querySelector('.meeting-form');
    var id = form.getAttribute('data-editing-id');
    var projectEl = form.querySelector('[data-meeting-project]');
    var projectId = root._fixedProject || (projectEl ? projectEl.value : state.projectId);
    var title = form.querySelector('[data-meeting-title]').value.trim();
    var meetingAt = form.querySelector('[data-meeting-at]').value;
    if (!title || !meetingAt) throw new Error('회의명과 회의 날짜·시간은 필수입니다.');
    var participants = Array.prototype.slice.call(form.querySelectorAll('[data-participant]:checked')).map(function(el) { return el.getAttribute('data-participant'); });
    if (!participants.length) throw new Error('참석자를 한 명 이상 선택하세요.');
    var contentHtml = sanitizeHtml(form.querySelector('[data-meeting-content]').innerHTML);
    var all = load(MEETING_KEY, []);
    var now = new Date().toISOString();
    var item = {
      id: id || uid('meeting'), projectId: projectId, title: title, meetingAt: meetingAt,
      location: form.querySelector('[data-meeting-location]').value.trim(), participants: participants,
      authorId: state.authorId, contentHtml: contentHtml,
      contentText: form.querySelector('[data-meeting-content]').textContent.trim(), updatedAt: now
    };
    var idx = all.findIndex(function(m) { return m.id === item.id; });
    if (idx >= 0) all[idx] = item; else all.push(item);
    save(MEETING_KEY, all);
    state.projectId = projectId;
    state.meetingId = item.id;
  }

  document.addEventListener('click', function(event) {
    var root = event.target.closest('[data-report-root]');
    if (!root) return;
    var state = ensureState(root, root._fixedProject);
    var tab = event.target.closest('[data-report-tab]');
    if (tab) {
      state.tab = tab.getAttribute('data-report-tab');
      if (state.tab === 'weekly' && !state.projectId) state.projectId = root._fixedProject || PROJECTS[0].id;
      renderRoot(root, root._fixedProject);
      return;
    }
    var project = event.target.closest('[data-select-project]');
    if (project) { state.projectId = project.getAttribute('data-select-project'); renderRoot(root, root._fixedProject); return; }
    var addSection = event.target.closest('[data-add-section]');
    if (addSection) {
      root.querySelector('[data-weekly-sections]').insertAdjacentHTML('beforeend', weeklySectionHtml({ id: uid('sec'), title: '', detail: '' }));
      return;
    }
    var removeSection = event.target.closest('[data-remove-section]');
    if (removeSection) { removeSection.closest('.weekly-section').remove(); return; }
    var format = event.target.closest('[data-format]');
    if (format) {
      var toolbar = format.closest('.rt-toolbar');
      var editor = toolbar && toolbar.nextElementSibling;
      if (editor) { editor.focus(); document.execCommand(format.getAttribute('data-format'), false, null); }
      return;
    }
    var saveWeekly = event.target.closest('[data-save-weekly]');
    if (saveWeekly) {
      try {
        var allWeekly = load(WEEKLY_KEY, {});
        var status = saveWeekly.getAttribute('data-save-weekly');
        allWeekly[weeklyStorageKey(state, state.projectId)] = collectWeekly(root, state, status);
        save(WEEKLY_KEY, allWeekly);
        renderRoot(root, root._fixedProject);
      } catch (e) { alert(e.message); }
      return;
    }
    var meetingCard = event.target.closest('[data-meeting-id]');
    if (meetingCard) { state.meetingId = meetingCard.getAttribute('data-meeting-id'); renderRoot(root, root._fixedProject); return; }
    if (event.target.closest('[data-new-meeting]')) { state.meetingId = ''; renderRoot(root, root._fixedProject); return; }
    if (event.target.closest('[data-save-meeting]')) {
      try { saveMeeting(root, state); renderRoot(root, root._fixedProject); } catch (e) { alert(e.message); }
      return;
    }
    if (event.target.closest('[data-delete-meeting]')) {
      if (!confirm('이 회의록을 삭제하시겠습니까?')) return;
      save(MEETING_KEY, load(MEETING_KEY, []).filter(function(m) { return m.id !== state.meetingId; }));
      state.meetingId = '';
      renderRoot(root, root._fixedProject);
    }
  });

  document.addEventListener('change', function(event) {
    var root = event.target.closest('[data-report-root]');
    if (!root) return;
    var state = ensureState(root, root._fixedProject);
    if (event.target.matches('[data-week-select]')) { state.week = event.target.value; renderRoot(root, root._fixedProject); }
    else if (event.target.matches('[data-author-select]')) { state.authorId = event.target.value; renderRoot(root, root._fixedProject); }
    else if (event.target.matches('[data-include-prev]')) {
      var prev = root.querySelector('[data-prev-box]');
      if (prev) prev.style.display = event.target.checked ? '' : 'none';
    } else if (event.target.matches('[data-meeting-filter]')) {
      state.projectId = event.target.value;
      state.meetingId = '';
      renderRoot(root, root._fixedProject);
    } else if (event.target.matches('[data-meeting-from]')) {
      state.meetingFrom = event.target.value;
      renderRoot(root, root._fixedProject);
    } else if (event.target.matches('[data-meeting-to]')) {
      state.meetingTo = event.target.value;
      renderRoot(root, root._fixedProject);
    } else if (event.target.matches('[data-meeting-participant]')) {
      state.meetingParticipant = event.target.value;
      renderRoot(root, root._fixedProject);
    }
  });
  document.addEventListener('input', function(event) {
    var root = event.target.closest('[data-report-root]');
    if (!root || !event.target.matches('[data-meeting-query]')) return;
    root._reportState.meetingQuery = event.target.value;
    var list = root.querySelector('.meeting-list');
    if (list) list.innerHTML = meetingListHtml(root._reportState);
  });

  function renderDocumentMatrix() {
    var root = document.getElementById('document-matrix-root');
    if (!root || typeof WORKFLOW === 'undefined') return;
    var docs = [];
    WORKFLOW.forEach(function(group) {
      group.tasks.forEach(function(task) { if (task.type === 'doc') docs.push(task); });
    });
    var byDate = {};
    docs.forEach(function(task) {
      (task.documentVersions || []).forEach(function(v) {
        if (!v.actualEnd) return;
        if (!byDate[v.actualEnd]) byDate[v.actualEnd] = {};
        if (!byDate[v.actualEnd][task.key]) byDate[v.actualEnd][task.key] = [];
        byDate[v.actualEnd][task.key].push(v);
      });
    });
    var dates = Object.keys(byDate).sort();
    if (!dates.length) { root.innerHTML = '<div class="report-empty">유효일이 입력된 문서 버전이 없습니다.</div>'; return; }
    var currentYear = '';
    var body = '';
    dates.forEach(function(date) {
      var year = date.slice(0, 4);
      if (year !== currentYear) {
        currentYear = year;
        body += '<tr class="matrix-year-row"><td class="matrix-date">' + year + '년</td><td colspan="' + docs.length + '">Document effective timeline</td></tr>';
      }
      body += '<tr><td class="matrix-date">' + esc(date) + '</td>' + docs.map(function(task) {
        var versions = byDate[date][task.key] || [];
        return '<td>' + versions.map(function(v) {
          return '<span class="matrix-version ' + esc(String(v.status || '').toLowerCase()) + '">' + esc(v.version) + ' (' + esc(date.slice(5).replace('-', '/')) + ')</span>'
            + (v.summary ? '<span class="matrix-summary" title="' + esc(v.summary) + '">' + esc(v.summary) + '</span>' : '');
        }).join('') + '</td>';
      }).join('') + '</tr>';
    });
    root.innerHTML = '<div class="matrix-wrap"><table class="document-matrix"><thead><tr><th class="matrix-date">유효일</th>'
      + docs.map(function(task) { return '<th title="' + esc(task.name) + '">' + esc(task.name) + '</th>'; }).join('')
      + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  window.renderCtmsReports = renderAll;
  window.renderDocumentMatrix = renderDocumentMatrix;
  document.addEventListener('DOMContentLoaded', function() {
    seedReportData();
    renderAll(currentProjectFromHash());
    renderDocumentMatrix();
  });
})();
