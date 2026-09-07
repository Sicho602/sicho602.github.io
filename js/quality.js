(function() {
  'use strict';

  var STORAGE_KEY = 'ctms_quality_management_v1';
  var ROLE_KEY = 'ctms_quality_role_v1';
  var EVENT_TYPES = ['Regulatory Inspection', 'Mock Inspection', 'CRO Audit', 'Vendor Audit', 'System Audit', 'Internal Audit', 'For-cause Audit', 'Internal Quality Issue'];
  var FINDING_STATUSES = ['Draft', 'RCA in Progress', 'CAPA Planning', 'CAPA in Progress', 'Effectiveness Check', 'Closed', 'On Hold'];
  var CAPA_STATUSES = ['Not Started', 'In Progress', 'Implemented', 'Effectiveness Check', 'Closed', 'On Hold'];
  var DISCLOSURE_LEVELS = ['QM Only', 'QM + Center Head', 'QM + Relevant Leaders', 'Relevant Team Only', 'Center Leaders', 'Center-wide', 'Company-wide'];
  var DISCLOSURE_STATUSES = ['Restricted', 'Embargoed until date', 'Approved for limited sharing', 'Approved for center-wide sharing'];
  var ROLE_LABELS = {
    qm: 'QM (전체 관리)', 'center-head': 'Center Head', 'team-leader': 'Team Leader',
    'action-owner': 'Action Owner', general: 'General User'
  };
  var filterState = { eventType: '', eventStatus: '', eventQuery: '', findingSeverity: '', findingStatus: '', findingArea: '', findingQuery: '', capaStatus: '', capaOwner: '', capaQuery: '' };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadDb() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (value && Array.isArray(value.events) && Array.isArray(value.findings) && Array.isArray(value.capas)) return value;
    } catch (e) {}
    var seeded = seedDb();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  function saveDb(db) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
  function currentRole() { return localStorage.getItem(ROLE_KEY) || 'qm'; }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysFromToday(date) {
    if (!date) return null;
    return Math.ceil((new Date(date + 'T00:00:00') - new Date(todayIso() + 'T00:00:00')) / 86400000);
  }
  function unique(values) {
    return values.filter(function(value, index) { return value && values.indexOf(value) === index; });
  }
  function findById(rows, id) { return rows.filter(function(row) { return row.id === id; })[0]; }

  function seedDb() {
    var events = [
      {
        id: 'AUD-2025-001', type: 'CRO Audit', title: 'C&R Research Inc. In-house Audit',
        study: 'DWC202404', product: 'DWC202404', protocol: 'DWC202404 / v2.2',
        organization: 'C&R Research Inc.', systemArea: 'Drug Product',
        scopes: ['TMF / Document Management', 'Training', 'Data Management', 'Biostatistics', 'Pharmacovigilance / Safety', 'Computerized System / IT'],
        startDate: '2025-12-17', endDate: '2025-12-18', reportIssueDate: '2026-01-14', responseDueDate: '2026-02-04',
        qmOwner: '한세희', auditLead: '김지미 / Lead Auditor / JPIN Inc.',
        sponsorClient: '함길태 / Clinical Project Leader\n김주현 / Clinical Team Manager',
        totalFindings: 10, critical: 0, major: 0, minor: 10, comments: 2,
        summary: '총 10건의 Minor Finding. 추가 General Comment로 SAE Reconciliation 관련 역할/교육, Medical Monitor의 EDC 접근 필요성, Statistical Analysis QC Report의 SAP/TFL shell/dataset 버전정보 관리가 권고됨.',
        status: 'CAPA Planning', overallCapaDue: '2026-03-31', closureDate: '',
        reportPath: 'BearDoc > Clinical Quality > AUD-2025-001 > Audit Report issued 2026-01-14',
        confidentiality: 'Audit report 원문은 별도 보관. CTMS에는 결과 요약·조치·영향 범위만 관리.',
        histories: [
          { date: '2026-01-14', actor: '한세희 (QM)', type: 'Report issued', detail: 'Audit 결과와 후속조치 추적을 시작함' },
          { date: '2025-12-18', actor: '김지미 (Lead Auditor)', type: 'Audit completed', detail: '현장 Audit 종료' }
        ]
      },
      {
        id: 'QEV-2026-002', type: 'Regulatory Inspection', title: 'MFDS 품목허가 실태조사 Follow-up',
        study: '엔블로젬 3상', product: '엔블로', protocol: 'DW_DWP16001308 / v3.0',
        organization: 'Clinical Center', systemArea: 'Clinical Operation / TMF',
        scopes: ['Clinical Operation', 'Regulatory', 'TMF / Document Management', 'Vendor Management'],
        startDate: '2026-06-15', endDate: '2026-06-17', reportIssueDate: '2026-07-01', responseDueDate: '2026-07-29',
        qmOwner: '이수진', auditLead: 'MFDS Inspector', sponsorClient: 'Clinical Center',
        totalFindings: 3, critical: 0, major: 1, minor: 2, comments: 0,
        summary: '필수문서 적시성 및 Vendor oversight 기록에 대한 후속조치 진행 중.',
        status: 'CAPA in Progress', overallCapaDue: addDays(18), closureDate: '',
        reportPath: 'eTMF > Quality > Regulatory Inspection > QEV-2026-002',
        confidentiality: '규제기관 대응 완료 전 제한 공유.',
        histories: [{ date: '2026-07-02', actor: '이수진 (QM)', type: 'Disclosure changed', detail: 'QM Only → QM + Center Head' }]
      },
      {
        id: 'QEV-2026-003', type: 'System Audit', title: 'eTMF Access Control 정기 Audit',
        study: '', product: '', protocol: '', organization: 'Internal IT / eTMF Vendor', systemArea: 'eTMF',
        scopes: ['Computerized System / IT', 'TMF / Document Management', 'Vendor Management'],
        startDate: '2026-08-03', endDate: '2026-08-04', reportIssueDate: '2026-08-12', responseDueDate: '2026-09-11',
        qmOwner: '박은영', auditLead: '한세희', sponsorClient: 'Clinical Center',
        totalFindings: 2, critical: 0, major: 0, minor: 2, comments: 1,
        summary: '퇴사자 권한 회수 증빙과 정기 접근권한 검토 기록의 표준화가 필요함.',
        status: 'Effectiveness Check', overallCapaDue: addDays(-7), closureDate: '',
        reportPath: 'BearDoc > Clinical Quality > System Audit > QEV-2026-003',
        confidentiality: '관련 팀 및 Center Leaders 공유.',
        histories: [{ date: '2026-08-12', actor: '박은영 (QM)', type: 'Report issued', detail: 'System Audit report link 등록' }]
      },
      {
        id: 'QEV-2026-004', type: 'Internal Quality Issue', title: 'Training Matrix 정합성 개선',
        study: '', product: '', protocol: '', organization: 'Clinical Center', systemArea: 'Training',
        scopes: ['Training', 'Quality Management'], startDate: '2026-08-20', endDate: '2026-08-20',
        reportIssueDate: '', responseDueDate: '', qmOwner: '한세희', auditLead: 'Internal QM', sponsorClient: 'Clinical Center',
        totalFindings: 1, critical: 0, major: 0, minor: 1, comments: 0,
        summary: '역할 변경 시 필수교육 Matrix 반영 시점의 편차를 확인함.',
        status: 'RCA in Progress', overallCapaDue: addDays(26), closureDate: '', reportPath: '',
        confidentiality: '센터 내부 개선 목적.', histories: [{ date: '2026-08-20', actor: '한세희 (QM)', type: 'Event created', detail: 'Internal Quality Issue 등록' }]
      }
    ];
    var findings = [
      {
        id: 'AUD-2025-001-GC01', eventId: 'AUD-2025-001', resultType: 'General Comment', findingDate: '2025-12-18',
        severity: 'Observation', functionalArea: 'Pharmacovigilance / Safety', issueCategory: 'Roles & Responsibilities',
        summary: 'SAE Reconciliation 역할·교육 및 Medical Monitor의 EDC 접근 관련 운영 명확화 권고',
        detail: 'PV 주관 SAE Reconciliation 시 SMP에 역할이 기술되는 경우 DM 담당자 교육 지정 필요성을 검토하고, Medical Monitor가 SAE 검토에 EDC 접근이 필요한 경우 사용자 우선 확인 후 필요 시 의뢰자와 협의하도록 권고.',
        reference: '관련 SMP / SAE Processing 절차 / Vendor oversight 절차 확인 필요',
        impactScope: 'Study', affectedStudies: 'DWC202404', affectedSops: 'SMP 및 SAE Processing 관련 SOP/절차',
        affectedAssets: 'SMP, 교육기록, EDC access 관리, PV/MM/DM 간 업무분장', affectedProcess: 'SAE Reconciliation / Medical Review',
        retrospectiveRequired: true, retrospectiveScope: '동일 CRO 및 동일 SAE reconciliation 프로세스 적용 과제 검토',
        immediateCorrection: '해당 과제의 역할·교육·접근권한 현황 확인',
        rootCause: '역할/책임 및 접근권한 기준의 불명확성 여부 RCA',
        correctivePlan: 'SMP 및 업무분장/교육 기준 명확화; 필요 시 EDC 접근 절차 보완',
        preventivePlan: '동일 프로세스 과제에 적용 가능한 checklist/가이드 반영 검토',
        owner: '담당자 지정', team: 'PV / DM / Clinical / QM', targetPlanDate: '2026-02-04', targetCompletionDate: '2026-03-31',
        status: 'CAPA Planning', effectivenessRequired: true,
        effectivenessDue: '2026-06-30', effectivenessMethod: '개선 후 동일 프로세스 적용 과제 표본 점검',
        effectivenessCriteria: '역할·교육·접근권한 누락 0건', effectivenessResult: '', effective: '',
        verifiedBy: '', verificationDate: '', closureDate: '',
        disclosureLevel: 'QM + Relevant Leaders', disclosureStatus: 'Approved for limited sharing',
        disclosureReviewDate: '2026-02-04', disclosureApprovedBy: 'QM / 센터장 지정',
        disclosureRationale: '관련 기능조직 조치 수립을 위한 제한 공유', externalProhibited: true,
        externalNote: '외부 공유 금지. Audit report 원문은 별도 권한 관리.',
        reportPath: 'Audit Report issued 2026-01-14',
        disclosureHistory: [{ date: '2026-01-14', actor: '한세희', from: 'QM Only', to: 'QM + Relevant Leaders', reason: '관련 기능조직 조치 수립' }],
        histories: [{ date: '2026-01-14', actor: '한세희 (QM)', type: 'Item registered', detail: 'General Comment를 Quality Item으로 등록' }]
      },
      {
        id: 'AUD-2025-001-GC02', eventId: 'AUD-2025-001', resultType: 'Recommendation', findingDate: '2025-12-18',
        severity: 'Observation', functionalArea: 'Biostatistics', issueCategory: 'Version Control',
        summary: 'Statistical Analysis QC Report에서 SAP/TFL shell/dataset 버전정보 관리 권고',
        detail: 'Dry-run Statistical Analysis QC Report V0.1~V0.4에서 해당 분석에 사용한 SAP version, TFL shell version 및 dataset version을 확인 가능하도록 관리할 것을 권고.',
        reference: '통계분석 QC / 문서관리 관련 SOP 확인 필요', impactScope: 'Process',
        affectedStudies: 'DWC202404 및 동일 분석 QC 양식 사용 과제', affectedSops: '통계분석 QC SOP / 문서관리 SOP',
        affectedAssets: 'Statistical Analysis QC Report, SAP, TFL shell, analysis dataset version control',
        affectedProcess: 'Statistical Analysis QC', retrospectiveRequired: true,
        retrospectiveScope: '동일 양식/프로세스를 사용하는 기존 과제 표본 검토',
        immediateCorrection: '현 과제 QC Report의 분석 input version 식별 가능 여부 확인',
        rootCause: 'QC Report template/절차에서 분석 input version 기록 요구사항의 명확성 확인',
        correctivePlan: 'QC Report template에 SAP/TFL shell/dataset version 필드 추가 또는 SOP/가이드에 반영',
        preventivePlan: '향후 모든 분석 QC Report에서 input version traceability 확인 항목을 checklist에 반영',
        owner: '통계 담당자', team: 'Biostatistics / QM', targetPlanDate: '2026-02-04', targetCompletionDate: '2026-03-31',
        status: 'CAPA Planning', effectivenessRequired: true, effectivenessDue: '2026-06-30',
        effectivenessMethod: '개정 후 신규 QC Report 표본 검토', effectivenessCriteria: 'SAP/TFL/dataset 버전 추적 가능 100%',
        effectivenessResult: '', effective: '', verifiedBy: '', verificationDate: '', closureDate: '',
        disclosureLevel: 'Relevant Team Only', disclosureStatus: 'Approved for limited sharing',
        disclosureReviewDate: '2026-02-04', disclosureApprovedBy: 'QM 지정',
        disclosureRationale: '통계팀 프로세스 개선 목적으로 공유', externalProhibited: true,
        externalNote: 'Audit 세부내용 및 CRO 정보의 외부 공유 금지', reportPath: 'Audit Report issued 2026-01-14',
        disclosureHistory: [{ date: '2026-01-14', actor: '한세희', from: 'QM Only', to: 'Relevant Team Only', reason: '통계팀 RCA 착수' }],
        histories: [{ date: '2026-01-14', actor: '한세희 (QM)', type: 'Item registered', detail: 'Recommendation을 Quality Item으로 등록' }]
      },
      {
        id: 'QEV-2026-002-F01', eventId: 'QEV-2026-002', resultType: 'Finding', findingDate: '2026-06-17',
        severity: 'Major', functionalArea: 'TMF / Document Management', issueCategory: 'Documentation',
        summary: '필수문서 Filing 적시성 및 QC 증빙 미흡', detail: '일부 필수문서의 최종본 Filing 시점과 QC 수행 근거가 일관되게 확인되지 않음.',
        reference: 'ICH-GCP E6(R2), TMF Management SOP', impactScope: 'Study', affectedStudies: '엔블로젬 3상',
        affectedSops: 'TMF Management SOP', affectedAssets: 'eTMF completeness report / QC checklist', affectedProcess: 'TMF Filing & QC',
        retrospectiveRequired: true, retrospectiveScope: '진행 중 Phase 3 과제의 필수문서 표본 점검', immediateCorrection: '해당 문서 Filing 및 QC 증빙 보완',
        rootCause: 'Vendor와 Sponsor 간 Filing 완료 기준 및 oversight 주기 불일치',
        correctivePlan: '월별 TMF reconciliation 및 escalation 기준 적용', preventivePlan: '공통 TMF oversight checklist 개정',
        owner: '이모니터', team: 'Clinical Operation / QM', targetPlanDate: '2026-07-29', targetCompletionDate: addDays(18),
        status: 'CAPA in Progress', effectivenessRequired: true, effectivenessDue: addDays(48),
        effectivenessMethod: '3개월간 월별 completeness trend 검토', effectivenessCriteria: '필수문서 적시 Filing 95% 이상',
        effectivenessResult: '', effective: '', verifiedBy: '', verificationDate: '', closureDate: '',
        disclosureLevel: 'QM + Center Head', disclosureStatus: 'Embargoed until date', disclosureReviewDate: addDays(7),
        disclosureApprovedBy: '센터장', disclosureRationale: '규제기관 대응 완료 전 공개 제한', externalProhibited: true,
        externalNote: '회사 외부 전달 금지', reportPath: 'eTMF > Quality > QEV-2026-002 > Finding 01',
        disclosureHistory: [{ date: '2026-07-02', actor: '이수진', from: 'QM Only', to: 'QM + Center Head', reason: 'CAPA 방향 검토' }],
        histories: [{ date: '2026-07-01', actor: '이수진 (QM)', type: 'Finding confirmed', detail: 'Major Finding 확정' }]
      },
      {
        id: 'QEV-2026-003-F01', eventId: 'QEV-2026-003', resultType: 'Finding', findingDate: '2026-08-04',
        severity: 'Minor', functionalArea: 'Computerized System / IT', issueCategory: 'Access Control',
        summary: 'eTMF 퇴사자 권한 회수 증빙 연결 미흡', detail: '권한은 회수되었으나 HR 퇴사 통보와 시스템 권한 회수 증빙 간 연결이 일부 누락됨.',
        reference: 'Computerized System Access Control SOP', impactScope: 'System', affectedStudies: 'All eTMF studies',
        affectedSops: 'Access Control SOP', affectedAssets: 'eTMF / Access Review Log', affectedProcess: 'User de-provisioning',
        retrospectiveRequired: true, retrospectiveScope: '최근 12개월 퇴사자 및 이동자 계정', immediateCorrection: '누락 증빙 연결 및 권한 재확인',
        rootCause: 'HR 통보와 eTMF admin ticket의 식별자 표준 부재', correctivePlan: '공통 ticket ID 필드 적용',
        preventivePlan: '분기별 접근권한 review checklist에 HR 대조 항목 추가', owner: '김안전', team: 'IT / QM',
        targetPlanDate: '2026-08-19', targetCompletionDate: addDays(-7), status: 'Effectiveness Check',
        effectivenessRequired: true, effectivenessDue: addDays(12), effectivenessMethod: '퇴사/이동자 표본 10건 확인',
        effectivenessCriteria: '권한 회수 및 증빙 연결 누락 0건', effectivenessResult: '1차 표본 10건 중 누락 0건',
        effective: '', verifiedBy: '박은영', verificationDate: '', closureDate: '',
        disclosureLevel: 'Center Leaders', disclosureStatus: 'Approved for limited sharing', disclosureReviewDate: addDays(12),
        disclosureApprovedBy: '센터장', disclosureRationale: 'System owner 및 관리책임자 공유', externalProhibited: true,
        externalNote: '보안 세부정보 외부 공유 금지', reportPath: 'BearDoc > Clinical Quality > QEV-2026-003 > F01',
        disclosureHistory: [{ date: '2026-08-12', actor: '박은영', from: 'QM + Relevant Leaders', to: 'Center Leaders', reason: '시스템 공통 영향 확인' }],
        histories: [{ date: '2026-08-25', actor: '박은영 (QM)', type: 'Status changed', detail: 'CAPA in Progress → Effectiveness Check' }]
      },
      {
        id: 'QEV-2026-004-F01', eventId: 'QEV-2026-004', resultType: 'Finding', findingDate: '2026-08-20',
        severity: 'Minor', functionalArea: 'Training', issueCategory: 'Training',
        summary: '역할 변경 후 Training Matrix 반영 지연', detail: '업무 역할 변경일과 Training Matrix 반영일 간 편차가 확인됨.',
        reference: 'Training Management SOP', impactScope: 'Clinical Center', affectedStudies: '',
        affectedSops: 'Training Management SOP', affectedAssets: 'Training Matrix / LMS', affectedProcess: 'Role change training assignment',
        retrospectiveRequired: false, retrospectiveScope: '', immediateCorrection: '대상자 필수교육 할당 상태 확인',
        rootCause: 'R&R 변경 승인과 교육 할당 간 자동 연계 부재', correctivePlan: '월 1회 역할 변경자 대조',
        preventivePlan: '인사/조직 변경 checklist에 Training Matrix update 추가', owner: '홍길동', team: 'QM / HR',
        targetPlanDate: addDays(7), targetCompletionDate: addDays(26), status: 'RCA in Progress',
        effectivenessRequired: false, effectivenessDue: '', effectivenessMethod: '', effectivenessCriteria: '', effectivenessResult: '',
        effective: '', verifiedBy: '', verificationDate: '', closureDate: '',
        disclosureLevel: 'Center-wide', disclosureStatus: 'Approved for center-wide sharing', disclosureReviewDate: '',
        disclosureApprovedBy: 'QM Lead', disclosureRationale: '센터 공통 프로세스 개선', externalProhibited: false,
        externalNote: '', reportPath: '', disclosureHistory: [],
        histories: [{ date: '2026-08-20', actor: '한세희 (QM)', type: 'Finding created', detail: 'Internal Quality Issue 확인' }]
      }
    ];
    var capas = [
      {
        id: 'AUD-2025-001-GC02-A01', findingId: 'AUD-2025-001-GC02', type: 'Correction',
        description: '[예시 제안] 현 과제 Statistical Analysis QC Report에서 사용 SAP/TFL shell/dataset version을 식별 가능하도록 보완',
        owner: '통계 담당자', ownerId: 'u5', team: 'Biostatistics', affectedSop: '통계분석 QC SOP / 문서관리 SOP',
        affectedAsset: 'Statistical Analysis QC Report', plannedStart: '2026-02-05', dueDate: '2026-02-28',
        actualCompletion: '', status: 'Not Started', evidence: '', delayReason: '', effectivenessRequired: false,
        effectivenessDue: '', method: '', criteria: '', result: '', effective: '', verifiedBy: '', verificationDate: '', closureDate: '',
        qmComment: '실제 CAPA 확정 후 Owner/Due date 수정', mockProposal: true
      },
      {
        id: 'AUD-2025-001-GC02-A02', findingId: 'AUD-2025-001-GC02', type: 'Corrective Action',
        description: '[예시 제안] QC Report template 또는 작성 가이드에 SAP/TFL shell/dataset version 필수 기록 항목 반영',
        owner: '통계 프로세스 Owner', ownerId: 'u5', team: 'Biostatistics', affectedSop: '통계분석 QC SOP / 문서관리 SOP',
        affectedAsset: 'QC Report Template / Guide', plannedStart: '2026-02-05', dueDate: '2026-03-31',
        actualCompletion: '', status: 'Not Started', evidence: '', delayReason: '', effectivenessRequired: true,
        effectivenessDue: '2026-06-30', method: '개정 후 생성된 QC Report 표본 검토', criteria: '버전정보 추적 가능 100%',
        result: '', effective: '', verifiedBy: '', verificationDate: '', closureDate: '',
        qmComment: '권고사항을 시스템성 조치로 전환하는 예시', mockProposal: true
      },
      {
        id: 'AUD-2025-001-GC01-A01', findingId: 'AUD-2025-001-GC01', type: 'Preventive/Systemic Action',
        description: '[예시 제안] 동일 CRO/프로세스 적용 과제에서 SAE reconciliation 역할·교육·EDC 접근 기준을 retrospective review',
        owner: '관련 프로세스 Owner', ownerId: 'u6', team: 'PV / DM / Clinical / QM',
        affectedSop: 'SMP / SAE Processing / Vendor Oversight 관련 절차', affectedAsset: 'SMP / Training / EDC Access',
        plannedStart: '2026-02-05', dueDate: '2026-03-31', actualCompletion: '', status: 'Not Started',
        evidence: '', delayReason: '', effectivenessRequired: true, effectivenessDue: '2026-06-30',
        method: '동일 프로세스 과제 표본 점검', criteria: '역할·교육·접근권한 누락 0건', result: '', effective: '',
        verifiedBy: '', verificationDate: '', closureDate: '', qmComment: '실제 적용범위는 QM 및 관련팀 RCA 후 확정', mockProposal: true
      },
      {
        id: 'QEV-2026-002-F01-A01', findingId: 'QEV-2026-002-F01', type: 'Correction',
        description: '해당 필수문서 Filing 및 QC 증빙 보완',
        owner: '이모니터', ownerId: 'u3', team: 'Clinical Operation', affectedSop: 'TMF Management SOP',
        affectedAsset: 'eTMF / QC Checklist', plannedStart: '2026-07-02', dueDate: addDays(-14), actualCompletion: '',
        status: 'In Progress', evidence: 'eTMF > QEV-2026-002 > Evidence A01', delayReason: 'Vendor QC 자료 회신 지연',
        effectivenessRequired: false, effectivenessDue: '', method: '', criteria: '', result: '', effective: '',
        verifiedBy: '', verificationDate: '', closureDate: '', qmComment: '주 1회 진행상태 업데이트', mockProposal: false
      },
      {
        id: 'QEV-2026-002-F01-A02', findingId: 'QEV-2026-002-F01', type: 'Preventive/Systemic Action',
        description: '공통 TMF oversight checklist 개정 및 Phase 3 과제 적용',
        owner: '이수진', ownerId: 'u1', team: 'QM / Clinical Operation', affectedSop: 'TMF Oversight Procedure',
        affectedAsset: 'TMF Oversight Checklist', plannedStart: addDays(-5), dueDate: addDays(18), actualCompletion: '',
        status: 'In Progress', evidence: '', delayReason: '', effectivenessRequired: true, effectivenessDue: addDays(48),
        method: '3개월간 completeness trend 검토', criteria: '필수문서 적시 Filing 95% 이상', result: '', effective: '',
        verifiedBy: '', verificationDate: '', closureDate: '', qmComment: '', mockProposal: false
      },
      {
        id: 'QEV-2026-003-F01-A01', findingId: 'QEV-2026-003-F01', type: 'Corrective Action',
        description: 'HR 통보와 eTMF admin ticket에 공통 식별자 적용',
        owner: '김안전', ownerId: 'u6', team: 'IT / QM', affectedSop: 'Access Control SOP',
        affectedAsset: 'eTMF / Access Review Log', plannedStart: '2026-08-13', dueDate: addDays(-7), actualCompletion: addDays(-8),
        status: 'Effectiveness Check', evidence: 'BearDoc > Quality > QEV-2026-003 > A01 Evidence', delayReason: '',
        effectivenessRequired: true, effectivenessDue: addDays(12), method: '퇴사/이동자 표본 10건 확인',
        criteria: '권한 회수 및 증빙 연결 누락 0건', result: '1차 표본 10건 중 누락 0건', effective: '',
        verifiedBy: '박은영', verificationDate: '', closureDate: '', qmComment: '2차 확인 후 Closure 검토', mockProposal: false
      },
      {
        id: 'QEV-2026-004-F01-A01', findingId: 'QEV-2026-004-F01', type: 'Corrective Action',
        description: '월 1회 역할 변경자와 Training Matrix 대조 절차 운영',
        owner: '홍길동', ownerId: 'u2', team: 'QM / HR', affectedSop: 'Training Management SOP',
        affectedAsset: 'Training Matrix', plannedStart: addDays(2), dueDate: addDays(26), actualCompletion: '',
        status: 'Not Started', evidence: '', delayReason: '', effectivenessRequired: false, effectivenessDue: '',
        method: '', criteria: '', result: '', effective: '', verifiedBy: '', verificationDate: '', closureDate: '',
        qmComment: '', mockProposal: false
      }
    ];
    return { version: 1, events: events, findings: findings, capas: capas };
  }

  function parseRoute() {
    var parts = (location.hash || '#quality/dashboard').replace(/^#/, '').split('/');
    if (parts[0] !== 'quality') return { view: 'dashboard', id: '', sub: '' };
    return { view: parts[1] || 'dashboard', id: decodeURIComponent(parts[2] || ''), sub: parts[3] || '' };
  }
  function visibleFinding(finding, db, role) {
    if (role === 'qm') return true;
    if (role === 'center-head') return finding.disclosureLevel !== 'QM Only';
    if (role === 'team-leader') return ['QM + Relevant Leaders', 'Relevant Team Only', 'Center Leaders', 'Center-wide', 'Company-wide'].indexOf(finding.disclosureLevel) !== -1;
    if (role === 'action-owner') {
      return finding.disclosureLevel === 'Center-wide' || finding.disclosureLevel === 'Company-wide'
        || db.capas.some(function(capa) { return capa.findingId === finding.id && capa.ownerId === 'u3'; });
    }
    return ['Center-wide', 'Company-wide'].indexOf(finding.disclosureLevel) !== -1
      && finding.disclosureStatus === 'Approved for center-wide sharing';
  }
  function scopedDb(db, role) {
    var findings = db.findings.filter(function(finding) { return visibleFinding(finding, db, role); });
    var findingIds = findings.map(function(finding) { return finding.id; });
    var eventIds = unique(findings.map(function(finding) { return finding.eventId; }));
    return {
      events: role === 'qm' ? db.events : db.events.filter(function(event) { return eventIds.indexOf(event.id) !== -1; }),
      findings: findings,
      capas: db.capas.filter(function(capa) {
        if (role === 'action-owner') return capa.ownerId === 'u3' || findingIds.indexOf(capa.findingId) !== -1;
        return findingIds.indexOf(capa.findingId) !== -1;
      })
    };
  }
  function badge(text, kind) { return '<span class="qm-badge ' + (kind || 'neutral') + '">' + esc(text) + '</span>'; }
  function severityBadge(value) {
    return badge(value || '-', value === 'Critical' || value === 'Major' ? 'danger' : (value === 'Minor' ? 'warning' : 'neutral'));
  }
  function statusBadge(value) {
    var kind = /Closed/.test(value) ? 'success' : (/Hold|Not Started|Draft/.test(value) ? 'neutral' : (/Effectiveness|Progress/.test(value) ? 'info' : 'warning'));
    return badge(value || '-', kind);
  }
  function disclosureBadge(finding) {
    var restricted = finding.disclosureStatus === 'Restricted' || finding.disclosureStatus === 'Embargoed until date';
    return badge((restricted ? 'Restricted · ' : '') + finding.disclosureLevel, restricted ? 'restricted' : 'neutral');
  }
  function dueHtml(date, status) {
    if (!date) return '<span class="qm-muted">-</span>';
    if (status === 'Closed') return esc(date);
    var days = daysFromToday(date);
    var cls = days < 0 ? ' overdue' : (days <= 30 ? ' soon' : '');
    var label = days < 0 ? ' · ' + Math.abs(days) + '일 지연' : (days <= 30 ? ' · D-' + days : '');
    return '<span class="qm-due' + cls + '">' + esc(date + label) + '</span>';
  }
  function canEditCapa(role, capa) { return role === 'qm' || (role === 'action-owner' && capa.ownerId === 'u3'); }
  function selectOptions(values, selected, allLabel) {
    return '<option value="">' + esc(allLabel || '전체') + '</option>' + values.map(function(value) {
      return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(value) + '</option>';
    }).join('');
  }
  function routeView(route) {
    if (route.view === 'event') return 'events';
    if (route.view === 'finding') return 'findings';
    return route.view;
  }
  function moduleNav(route, scoped) {
    var active = routeView(route);
    var openFindings = scoped.findings.filter(function(f) { return f.status !== 'Closed'; }).length;
    var openCapas = scoped.capas.filter(function(c) { return c.status !== 'Closed'; }).length;
    var links = [
      ['dashboard', 'Quality Dashboard', ''],
      ['events', 'Audit / Inspection', scoped.events.length],
      ['findings', 'Findings', openFindings],
      ['capa', 'CAPA Actions', openCapas],
      ['my-capa', 'My CAPA Actions', scoped.capas.filter(function(c) { return c.ownerId === 'u3'; }).length]
    ];
    return '<nav class="qm-nav" aria-label="Quality Management">' + links.map(function(item) {
      return '<a href="#quality/' + item[0] + '" class="' + (active === item[0] ? 'active' : '') + '">' + item[1]
        + (item[2] === '' ? '' : '<span class="qm-nav-count">' + item[2] + '</span>') + '</a>';
    }).join('') + '</nav>';
  }
  function moduleHeader(title, description, role) {
    return '<div class="qm-module-head"><div><h2>' + esc(title) + '</h2><p>' + esc(description) + '</p></div>'
      + '<label class="qm-role-preview">권한 미리보기 <select data-qm-role>' + Object.keys(ROLE_LABELS).map(function(key) {
        return '<option value="' + key + '"' + (key === role ? ' selected' : '') + '>' + esc(ROLE_LABELS[key]) + '</option>';
      }).join('') + '</select></label></div>';
  }
  function chartRows(counts) {
    var entries = Object.keys(counts).map(function(key) { return [key, counts[key]]; }).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 6);
    var max = Math.max.apply(null, entries.map(function(row) { return row[1]; }).concat([1]));
    return '<div class="qm-chart-list">' + entries.map(function(row) {
      return '<div class="qm-chart-row"><span class="qm-chart-label" title="' + esc(row[0]) + '">' + esc(row[0]) + '</span>'
        + '<div class="qm-chart-track"><div class="qm-chart-fill" style="width:' + ((row[1] / max) * 100).toFixed(1) + '%"></div></div><span class="qm-chart-value">' + row[1] + '</span></div>';
    }).join('') + '</div>';
  }
  function countBy(rows, field) {
    var counts = {};
    rows.forEach(function(row) { var key = row[field] || 'Other'; counts[key] = (counts[key] || 0) + 1; });
    return counts;
  }
  function actionBox(title, items, kind) {
    return '<div class="qm-action-box"><h4>' + esc(title) + ' · ' + items.length + '</h4>'
      + (items.length ? items.slice(0, 4).map(function(item) {
        var href = item.findingId ? '#quality/finding/' + encodeURIComponent(item.findingId) + '/capa' : '#quality/finding/' + encodeURIComponent(item.id);
        return '<a class="qm-action-item" href="' + href + '"><strong>' + esc(item.description || item.summary) + '</strong><span>'
          + esc((item.owner || item.team || item.disclosureLevel || '') + (item.dueDate || item.effectivenessDue || item.disclosureReviewDate ? ' · ' + (item.dueDate || item.effectivenessDue || item.disclosureReviewDate) : '')) + '</span></a>';
      }).join('') : '<div class="qm-empty" style="padding:18px">해당 항목 없음</div>') + '</div>';
  }
  function dashboardView(scoped, role) {
    var openFindings = scoped.findings.filter(function(f) { return f.status !== 'Closed'; });
    var criticalMajor = openFindings.filter(function(f) { return f.severity === 'Critical' || f.severity === 'Major'; });
    var openCapas = scoped.capas.filter(function(c) { return c.status !== 'Closed'; });
    var overdue = openCapas.filter(function(c) { return daysFromToday(c.dueDate) < 0; });
    var dueSoon = openCapas.filter(function(c) { var d = daysFromToday(c.dueDate); return d >= 0 && d <= 30; });
    var effectiveness = openCapas.filter(function(c) { return c.effectivenessRequired && c.effective !== 'Yes'; });
    var restricted = scoped.findings.filter(function(f) { return f.disclosureStatus === 'Restricted' || f.disclosureStatus === 'Embargoed until date'; });
    var openEvents = scoped.events.filter(function(e) { return e.status !== 'Closed'; });
    var reviewDue = restricted.filter(function(f) { return f.disclosureReviewDate && daysFromToday(f.disclosureReviewDate) <= 30; });
    var kpis = [
      ['Open Findings', openFindings.length, ''], ['Critical / Major Open', criticalMajor.length, 'danger'],
      ['Overdue CAPA', overdue.length, 'danger'], ['CAPA Due ≤ 30 Days', dueSoon.length, 'warning'],
      ['Effectiveness Pending', effectiveness.length, 'warning'], ['Restricted / Embargoed', restricted.length, 'restricted'],
      ['Open Audit / Inspection', openEvents.length, '']
    ];
    return moduleHeader('Quality Dashboard', '센터 전체 Quality Risk와 후속조치 우선순위를 확인합니다.', role)
      + '<div class="qm-kpis">' + kpis.map(function(kpi) {
        return '<div class="qm-kpi ' + kpi[2] + '"><div class="qm-kpi-label">' + esc(kpi[0]) + '</div><div class="qm-kpi-value">' + kpi[1] + '</div></div>';
      }).join('') + '</div>'
      + '<div class="qm-grid-3">'
      + '<section class="qm-card"><h3 class="qm-card-title">Findings by Source <small>Open items</small></h3>' + chartRows(countBy(openFindings.map(function(f) {
        var event = findById(scoped.events, f.eventId); return { source: event ? event.type : 'Other' };
      }), 'source')) + '</section>'
      + '<section class="qm-card"><h3 class="qm-card-title">Findings by Functional Area</h3>' + chartRows(countBy(openFindings, 'functionalArea')) + '</section>'
      + '<section class="qm-card"><h3 class="qm-card-title">Findings by Issue Category</h3>' + chartRows(countBy(openFindings, 'issueCategory')) + '</section></div>'
      + '<section class="qm-card"><h3 class="qm-card-title">Action Required <small>Due date와 공개 검토일 기준</small></h3><div class="qm-action-sections">'
      + actionBox('Overdue CAPA', overdue, 'danger') + actionBox('Upcoming CAPA', dueSoon, 'warning')
      + actionBox('Effectiveness Check Pending', effectiveness, 'info') + actionBox('Restricted Finding Review Due', reviewDue, 'restricted')
      + '</div></section>';
  }

  function eventListView(scoped, role) {
    var rows = scoped.events.filter(function(event) {
      var q = filterState.eventQuery.toLowerCase();
      return (!filterState.eventType || event.type === filterState.eventType)
        && (!filterState.eventStatus || event.status === filterState.eventStatus)
        && (!q || (event.id + ' ' + event.title + ' ' + event.study + ' ' + event.organization).toLowerCase().indexOf(q) !== -1);
    });
    return moduleHeader('Audit / Inspection', 'Quality Event를 등록하고 Report 결과와 후속조치를 연결합니다.', role)
      + '<div class="qm-card"><div class="qm-filter">'
      + '<label>Event Type<select data-qm-filter="eventType">' + selectOptions(EVENT_TYPES, filterState.eventType) + '</select></label>'
      + '<label>Status<select data-qm-filter="eventStatus">' + selectOptions(unique(scoped.events.map(function(e) { return e.status; })), filterState.eventStatus) + '</select></label>'
      + '<label>검색<input class="qm-search" data-qm-filter="eventQuery" value="' + esc(filterState.eventQuery) + '" placeholder="Event ID, 제목, Study, Vendor"></label>'
      + '<button type="button" class="btn btn-outline" data-qm-reset="event">초기화</button>' + (role === 'qm' ? '<button type="button" class="btn btn-primary" data-new-quality-event>+ Quality Event</button>' : '') + '</div>'
      + '<div class="qm-table-wrap"><table class="qm-table"><thead><tr><th>Event ID</th><th>Type / Title</th><th>Study / Product</th><th>Audited Organization</th><th>Audit Date</th><th>QM Owner</th><th>Findings</th><th>C/M/m</th><th>Status</th><th>CAPA Due</th></tr></thead><tbody>'
      + (rows.length ? rows.map(function(event) {
        return '<tr data-qm-href="#quality/event/' + encodeURIComponent(event.id) + '/overview"><td><a class="qm-id-link" href="#quality/event/' + encodeURIComponent(event.id) + '/overview">' + esc(event.id) + '</a></td>'
          + '<td><span class="qm-muted">' + esc(event.type) + '</span><br><strong>' + esc(event.title) + '</strong></td><td>' + esc(event.study || event.product || '-') + '</td>'
          + '<td>' + esc(event.organization || '-') + '</td><td>' + esc(event.startDate + ' ~ ' + event.endDate) + '</td><td>' + esc(event.qmOwner) + '</td>'
          + '<td>' + event.totalFindings + ' + ' + event.comments + '</td><td>' + event.critical + ' / ' + event.major + ' / ' + event.minor + '</td>'
          + '<td>' + statusBadge(event.status) + '</td><td>' + dueHtml(event.overallCapaDue, event.status) + '</td></tr>';
      }).join('') : '<tr><td colspan="10"><div class="qm-empty">조건에 맞는 Quality Event가 없습니다.</div></td></tr>') + '</tbody></table></div></div>';
  }

  function findingListView(scoped, role) {
    var areas = unique(scoped.findings.map(function(f) { return f.functionalArea; })).sort();
    var rows = scoped.findings.filter(function(finding) {
      var q = filterState.findingQuery.toLowerCase();
      return (!filterState.findingSeverity || finding.severity === filterState.findingSeverity)
        && (!filterState.findingStatus || finding.status === filterState.findingStatus)
        && (!filterState.findingArea || finding.functionalArea === filterState.findingArea)
        && (!q || (finding.id + ' ' + finding.summary + ' ' + finding.affectedStudies + ' ' + finding.team).toLowerCase().indexOf(q) !== -1);
    });
    return moduleHeader('Findings', 'Finding·Comment·Recommendation을 동일한 Impact–RCA–CAPA 흐름으로 관리합니다.', role)
      + '<div class="qm-card"><div class="qm-filter">'
      + '<label>Severity<select data-qm-filter="findingSeverity">' + selectOptions(['Critical','Major','Minor','Observation'], filterState.findingSeverity) + '</select></label>'
      + '<label>Functional Area<select data-qm-filter="findingArea">' + selectOptions(areas, filterState.findingArea) + '</select></label>'
      + '<label>Status<select data-qm-filter="findingStatus">' + selectOptions(FINDING_STATUSES, filterState.findingStatus) + '</select></label>'
      + '<label>검색<input class="qm-search" data-qm-filter="findingQuery" value="' + esc(filterState.findingQuery) + '" placeholder="Item ID, 내용, Study, Team"></label>'
      + '<button type="button" class="btn btn-outline" data-qm-reset="finding">초기화</button>' + (role === 'qm' ? '<button type="button" class="btn btn-primary" data-new-finding>+ Finding / Item</button>' : '') + '</div>'
      + '<div class="qm-table-wrap"><table class="qm-table"><thead><tr><th>Item ID</th><th>Result / Severity</th><th>Finding Summary</th><th>Functional Area</th><th>Issue Category</th><th>Study / Product</th><th>Owner / Team</th><th>Target Date</th><th>Status</th><th>Visibility</th></tr></thead><tbody>'
      + (rows.length ? rows.map(function(finding) {
        return '<tr data-qm-href="#quality/finding/' + encodeURIComponent(finding.id) + '/summary"><td><a class="qm-id-link" href="#quality/finding/' + encodeURIComponent(finding.id) + '/summary">' + esc(finding.id) + '</a></td>'
          + '<td>' + badge(finding.resultType, 'neutral') + '<br>' + severityBadge(finding.severity) + '</td><td><strong>' + esc(finding.summary) + '</strong></td>'
          + '<td>' + esc(finding.functionalArea) + '</td><td>' + esc(finding.issueCategory) + '</td><td>' + esc(finding.affectedStudies || '-') + '</td>'
          + '<td>' + esc(finding.owner + ' / ' + finding.team) + '</td><td>' + dueHtml(finding.targetCompletionDate, finding.status) + '</td>'
          + '<td>' + statusBadge(finding.status) + '</td><td>' + disclosureBadge(finding) + '</td></tr>';
      }).join('') : '<tr><td colspan="10"><div class="qm-empty">현재 권한 또는 검색 조건에서 조회 가능한 Finding이 없습니다.</div></td></tr>') + '</tbody></table></div></div>';
  }

  function capaListView(scoped, role, myOnly) {
    var rows = scoped.capas.filter(function(capa) {
      var q = filterState.capaQuery.toLowerCase();
      return (!myOnly || capa.ownerId === 'u3')
        && (!filterState.capaStatus || capa.status === filterState.capaStatus)
        && (!filterState.capaOwner || capa.owner === filterState.capaOwner)
        && (!q || (capa.id + ' ' + capa.description + ' ' + capa.findingId + ' ' + capa.team).toLowerCase().indexOf(q) !== -1);
    });
    return moduleHeader(myOnly ? 'My CAPA Actions' : 'CAPA Actions', myOnly ? 'Action Owner에게 할당된 조치와 Due Date를 확인합니다.' : 'Finding별 1:N Action, Evidence와 Effectiveness Check를 추적합니다.', role)
      + (myOnly && role !== 'action-owner' ? '<div class="qm-sensitive-note">PoC에서는 Action Owner 계정(이모니터/u3)에 할당된 Action을 미리보기합니다.</div>' : '')
      + '<div class="qm-card"><div class="qm-filter">'
      + '<label>Status<select data-qm-filter="capaStatus">' + selectOptions(CAPA_STATUSES, filterState.capaStatus) + '</select></label>'
      + (myOnly ? '' : '<label>Owner<select data-qm-filter="capaOwner">' + selectOptions(unique(scoped.capas.map(function(c) { return c.owner; })).sort(), filterState.capaOwner) + '</select></label>')
      + '<label>검색<input class="qm-search" data-qm-filter="capaQuery" value="' + esc(filterState.capaQuery) + '" placeholder="CAPA ID, Action, Finding, Team"></label>'
      + '<button type="button" class="btn btn-outline" data-qm-reset="capa">초기화</button></div>'
      + '<div class="qm-table-wrap"><table class="qm-table"><thead><tr><th>CAPA ID</th><th>Type / Action</th><th>Finding</th><th>Owner / Team</th><th>Due Date</th><th>Status</th><th>Evidence</th><th>Effectiveness</th><th>관리</th></tr></thead><tbody>'
      + (rows.length ? rows.map(function(capa) {
        return '<tr><td><strong>' + esc(capa.id) + '</strong>' + (capa.mockProposal ? '<br>' + badge('UI 검증용 Mock', 'mock') : '') + '</td>'
          + '<td><span class="qm-muted">' + esc(capa.type) + '</span><br><strong>' + esc(capa.description) + '</strong></td>'
          + '<td><a class="qm-id-link" href="#quality/finding/' + encodeURIComponent(capa.findingId) + '/capa">' + esc(capa.findingId) + '</a></td>'
          + '<td>' + esc(capa.owner + ' / ' + capa.team) + '</td><td>' + dueHtml(capa.dueDate, capa.status) + '</td><td>' + statusBadge(capa.status) + '</td>'
          + '<td>' + (capa.evidence ? '<span title="' + esc(capa.evidence) + '">등록됨</span>' : '<span class="qm-muted">미등록</span>') + '</td>'
          + '<td>' + (capa.effectivenessRequired ? badge(capa.effective === 'Yes' ? 'Effective' : 'Pending', capa.effective === 'Yes' ? 'success' : 'warning') : '<span class="qm-muted">Not required</span>') + '</td>'
          + '<td>' + (canEditCapa(role, capa) ? '<button type="button" class="btn btn-outline" style="padding:5px 9px;font-size:10px" data-edit-capa="' + esc(capa.id) + '">업데이트</button>' : '<span class="qm-muted">조회</span>') + '</td></tr>';
      }).join('') : '<tr><td colspan="9"><div class="qm-empty">조건에 맞는 CAPA Action이 없습니다.</div></td></tr>') + '</tbody></table></div></div>';
  }

  function dl(rows) {
    return '<dl class="qm-dl">' + rows.map(function(row) {
      return '<div class="' + (row[2] ? 'wide' : '') + '"><dt>' + esc(row[0]) + '</dt><dd>' + (row[3] ? row[1] : esc(row[1] || '-')) + '</dd></div>';
    }).join('') + '</dl>';
  }
  function scopes(values) { return '<div class="qm-scope-list">' + (values || []).map(function(value) { return '<span class="qm-scope-pill">' + esc(value) + '</span>'; }).join('') + '</div>'; }
  function historyHtml(rows) {
    return '<div class="qm-history">' + (rows && rows.length ? rows.map(function(row) {
      return '<div class="qm-history-row"><time>' + esc(row.date) + '</time><strong>' + esc(row.type || row.actor) + '</strong><span>' + esc((row.actor && row.type ? row.actor + ' · ' : '') + (row.detail || row.reason || '')) + '</span></div>';
    }).join('') : '<div class="qm-empty">기록된 History가 없습니다.</div>') + '</div>';
  }
  function eventDetailView(db, scoped, event, sub, role) {
    if (!event || scoped.events.indexOf(event) === -1) return accessDenied(role);
    sub = ['overview','findings','capa','documents','history'].indexOf(sub) !== -1 ? sub : 'overview';
    var findings = scoped.findings.filter(function(f) { return f.eventId === event.id; });
    var ids = findings.map(function(f) { return f.id; });
    var capas = scoped.capas.filter(function(c) { return ids.indexOf(c.findingId) !== -1; });
    var base = '#quality/event/' + encodeURIComponent(event.id) + '/';
    var content = '';
    if (sub === 'overview') {
      content = '<section class="qm-section accent"><h3>Audit / Inspection Overview</h3>'
        + dl([['Event Type', event.type], ['Study / Product', event.study || event.product || '센터 공통'], ['Protocol / Version', event.protocol],
          ['Audited Organization / Vendor', event.organization], ['System / Area', event.systemArea], ['Audit Scope / Areas Reviewed', scopes(event.scopes), true, true],
          ['Audit Period', event.startDate + ' ~ ' + event.endDate], ['Report / Response Due', (event.reportIssueDate || '-') + ' / ' + (event.responseDueDate || '-')],
          ['QM Owner', event.qmOwner], ['Audit Lead / Inspector', event.auditLead], ['Sponsor / Audit Client', event.sponsorClient, true],
          ['Overall Result Summary', event.summary, true], ['Confidentiality / Disclosure Note', event.confidentiality, true]]) + '</section>';
    } else if (sub === 'findings') {
      var detailedFindingCount = findings.filter(function(f) { return f.resultType === 'Finding'; }).length;
      content = '<section class="qm-section"><h3>Findings / Comments / Recommendations</h3>'
        + (event.totalFindings > detailedFindingCount ? '<div class="qm-sensitive-note">Event Summary에는 Finding ' + event.totalFindings + '건이 집계되어 있으며, Excel Reference에서 상세 Item으로 제공된 ' + findings.length + '건만 이 PoC에 표시됩니다.</div>' : '')
        + compactFindingTable(findings) + '</section>';
    } else if (sub === 'capa') {
      content = '<section class="qm-section capa"><h3>CAPA Actions</h3>' + capaCards(capas, role) + '</section>';
    } else if (sub === 'documents') {
      content = '<section class="qm-section"><h3>Documents / Evidence Links</h3><div class="qm-sensitive-note">CTMS는 원문 Repository가 아닙니다. Report ID와 기존 문서관리시스템 경로만 관리합니다.</div>'
        + dl([['Audit Report / Evidence Path', '<a class="qm-doc-link" href="#" onclick="return false">' + esc(event.reportPath || '경로 미등록') + '</a>', true, true],
          ['Report Issue Date', event.reportIssueDate], ['Confidentiality Note', event.confidentiality, true]]) + '</section>';
    } else {
      content = '<section class="qm-section"><h3>Event History</h3>' + historyHtml(event.histories) + '</section>';
    }
    return '<div class="qm-detail-head"><div><a class="qm-detail-id" href="#quality/events">← Audit / Inspection</a><h2>' + esc(event.title) + '</h2><p>' + esc(event.id + ' · ' + event.type + ' · ' + (event.study || '센터 공통')) + '</p></div>'
      + '<div class="qm-summary-metrics"><div class="qm-summary-metric"><b>' + event.totalFindings + '</b><span>Findings</span></div><div class="qm-summary-metric"><b>' + event.comments + '</b><span>Comments</span></div><div class="qm-summary-metric"><b>' + capas.filter(function(c) { return c.status !== 'Closed'; }).length + '</b><span>Open CAPA</span></div>' + statusBadge(event.status) + '</div></div>'
      + '<nav class="qm-subnav">' + [['overview','Overview'],['findings','Findings'],['capa','CAPA'],['documents','Documents / Evidence'],['history','History']].map(function(item) {
        return '<a href="' + base + item[0] + '" class="' + (sub === item[0] ? 'active' : '') + '">' + item[1] + '</a>';
      }).join('') + '</nav>' + content;
  }
  function compactFindingTable(findings) {
    if (!findings.length) return '<div class="qm-empty">조회 가능한 Item이 없습니다.</div>';
    return '<div class="qm-table-wrap"><table class="qm-table"><thead><tr><th>Item ID</th><th>Type / Severity</th><th>Summary</th><th>Area / Category</th><th>Status</th><th>Disclosure</th></tr></thead><tbody>'
      + findings.map(function(f) { return '<tr data-qm-href="#quality/finding/' + encodeURIComponent(f.id) + '/summary"><td><a class="qm-id-link" href="#quality/finding/' + encodeURIComponent(f.id) + '/summary">' + esc(f.id) + '</a></td><td>' + badge(f.resultType) + '<br>' + severityBadge(f.severity) + '</td><td><strong>' + esc(f.summary) + '</strong></td><td>' + esc(f.functionalArea + ' / ' + f.issueCategory) + '</td><td>' + statusBadge(f.status) + '</td><td>' + disclosureBadge(f) + '</td></tr>'; }).join('')
      + '</tbody></table></div>';
  }
  function capaCards(capas, role) {
    if (!capas.length) return '<div class="qm-empty">연결된 CAPA Action이 없습니다.</div>';
    return '<div class="qm-capa-cards">' + capas.map(function(capa) {
      return '<article class="qm-capa-card"><div class="qm-capa-card-head"><div><h4>' + esc(capa.id) + '</h4>' + (capa.mockProposal ? badge('UI 검증용 Mock · 미확정 CAPA', 'mock') : '') + '</div>' + statusBadge(capa.status) + '</div>'
        + '<p><strong>' + esc(capa.type) + '</strong> · ' + esc(capa.description) + '</p><div class="qm-capa-meta"><span>Owner: ' + esc(capa.owner) + '</span><span>Team: ' + esc(capa.team) + '</span><span>Due: ' + dueHtml(capa.dueDate, capa.status) + '</span><span>Evidence: ' + esc(capa.evidence || '미등록') + '</span></div>'
        + (canEditCapa(role, capa) ? '<div style="margin-top:9px"><button type="button" class="btn btn-outline" style="padding:5px 9px;font-size:10px" data-edit-capa="' + esc(capa.id) + '">상태 / Evidence 업데이트</button></div>' : '') + '</article>';
    }).join('') + '</div>';
  }
  function findingFlow(status) {
    var steps = ['Finding', 'Impact Assessment', 'Root Cause', 'CAPA Action', 'Effectiveness Check', 'Closure'];
    var index = status === 'Draft' ? 0 : status === 'RCA in Progress' ? 2 : (status === 'CAPA Planning' || status === 'CAPA in Progress') ? 3 : status === 'Effectiveness Check' ? 4 : status === 'Closed' ? 5 : 1;
    return '<div class="qm-flow">' + steps.map(function(step, i) { return '<div class="qm-flow-step ' + (i < index ? 'done' : (i === index ? 'current' : '')) + '">' + esc(step) + '</div>'; }).join('') + '</div>';
  }
  function findingDetailView(db, scoped, finding, sub, role) {
    if (!finding || scoped.findings.indexOf(finding) === -1) return accessDenied(role);
    sub = ['summary','impact','rca','capa','effectiveness','disclosure','history'].indexOf(sub) !== -1 ? sub : 'summary';
    var event = findById(db.events, finding.eventId);
    var capas = scoped.capas.filter(function(c) { return c.findingId === finding.id; });
    var base = '#quality/finding/' + encodeURIComponent(finding.id) + '/';
    var content = '';
    if (sub === 'summary') {
      content = '<section class="qm-section accent"><h3>Finding Summary & Classification</h3>'
        + dl([['Report Result Type', finding.resultType], ['Severity', severityBadge(finding.severity), false, true],
          ['Functional Area', finding.functionalArea], ['Issue Category', finding.issueCategory],
          ['Finding / Comment Summary', finding.summary, true], ['Detailed Finding / Recommendation', finding.detail, true],
          ['Regulation / SOP Reference', finding.reference, true]]) + '</section>';
    } else if (sub === 'impact') {
      content = '<section class="qm-section accent"><h3>Impact Assessment</h3>'
        + dl([['Impact Scope', finding.impactScope], ['Affected Studies / Products', finding.affectedStudies],
          ['Affected SOP(s)', finding.affectedSops, true], ['Affected Documents / Systems', finding.affectedAssets, true],
          ['Affected Process', finding.affectedProcess, true], ['Retrospective Review Required?', finding.retrospectiveRequired ? 'Yes' : 'No'],
          ['Retrospective Review Scope', finding.retrospectiveScope || 'Not required', true]]) + '</section>';
    } else if (sub === 'rca') {
      content = '<section class="qm-section"><h3>Immediate Correction & Root Cause Analysis</h3>'
        + dl([['Immediate Correction', finding.immediateCorrection, true], ['Root Cause', finding.rootCause, true],
          ['Corrective Action Plan', finding.correctivePlan, true], ['Preventive / Recurrence Prevention Plan', finding.preventivePlan, true],
          ['Action Owner', finding.owner], ['Responsible Team', finding.team], ['Target CAPA Plan Date', finding.targetPlanDate], ['Target Completion Date', finding.targetCompletionDate]]) + '</section>';
    } else if (sub === 'capa') {
      content = '<section class="qm-section capa"><h3>CAPA Actions (1:N)</h3>'
        + (capas.some(function(c) { return c.mockProposal; }) ? '<div class="qm-proposal-note">`[예시 제안]` 표시는 Excel의 UI 검증용 Mock Data이며 확정된 회사 CAPA가 아닙니다.</div>' : '')
        + (role === 'qm' ? '<div style="margin-bottom:10px"><button type="button" class="btn btn-primary" data-new-capa="' + esc(finding.id) + '">+ CAPA Action</button></div>' : '')
        + capaCards(capas, role) + '</section>';
    } else if (sub === 'effectiveness') {
      content = '<section class="qm-section capa"><h3>Effectiveness Check</h3>'
        + dl([['Required?', finding.effectivenessRequired ? 'Yes' : 'No'], ['Due Date', finding.effectivenessDue],
          ['Method', finding.effectivenessMethod, true], ['Criteria', finding.effectivenessCriteria, true],
          ['Result', finding.effectivenessResult || 'Pending', true], ['Effective?', finding.effective || 'Pending'],
          ['Verified By', finding.verifiedBy], ['Verification Date', finding.verificationDate], ['Closure Date', finding.closureDate]]) + '</section>';
    } else if (sub === 'disclosure') {
      content = '<section class="qm-section disclosure"><h3>Disclosure / Confidentiality</h3>'
        + (finding.disclosureStatus === 'Restricted' || finding.disclosureStatus === 'Embargoed until date' ? '<div class="qm-sensitive-note">제한 공개 항목입니다. 허용된 역할과 공개 검토일을 확인한 뒤 공유 범위를 변경하세요.</div>' : '')
        + dl([['Disclosure Level', disclosureBadge(finding), false, true], ['Disclosure Status', finding.disclosureStatus],
          ['Review / Release Date', finding.disclosureReviewDate], ['Approved By', finding.disclosureApprovedBy],
          ['Rationale / Restriction Reason', finding.disclosureRationale, true], ['External Sharing Prohibited?', finding.externalProhibited ? 'Yes' : 'No'],
          ['External Sharing Note', finding.externalNote || '-', true]]) + (role === 'qm' ? '<div style="margin-top:12px"><button type="button" class="btn btn-outline" data-edit-disclosure="' + esc(finding.id) + '">공개범위 변경</button></div>' : '') + '</section>'
        + '<section class="qm-section"><h3>Disclosure Level History</h3>' + (finding.disclosureHistory.length ? '<div class="qm-history">' + finding.disclosureHistory.map(function(h) {
          return '<div class="qm-history-row"><time>' + esc(h.date) + '</time><strong>' + esc(h.actor) + '</strong><span>' + esc(h.from + ' → ' + h.to + ' · ' + h.reason) + '</span></div>';
        }).join('') + '</div>' : '<div class="qm-empty">공개범위 변경 이력이 없습니다.</div>') + '</section>';
    } else {
      content = '<section class="qm-section"><h3>Finding History</h3>' + historyHtml(finding.histories) + '</section>';
    }
    return '<div class="qm-detail-head"><div><a class="qm-detail-id" href="#quality/findings">← Findings</a><h2>' + esc(finding.summary) + '</h2><p>' + esc(finding.id + ' · ' + (event ? event.title : finding.eventId)) + '</p></div>'
      + '<div class="qm-summary-metrics">' + severityBadge(finding.severity) + statusBadge(finding.status) + disclosureBadge(finding)
      + (role === 'qm' ? '<button type="button" class="btn btn-outline" style="padding:6px 9px;font-size:10px" data-edit-finding-status="' + esc(finding.id) + '">Status 변경</button>' : '') + '</div></div>'
      + findingFlow(finding.status)
      + '<nav class="qm-subnav">' + [['summary','Finding Summary'],['impact','Impact Assessment'],['rca','RCA'],['capa','CAPA Actions'],['effectiveness','Effectiveness Check'],['disclosure','Disclosure'],['history','History']].map(function(item) {
        return '<a href="' + base + item[0] + '" class="' + (sub === item[0] ? 'active' : '') + '">' + item[1] + '</a>';
      }).join('') + '</nav>' + content;
  }
  function accessDenied(role) {
    return '<div class="qm-card"><div class="qm-empty"><strong>조회 권한이 없습니다.</strong><br>현재 권한(' + esc(ROLE_LABELS[role]) + ')에 허용된 Disclosure Level을 확인하세요.</div></div>';
  }

  function capaModal(capa) {
    return '<div id="qm-capa-modal" class="modal-overlay qm-modal show"><div class="modal-box"><div class="modal-header"><span>CAPA Action 업데이트 · ' + esc(capa.id) + '</span><button type="button" class="modal-close" data-close-qm-modal>×</button></div>'
      + '<div class="modal-body"><div class="qm-form-grid">'
      + '<div class="qm-form-field"><label>Status</label><select data-capa-field="status">' + CAPA_STATUSES.map(function(value) { return '<option' + (value === capa.status ? ' selected' : '') + '>' + value + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Actual Completion Date</label><input type="date" data-capa-field="actualCompletion" value="' + esc(capa.actualCompletion) + '"></div>'
      + '<div class="qm-form-field wide"><label>Evidence / Document Link</label><input data-capa-field="evidence" value="' + esc(capa.evidence) + '" placeholder="eTMF / BearDoc / Repository 경로"></div>'
      + '<div class="qm-form-field wide"><label>Delay Reason</label><textarea rows="2" data-capa-field="delayReason" placeholder="Due Date 지연 시 사유">' + esc(capa.delayReason) + '</textarea></div>'
      + '<div class="qm-form-field"><label>Effectiveness Result</label><input data-capa-field="result" value="' + esc(capa.result) + '" placeholder="검토 결과"></div>'
      + '<div class="qm-form-field"><label>Effective?</label><select data-capa-field="effective"><option value="">Pending</option><option value="Yes"' + (capa.effective === 'Yes' ? ' selected' : '') + '>Yes</option><option value="No"' + (capa.effective === 'No' ? ' selected' : '') + '>No</option></select></div>'
      + '<div class="qm-form-field"><label>Verified By</label><input data-capa-field="verifiedBy" value="' + esc(capa.verifiedBy) + '"></div>'
      + '<div class="qm-form-field"><label>Verification Date</label><input type="date" data-capa-field="verificationDate" value="' + esc(capa.verificationDate) + '"></div>'
      + '</div>' + (capa.mockProposal ? '<div class="qm-proposal-note" style="margin-top:12px">이 Action은 `[예시 제안]` Mock Data입니다. 실제 CAPA 확정 전 검토용입니다.</div>' : '')
      + '<div class="qm-modal-actions"><button type="button" class="btn btn-outline" data-close-qm-modal>취소</button><button type="button" class="btn btn-primary" data-save-capa="' + esc(capa.id) + '">저장</button></div></div></div></div>';
  }
  function openCapaModal(id) {
    var old = document.getElementById('qm-capa-modal');
    if (old) old.remove();
    var capa = findById(loadDb().capas, id);
    if (!capa) return;
    document.body.insertAdjacentHTML('beforeend', capaModal(capa));
  }
  function saveCapaFromModal(id) {
    var modal = document.getElementById('qm-capa-modal');
    if (!modal) return;
    var db = loadDb();
    var capa = findById(db.capas, id);
    if (!capa) return;
    var oldStatus = capa.status;
    modal.querySelectorAll('[data-capa-field]').forEach(function(field) { capa[field.getAttribute('data-capa-field')] = field.value.trim(); });
    if (capa.actualCompletion && capa.status === 'Not Started') capa.status = 'Implemented';
    if (capa.status === 'Closed' && capa.effectivenessRequired && capa.effective !== 'Yes') {
      alert('Effectiveness Check가 필요한 Action은 Effective = Yes 확인 후 Closed 처리할 수 있습니다.');
      return;
    }
    if (daysFromToday(capa.dueDate) < 0 && capa.status !== 'Closed' && !capa.delayReason) {
      alert('기한이 지난 Action은 Delay Reason을 입력하세요.');
      return;
    }
    var linkedFinding = findById(db.findings, capa.findingId);
    if (linkedFinding && linkedFinding.effectivenessRequired) {
      var checks = db.capas.filter(function(item) { return item.findingId === capa.findingId && item.effectivenessRequired; });
      if (checks.length && checks.every(function(item) { return item.effective === 'Yes'; })) {
        linkedFinding.effective = 'Yes';
        linkedFinding.effectivenessResult = checks.map(function(item) { return item.result; }).filter(Boolean).join(' / ');
        linkedFinding.verifiedBy = capa.verifiedBy || linkedFinding.verifiedBy;
        linkedFinding.verificationDate = capa.verificationDate || linkedFinding.verificationDate;
      } else if (checks.some(function(item) { return item.effective === 'No'; })) {
        linkedFinding.effective = 'No';
        linkedFinding.effectivenessResult = checks.map(function(item) { return item.result; }).filter(Boolean).join(' / ');
      }
    }
    if (oldStatus !== capa.status) {
      if (linkedFinding) {
        linkedFinding.histories = linkedFinding.histories || [];
        linkedFinding.histories.unshift({ date: todayIso(), actor: currentRole() === 'qm' ? '한세희 (QM)' : capa.owner, type: 'CAPA status changed', detail: capa.id + ' · ' + oldStatus + ' → ' + capa.status });
      }
    }
    saveDb(db);
    modal.remove();
    render();
  }
  function disclosureModal(finding) {
    return '<div id="qm-disclosure-modal" class="modal-overlay qm-modal show"><div class="modal-box"><div class="modal-header"><span>Disclosure 변경 · ' + esc(finding.id) + '</span><button type="button" class="modal-close" data-close-qm-modal>×</button></div>'
      + '<div class="modal-body"><div class="qm-sensitive-note">공개범위 변경은 History에 변경자·일시·이전/이후 Level과 사유로 기록됩니다.</div><div class="qm-form-grid">'
      + '<div class="qm-form-field"><label>Disclosure Level</label><select data-disclosure-field="disclosureLevel">' + DISCLOSURE_LEVELS.map(function(value) { return '<option' + (value === finding.disclosureLevel ? ' selected' : '') + '>' + value + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Disclosure Status</label><select data-disclosure-field="disclosureStatus">' + DISCLOSURE_STATUSES.map(function(value) { return '<option' + (value === finding.disclosureStatus ? ' selected' : '') + '>' + value + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Review / Release Date</label><input type="date" data-disclosure-field="disclosureReviewDate" value="' + esc(finding.disclosureReviewDate) + '"></div>'
      + '<div class="qm-form-field"><label>Approved By</label><input data-disclosure-field="disclosureApprovedBy" value="' + esc(finding.disclosureApprovedBy) + '"></div>'
      + '<div class="qm-form-field wide"><label>Rationale / Restriction Reason</label><textarea rows="3" data-disclosure-field="disclosureRationale">' + esc(finding.disclosureRationale) + '</textarea></div>'
      + '<div class="qm-form-field"><label>External Sharing Prohibited?</label><select data-disclosure-field="externalProhibited"><option value="true"' + (finding.externalProhibited ? ' selected' : '') + '>Yes</option><option value="false"' + (!finding.externalProhibited ? ' selected' : '') + '>No</option></select></div>'
      + '<div class="qm-form-field"><label>변경자</label><input data-disclosure-actor value="한세희 (QM)"></div>'
      + '<div class="qm-form-field wide"><label>External Sharing Note</label><input data-disclosure-field="externalNote" value="' + esc(finding.externalNote) + '"></div>'
      + '</div><div class="qm-modal-actions"><button type="button" class="btn btn-outline" data-close-qm-modal>취소</button><button type="button" class="btn btn-primary" data-save-disclosure="' + esc(finding.id) + '">변경 저장</button></div></div></div></div>';
  }
  function openDisclosureModal(id) {
    var old = document.getElementById('qm-disclosure-modal');
    if (old) old.remove();
    var finding = findById(loadDb().findings, id);
    if (!finding || currentRole() !== 'qm') return;
    document.body.insertAdjacentHTML('beforeend', disclosureModal(finding));
  }
  function saveDisclosureFromModal(id) {
    var modal = document.getElementById('qm-disclosure-modal');
    if (!modal || currentRole() !== 'qm') return;
    var db = loadDb();
    var finding = findById(db.findings, id);
    if (!finding) return;
    var oldLevel = finding.disclosureLevel;
    var oldStatus = finding.disclosureStatus;
    modal.querySelectorAll('[data-disclosure-field]').forEach(function(field) {
      var key = field.getAttribute('data-disclosure-field');
      finding[key] = key === 'externalProhibited' ? field.value === 'true' : field.value.trim();
    });
    var actor = modal.querySelector('[data-disclosure-actor]').value.trim() || 'QM';
    if (!finding.disclosureRationale) {
      alert('공개범위 변경 사유를 입력하세요.');
      return;
    }
    if (oldLevel !== finding.disclosureLevel || oldStatus !== finding.disclosureStatus) {
      finding.disclosureHistory = finding.disclosureHistory || [];
      finding.disclosureHistory.unshift({
        date: todayIso(), actor: actor, from: oldLevel + ' / ' + oldStatus,
        to: finding.disclosureLevel + ' / ' + finding.disclosureStatus,
        reason: finding.disclosureRationale
      });
      finding.histories = finding.histories || [];
      finding.histories.unshift({ date: todayIso(), actor: actor, type: 'Disclosure changed', detail: oldLevel + ' → ' + finding.disclosureLevel });
    }
    saveDb(db);
    modal.remove();
    render();
  }
  function openFindingStatusModal(id) {
    var finding = findById(loadDb().findings, id);
    if (!finding || currentRole() !== 'qm') return;
    var html = '<div id="qm-finding-status-modal" class="modal-overlay qm-modal show"><div class="modal-box"><div class="modal-header"><span>Finding Status 변경 · ' + esc(id) + '</span><button type="button" class="modal-close" data-close-qm-modal>×</button></div><div class="modal-body"><div class="qm-form-grid">'
      + '<div class="qm-form-field"><label>Finding Status</label><select data-finding-status>' + FINDING_STATUSES.map(function(value) { return '<option' + (value === finding.status ? ' selected' : '') + '>' + value + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Closure Date</label><input type="date" data-finding-closure value="' + esc(finding.closureDate || todayIso()) + '"></div>'
      + '<div class="qm-form-field wide"><label>QM Review Comment</label><textarea rows="3" data-finding-status-comment placeholder="변경 근거 또는 Closure 검토 의견"></textarea></div>'
      + '</div><div class="qm-modal-actions"><button type="button" class="btn btn-outline" data-close-qm-modal>취소</button><button type="button" class="btn btn-primary" data-save-finding-status="' + esc(id) + '">저장</button></div></div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }
  function saveFindingStatus(id) {
    var modal = document.getElementById('qm-finding-status-modal');
    if (!modal || currentRole() !== 'qm') return;
    var db = loadDb();
    var finding = findById(db.findings, id);
    var newStatus = modal.querySelector('[data-finding-status]').value;
    var comment = modal.querySelector('[data-finding-status-comment]').value.trim();
    var linked = db.capas.filter(function(capa) { return capa.findingId === id; });
    if (newStatus === 'Closed') {
      if (linked.some(function(capa) { return capa.status !== 'Closed'; })) { alert('연결된 모든 CAPA Action을 먼저 Closed 처리하세요.'); return; }
      if (finding.effectivenessRequired && finding.effective !== 'Yes') { alert('Effectiveness Check 결과가 Effective = Yes인지 확인하세요.'); return; }
      if (!comment) { alert('Closure 검토 의견을 입력하세요.'); return; }
      finding.closureDate = modal.querySelector('[data-finding-closure]').value || todayIso();
    } else finding.closureDate = '';
    var oldStatus = finding.status;
    finding.status = newStatus;
    finding.histories = finding.histories || [];
    finding.histories.unshift({ date: todayIso(), actor: '한세희 (QM)', type: 'Finding status changed', detail: oldStatus + ' → ' + newStatus + (comment ? ' · ' + comment : '') });
    saveDb(db);
    modal.remove();
    render();
  }
  function nextId(prefix, rows) {
    var year = new Date().getFullYear();
    var base = prefix + '-' + year + '-';
    var max = rows.reduce(function(value, row) {
      var match = String(row.id || '').match(new RegExp('^' + base + '(\\d+)$'));
      return match ? Math.max(value, parseInt(match[1], 10)) : value;
    }, 0);
    return base + String(max + 1).padStart(3, '0');
  }
  function openCreateEventModal() {
    var id = nextId('QEV', loadDb().events);
    var html = '<div id="qm-create-modal" class="modal-overlay qm-modal show"><div class="modal-box"><div class="modal-header"><span>Quality Event 등록</span><button type="button" class="modal-close" data-close-qm-modal>×</button></div><div class="modal-body"><div class="qm-form-grid">'
      + '<div class="qm-form-field"><label>Event ID</label><input data-new-event-field="id" value="' + id + '" readonly></div>'
      + '<div class="qm-form-field"><label>Event Type</label><select data-new-event-field="type">' + EVENT_TYPES.map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field wide"><label>Audit / Inspection Title</label><input data-new-event-field="title"></div>'
      + '<div class="qm-form-field"><label>Study / Product (Optional)</label><input data-new-event-field="study" placeholder="센터 공통이면 비워둠"></div>'
      + '<div class="qm-form-field"><label>Protocol / Version</label><input data-new-event-field="protocol"></div>'
      + '<div class="qm-form-field"><label>Audited Organization / Vendor</label><input data-new-event-field="organization"></div>'
      + '<div class="qm-form-field"><label>System / Area</label><input data-new-event-field="systemArea"></div>'
      + '<div class="qm-form-field"><label>Audit Start Date</label><input type="date" data-new-event-field="startDate"></div>'
      + '<div class="qm-form-field"><label>Audit End Date</label><input type="date" data-new-event-field="endDate"></div>'
      + '<div class="qm-form-field"><label>Report Issue Date</label><input type="date" data-new-event-field="reportIssueDate"></div>'
      + '<div class="qm-form-field"><label>Response Due Date</label><input type="date" data-new-event-field="responseDueDate"></div>'
      + '<div class="qm-form-field"><label>QM Owner</label><input data-new-event-field="qmOwner" value="한세희"></div>'
      + '<div class="qm-form-field"><label>Audit Lead / Inspector</label><input data-new-event-field="auditLead"></div>'
      + '<div class="qm-form-field wide"><label>Audit Scope / Areas Reviewed (복수 선택)</label><div class="qm-scope-selector">'
      + ['Clinical Operation','Data Management','Biostatistics','Pharmacovigilance / Safety','Medical','Quality Management','Regulatory','TMF / Document Management','Computerized System / IT','Vendor Management','Training','Other'].map(function(v) { return '<label><input type="checkbox" data-new-event-scope value="' + esc(v) + '"> ' + esc(v) + '</label>'; }).join('') + '</div></div>'
      + '<div class="qm-form-field wide"><label>Overall Result Summary</label><textarea rows="3" data-new-event-field="summary"></textarea></div>'
      + '<div class="qm-form-field wide"><label>Audit Report Link / Evidence Path</label><input data-new-event-field="reportPath" placeholder="eTMF / BearDoc / Repository 경로"></div>'
      + '<div class="qm-form-field wide"><label>Confidentiality / Disclosure Note</label><textarea rows="2" data-new-event-field="confidentiality"></textarea></div>'
      + '</div><div class="qm-modal-actions"><button type="button" class="btn btn-outline" data-close-qm-modal>취소</button><button type="button" class="btn btn-primary" data-save-new-event>등록</button></div></div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }
  function saveNewEvent() {
    var modal = document.getElementById('qm-create-modal');
    if (!modal) return;
    var values = {};
    modal.querySelectorAll('[data-new-event-field]').forEach(function(field) { values[field.getAttribute('data-new-event-field')] = field.value.trim(); });
    if (!values.title || !values.startDate || !values.endDate || !values.qmOwner) {
      alert('Title, Audit Start/End Date, QM Owner는 필수입니다.');
      return;
    }
    if (values.startDate > values.endDate) { alert('Audit End Date는 Start Date보다 빠를 수 없습니다.'); return; }
    var db = loadDb();
    db.events.push({
      id: values.id, type: values.type, title: values.title, study: values.study, product: values.study, protocol: values.protocol,
      organization: values.organization, systemArea: values.systemArea,
      scopes: Array.prototype.slice.call(modal.querySelectorAll('[data-new-event-scope]:checked')).map(function(field) { return field.value; }),
      startDate: values.startDate, endDate: values.endDate, reportIssueDate: values.reportIssueDate, responseDueDate: values.responseDueDate,
      qmOwner: values.qmOwner, auditLead: values.auditLead, sponsorClient: '', totalFindings: 0, critical: 0, major: 0, minor: 0, comments: 0,
      summary: values.summary, status: 'Draft', overallCapaDue: '', closureDate: '', reportPath: values.reportPath,
      confidentiality: values.confidentiality, histories: [{ date: todayIso(), actor: values.qmOwner + ' (QM)', type: 'Event created', detail: 'Quality Event 등록' }]
    });
    saveDb(db);
    modal.remove();
    location.hash = '#quality/event/' + encodeURIComponent(values.id) + '/overview';
  }
  function openCreateFindingModal() {
    var db = loadDb();
    var eventOptions = db.events.map(function(event) { return '<option value="' + esc(event.id) + '">' + esc(event.id + ' · ' + event.title) + '</option>'; }).join('');
    var html = '<div id="qm-create-modal" class="modal-overlay qm-modal show"><div class="modal-box"><div class="modal-header"><span>Finding / Item 등록</span><button type="button" class="modal-close" data-close-qm-modal>×</button></div><div class="modal-body"><div class="qm-form-grid">'
      + '<div class="qm-form-field wide"><label>Quality Event</label><select data-new-finding-field="eventId">' + eventOptions + '</select></div>'
      + '<div class="qm-form-field"><label>Result Type</label><select data-new-finding-field="resultType">' + ['Finding','General Comment','Recommendation','Observation','Opportunity for Improvement','No Finding'].map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Severity</label><select data-new-finding-field="severity">' + ['Critical','Major','Minor','Observation'].map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Finding Date</label><input type="date" data-new-finding-field="findingDate" value="' + todayIso() + '"></div>'
      + '<div class="qm-form-field"><label>Functional Area</label><select data-new-finding-field="functionalArea">' + ['Clinical Operation','Data Management','Biostatistics','Pharmacovigilance / Safety','Medical','Quality Management','Regulatory','TMF / Document Management','Computerized System / IT','Vendor Management','Training','Cross-functional','Other'].map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Issue Category</label><select data-new-finding-field="issueCategory">' + ['Process / Procedure','Documentation','Training','Roles & Responsibilities','Vendor Oversight','Access Control','Data Integrity','Validation','Version Control','Compliance','Communication','Other'].map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Impact Scope</label><select data-new-finding-field="impactScope">' + ['Study','Product','CRO','Vendor','System','SOP','Process','Clinical Center','Company-wide'].map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field wide"><label>Finding / Comment Summary</label><input data-new-finding-field="summary"></div>'
      + '<div class="qm-form-field wide"><label>Detailed Finding / Recommendation</label><textarea rows="3" data-new-finding-field="detail"></textarea></div>'
      + '<div class="qm-form-field wide"><label>Regulation / SOP Reference</label><input data-new-finding-field="reference"></div>'
      + '<div class="qm-form-field"><label>Action Owner</label><input data-new-finding-field="owner"></div>'
      + '<div class="qm-form-field"><label>Responsible Team</label><input data-new-finding-field="team"></div>'
      + '<div class="qm-form-field"><label>Target Completion Date</label><input type="date" data-new-finding-field="targetCompletionDate"></div>'
      + '<div class="qm-form-field"><label>Disclosure Level</label><select data-new-finding-field="disclosureLevel">' + DISCLOSURE_LEVELS.map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field"><label>Disclosure Status</label><select data-new-finding-field="disclosureStatus">' + DISCLOSURE_STATUSES.map(function(v) { return '<option>' + v + '</option>'; }).join('') + '</select></div>'
      + '<div class="qm-form-field wide"><label>Restriction / Disclosure Rationale</label><input data-new-finding-field="disclosureRationale"></div>'
      + '</div><div class="qm-modal-actions"><button type="button" class="btn btn-outline" data-close-qm-modal>취소</button><button type="button" class="btn btn-primary" data-save-new-finding>등록</button></div></div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }
  function saveNewFinding() {
    var modal = document.getElementById('qm-create-modal');
    if (!modal) return;
    var v = {};
    modal.querySelectorAll('[data-new-finding-field]').forEach(function(field) { v[field.getAttribute('data-new-finding-field')] = field.value.trim(); });
    if (!v.eventId || !v.summary || !v.detail || !v.owner || !v.team) { alert('Event, Summary, Detail, Action Owner, Responsible Team은 필수입니다.'); return; }
    var db = loadDb();
    var eventItems = db.findings.filter(function(f) { return f.eventId === v.eventId; });
    var code = v.resultType === 'Finding' ? 'F' : 'GC';
    var id = v.eventId + '-' + code + String(eventItems.length + 1).padStart(2, '0');
    var event = findById(db.events, v.eventId);
    db.findings.push({
      id: id, eventId: v.eventId, resultType: v.resultType, findingDate: v.findingDate, severity: v.severity,
      functionalArea: v.functionalArea, issueCategory: v.issueCategory, summary: v.summary, detail: v.detail, reference: v.reference,
      impactScope: v.impactScope, affectedStudies: event ? event.study : '', affectedSops: '', affectedAssets: '', affectedProcess: '',
      retrospectiveRequired: false, retrospectiveScope: '', immediateCorrection: '', rootCause: '', correctivePlan: '', preventivePlan: '',
      owner: v.owner, team: v.team, targetPlanDate: '', targetCompletionDate: v.targetCompletionDate, status: 'Draft',
      effectivenessRequired: false, effectivenessDue: '', effectivenessMethod: '', effectivenessCriteria: '', effectivenessResult: '',
      effective: '', verifiedBy: '', verificationDate: '', closureDate: '', disclosureLevel: v.disclosureLevel,
      disclosureStatus: v.disclosureStatus, disclosureReviewDate: '', disclosureApprovedBy: '',
      disclosureRationale: v.disclosureRationale, externalProhibited: true, externalNote: '', reportPath: event ? event.reportPath : '',
      disclosureHistory: [], histories: [{ date: todayIso(), actor: '한세희 (QM)', type: 'Item created', detail: v.resultType + ' 등록' }]
    });
    if (event) {
      if (v.resultType === 'Finding') {
        event.totalFindings += 1;
        if (v.severity === 'Critical') event.critical += 1;
        if (v.severity === 'Major') event.major += 1;
        if (v.severity === 'Minor') event.minor += 1;
      } else event.comments += 1;
    }
    saveDb(db);
    modal.remove();
    location.hash = '#quality/finding/' + encodeURIComponent(id) + '/summary';
  }
  function openCreateCapaModal(findingId) {
    var db = loadDb();
    var count = db.capas.filter(function(c) { return c.findingId === findingId; }).length;
    var id = findingId + '-A' + String(count + 1).padStart(2, '0');
    var html = '<div id="qm-create-modal" class="modal-overlay qm-modal show"><div class="modal-box"><div class="modal-header"><span>CAPA Action 등록 · ' + esc(findingId) + '</span><button type="button" class="modal-close" data-close-qm-modal>×</button></div><div class="modal-body"><div class="qm-form-grid">'
      + '<div class="qm-form-field"><label>CAPA ID</label><input data-new-capa-field="id" value="' + esc(id) + '" readonly></div>'
      + '<div class="qm-form-field"><label>CAPA Type</label><select data-new-capa-field="type"><option>Correction</option><option>Corrective Action</option><option>Preventive/Systemic Action</option></select></div>'
      + '<div class="qm-form-field wide"><label>Action Description</label><textarea rows="3" data-new-capa-field="description"></textarea></div>'
      + '<div class="qm-form-field"><label>Action Owner</label><input data-new-capa-field="owner"></div>'
      + '<div class="qm-form-field"><label>Responsible Team</label><input data-new-capa-field="team"></div>'
      + '<div class="qm-form-field"><label>Planned Start</label><input type="date" data-new-capa-field="plannedStart"></div>'
      + '<div class="qm-form-field"><label>Due Date</label><input type="date" data-new-capa-field="dueDate"></div>'
      + '<div class="qm-form-field wide"><label>Affected SOP / Procedure</label><input data-new-capa-field="affectedSop"></div>'
      + '<div class="qm-form-field wide"><label>Affected Document / System</label><input data-new-capa-field="affectedAsset"></div>'
      + '<div class="qm-form-field"><label>Effectiveness Check Required?</label><select data-new-capa-field="effectivenessRequired"><option value="false">No</option><option value="true">Yes</option></select></div>'
      + '<div class="qm-form-field"><label>Effectiveness Check Due</label><input type="date" data-new-capa-field="effectivenessDue"></div>'
      + '</div><div class="qm-modal-actions"><button type="button" class="btn btn-outline" data-close-qm-modal>취소</button><button type="button" class="btn btn-primary" data-save-new-capa="' + esc(findingId) + '">등록</button></div></div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }
  function saveNewCapa(findingId) {
    var modal = document.getElementById('qm-create-modal');
    if (!modal) return;
    var v = {};
    modal.querySelectorAll('[data-new-capa-field]').forEach(function(field) { v[field.getAttribute('data-new-capa-field')] = field.value.trim(); });
    if (!v.description || !v.owner || !v.team || !v.dueDate) { alert('Action Description, Owner, Team, Due Date는 필수입니다.'); return; }
    var db = loadDb();
    db.capas.push({
      id: v.id, findingId: findingId, type: v.type, description: v.description, owner: v.owner, ownerId: '',
      team: v.team, affectedSop: v.affectedSop, affectedAsset: v.affectedAsset, plannedStart: v.plannedStart,
      dueDate: v.dueDate, actualCompletion: '', status: 'Not Started', evidence: '', delayReason: '',
      effectivenessRequired: v.effectivenessRequired === 'true', effectivenessDue: v.effectivenessDue,
      method: '', criteria: '', result: '', effective: '', verifiedBy: '', verificationDate: '', closureDate: '',
      qmComment: '', mockProposal: false
    });
    var finding = findById(db.findings, findingId);
    if (finding && (finding.status === 'Draft' || finding.status === 'RCA in Progress')) finding.status = 'CAPA Planning';
    saveDb(db);
    modal.remove();
    render();
  }

  function render() {
    var root = document.getElementById('quality-management-root');
    if (!root) return;
    var db = loadDb();
    var role = currentRole();
    var scoped = scopedDb(db, role);
    var route = parseRoute();
    var content;
    if (route.view === 'events') content = eventListView(scoped, role);
    else if (route.view === 'findings') content = findingListView(scoped, role);
    else if (route.view === 'capa') content = capaListView(scoped, role, false);
    else if (route.view === 'my-capa') content = capaListView(scoped, role, true);
    else if (route.view === 'event') content = eventDetailView(db, scoped, findById(db.events, route.id), route.sub, role);
    else if (route.view === 'finding') content = findingDetailView(db, scoped, findById(db.findings, route.id), route.sub, role);
    else content = dashboardView(scoped, role);
    root.innerHTML = '<div class="qm-shell">' + moduleNav(route, scoped) + '<div class="qm-content">' + content + '</div></div>';
  }

  document.addEventListener('change', function(event) {
    if (event.target.matches('[data-qm-role]')) {
      localStorage.setItem(ROLE_KEY, event.target.value);
      render();
      return;
    }
    if (event.target.matches('[data-qm-filter]')) {
      filterState[event.target.getAttribute('data-qm-filter')] = event.target.value;
      render();
    }
  });
  document.addEventListener('input', function(event) {
    if (!event.target.matches('[data-qm-filter][type="text"], input[data-qm-filter]')) return;
    filterState[event.target.getAttribute('data-qm-filter')] = event.target.value;
    render();
    var inputs = document.querySelectorAll('[data-qm-filter="' + event.target.getAttribute('data-qm-filter') + '"]');
    if (inputs.length) { inputs[0].focus(); inputs[0].setSelectionRange(inputs[0].value.length, inputs[0].value.length); }
  });
  document.addEventListener('click', function(event) {
    var row = event.target.closest('[data-qm-href]');
    if (row && !event.target.closest('a,button')) { location.hash = row.getAttribute('data-qm-href'); return; }
    var reset = event.target.closest('[data-qm-reset]');
    if (reset) {
      var group = reset.getAttribute('data-qm-reset');
      Object.keys(filterState).forEach(function(key) { if (key.indexOf(group) === 0) filterState[key] = ''; });
      render();
      return;
    }
    var edit = event.target.closest('[data-edit-capa]');
    if (edit) { openCapaModal(edit.getAttribute('data-edit-capa')); return; }
    var disclosure = event.target.closest('[data-edit-disclosure]');
    if (disclosure) { openDisclosureModal(disclosure.getAttribute('data-edit-disclosure')); return; }
    var findingStatus = event.target.closest('[data-edit-finding-status]');
    if (findingStatus) { openFindingStatusModal(findingStatus.getAttribute('data-edit-finding-status')); return; }
    if (event.target.closest('[data-new-quality-event]')) { openCreateEventModal(); return; }
    if (event.target.closest('[data-new-finding]')) { openCreateFindingModal(); return; }
    var newCapa = event.target.closest('[data-new-capa]');
    if (newCapa) { openCreateCapaModal(newCapa.getAttribute('data-new-capa')); return; }
    if (event.target.closest('[data-close-qm-modal]')) {
      var modal = event.target.closest('.modal-overlay');
      if (modal) modal.remove();
      return;
    }
    var save = event.target.closest('[data-save-capa]');
    if (save) saveCapaFromModal(save.getAttribute('data-save-capa'));
    var saveDisclosure = event.target.closest('[data-save-disclosure]');
    if (saveDisclosure) saveDisclosureFromModal(saveDisclosure.getAttribute('data-save-disclosure'));
    var saveFinding = event.target.closest('[data-save-finding-status]');
    if (saveFinding) saveFindingStatus(saveFinding.getAttribute('data-save-finding-status'));
    if (event.target.closest('[data-save-new-event]')) saveNewEvent();
    if (event.target.closest('[data-save-new-finding]')) saveNewFinding();
    var saveNewCapaButton = event.target.closest('[data-save-new-capa]');
    if (saveNewCapaButton) saveNewCapa(saveNewCapaButton.getAttribute('data-save-new-capa'));
  });
  window.addEventListener('hashchange', function() {
    if ((location.hash || '').indexOf('#quality') === 0) render();
  });
  window.renderClinicalQuality = render;
  document.addEventListener('DOMContentLoaded', render);
})();
