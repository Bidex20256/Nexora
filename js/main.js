/* ==========================================================================
   NEXORA — main.js
   Vanilla JavaScript shared by every page.

   1. Utilities
   2. Icons
   3. Data store (localStorage demo state)
   4. Markup helpers
   5. UI primitives: actions, toasts, dropdowns, tabs, modals, validation
   6. App shell: sidebar, topbar, mobile nav, search, notifications
   7. Charts (SVG)
   8. Page modules (selected by <body data-page="…">)
   9. Init
   ========================================================================== */
(function () {
  'use strict';

  /* 1. Utilities ---------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const debounce = (fn, ms = 160) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };
  const initials = (name) =>
    String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => (w[0] || '').toUpperCase()).join('');
  const fmtNum = (n) => Number(n).toLocaleString('en-US');
  const r1 = (n) => Math.round(n * 10) / 10;
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const params = new URLSearchParams(location.search);
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const formVal = (form, name) => (form.elements.namedItem(name)?.value || '').trim();

  const DAY = 864e5;
  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const toISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isoIn = (days) => {
    const d = startOfToday();
    d.setDate(d.getDate() + days);
    return toISO(d);
  };
  const parseISO = (s) => {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const daysUntil = (iso) => Math.round((parseISO(iso) - startOfToday()) / DAY);
  const fmtDate = (iso, opts = { month: 'short', day: 'numeric' }) => parseISO(iso).toLocaleDateString('en-US', opts);
  const relDue = (iso) => {
    const n = daysUntil(iso);
    if (n < -1) return `${-n} days overdue`;
    if (n === -1) return 'Yesterday';
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n < 7) return `In ${n} days`;
    return fmtDate(iso);
  };
  const dueState = (iso, done) => {
    if (done) return '';
    const n = daysUntil(iso);
    return n < 0 ? 'is-overdue' : n <= 2 ? 'is-soon' : '';
  };
  const timeAgo = (ts) => {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /** Deterministic pseudo-random generator so demo charts are stable. */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* 2. Icons -------------------------------------------------------------- */
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    'check-square': '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'arrow-right': '<path d="M5 12h14M13 5l7 7-7 7"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    more: '<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/>',
    'trending-up': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  };

  const icon = (name, cls = '') =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((el) => {
      el.innerHTML = icon(el.dataset.icon, el.dataset.iconClass || '');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  /* 3. Data store --------------------------------------------------------- */
  const STORAGE_KEY = 'nexora:v1:data';
  const APPEARANCE_KEY = 'nexora:appearance';
  const SCHEMA = 1;

  const PROJECT_STATUS = {
    active: { label: 'Active', tone: 'info' },
    planning: { label: 'Planning', tone: 'violet' },
    review: { label: 'In review', tone: 'warning' },
    'on-hold': { label: 'On hold', tone: 'neutral' },
    completed: { label: 'Completed', tone: 'success' },
  };
  const TASK_STATUS = {
    todo: { label: 'To do', tone: 'neutral' },
    'in-progress': { label: 'In progress', tone: 'info' },
    review: { label: 'In review', tone: 'warning' },
    done: { label: 'Done', tone: 'success' },
  };
  const PRIORITY = {
    high: { label: 'High', tone: 'danger', rank: 0 },
    medium: { label: 'Medium', tone: 'warning', rank: 1 },
    low: { label: 'Low', tone: 'success', rank: 2 },
  };
  const MEMBER_STATUS = {
    online: { label: 'Online', tone: 'success' },
    away: { label: 'Away', tone: 'warning' },
    offline: { label: 'Offline', tone: 'neutral' },
    invited: { label: 'Invited', tone: 'accent' },
  };

  function seed() {
    const now = Date.now();
    const min = 60000;
    return {
      schema: SCHEMA,
      user: {
        firstName: 'Alex',
        lastName: 'Morgan',
        email: 'alex.morgan@nexora.io',
        title: 'Head of Operations',
        timezone: 'Europe/London',
        bio: 'Keeping projects on track and teams unblocked. Coffee-powered planner.',
      },
      members: [
        { id: 'm1', name: 'Amara Okafor', role: 'Product Lead', department: 'Product', email: 'amara@nexora.io', status: 'online', tasksCompleted: 148, hue: 262 },
        { id: 'm2', name: 'Daniel Reyes', role: 'Engineering Manager', department: 'Engineering', email: 'daniel@nexora.io', status: 'online', tasksCompleted: 132, hue: 215 },
        { id: 'm3', name: 'Priya Sharma', role: 'Senior Frontend Engineer', department: 'Engineering', email: 'priya@nexora.io', status: 'away', tasksCompleted: 176, hue: 330 },
        { id: 'm4', name: 'Lucas Meyer', role: 'Backend Engineer', department: 'Engineering', email: 'lucas@nexora.io', status: 'online', tasksCompleted: 121, hue: 190 },
        { id: 'm5', name: 'Sofia Rossi', role: 'Product Designer', department: 'Design', email: 'sofia@nexora.io', status: 'offline', tasksCompleted: 98, hue: 12 },
        { id: 'm6', name: 'Kenji Tanaka', role: 'QA Engineer', department: 'Engineering', email: 'kenji@nexora.io', status: 'online', tasksCompleted: 164, hue: 150 },
        { id: 'm7', name: 'Zara Ahmed', role: 'Marketing Lead', department: 'Marketing', email: 'zara@nexora.io', status: 'away', tasksCompleted: 87, hue: 40 },
        { id: 'm8', name: 'Ethan Brooks', role: 'Data Analyst', department: 'Operations', email: 'ethan@nexora.io', status: 'offline', tasksCompleted: 109, hue: 280 },
      ],
      projects: [
        { id: 'p1', name: 'Atlas Mobile App', description: 'Rebuild of the iOS and Android apps with offline sync and a refreshed navigation model.', status: 'active', priority: 'high', progress: 68, due: isoIn(12), owner: 'm1', members: ['m1', 'm3', 'm5', 'm6'], hue: 220 },
        { id: 'p2', name: 'Payments API v3', description: 'Idempotent payments API with webhooks, automatic retries and multi-currency support.', status: 'active', priority: 'high', progress: 45, due: isoIn(21), owner: 'm2', members: ['m2', 'm4', 'm6'], hue: 262 },
        { id: 'p3', name: 'Q4 Growth Campaign', description: 'Integrated launch campaign across email, paid social and partner channels.', status: 'planning', priority: 'medium', progress: 18, due: isoIn(34), owner: 'm7', members: ['m7', 'm5', 'm8'], hue: 35 },
        { id: 'p4', name: 'Customer Portal', description: 'Self-serve portal for billing, invoices, seat management and support tickets.', status: 'review', priority: 'medium', progress: 88, due: isoIn(5), owner: 'm3', members: ['m3', 'm4', 'm1'], hue: 190 },
        { id: 'p5', name: 'Data Warehouse Migration', description: 'Move analytics pipelines to the new warehouse with zero reporting downtime.', status: 'on-hold', priority: 'low', progress: 32, due: isoIn(48), owner: 'm8', members: ['m8', 'm4'], hue: 150 },
        { id: 'p6', name: 'Design System 2.0', description: 'Tokens, components and documentation shared across web and mobile products.', status: 'active', priority: 'medium', progress: 74, due: isoIn(9), owner: 'm5', members: ['m5', 'm3', 'm1'], hue: 300 },
        { id: 'p7', name: 'Onboarding Revamp', description: 'Guided setup, templates and in-app checklists to improve week-one activation.', status: 'completed', priority: 'high', progress: 100, due: isoIn(-6), owner: 'm1', members: ['m1', 'm5', 'm7'], hue: 340 },
        { id: 'p8', name: 'Security Audit 2026', description: 'Annual SOC 2 readiness review, penetration test fixes and access reviews.', status: 'active', priority: 'high', progress: 56, due: isoIn(16), owner: 'm2', members: ['m2', 'm6', 'm8'], hue: 0 },
      ],
      tasks: [
        { id: 't1', title: 'Finalize offline sync conflict rules', project: 'p1', status: 'in-progress', priority: 'high', assignee: 'm3', due: isoIn(1) },
        { id: 't2', title: 'Write webhook retry specification', project: 'p2', status: 'review', priority: 'high', assignee: 'm4', due: isoIn(2) },
        { id: 't3', title: 'Design billing settings screens', project: 'p4', status: 'done', priority: 'medium', assignee: 'm5', due: isoIn(-2) },
        { id: 't4', title: 'Regression test checkout flow', project: 'p2', status: 'todo', priority: 'high', assignee: 'm6', due: isoIn(0) },
        { id: 't5', title: 'Draft campaign messaging brief', project: 'p3', status: 'in-progress', priority: 'medium', assignee: 'm7', due: isoIn(4) },
        { id: 't6', title: 'Audit admin access permissions', project: 'p8', status: 'todo', priority: 'high', assignee: 'm2', due: isoIn(3) },
        { id: 't7', title: 'Publish button and input tokens', project: 'p6', status: 'done', priority: 'low', assignee: 'm3', due: isoIn(-4) },
        { id: 't8', title: 'Map legacy reporting tables', project: 'p5', status: 'todo', priority: 'low', assignee: 'm8', due: isoIn(10) },
        { id: 't9', title: 'Invoice PDF export', project: 'p4', status: 'in-progress', priority: 'medium', assignee: 'm4', due: isoIn(5) },
        { id: 't10', title: 'Usability test the new navigation', project: 'p1', status: 'todo', priority: 'medium', assignee: 'm5', due: isoIn(6) },
        { id: 't11', title: 'Fix pen-test finding: session timeout', project: 'p8', status: 'in-progress', priority: 'high', assignee: 'm6', due: isoIn(-1) },
        { id: 't12', title: 'Component documentation site', project: 'p6', status: 'review', priority: 'medium', assignee: 'm1', due: isoIn(8) },
        { id: 't13', title: 'Q4 channel budget allocation', project: 'p3', status: 'todo', priority: 'medium', assignee: 'me', due: isoIn(7) },
        { id: 't14', title: 'Push notification permissions flow', project: 'p1', status: 'done', priority: 'medium', assignee: 'm3', due: isoIn(-3) },
        { id: 't15', title: 'Prepare sprint 14 review deck', project: 'p1', status: 'todo', priority: 'low', assignee: 'me', due: isoIn(2) },
      ],
      notifications: [
        { id: 'n1', type: 'mention', title: 'Priya mentioned you', text: '“Can you review the conflict rules before standup?” — Atlas Mobile App', time: now - 12 * min, read: false },
        { id: 'n2', type: 'deadline', title: 'Deadline tomorrow', text: 'Finalize offline sync conflict rules is due tomorrow.', time: now - 64 * min, read: false },
        { id: 'n3', type: 'success', title: 'Project completed', text: 'Amara marked Onboarding Revamp as completed.', time: now - 3 * 60 * min, read: false },
        { id: 'n4', type: 'comment', title: 'New comment', text: 'Lucas replied on “Write webhook retry specification”.', time: now - 7 * 60 * min, read: true },
        { id: 'n5', type: 'team', title: 'New teammate', text: 'Ethan Brooks joined the Operations team.', time: now - 26 * 60 * min, read: true },
      ],
      activity: [
        { id: 'a1', who: 'm3', action: 'completed', target: 'Push notification permissions flow', time: now - 25 * min },
        { id: 'a2', who: 'm4', action: 'moved to review', target: 'Write webhook retry specification', time: now - 70 * min },
        { id: 'a3', who: 'm1', action: 'created the project', target: 'Security Audit 2026', time: now - 3 * 60 * min },
        { id: 'a4', who: 'm5', action: 'uploaded 6 designs to', target: 'Customer Portal', time: now - 5 * 60 * min },
        { id: 'a5', who: 'm6', action: 'reported a bug in', target: 'Payments API v3', time: now - 22 * 60 * min },
        { id: 'a6', who: 'm7', action: 'commented on', target: 'Q4 Growth Campaign', time: now - 27 * 60 * min },
      ],
      prefs: {
        email_assigned: true,
        email_mentions: true,
        email_projects: false,
        email_digest: true,
        push_desktop: true,
        push_reminders: true,
        push_team: false,
        quietHours: '22-07',
        twoFactor: false,
      },
      sessions: [
        { id: 's1', device: 'Chrome on Windows', location: 'This device', lastActive: 'Active now', icon: 'monitor', current: true },
        { id: 's2', device: 'Safari on iPhone', location: 'Mobile app', lastActive: '2 hours ago', icon: 'smartphone' },
        { id: 's3', device: 'Firefox on macOS', location: 'Office laptop', lastActive: '3 days ago', icon: 'monitor' },
      ],
    };
  }

  const store = {
    data: null,
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && saved.schema === SCHEMA) {
          this.data = saved;
          return;
        }
      } catch (e) {
        /* corrupted or unavailable storage: fall back to seed data */
      }
      this.data = seed();
      this.save();
    },
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        /* storage full or blocked: keep working in memory */
      }
    },
    reset() {
      this.data = seed();
      this.save();
    },
  };

  const me = () => {
    const u = store.data.user;
    return { id: 'me', name: `${u.firstName} ${u.lastName}`.trim(), role: u.title, email: u.email, hue: 225 };
  };
  const memberById = (id) =>
    id === 'me' ? me() : store.data.members.find((m) => m.id === id) || { id, name: 'Unassigned', role: '', hue: 220 };
  const projectById = (id) => store.data.projects.find((p) => p.id === id);
  const ownerOf = (p) => memberById(p.owner || p.members[0] || 'me');
  const tasksFor = (projectId) => store.data.tasks.filter((t) => t.project === projectId);
  const completedBy = (m) => m.tasksCompleted + store.data.tasks.filter((t) => t.assignee === m.id && t.status === 'done').length;
  const activeProjectsFor = (id) => store.data.projects.filter((p) => p.members.includes(id) && p.status !== 'completed').length;
  const totalCompleted = () =>
    (store.data.user.tasksCompleted || 0) +
    store.data.members.reduce((sum, m) => sum + m.tasksCompleted, 0) +
    store.data.tasks.filter((t) => t.status === 'done').length;

  function logActivity(action, target) {
    store.data.activity.unshift({ id: uid('a'), who: 'me', action, target, time: Date.now() });
    store.data.activity = store.data.activity.slice(0, 30);
  }

  function pushNotification(type, title, text) {
    store.data.notifications.unshift({ id: uid('n'), type, title, text, time: Date.now(), read: false });
    store.data.notifications = store.data.notifications.slice(0, 20);
    store.save();
    renderNotifications();
  }

  function emitChange(type) {
    store.save();
    refreshNavCounts();
    document.dispatchEvent(new CustomEvent('nexora:change', { detail: { type } }));
  }

  /* 4. Markup helpers ----------------------------------------------------- */
  const avatar = (m, size = '') =>
    `<span class="avatar ${size}" style="--hue:${Number(m.hue) || 220}" title="${esc(m.name)}" aria-hidden="true">${esc(initials(m.name))}</span>`;

  const badge = (cfg, dot = false) =>
    `<span class="badge${dot ? ' badge-dot' : ''}" data-tone="${cfg.tone}">${esc(cfg.label)}</span>`;

  const priorityBadge = (p) =>
    `<span class="priority" data-tone="${PRIORITY[p].tone}" data-level="${3 - PRIORITY[p].rank}"><span class="pri-bars" aria-hidden="true"><i></i><i></i><i></i></span>${PRIORITY[p].label}<span class="sr-only"> priority</span></span>`;

  function avatarStack(ids, max = 4) {
    const list = ids.map(memberById);
    const shown = list.slice(0, max).map((m) => avatar(m, 'avatar-sm')).join('');
    const extra = list.length > max ? `<span class="avatar avatar-sm avatar-more" aria-hidden="true">+${list.length - max}</span>` : '';
    return `<span class="avatar-stack" role="img" aria-label="${esc(`${plural(list.length, 'member')}: ${list.map((m) => m.name).join(', ')}`)}">${shown}${extra}</span>`;
  }

  const projectGlyph = (p) => `<span class="project-glyph" style="--hue:${Number(p.hue) || 220}" aria-hidden="true">${esc(initials(p.name))}</span>`;

  const emptyState = (iconName, title, text, action = '') =>
    `<div class="empty"><span class="empty-icon">${icon(iconName, 'icon-lg')}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${action ? `<div class="empty-actions">${action}</div>` : ''}</div>`;
  const clearFiltersBtn = '<button type="button" class="btn btn-secondary btn-sm" data-action="clear-filters">Clear filters</button>';

  const progressBar = (value, label) =>
    `<div class="progress" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span style="--value:${value}%"></span></div>`;

  /* 5. UI primitives ------------------------------------------------------ */

  // Delegated click actions: <button data-action="name">
  const actions = {};
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = actions[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    if (!el.hasAttribute('data-keep-open')) {
      const trigger = el.closest('[data-dropdown-menu]') && $('[data-dropdown-trigger]', el.closest('[data-dropdown]'));
      closeDropdowns();
      trigger?.focus({ preventScroll: true });
    }
    fn(el, e);
  });

  // Toasts
  const TOAST_META = {
    success: { icon: 'check-circle', tone: 'success' },
    error: { icon: 'alert-circle', tone: 'danger' },
    info: { icon: 'info', tone: 'info' },
    warning: { icon: 'alert-circle', tone: 'warning' },
  };

  function toastRegion() {
    let region = $('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    return region;
  }

  function toast(message, { title = '', type = 'success', action = null, duration = 4200 } = {}) {
    const meta = TOAST_META[type] || TOAST_META.info;
    const el = document.createElement('div');
    el.className = 'toast';
    el.dataset.tone = meta.tone;
    el.innerHTML = `
      <span class="toast-icon">${icon(meta.icon)}</span>
      <div class="toast-body">
        ${title ? `<p class="toast-title">${esc(title)}</p>` : ''}
        <p class="toast-msg">${esc(message)}</p>
      </div>
      ${action ? `<button type="button" class="toast-action">${esc(action.label)}</button>` : ''}
      <button type="button" class="btn-icon sm toast-close" aria-label="Dismiss notification">${icon('x', 'icon-sm')}</button>`;
    toastRegion().appendChild(el);

    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 260);
    };
    const timer = setTimeout(remove, duration);
    $('.toast-close', el).addEventListener('click', () => {
      clearTimeout(timer);
      remove();
    });
    if (action) {
      $('.toast-action', el).addEventListener('click', () => {
        clearTimeout(timer);
        action.onClick();
        remove();
      });
    }
  }

  // Dropdowns (disclosure pattern): [data-dropdown] > [data-dropdown-trigger] + [data-dropdown-menu]
  function setDropdown(dd, open) {
    dd.classList.toggle('is-open', open);
    const trigger = $('[data-dropdown-trigger]', dd);
    const menu = $('[data-dropdown-menu]', dd);
    if (trigger) trigger.setAttribute('aria-expanded', String(open));
    if (menu) menu.hidden = !open;
  }
  function closeDropdowns(except) {
    $$('[data-dropdown].is-open').forEach((dd) => dd !== except && setDropdown(dd, false));
  }
  const menuItems = (dd) => $$('.menu-item, .notif-item, [data-dropdown-menu] a, [data-dropdown-menu] button', dd).filter(
    (el, i, arr) => arr.indexOf(el) === i && el.offsetParent !== null
  );

  function initDropdowns() {
    document.addEventListener('click', (e) => {
      // Menu contents may be re-rendered by an action handler before this runs.
      if (!e.target.isConnected) return;
      const trigger = e.target.closest('[data-dropdown-trigger]');
      if (trigger) {
        const dd = trigger.closest('[data-dropdown]');
        const open = !dd.classList.contains('is-open');
        closeDropdowns(dd);
        setDropdown(dd, open);
        return;
      }
      if (!e.target.closest('[data-dropdown-menu]') || e.target.closest('[data-dropdown-menu] a[href]')) closeDropdowns();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const open = $('[data-dropdown].is-open');
        if (!open) return;
        e.preventDefault();
        setDropdown(open, false);
        $('[data-dropdown-trigger]', open)?.focus();
        return;
      }
      const dd = e.target.closest?.('[data-dropdown]');
      if (!dd) return;
      const trigger = $('[data-dropdown-trigger]', dd);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (e.target === trigger && !dd.classList.contains('is-open')) setDropdown(dd, true);
        const items = menuItems(dd);
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[i === -1 ? 0 : next].focus();
      }
    });

    document.addEventListener('focusout', (e) => {
      const dd = e.target.closest?.('[data-dropdown].is-open');
      if (dd && e.relatedTarget && !dd.contains(e.relatedTarget)) setDropdown(dd, false);
    });
  }

  // Tabs (ARIA tabs pattern)
  function initTabs(root, { onChange } = {}) {
    const tabs = $$('[role="tab"]', root);
    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (onChange) onChange(tab);
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (step) {
          e.preventDefault();
          select(tabs[(i + step + tabs.length) % tabs.length], true);
        } else if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          select(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true);
        }
      });
    });
    return select;
  }

  // Segmented / chip groups using aria-pressed
  function initPressedGroup(group, onSelect) {
    if (!group) return;
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || !group.contains(btn)) return;
      $$('button', group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      onSelect(btn);
    });
  }

  // Modals (native <dialog>)
  function bindBackdropClose(dlg) {
    dlg.addEventListener('click', (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
  }

  /** Opens a dialog with its form reset; pass `editId` to open a create dialog in edit mode. */
  function openModal(id, editId = null) {
    const dlg = document.getElementById(id);
    if (!dlg || dlg.open) return;
    closeDropdowns();
    const form = $('form', dlg);
    if (form) {
      form.reset();
      clearErrors(form);
      setFormMode(form, editId);
    }
    dlg.dispatchEvent(new Event('nexora:open'));
    dlg.showModal();
  }

  /**
   * Create dialogs double as edit dialogs. Elements with [data-edit-text] swap their text,
   * [data-edit-only] fields are shown (and enabled) only while editing.
   */
  function setFormMode(form, editId = null) {
    const dlg = form.closest('dialog') || form;
    $$('[data-edit-text]', dlg).forEach((el) => {
      if (el.dataset.createText === undefined) el.dataset.createText = el.textContent;
      el.textContent = editId ? el.dataset.editText : el.dataset.createText;
    });
    $$('[data-edit-only]', dlg).forEach((el) => {
      el.hidden = !editId;
      $$('input, select, textarea', el).forEach((f) => (f.disabled = !editId));
    });
    if (editId) form.dataset.editId = editId;
    else {
      delete form.dataset.editId;
      $$('[data-original]', form).forEach((el) => delete el.dataset.original);
    }
  }

  function initModals() {
    $$('dialog.modal').forEach((dlg) => {
      bindBackdropClose(dlg);
      const form = $('form', dlg);
      if (form) setFormMode(form);
      dlg.addEventListener('close', () => {
        // The close event is async; skip if the dialog was reopened in the meantime.
        if (form && !dlg.open) {
          form.reset();
          clearErrors(form);
          setFormMode(form);
        }
      });
    });
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-open-modal]');
      if (opener) {
        e.preventDefault();
        openModal(opener.dataset.openModal);
        return;
      }
      const closer = e.target.closest('[data-close-modal]');
      if (closer) closer.closest('dialog')?.close();
    });
  }

  function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = true }) {
    let dlg = $('#confirm-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'modal modal-sm';
      dlg.id = 'confirm-dialog';
      dlg.setAttribute('aria-labelledby', 'confirm-title');
      dlg.setAttribute('aria-describedby', 'confirm-message');
      dlg.innerHTML = `
        <div class="modal-head"><span class="modal-icon" aria-hidden="true"></span><div><h2 class="modal-title" id="confirm-title"></h2></div></div>
        <div class="modal-body"><p class="muted" id="confirm-message"></p></div>
        <div class="modal-foot">
          <button type="button" class="btn btn-secondary" data-confirm="no">Cancel</button>
          <button type="button" class="btn" data-confirm="yes"></button>
        </div>`;
      document.body.appendChild(dlg);
      bindBackdropClose(dlg);
      dlg.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-confirm]');
        if (!btn) return;
        dlg.close(btn.dataset.confirm);
        dlg._settle?.(btn.dataset.confirm === 'yes');
      });
      dlg.addEventListener('close', () => dlg._settle?.(dlg.returnValue === 'yes'));
    }
    const mark = $('.modal-icon', dlg);
    mark.className = `modal-icon${danger ? ' danger' : ''}`;
    mark.innerHTML = icon(danger ? 'alert-circle' : 'info');
    $('#confirm-title', dlg).textContent = title;
    $('#confirm-message', dlg).textContent = message;
    const yes = $('[data-confirm="yes"]', dlg);
    yes.textContent = confirmLabel;
    yes.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    dlg.returnValue = '';
    closeDropdowns();
    dlg.showModal();
    $('[data-confirm="no"]', dlg).focus();
    return new Promise((resolve) => {
      dlg._settle = (ok) => {
        dlg._settle = null;
        resolve(ok);
      };
    });
  }

  // Form validation
  function fieldLabel(input) {
    if (input.dataset.label) return input.dataset.label;
    const label = input.id && document.querySelector(`label[for="${input.id}"]`);
    return label ? label.childNodes[0].textContent.trim() : 'This field';
  }

  function validateField(input) {
    const v = (input.value || '').trim();
    const label = fieldLabel(input);
    if (input.required && !v) return `${label} is required.`;
    if (!v) return '';
    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address, like name@company.com.';
    if (input.minLength > 0 && v.length < input.minLength) return `${label} must be at least ${input.minLength} characters.`;
    if (input.type === 'number') {
      const n = Number(v);
      const min = input.min === '' ? -Infinity : Number(input.min);
      const max = input.max === '' ? Infinity : Number(input.max);
      if (!Number.isFinite(n) || n < min || n > max || !Number.isInteger(n)) return `${label} must be a whole number between ${input.min} and ${input.max}.`;
    }
    if ('futureDate' in input.dataset && daysUntil(v) < 0 && v !== input.dataset.original) return 'Choose today or a future date.';
    if (input.dataset.match && input.form && v !== input.form.elements.namedItem(input.dataset.match).value) return 'Passwords do not match.';
    if ('uniqueEmail' in input.dataset && store.data.members.some((m) => m.email.toLowerCase() === v.toLowerCase() && m.id !== input.form?.dataset.editId)) {
      return 'Someone with this email is already on the team.';
    }
    return '';
  }

  function setError(input, msg) {
    const field = input.closest('.field');
    if (!field) return;
    let err = $(':scope > .field-error', field);
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.id = `${input.id || uid('field')}-error`;
      field.appendChild(err);
    }
    err.textContent = msg;
    if (input.matches('input, select, textarea')) {
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const ids = new Set((input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
      if (msg) ids.add(err.id);
      else ids.delete(err.id);
      if (ids.size) input.setAttribute('aria-describedby', [...ids].join(' '));
      else input.removeAttribute('aria-describedby');
    }
  }

  function validateGroup(group) {
    const ok = $$('input:checked', group).length >= Number(group.dataset.minChecked || 1);
    setError(group, ok ? '' : group.dataset.error || 'Select at least one option.');
    return ok;
  }

  function validateForm(form) {
    let first = null;
    $$('input, select, textarea', form).forEach((input) => {
      if (['checkbox', 'radio', 'submit', 'button', 'reset'].includes(input.type) || input.disabled) return;
      const msg = validateField(input);
      setError(input, msg);
      if (msg && !first) first = input;
    });
    $$('[data-min-checked]', form).forEach((group) => {
      if (!validateGroup(group) && !first) first = $('input', group);
    });
    form.dataset.validated = 'true';
    if (first) first.focus();
    return !first;
  }

  function clearErrors(form) {
    $$('.field-error', form).forEach((el) => {
      el.textContent = '';
    });
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    delete form.dataset.validated;
  }

  function initLiveValidation() {
    const isValidatable = (el) =>
      el.form && el.form.noValidate && el.matches('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
    document.addEventListener('input', (e) => {
      const el = e.target;
      if (isValidatable(el) && el.form.dataset.validated === 'true') setError(el, validateField(el));
    });
    document.addEventListener('change', (e) => {
      const group = e.target.closest('[data-min-checked]');
      if (group && group.closest('form')?.dataset.validated === 'true') validateGroup(group);
    });
    document.addEventListener('focusout', (e) => {
      const el = e.target;
      if (isValidatable(el) && el.value.trim()) setError(el, validateField(el));
    });
  }

  // Brief busy state on a form's submit button so saves read as deliberate; resolves when done.
  const BUSY_MS = 380;
  function submitWithBusy(form, work) {
    const btn = form.querySelector('[type="submit"]') || (form.id && document.querySelector(`[type="submit"][form="${form.id}"]`));
    if (btn?.getAttribute('aria-busy') === 'true') return;
    const dlg = form.closest('dialog');
    btn?.setAttribute('aria-busy', 'true');
    setTimeout(() => {
      btn?.removeAttribute('aria-busy');
      if (dlg && !dlg.open) return;
      work();
    }, BUSY_MS);
  }

  // Appearance preferences (also read by the inline script in each <head>)
  function readAppearance() {
    try {
      return JSON.parse(localStorage.getItem(APPEARANCE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function applyAppearance(ap) {
    const root = document.documentElement;
    ['accent', 'density', 'motion', 'contrast'].forEach((key) => {
      if (ap[key]) root.setAttribute(`data-${key}`, ap[key]);
      else root.removeAttribute(`data-${key}`);
    });
    try {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify(ap));
    } catch (e) {
      /* storage unavailable: preference applies to this page only */
    }
  }

  /* 6. App shell ---------------------------------------------------------- */
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'dashboard' },
    { id: 'projects', label: 'Projects', href: 'projects.html', icon: 'folder', count: () => store.data.projects.filter((p) => p.status !== 'completed').length },
    { id: 'tasks', label: 'Tasks', href: 'tasks.html', icon: 'check-square', count: () => store.data.tasks.filter((t) => t.status !== 'done').length },
    { id: 'team', label: 'Team', href: 'team.html', icon: 'users' },
    { id: 'analytics', label: 'Analytics', href: 'analytics.html', icon: 'chart' },
  ];
  const SEAT_LIMIT = 15;

  function renderSidebar(el, page) {
    const u = me();
    el.innerHTML = `
      <div class="sidebar-head">
        <a href="index.html" class="brand" aria-label="NEXORA home"><img src="assets/logo.svg" alt="" width="28" height="28"><span>NEXORA</span></a>
        <button type="button" class="btn-icon sm sidebar-close" data-action="close-nav" aria-label="Close navigation">${icon('x')}</button>
      </div>
      <div class="dropdown" data-dropdown>
        <button type="button" class="workspace-switch" data-dropdown-trigger aria-expanded="false" aria-controls="workspace-menu">
          <span class="workspace-mark" aria-hidden="true">NH</span>
          <span class="min0"><span class="workspace-name truncate">Nexora HQ</span><span class="workspace-plan">Pro workspace</span></span>
          ${icon('chevron-down', 'icon-sm')}
          <span class="sr-only">Switch workspace</span>
        </button>
        <div class="dropdown-menu" id="workspace-menu" data-dropdown-menu hidden>
          <p class="menu-label">Workspaces</p>
          <button type="button" class="menu-item" data-action="switch-workspace" data-name="Nexora HQ"><span class="workspace-mark" aria-hidden="true">NH</span>Nexora HQ<span class="menu-end">${icon('check', 'icon-sm')}</span></button>
          <button type="button" class="menu-item" data-action="switch-workspace" data-name="Design Guild"><span class="workspace-mark" aria-hidden="true">DG</span>Design Guild</button>
          <div class="menu-sep"></div>
          <button type="button" class="menu-item" data-action="switch-workspace" data-name="new">${icon('plus', 'icon-sm')}Create workspace</button>
        </div>
      </div>
      <nav aria-label="Primary">
        <p class="nav-label" id="nav-heading">Menu</p>
        <ul class="nav-list" aria-labelledby="nav-heading">
          ${NAV.map(
            (n, i) => `<li><a class="nav-link" href="${n.href}"${n.id === page ? ' aria-current="page"' : ''}><span class="nav-index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span>${n.label}</span>${
              n.count ? `<span class="nav-count" data-nav-count="${n.id}">${n.count()}</span>` : ''
            }</a></li>`
          ).join('')}
        </ul>
        <p class="nav-label" id="pinned-heading">Pinned projects</p>
        <ul class="nav-list" aria-labelledby="pinned-heading" data-pinned></ul>
      </nav>
      <div class="sidebar-spacer"></div>
      <div class="plan-card" data-plan-card></div>
      <div class="sidebar-foot">
        <a class="nav-link" href="settings.html"${page === 'settings' ? ' aria-current="page"' : ''}><span class="nav-index" aria-hidden="true">06</span><span>Settings</span></a>
        <a class="sidebar-user" href="settings.html#profile">
          <span class="avatar avatar-sm" data-user-avatar style="--hue:${u.hue}" aria-hidden="true">${esc(initials(u.name))}</span>
          <span class="min0">
            <span class="name truncate" data-user-name>${esc(u.name)}</span>
            <span class="email truncate" data-user-email>${esc(u.email)}</span>
          </span>
        </a>
        <button type="button" class="nav-link danger" data-action="logout">${icon('logout')}<span>Log out</span></button>
      </div>`;
    renderPlanCard();
    renderPinned();
  }

  function renderPlanCard() {
    const el = $('[data-plan-card]');
    if (!el) return;
    const seats = store.data.members.length + 1;
    const pct = Math.min(100, Math.round((seats / SEAT_LIMIT) * 100));
    el.innerHTML = `
      <div class="row between"><strong>Seats used</strong><span class="text-xs muted num mono">${seats} / ${SEAT_LIMIT}</span></div>
      ${progressBar(pct, 'Seats used')}
      <p>${SEAT_LIMIT - seats} seats left on the Pro plan</p>`;
  }

  function renderPinned() {
    const el = $('[data-pinned]');
    if (!el) return;
    const pinned = store.data.projects.filter((p) => p.status !== 'completed').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
    el.innerHTML = pinned
      .map((p) => `<li><a class="nav-link" href="projects.html?q=${encodeURIComponent(p.name)}"><span class="pin-dot" style="--hue:${Number(p.hue) || 220}" aria-hidden="true"></span><span class="truncate">${esc(p.name)}</span></a></li>`)
      .join('');
    el.previousElementSibling.hidden = !pinned.length;
  }

  function refreshNavCounts() {
    NAV.forEach((n) => {
      const el = $(`[data-nav-count="${n.id}"]`);
      if (el && n.count) el.textContent = n.count();
    });
    renderPlanCard();
    renderPinned();
  }

  const PAGE_LABELS = { dashboard: 'Dashboard', projects: 'Projects', tasks: 'Tasks', team: 'Team', analytics: 'Analytics', settings: 'Settings' };

  function renderTopbar(el, page) {
    const u = me();
    const hasTaskModal = !!document.getElementById('task-modal');
    const cta = hasTaskModal
      ? `<button type="button" class="btn btn-primary btn-sm topbar-cta" data-open-modal="task-modal">${icon('plus', 'icon-sm')}New task</button>`
      : `<a class="btn btn-primary btn-sm topbar-cta" href="tasks.html#new">${icon('plus', 'icon-sm')}New task</a>`;
    el.innerHTML = `
      <button type="button" class="btn-icon nav-toggle" data-action="open-nav" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button>
      <a class="topbar-brand" href="dashboard.html" aria-label="NEXORA dashboard"><img src="assets/logo.svg" alt="" width="26" height="26"></a>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="dashboard.html">Nexora HQ</a>${icon('chevron-right', 'icon-xs')}<span aria-current="page">${PAGE_LABELS[page] || ''}</span>
      </nav>
      <div class="search" role="search">
        ${icon('search', 'icon-sm')}
        <label class="sr-only" for="global-search">Search projects, tasks and people</label>
        <input class="search-input" id="global-search" type="search" placeholder="Search projects, tasks, people…" autocomplete="off"
          role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list">
        <kbd aria-hidden="true">Ctrl K</kbd>
        <div class="search-results" id="search-results" role="listbox" aria-label="Search results" hidden></div>
      </div>
      <button type="button" class="btn-icon search-close" data-action="close-search" aria-label="Close search">${icon('x')}</button>
      <div class="topbar-actions">
        <button type="button" class="btn-icon search-toggle" data-action="open-search" aria-label="Search">${icon('search')}</button>
        ${cta}
        <span class="topbar-divider" aria-hidden="true"></span>
        <div class="dropdown" data-dropdown>
          <button type="button" class="btn-icon" id="notif-trigger" data-dropdown-trigger aria-expanded="false" aria-controls="notif-panel" aria-label="Notifications">
            ${icon('bell')}<span class="dot-badge" data-notif-count hidden>0</span>
          </button>
          <div class="dropdown-menu notif-panel" id="notif-panel" data-dropdown-menu hidden>
            <div class="notif-head">
              <h2>Notifications</h2>
              <button type="button" class="card-link" data-action="notif-read-all" data-keep-open>Mark all as read</button>
            </div>
            <div class="notif-list" id="notif-list"></div>
            <div class="notif-foot"><a class="btn btn-ghost btn-sm btn-block" href="settings.html#notifications">Notification settings</a></div>
          </div>
        </div>
        <div class="dropdown" data-dropdown>
          <button type="button" class="profile-btn" data-dropdown-trigger aria-expanded="false" aria-controls="profile-menu" aria-label="Account menu">
            <span class="avatar avatar-sm" data-user-avatar style="--hue:${u.hue}" aria-hidden="true">${esc(initials(u.name))}</span>
            <span class="profile-meta"><span class="name" data-user-name>${esc(u.name)}</span><span class="role" data-user-title>${esc(u.role)}</span></span>
            ${icon('chevron-down', 'icon-sm')}
          </button>
          <div class="dropdown-menu" id="profile-menu" data-dropdown-menu hidden>
            <div class="menu-header">
              <p class="fw-600 truncate" data-user-name>${esc(u.name)}</p>
              <p class="text-xs subtle truncate" data-user-email>${esc(u.email)}</p>
            </div>
            <div class="menu-sep"></div>
            <a class="menu-item" href="settings.html#profile">${icon('user', 'icon-sm')}Your profile</a>
            <a class="menu-item" href="settings.html">${icon('settings', 'icon-sm')}Settings</a>
            <a class="menu-item" href="settings.html#appearance">${icon('palette', 'icon-sm')}Appearance</a>
            <button type="button" class="menu-item" data-action="shortcuts">${icon('help', 'icon-sm')}Keyboard shortcuts</button>
            <div class="menu-sep"></div>
            <button type="button" class="menu-item danger" data-action="logout">${icon('logout', 'icon-sm')}Log out</button>
          </div>
        </div>
      </div>`;
  }

  function syncUser() {
    const u = me();
    $$('[data-user-name]').forEach((el) => (el.textContent = u.name));
    $$('[data-user-email]').forEach((el) => (el.textContent = u.email));
    $$('[data-user-title]').forEach((el) => (el.textContent = u.role));
    $$('[data-user-avatar]').forEach((el) => (el.textContent = initials(u.name)));
  }

  function initMobileNav() {
    const sidebar = $('#sidebar');
    const toggle = $('.nav-toggle');
    const scrim = $('.scrim');
    if (!sidebar || !toggle) return;

    const isOpen = () => sidebar.classList.contains('is-open');
    const setNav = (open, returnFocus = true) => {
      sidebar.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (scrim) scrim.hidden = !open;
      if (open) setTimeout(() => $('.sidebar-close', sidebar)?.focus(), 60);
      else if (returnFocus) toggle.focus();
    };

    actions['open-nav'] = () => setNav(true);
    actions['close-nav'] = () => setNav(false);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen() && !e.defaultPrevented) setNav(false);
    });
    window.matchMedia('(max-width: 1024px)').addEventListener('change', (e) => {
      if (!e.matches && isOpen()) setNav(false, false);
    });
    sidebar.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !isOpen()) return;
      const focusable = $$('a[href], button:not([disabled])', sidebar).filter((el) => el.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // Global search (combobox)
  function initSearch() {
    const input = $('#global-search');
    const box = $('#search-results');
    if (!input || !box) return;
    const topbar = input.closest('.topbar');
    let items = [];
    let active = -1;

    const highlight = (text, q) => {
      const i = text.toLowerCase().indexOf(q);
      if (i < 0) return esc(text);
      return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
    };

    const close = () => {
      box.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    };

    const setActive = (i) => {
      active = i;
      $$('.search-option', box).forEach((opt, idx) => opt.setAttribute('aria-selected', String(idx === i)));
      const opt = document.getElementById(`search-opt-${i}`);
      if (opt) {
        input.setAttribute('aria-activedescendant', opt.id);
        opt.scrollIntoView({ block: 'nearest' });
      }
    };

    const run = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return close();
      const d = store.data;
      const pages = [...NAV, { label: 'Settings', href: 'settings.html', icon: 'settings' }];
      const groups = [
        ['Pages', pages.filter((p) => p.label.toLowerCase().includes(q)).map((p) => ({ label: p.label, meta: 'Go to page', href: p.href, icon: p.icon, tone: 'accent' }))],
        ['Projects', d.projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 4).map((p) => ({ label: p.name, meta: `${PROJECT_STATUS[p.status].label} · ${p.progress}%`, href: `projects.html?q=${encodeURIComponent(p.name)}`, icon: 'folder', tone: 'violet' }))],
        ['Tasks', d.tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5).map((t) => ({ label: t.title, meta: `${TASK_STATUS[t.status].label} · due ${relDue(t.due).toLowerCase()}`, href: `tasks.html?q=${encodeURIComponent(t.title)}`, icon: 'check-square', tone: 'info' }))],
        ['People', d.members.filter((m) => `${m.name} ${m.role}`.toLowerCase().includes(q)).slice(0, 4).map((m) => ({ label: m.name, meta: m.role, href: `team.html?q=${encodeURIComponent(m.name)}`, icon: 'user', tone: 'success' }))],
      ].filter(([, list]) => list.length);

      items = groups.flatMap(([, list]) => list);
      let idx = 0;
      box.innerHTML = items.length
        ? groups
            .map(
              ([name, list]) =>
                `<div role="group" aria-label="${name}"><p class="search-group" aria-hidden="true">${name}</p>${list
                  .map(
                    (it) => `<a class="search-option" role="option" id="search-opt-${idx++}" href="${it.href}" aria-selected="false" tabindex="-1">
                      <span class="icon-tile" data-tone="${it.tone}">${icon(it.icon, 'icon-sm')}</span>
                      <span class="min0"><span class="label-text truncate">${highlight(it.label, q)}</span><span class="text-xs subtle">${esc(it.meta)}</span></span>
                    </a>`
                  )
                  .join('')}</div>`
            )
            .join('') +
          '<div class="search-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd>navigate</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div>'
        : `<p class="search-empty">No results for “${esc(input.value.trim())}”</p>`;
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (items.length) setActive(0);
      else input.removeAttribute('aria-activedescendant');
    };

    input.addEventListener('input', debounce(run, 90));
    input.addEventListener('focus', () => input.value.trim() && run());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        if (box.hidden) run();
        setActive((active + 1) % items.length);
      } else if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        setActive((active - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        if (!box.hidden && items[active]) {
          e.preventDefault();
          location.href = items[active].href;
        }
      } else if (e.key === 'Escape') {
        if (!box.hidden) {
          e.stopPropagation();
          close();
        } else if (topbar.classList.contains('search-open')) {
          actions['close-search']();
        } else {
          input.value = '';
        }
      }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('.search, .search-toggle')) return;
      close();
      topbar.classList.remove('search-open');
    });
  }

  // Notifications panel
  const NOTIF_META = {
    mention: ['message', 'accent'],
    deadline: ['clock', 'warning'],
    success: ['check-circle', 'success'],
    team: ['users', 'violet'],
    comment: ['message', 'info'],
    task: ['check-square', 'info'],
    security: ['shield', 'danger'],
  };

  function renderNotifications() {
    const list = $('#notif-list');
    if (!list) return;
    const items = store.data.notifications;
    const unread = items.filter((n) => !n.read).length;
    const countEl = $('[data-notif-count]');
    countEl.hidden = !unread;
    countEl.textContent = unread > 9 ? '9+' : String(unread);
    $('#notif-trigger').setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
    list.innerHTML = items.length
      ? items
          .map((n) => {
            const [ic, tone] = NOTIF_META[n.type] || NOTIF_META.task;
            return `<button type="button" class="notif-item${n.read ? '' : ' unread'}" data-action="notif-open" data-keep-open data-id="${n.id}">
              <span class="icon-tile" data-tone="${tone}">${icon(ic, 'icon-sm')}</span>
              <span class="min0">
                <span class="notif-title">${esc(n.title)}${n.read ? '' : '<span class="sr-only"> (unread)</span>'}</span>
                <span class="notif-text">${esc(n.text)}</span>
                <span class="notif-time">${timeAgo(n.time)}</span>
              </span>
            </button>`;
          })
          .join('')
      : emptyState('bell', 'You are all caught up', 'New notifications will appear here.');
  }

  actions['notif-open'] = (el) => {
    const n = store.data.notifications.find((x) => x.id === el.dataset.id);
    if (!n || n.read) return;
    n.read = true;
    store.save();
    renderNotifications();
    $(`[data-id="${n.id}"]`, $('#notif-list'))?.focus();
  };
  actions['notif-read-all'] = () => {
    const unread = store.data.notifications.filter((n) => !n.read);
    if (!unread.length) return toast('No unread notifications.', { type: 'info' });
    unread.forEach((n) => (n.read = true));
    store.save();
    renderNotifications();
    toast(`${plural(unread.length, 'notification')} marked as read.`);
  };
  actions.logout = () => {
    toast('You have been signed out. See you soon!', { title: 'Signed out', type: 'info', duration: 1500 });
    setTimeout(() => (location.href = 'index.html'), 1000);
  };
  actions['open-search'] = () => {
    $('.topbar')?.classList.add('search-open');
    $('#global-search')?.focus();
  };
  actions['close-search'] = () => {
    $('.topbar')?.classList.remove('search-open');
    $('.search-toggle')?.focus();
  };
  actions['switch-workspace'] = (el) => {
    const name = el.dataset.name;
    if (name === 'Nexora HQ') return toast('You are already in Nexora HQ.', { type: 'info' });
    if (name === 'new') return toast('Workspace creation is available on the Business plan.', { title: 'Create workspace', type: 'info' });
    toast(`You don't have access to ${name} yet. Ask an admin for an invite.`, { title: 'Access required', type: 'warning' });
  };
  actions['coming-soon'] = (el) =>
    toast(`${el.dataset.label || 'This page'} will be published before launch.`, { title: 'Coming soon', type: 'info' });
  actions.shortcuts = () =>
    toast('Press / or Ctrl+K to search, N to create a task, and Esc to close menus and dialogs.', { title: 'Keyboard shortcuts', type: 'info', duration: 7000 });

  function initShortcuts() {
    document.addEventListener('keydown', (e) => {
      const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
      const search = $('#global-search');
      const key = (e.key || '').toLowerCase();
      if (search && ((key === 'k' && (e.ctrlKey || e.metaKey)) || (key === '/' && !typing))) {
        e.preventDefault();
        search.closest('.topbar')?.classList.add('search-open');
        search.focus();
        search.select();
      } else if (key === 'n' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && $('#task-modal') && !$('dialog[open]')) {
        e.preventDefault();
        openModal('task-modal');
      }
    });
  }

  // Shared "Create task" dialog (dashboard + tasks pages)
  function initTaskForm() {
    const form = $('#task-form');
    if (!form) return;
    const dlg = form.closest('dialog');

    const field = (name) => form.elements.namedItem(name);
    const editing = () => store.data.tasks.find((t) => t.id === form.dataset.editId);

    const fillOptions = (task) => {
      $$('[data-options]', form).forEach((sel) => {
        if (sel.dataset.options === 'projects') {
          sel.innerHTML = `<option value="">Select a project</option>${store.data.projects
            .filter((p) => p.status !== 'completed' || p.id === task?.project)
            .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
            .join('')}`;
        } else {
          sel.innerHTML = `<option value="">Select a teammate</option><option value="me">${esc(me().name)} (you)</option>${store.data.members
            .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
            .join('')}`;
        }
      });
    };

    dlg.addEventListener('nexora:open', () => {
      const task = editing();
      fillOptions(task);
      if (!task) {
        field('due').value = isoIn(3);
        return;
      }
      field('title').value = task.title;
      field('project').value = projectById(task.project) ? task.project : '';
      field('assignee').value = task.assignee === 'me' || store.data.members.some((m) => m.id === task.assignee) ? task.assignee : '';
      field('priority').value = task.priority;
      field('status').value = task.status;
      field('due').value = task.due;
      field('due').dataset.original = task.due;
    });

    actions['task-edit'] = (el) => {
      if (!store.data.tasks.some((t) => t.id === el.dataset.id)) return toast('That task no longer exists.', { type: 'warning' });
      openModal('task-modal', el.dataset.id);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm(form)) submitWithBusy(form, form.dataset.editId ? updateTask : createTask);
    });

    const updateTask = () => {
      const task = editing();
      if (!task) return dlg.close();
      const was = { ...task };
      Object.assign(task, {
        title: formVal(form, 'title'),
        project: formVal(form, 'project'),
        assignee: formVal(form, 'assignee'),
        priority: formVal(form, 'priority'),
        status: formVal(form, 'status'),
        due: formVal(form, 'due'),
      });
      if (task.status === 'done' && was.status !== 'done') logActivity('completed', task.title);
      else logActivity('updated the task', task.title);
      if (task.assignee !== was.assignee && task.assignee !== 'me') {
        pushNotification('task', 'Task reassigned', `You assigned “${task.title}” to ${memberById(task.assignee).name}.`);
      }
      dlg.close();
      emitChange('tasks');
      toast(`Your changes to “${task.title}” were saved.`, { title: 'Task updated' });
      document.dispatchEvent(new CustomEvent('nexora:task-created', { detail: { id: task.id } }));
    };

    const createTask = () => {
      const task = {
        id: uid('t'),
        title: formVal(form, 'title'),
        project: formVal(form, 'project'),
        assignee: formVal(form, 'assignee'),
        priority: formVal(form, 'priority'),
        status: 'todo',
        due: formVal(form, 'due'),
      };
      store.data.tasks.unshift(task);
      logActivity('created the task', task.title);
      if (task.assignee !== 'me') {
        pushNotification('task', 'Task assigned', `You assigned “${task.title}” to ${memberById(task.assignee).name}.`);
      }
      dlg.close();
      emitChange('tasks');
      toast(`“${task.title}” was added to ${projectById(task.project)?.name || 'your tasks'}.`, { title: 'Task created' });
      document.dispatchEvent(new CustomEvent('nexora:task-created', { detail: { id: task.id } }));
    };
  }

  /* 7. Charts ------------------------------------------------------------- */

  function niceScale(maxValue, ticks = 4) {
    const raw = Math.max(maxValue, 1) / ticks;
    const exp = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / exp;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
    return { max: step * ticks, step };
  }

  /** Renders via `draw(width)` and re-renders when the container width changes. */
  function mountChart(el, draw) {
    el._draw = draw;
    draw(el.clientWidth || 600);
    if (!el._observed && 'ResizeObserver' in window) {
      el._observed = true;
      let lastWidth = el.clientWidth;
      new ResizeObserver(() => {
        const w = el.clientWidth;
        if (w && w !== lastWidth) {
          lastWidth = w;
          el._draw(w);
        }
      }).observe(el);
    }
  }

  function axisMarkup({ width, pad, h, max, step, labels, xAt }) {
    let out = '';
    for (let v = 0; v <= max + 1e-9; v += step) {
      const y = r1(pad.t + h - (v / max) * h);
      out += `<line class="grid-line${v === 0 ? ' base' : ''}" x1="${pad.l}" x2="${width - pad.r}" y1="${y}" y2="${y}"/>`;
      out += `<text class="axis-label" x="${pad.l - 10}" y="${y + 4}" text-anchor="end">${fmtNum(Math.round(v))}</text>`;
    }
    const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor((width - pad.l - pad.r) / 58))));
    labels.forEach((label, i) => {
      if (i % every === 0) out += `<text class="axis-label" x="${r1(xAt(i))}" y="${pad.t + h + 22}" text-anchor="middle">${esc(label)}</text>`;
    });
    return out;
  }

  function bindTooltip(el, getData) {
    const tip = $('.chart-tooltip', el);
    const hoverLine = $('.hover-line', el);
    const cols = $$('.col', el);
    const hide = () => {
      tip.classList.remove('show');
      if (hoverLine) hoverLine.setAttribute('opacity', '0');
      cols.forEach((c) => c.classList.remove('is-active'));
    };
    cols.forEach((col) => {
      col.addEventListener('mouseenter', () => {
        const data = getData(Number(col.dataset.i));
        cols.forEach((c) => c.classList.toggle('is-active', c === col));
        tip.innerHTML = `<strong>${esc(data.title)}</strong>${data.rows
          .map(([name, value, color]) => `<span class="tip-row"><i style="background:${color}"></i>${esc(name)}<b>${fmtNum(value)}</b></span>`)
          .join('')}`;
        tip.classList.add('show');
        const half = tip.offsetWidth / 2;
        tip.style.left = `${Math.min(Math.max(data.x, half), el.clientWidth - half)}px`;
        if (hoverLine) {
          hoverLine.setAttribute('x1', data.x);
          hoverLine.setAttribute('x2', data.x);
          hoverLine.setAttribute('opacity', '1');
        }
      });
    });
    $('svg', el).addEventListener('mouseleave', hide);
  }

  const chartHeight = (base, width) => Math.round(Math.max(180, Math.min(base, width * 0.62)));

  function lineChart(el, { labels, series, height: baseHeight = 260, label = 'Line chart' }) {
    if (!el) return;
    mountChart(el, (width) => {
      const height = chartHeight(baseHeight, width);
      const pad = { t: 16, r: 10, b: 32, l: 44 };
      const w = Math.max(width - pad.l - pad.r, 40);
      const h = height - pad.t - pad.b;
      const { max, step } = niceScale(Math.max(...series.flatMap((s) => s.values)) * 1.08);
      const n = labels.length;
      const xAt = (i) => pad.l + (n === 1 ? w / 2 : (i * w) / (n - 1));
      const yAt = (v) => pad.t + h - (v / max) * h;
      const colW = n > 1 ? w / (n - 1) : w;

      let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">`;
      svg += axisMarkup({ width, pad, h, max, step, labels, xAt });
      series.forEach((s, si) => {
        const pts = s.values.map((v, i) => [xAt(i), yAt(v)]);
        const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)},${r1(y)}`).join(' ');
        if (si === 0) {
          svg += `<path class="area" d="${d} L${r1(pts[pts.length - 1][0])},${pad.t + h} L${r1(pts[0][0])},${pad.t + h} Z" fill="${s.color}" fill-opacity="0.07"/>`;
        }
        svg += `<path class="line${si > 0 ? ' secondary' : ''}" d="${d}" stroke="${s.color}"/>`;
      });
      svg += `<line class="hover-line" x1="0" x2="0" y1="${pad.t}" y2="${pad.t + h}" opacity="0"/>`;
      labels.forEach((_, i) => {
        svg += `<g class="col" data-i="${i}">`;
        series.forEach((s) => {
          svg += `<rect class="dot" x="${r1(xAt(i) - 3.5)}" y="${r1(yAt(s.values[i]) - 3.5)}" width="7" height="7" stroke="${s.color}" stroke-width="1.5"/>`;
        });
        const x0 = Math.max(pad.l, xAt(i) - colW / 2);
        const x1 = Math.min(width - pad.r, xAt(i) + colW / 2);
        svg += `<rect x="${r1(x0)}" y="${pad.t}" width="${r1(x1 - x0)}" height="${h}" fill="transparent"/></g>`;
      });
      svg += '</svg>';
      el.innerHTML = `${svg}<div class="chart-tooltip" aria-hidden="true"></div>`;
      bindTooltip(el, (i) => ({ x: xAt(i), title: labels[i], rows: series.map((s) => [s.name, s.values[i], s.color]) }));
    });
  }

  function barChart(el, { labels, series, height: baseHeight = 240, label = 'Bar chart' }) {
    if (!el) return;
    mountChart(el, (width) => {
      const height = chartHeight(baseHeight, width);
      const pad = { t: 16, r: 6, b: 32, l: 44 };
      const w = Math.max(width - pad.l - pad.r, 40);
      const h = height - pad.t - pad.b;
      const { max, step } = niceScale(Math.max(...series.flatMap((s) => s.values)) * 1.08);
      const n = labels.length;
      const groupW = w / n;
      const gap = 4;
      const barW = Math.min(26, (groupW * 0.64 - gap * (series.length - 1)) / series.length);
      const innerW = barW * series.length + gap * (series.length - 1);
      const xAt = (i) => pad.l + groupW * (i + 0.5);

      let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">`;
      svg += axisMarkup({ width, pad, h, max, step, labels, xAt });
      labels.forEach((_, i) => {
        svg += `<g class="col" data-i="${i}">`;
        series.forEach((s, si) => {
          const bh = Math.max(2, (s.values[i] / max) * h);
          const x = xAt(i) - innerW / 2 + si * (barW + gap);
          svg += `<rect class="bar" x="${r1(x)}" y="${r1(pad.t + h - bh)}" width="${r1(barW)}" height="${r1(bh)}" fill="${s.color}"/>`;
        });
        svg += `<rect x="${r1(pad.l + groupW * i)}" y="${pad.t}" width="${r1(groupW)}" height="${h}" fill="transparent"/></g>`;
      });
      svg += '</svg>';
      el.innerHTML = `${svg}<div class="chart-tooltip" aria-hidden="true"></div>`;
      bindTooltip(el, (i) => ({ x: xAt(i), title: labels[i], rows: series.map((s) => [s.name, s.values[i], s.color]) }));
    });
  }

  /** Horizontal stacked composition bar with a tabular legend. */
  function compositionChart(el, { segments, centerValue, centerLabel }) {
    if (!el) return;
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const pct = (v) => (total ? Math.round((v / total) * 100) : 0);
    const summary = segments.map((s) => `${s.label}: ${s.value}`).join(', ');
    el.innerHTML = `
      <div class="composition">
        <div class="comp-total"><strong class="num">${esc(centerValue)}</strong><span>${esc(centerLabel)}</span></div>
        <div class="comp-bar" role="img" aria-label="${esc(`${centerLabel} ${centerValue}. ${summary}`)}">
          ${segments.filter((s) => s.value > 0).map((s) => `<span style="--c:${s.color};flex:${s.value}"></span>`).join('')}
        </div>
        <ul class="comp-legend">
          ${segments
            .map((s) => `<li><span class="legend-dot" style="--c:${s.color}"></span>${esc(s.label)}<b class="num">${s.value}</b><em class="num">${pct(s.value)}%</em></li>`)
            .join('')}
        </ul>
      </div>`;
  }

  /** Stable demo time series for the dashboard and analytics charts. */
  function activitySeries(range) {
    const seedFor = { '7d': 7, '30d': 30, '90d': 90, '12m': 12 }[range] || 7;
    const rand = rng(seedFor * 7919);
    const today = startOfToday();
    const labels = [];
    const completed = [];
    const created = [];

    if (range === '12m') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        const base = 300 + (11 - i) * 16;
        completed.push(Math.round(base + rand() * 70));
        created.push(Math.round(base * 1.04 + rand() * 80));
      }
    } else if (range === '90d') {
      for (let i = 12; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i * 7);
        labels.push(fmtDate(toISO(d)));
        const base = 72 + (12 - i) * 2.2;
        completed.push(Math.round(base + rand() * 20));
        created.push(Math.round(base + 4 + rand() * 22));
      }
    } else {
      const days = range === '30d' ? 30 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(days === 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : fmtDate(toISO(d)));
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        const base = weekend ? 5 : 15 + ((days - i) / days) * 6;
        completed.push(Math.round(base + rand() * 8));
        created.push(Math.round(base + 1 + rand() * 9));
      }
    }
    return { labels, completed, created };
  }

  const chartColors = () => ({ a: cssVar('--chart-1') || '#1f4d3a', b: cssVar('--chart-2') || '#b9ad94' });

  /* 8. Page modules ------------------------------------------------------- */
  const PAGES = {};

  // Landing ---------------------------------------------------------------
  PAGES.landing = () => {
    const header = $('#site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const menu = $('#mobile-menu');
    const toggle = $('.menu-toggle');
    const setMenu = (open) => {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.innerHTML = icon(open ? 'x' : 'menu');
      header.classList.toggle('menu-open', open);
    };
    actions['toggle-site-menu'] = () => setMenu(menu.hidden);
    menu.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && setMenu(false));

    const tabs = $('[data-tabs]');
    if (tabs) initTabs(tabs);

    initPressedGroup($('.billing-toggle .segmented'), (btn) => {
      const period = btn.dataset.billing;
      $$('.price strong').forEach((el) => (el.textContent = el.dataset[period]));
      $$('.price span').forEach((el) => (el.textContent = period === 'yearly' ? '/ user / month, billed yearly' : '/ user / month'));
    });

    const cta = $('#cta-form');
    cta.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(cta)) return;
      toast('Setting up your workspace…', { title: 'Welcome to NEXORA!' });
      cta.querySelector('button[type="submit"]').setAttribute('aria-busy', 'true');
      setTimeout(() => (location.href = 'dashboard.html'), 1300);
    });

    $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  };

  // Dashboard -------------------------------------------------------------
  PAGES.dashboard = () => {
    const d = store.data;
    const hour = new Date().getHours();
    $('[data-greeting]').textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${d.user.firstName}`;
    $('[data-today]').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const setText = (sel, text) => {
      const el = $(sel);
      if (el) el.textContent = text;
    };

    const render = () => {
      const open = d.tasks.filter((t) => t.status !== 'done');
      const overdue = open.filter((t) => daysUntil(t.due) < 0).length;
      const dueThisWeek = open.filter((t) => daysUntil(t.due) >= 0 && daysUntil(t.due) <= 7).length;
      setText('[data-summary]', `You have ${plural(dueThisWeek, 'task')} due this week${overdue ? ` and ${overdue} overdue` : ''}.`);
      setText('[data-stat="projects"]', d.projects.length);
      setText('[data-stat="active"]', open.length);
      setText('[data-stat="overdue"]', overdue ? `${overdue} overdue` : 'Nothing overdue');
      setText('[data-stat="completed"]', fmtNum(totalCompleted()));
      setText('[data-stat="members"]', d.members.length);
      setText('[data-stat="online"]', `${d.members.filter((m) => m.status === 'online').length} online now`);

      const projects = d.projects.filter((p) => p.status !== 'completed').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
      $('#recent-projects').innerHTML = projects.length
        ? `<table class="table">
            <caption class="sr-only">Active projects by deadline</caption>
            <thead><tr><th scope="col">Project</th><th scope="col" class="hide-sm">Status</th><th scope="col">Progress</th><th scope="col" class="num">Deadline</th></tr></thead>
            <tbody>${projects
              .map(
                (p) => `<tr>
                  <td><div class="cell-main">${projectGlyph(p)}<a class="cell-name truncate" href="projects.html?q=${encodeURIComponent(p.name)}">${esc(p.name)}</a></div></td>
                  <td class="hide-sm">${badge(PROJECT_STATUS[p.status], true)}</td>
                  <td><div class="cell-progress">${progressBar(p.progress, `${p.name} progress`)}<span class="num">${p.progress}%</span></div></td>
                  <td class="num mono-cell"><span class="due ${dueState(p.due, false)}">${fmtDate(p.due)}</span></td>
                </tr>`
              )
              .join('')}</tbody>
          </table>`
        : emptyState('folder', 'No active projects', 'Create a project to get started.');

      const upcoming = open.slice().sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
      $('#upcoming-deadlines').innerHTML = upcoming.length
        ? upcoming
            .map((t) => {
              const a = memberById(t.assignee);
              const state = dueState(t.due, false);
              return `<li class="deadline">
                <span class="date-chip ${state}" aria-hidden="true"><span class="d">${String(parseISO(t.due).getDate()).padStart(2, '0')}</span><span class="m">${fmtDate(t.due, { month: 'short' })}</span></span>
                <div class="min0 grow">
                  <button type="button" class="item-title truncate" data-action="task-edit" data-id="${t.id}" title="Edit “${esc(t.title)}”">${esc(t.title)}</button>
                  <p class="item-meta truncate">${esc(projectById(t.project)?.name || 'No project')} · <span class="due ${state}">${relDue(t.due)}</span></p>
                </div>
                ${avatar(a, 'avatar-sm')}
              </li>`;
            })
            .join('')
        : `<li>${emptyState('check-circle', 'All clear', 'No upcoming deadlines.')}</li>`;

      $('#activity-feed').innerHTML = d.activity
        .slice(0, 6)
        .map((a) => {
          const who = memberById(a.who);
          return `<li class="activity-item">
            ${avatar(who, 'avatar-sm')}
            <div class="min0">
              <p><strong>${a.who === 'me' ? 'You' : esc(who.name)}</strong> ${esc(a.action)} <strong>${esc(a.target)}</strong></p>
              <p class="activity-time">${timeAgo(a.time)}</p>
            </div>
          </li>`;
        })
        .join('');
    };

    let range = '7d';
    const drawChart = () => {
      const s = activitySeries(range);
      const { a, b } = chartColors();
      const period = range === '12m' ? '12 months' : range === '30d' ? '30 days' : '7 days';
      const change = { '7d': 9, '30d': 18, '12m': 31 }[range];
      const total = s.completed.reduce((x, y) => x + y, 0);
      $('[data-chart-summary]').innerHTML = `<strong>${fmtNum(total)}</strong><span class="trend up" title="Compared with the previous ${period}">+${change}%</span><span>completed in the last ${period}</span>`;
      lineChart($('#productivity-chart'), {
        labels: s.labels,
        height: 280,
        label: `Tasks completed and created over the last ${period}`,
        series: [
          { name: 'Completed', values: s.completed, color: a },
          { name: 'Created', values: s.created, color: b },
        ],
      });
    };
    initPressedGroup($('[data-chart-range]'), (btn) => {
      range = btn.dataset.range;
      drawChart();
    });

    render();
    drawChart();
    document.addEventListener('nexora:change', render);
  };

  // Projects --------------------------------------------------------------
  PAGES.projects = () => {
    const d = store.data;
    const state = { status: 'all', priority: 'all', sort: 'due', q: params.get('q') || '' };
    const grid = $('#project-grid');
    const search = $('#project-search');
    let highlightId = null;
    search.value = state.q;

    const card = (p) => {
      const tasks = tasksFor(p.id);
      const openTasks = tasks.filter((t) => t.status !== 'done').length;
      const done = p.status === 'completed';
      const dueCls = dueState(p.due, done);
      const statusItems = Object.entries(PROJECT_STATUS)
        .filter(([key]) => key !== p.status)
        .map(([key, cfg]) => `<button type="button" class="menu-item" data-action="project-status" data-id="${p.id}" data-status="${key}">${icon(key === 'completed' ? 'check-circle' : 'flag', 'icon-sm')}Mark as ${cfg.label.toLowerCase()}</button>`)
        .join('');
      const owner = ownerOf(p);
      return `<li class="proj-row${p.id === highlightId ? ' is-new' : ''}" data-id="${p.id}">
        <div class="p-main">
          ${projectGlyph(p)}
          <button type="button" class="p-name truncate" id="pn-${p.id}" data-action="project-edit" data-id="${p.id}" title="Edit “${esc(p.name)}”">${esc(p.name)}</button>
          <div class="p-sub"><span class="truncate">${plural(tasks.length, 'task')} · ${openTasks} open</span>${priorityBadge(p.priority)}</div>
        </div>
        <div class="p-status"><span class="cell-label">Status</span>${badge(PROJECT_STATUS[p.status], true)}</div>
        <div class="p-progress"><span class="cell-label">Progress</span><div class="progress-line">${progressBar(p.progress, `${p.name} progress`)}<span class="num">${p.progress}%</span></div></div>
        <div class="p-owner"><span class="cell-label">Owner</span><div class="owner-line">${avatar(owner, 'avatar-sm')}<span class="name truncate">${esc(owner.name)}</span></div></div>
        <div class="p-due"><span class="cell-label">Deadline</span><span class="due ${dueCls}"><span class="sr-only">Deadline: </span>${fmtDate(p.due, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span class="item-meta">${done ? 'Completed' : daysUntil(p.due) >= 7 ? `In ${daysUntil(p.due)} days` : relDue(p.due)}</span></div>
        <div class="p-team"><span class="cell-label">Team</span>${avatarStack(p.members)}</div>
        <div class="p-actions dropdown" data-dropdown>
          <button type="button" class="btn-icon sm" data-dropdown-trigger aria-expanded="false" aria-controls="pm-${p.id}" aria-label="Actions for ${esc(p.name)}">${icon('more')}</button>
          <div class="dropdown-menu" id="pm-${p.id}" data-dropdown-menu hidden>
            <button type="button" class="menu-item" data-action="project-edit" data-id="${p.id}">${icon('edit', 'icon-sm')}Edit project</button>
            <div class="menu-sep"></div>
            ${statusItems}
            <a class="menu-item" href="tasks.html?q=${encodeURIComponent(p.name)}">${icon('check-square', 'icon-sm')}View tasks</a>
            <div class="menu-sep"></div>
            <button type="button" class="menu-item danger" data-action="project-delete" data-id="${p.id}">${icon('trash', 'icon-sm')}Delete project</button>
          </div>
        </div>
      </li>`;
    };

    const render = () => {
      const q = state.q.trim().toLowerCase();
      const counts = { all: 0 };
      d.projects.forEach((p) => {
        counts.all++;
        counts[p.status] = (counts[p.status] || 0) + 1;
      });
      $$('#project-filters [data-count]').forEach((el) => (el.textContent = counts[el.dataset.count] || 0));

      const list = d.projects
        .filter((p) => state.status === 'all' || p.status === state.status)
        .filter((p) => state.priority === 'all' || p.priority === state.priority)
        .filter((p) => !q || `${p.name} ${p.description}`.toLowerCase().includes(q))
        .sort((a, b) => {
          if (state.sort === 'progress') return b.progress - a.progress;
          if (state.sort === 'priority') return PRIORITY[a.priority].rank - PRIORITY[b.priority].rank;
          if (state.sort === 'name') return a.name.localeCompare(b.name);
          return a.due.localeCompare(b.due);
        });

      grid.innerHTML = list.length
        ? list.map(card).join('')
        : `<li class="list-empty">${emptyState('folder', 'No projects found', 'Try a different search or filter, or create a new project.', `${clearFiltersBtn}<button type="button" class="btn btn-primary btn-sm" data-open-modal="project-modal">Add project</button>`)}</li>`;
      const overdue = d.projects.filter((p) => p.status !== 'completed' && daysUntil(p.due) < 0).length;
      $('#project-count').textContent = `${plural(d.projects.length, 'project')} · ${counts.active || 0} active${overdue ? ` · ${overdue} past deadline` : ''}`;
      $('#project-result-count').textContent = `Showing ${list.length} of ${d.projects.length}`;
      highlightId = null;
    };

    initPressedGroup($('#project-filters'), (btn) => {
      state.status = btn.dataset.filter;
      render();
    });
    search.addEventListener('input', debounce(() => {
      state.q = search.value;
      render();
    }));
    $('#project-priority').addEventListener('change', (e) => {
      state.priority = e.target.value;
      render();
    });
    $('#project-sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      render();
    });

    actions['clear-filters'] = () => {
      Object.assign(state, { status: 'all', priority: 'all', q: '' });
      search.value = '';
      $('#project-priority').value = 'all';
      $$('#project-filters .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
      render();
    };

    actions['project-status'] = (el) => {
      const p = projectById(el.dataset.id);
      if (!p) return;
      p.status = el.dataset.status;
      if (p.status === 'completed') p.progress = 100;
      logActivity(`marked as ${PROJECT_STATUS[p.status].label.toLowerCase()}`, p.name);
      emitChange('projects');
      render();
      toast(`${p.name} is now ${PROJECT_STATUS[p.status].label.toLowerCase()}.`, { title: 'Project updated' });
    };

    actions['project-delete'] = async (el) => {
      const p = projectById(el.dataset.id);
      if (!p) return;
      const taskCount = tasksFor(p.id).length;
      const ok = await confirmDialog({
        title: `Delete “${p.name}”?`,
        message: `This permanently removes the project${taskCount ? ` and its ${plural(taskCount, 'task')}` : ''}. This cannot be undone.`,
        confirmLabel: 'Delete project',
      });
      if (!ok) return;
      d.projects = d.projects.filter((x) => x.id !== p.id);
      d.tasks = d.tasks.filter((t) => t.project !== p.id);
      logActivity('deleted the project', p.name);
      emitChange('projects');
      render();
      toast(`${p.name} was deleted.`, { title: 'Project deleted', type: 'info' });
    };

    // Add / edit project dialog
    const form = $('#project-form');
    const dlg = $('#project-modal');
    const membersBox = $('#project-members');
    const field = (name) => form.elements.namedItem(name);
    membersBox.dataset.error = 'Select at least one team member.';
    dlg.addEventListener('nexora:open', () => {
      const p = projectById(form.dataset.editId);
      membersBox.innerHTML = d.members
        .map((m) => `<label class="check-item"><input type="checkbox" class="checkbox" name="members" value="${m.id}"${p?.members.includes(m.id) ? ' checked' : ''}>${avatar(m, 'avatar-xs')}<span class="truncate">${esc(m.name)}</span></label>`)
        .join('');
      field('owner').innerHTML = `<option value="me">${esc(me().name)} (you)</option>${d.members
        .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
        .join('')}`;
      if (!p) {
        field('owner').value = 'me';
        field('due').value = isoIn(30);
        return;
      }
      field('owner').value = ownerOf(p).id;
      if (field('owner').selectedIndex < 0) field('owner').value = 'me';
      field('name').value = p.name;
      field('description').value = p.description || '';
      field('status').value = p.status;
      field('priority').value = p.priority;
      field('progress').value = p.progress;
      field('due').value = p.due;
      field('due').dataset.original = p.due;
    });

    actions['project-edit'] = (el) => {
      if (!projectById(el.dataset.id)) return toast('That project no longer exists.', { type: 'warning' });
      openModal('project-modal', el.dataset.id);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm(form)) submitWithBusy(form, form.dataset.editId ? updateProject : createProject);
    });

    const selectedMembers = () => {
      const ids = $$('input[name="members"]:checked', form).map((i) => i.value);
      const owner = formVal(form, 'owner');
      return owner !== 'me' && !ids.includes(owner) ? [owner, ...ids] : ids;
    };

    const updateProject = () => {
      const p = projectById(form.dataset.editId);
      if (!p) return dlg.close();
      Object.assign(p, {
        name: formVal(form, 'name'),
        description: formVal(form, 'description'),
        status: formVal(form, 'status'),
        priority: formVal(form, 'priority'),
        progress: Number(formVal(form, 'progress')),
        owner: formVal(form, 'owner'),
        due: formVal(form, 'due'),
        members: selectedMembers(),
      });
      if (p.status === 'completed') p.progress = 100;
      logActivity('updated the project', p.name);
      dlg.close();
      emitChange('projects');
      render();
      toast(`Your changes to ${p.name} were saved.`, { title: 'Project updated' });
    };
    const createProject = () => {
      const project = {
        id: uid('p'),
        name: formVal(form, 'name'),
        description: formVal(form, 'description'),
        status: formVal(form, 'status'),
        priority: formVal(form, 'priority'),
        progress: 0,
        owner: formVal(form, 'owner'),
        due: formVal(form, 'due'),
        members: selectedMembers(),
        hue: Math.floor(Math.random() * 360),
      };
      highlightId = project.id;
      d.projects.unshift(project);
      logActivity('created the project', project.name);
      pushNotification('success', 'Project created', `${project.name} is ready. Invite your team and add tasks.`);
      dlg.close();
      emitChange('projects');
      state.status = 'all';
      $$('#project-filters .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
      render();
      toast(`${project.name} was added to your workspace.`, { title: 'Project created' });
    };

    render();
  };

  // Tasks -----------------------------------------------------------------
  PAGES.tasks = () => {
    const d = store.data;
    const state = { status: 'all', priority: 'all', assignee: params.get('assignee') || 'all', sort: 'due', q: params.get('q') || '' };
    const list = $('#task-list');
    const search = $('#task-search');
    const assigneeSel = $('#task-filter-assignee');
    let highlightId = null;
    search.value = state.q;

    const fillAssignees = () => {
      assigneeSel.innerHTML = `<option value="all">All assignees</option><option value="me">${esc(me().name)} (you)</option>${d.members
        .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
        .join('')}`;
      assigneeSel.value = [...assigneeSel.options].some((o) => o.value === state.assignee) ? state.assignee : 'all';
      state.assignee = assigneeSel.value;
    };

    const row = (t) => {
      const p = projectById(t.project);
      const a = memberById(t.assignee);
      const done = t.status === 'done';
      return `<li class="task-row${done ? ' is-done' : ''}${t.id === highlightId ? ' is-new' : ''}" data-id="${t.id}">
        <div class="t-check"><input type="checkbox" class="checkbox task-check" id="chk-${t.id}"${done ? ' checked' : ''} aria-label="Mark “${esc(t.title)}” as done"></div>
        <div class="t-main min0">
          <button type="button" class="task-title truncate" title="Edit “${esc(t.title)}”" data-action="task-edit" data-id="${t.id}">${esc(t.title)}</button>
          <p class="task-project"><i style="--hue:${p ? p.hue : 220}" aria-hidden="true"></i><span class="truncate">${esc(p ? p.name : 'No project')}</span></p>
        </div>
        <div class="t-meta">
          <div class="t-status">
            <span class="cell-label" aria-hidden="true">Status</span>
            <label class="sr-only" for="st-${t.id}">Status of “${esc(t.title)}”</label>
            <select class="select status-select" id="st-${t.id}">${Object.entries(TASK_STATUS)
              .map(([key, cfg]) => `<option value="${key}"${key === t.status ? ' selected' : ''}>${cfg.label}</option>`)
              .join('')}</select>
          </div>
          <div class="t-priority"><span class="cell-label" aria-hidden="true">Priority</span>${priorityBadge(t.priority)}</div>
          <div class="t-assignee"><span class="cell-label" aria-hidden="true">Assignee</span><span class="assignee">${avatar(a, 'avatar-xs')}<span class="name truncate"><span class="sr-only">Assigned to </span>${esc(t.assignee === 'me' ? `${a.name} (you)` : a.name)}</span></span></div>
          <div class="t-due"><span class="cell-label" aria-hidden="true">Due</span><span class="due ${dueState(t.due, done)}" title="${fmtDate(t.due, { weekday: 'short', month: 'short', day: 'numeric' })}"><span class="sr-only">Due </span>${done ? fmtDate(t.due) : relDue(t.due)}</span></div>
        </div>
        <div class="t-actions dropdown" data-dropdown>
          <button type="button" class="btn-icon sm" id="ta-${t.id}" data-dropdown-trigger aria-expanded="false" aria-controls="tm-${t.id}" aria-label="Actions for “${esc(t.title)}”">${icon('more')}</button>
          <div class="dropdown-menu" id="tm-${t.id}" data-dropdown-menu hidden>
            <button type="button" class="menu-item" data-action="task-edit" data-id="${t.id}">${icon('edit', 'icon-sm')}Edit task</button>
            ${done ? '' : `<button type="button" class="menu-item" data-action="task-complete" data-id="${t.id}">${icon('check-circle', 'icon-sm')}Mark as done</button>`}
            <div class="menu-sep"></div>
            <button type="button" class="menu-item danger" data-action="task-delete" data-id="${t.id}">${icon('trash', 'icon-sm')}Delete task</button>
          </div>
        </div>
      </li>`;
    };

    const render = () => {
      const focusedId = document.activeElement && list.contains(document.activeElement) ? document.activeElement.id : null;
      const q = state.q.trim().toLowerCase();
      const counts = { all: d.tasks.length };
      Object.keys(TASK_STATUS).forEach((k) => (counts[k] = d.tasks.filter((t) => t.status === k).length));
      $$('#task-filters [data-count]').forEach((el) => (el.textContent = counts[el.dataset.count]));
      $$('[data-task-count]').forEach((el) => (el.textContent = counts[el.dataset.taskCount]));

      const items = d.tasks
        .filter((t) => state.status === 'all' || t.status === state.status)
        .filter((t) => state.priority === 'all' || t.priority === state.priority)
        .filter((t) => state.assignee === 'all' || t.assignee === state.assignee)
        .filter((t) => !q || `${t.title} ${projectById(t.project)?.name || ''}`.toLowerCase().includes(q))
        .sort((a, b) => {
          if (state.sort === 'priority') return PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || a.due.localeCompare(b.due);
          if (state.sort === 'title') return a.title.localeCompare(b.title);
          return a.due.localeCompare(b.due);
        });

      list.innerHTML = items.length
        ? items.map(row).join('')
        : d.tasks.length
          ? `<li class="list-empty">${emptyState('check-square', 'No tasks match your filters', 'Try adjusting the search or filters, or create a new task.', `${clearFiltersBtn}<button type="button" class="btn btn-primary btn-sm" data-open-modal="task-modal">New task</button>`)}</li>`
          : `<li class="list-empty">${emptyState('check-circle', 'You’re all caught up', 'There are no tasks yet. Create one to start tracking work.', '<button type="button" class="btn btn-primary btn-sm" data-open-modal="task-modal">New task</button>')}</li>`;
      $('#task-result-count').textContent = `Showing ${items.length} of ${plural(d.tasks.length, 'task')}`;
      highlightId = null;
      if (focusedId) document.getElementById(focusedId)?.focus();
    };

    const setStatus = (task, status) => {
      const was = task.status;
      task.status = status;
      if (status === 'done' && was !== 'done') logActivity('completed', task.title);
      else if (status !== was) logActivity(`moved to ${TASK_STATUS[status].label.toLowerCase()}`, task.title);
      emitChange('tasks');
      render();
    };

    list.addEventListener('change', (e) => {
      const li = e.target.closest('.task-row');
      const task = li && d.tasks.find((t) => t.id === li.dataset.id);
      if (!task) return;
      if (e.target.classList.contains('task-check')) {
        setStatus(task, e.target.checked ? 'done' : 'todo');
        toast(e.target.checked ? `“${task.title}” completed. Nice work!` : `“${task.title}” reopened.`, { type: e.target.checked ? 'success' : 'info' });
      } else if (e.target.classList.contains('status-select')) {
        setStatus(task, e.target.value);
        toast(`“${task.title}” moved to ${TASK_STATUS[task.status].label}.`, { type: 'info' });
      }
    });

    actions['task-complete'] = (el) => {
      const task = d.tasks.find((t) => t.id === el.dataset.id);
      if (!task) return;
      setStatus(task, 'done');
      toast(`“${task.title}” completed. Nice work!`);
    };

    actions['task-delete'] = (el) => {
      const index = d.tasks.findIndex((t) => t.id === el.dataset.id);
      if (index < 0) return;
      const [removed] = d.tasks.splice(index, 1);
      emitChange('tasks');
      render();
      toast(`“${removed.title}” was deleted.`, {
        title: 'Task deleted',
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            d.tasks.splice(Math.min(index, d.tasks.length), 0, removed);
            emitChange('tasks');
            render();
          },
        },
      });
    };

    actions['clear-filters'] = () => {
      Object.assign(state, { status: 'all', priority: 'all', assignee: 'all', q: '' });
      search.value = '';
      $('#task-filter-priority').value = 'all';
      assigneeSel.value = 'all';
      $$('#task-filters .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
      render();
    };

    actions['clear-completed'] = async () => {
      const done = d.tasks.filter((t) => t.status === 'done');
      if (!done.length) return toast('There are no completed tasks to clear.', { type: 'info' });
      const ok = await confirmDialog({
        title: 'Clear completed tasks?',
        message: `${plural(done.length, 'completed task')} will be removed from the list.`,
        confirmLabel: 'Clear tasks',
      });
      if (!ok) return;
      done.forEach((t) => {
        const owner = t.assignee === 'me' ? d.user : d.members.find((x) => x.id === t.assignee);
        if (owner) owner.tasksCompleted = (owner.tasksCompleted || 0) + 1;
      });
      d.tasks = d.tasks.filter((t) => t.status !== 'done');
      emitChange('tasks');
      render();
      toast(`${plural(done.length, 'completed task')} cleared.`);
    };

    initPressedGroup($('#task-filters'), (btn) => {
      state.status = btn.dataset.filter;
      render();
    });
    search.addEventListener('input', debounce(() => {
      state.q = search.value;
      render();
    }));
    $('#task-filter-priority').addEventListener('change', (e) => {
      state.priority = e.target.value;
      render();
    });
    assigneeSel.addEventListener('change', (e) => {
      state.assignee = e.target.value;
      render();
    });
    $('#task-sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      render();
    });
    document.addEventListener('nexora:task-created', (e) => {
      highlightId = e.detail.id;
      render();
    });

    fillAssignees();
    render();

    if (location.hash === '#new') {
      history.replaceState(null, '', location.pathname + location.search);
      openModal('task-modal');
    }
  };

  // Team ------------------------------------------------------------------
  PAGES.team = () => {
    const d = store.data;
    const state = { q: params.get('q') || '', department: 'all', status: 'all', view: d.prefs.teamView === 'cards' ? 'cards' : 'table' };
    const grid = $('#member-grid');
    const search = $('#member-search');
    const deptSel = $('#member-department');
    const viewGroup = $('#member-view');
    const narrow = window.matchMedia('(max-width: 720px)');
    search.value = state.q;

    const memberMenu = (m, cls = '') => `<div class="dropdown ${cls}" data-dropdown>
          <button type="button" class="btn-icon sm" data-dropdown-trigger aria-expanded="false" aria-controls="mm-${m.id}" aria-label="More actions for ${esc(m.name)}">${icon('more')}</button>
          <div class="dropdown-menu" id="mm-${m.id}" data-dropdown-menu hidden>
            <button type="button" class="menu-item" data-action="member-edit" data-id="${m.id}">${icon('edit', 'icon-sm')}Edit member</button>
            <a class="menu-item" href="tasks.html?assignee=${m.id}">${icon('check-square', 'icon-sm')}View tasks</a>
            <button type="button" class="menu-item" data-action="member-copy" data-id="${m.id}">${icon('copy', 'icon-sm')}Copy email</button>
            ${m.status === 'invited' ? `<button type="button" class="menu-item" data-action="member-resend" data-id="${m.id}">${icon('mail', 'icon-sm')}Resend invite</button>` : ''}
            <div class="menu-sep"></div>
            <button type="button" class="menu-item danger" data-action="member-remove" data-id="${m.id}">${icon('trash', 'icon-sm')}Remove from team</button>
          </div>
        </div>`;

    const tableRow = (m) => {
      const st = MEMBER_STATUS[m.status] || MEMBER_STATUS.offline;
      return `<tr>
        <td><div class="cell-main">${avatar(m)}<div class="min0"><p class="item-title truncate">${esc(m.name)}</p><p class="item-meta truncate">${esc(m.email)}</p></div></div></td>
        <td class="hide-sm">${esc(m.role)}</td>
        <td class="hide-md muted">${esc(m.department)}</td>
        <td>${badge(st, true)}</td>
        <td class="num hide-sm">${activeProjectsFor(m.id)}</td>
        <td class="num">${fmtNum(completedBy(m))}</td>
        <td class="num">${memberMenu(m)}</td>
      </tr>`;
    };

    const table = (items) => `<div class="table-wrap"><table class="table member-table">
      <caption class="sr-only">Team members</caption>
      <thead><tr><th scope="col">Member</th><th scope="col" class="hide-sm">Role</th><th scope="col" class="hide-md">Department</th><th scope="col">Status</th><th scope="col" class="num hide-sm">Projects</th><th scope="col" class="num">Completed</th><th scope="col" class="num"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>${items.map(tableRow).join('')}</tbody>
    </table></div>`;

    const card = (m) => {
      const st = MEMBER_STATUS[m.status] || MEMBER_STATUS.offline;
      return `<article class="member-card" aria-labelledby="mn-${m.id}">
        ${memberMenu(m, 'card-menu')}
        <span class="avatar avatar-lg" style="--hue:${Number(m.hue) || 220}" aria-hidden="true">${esc(initials(m.name))}<span class="status-dot" data-tone="${st.tone}"></span></span>
        <h2 class="member-name" id="mn-${m.id}">${esc(m.name)}</h2>
        <p class="member-role">${esc(m.role)} · ${esc(m.department)}</p>
        <p class="member-email truncate">${esc(m.email)}</p>
        ${badge(st, true)}
        <div class="member-stats">
          <div><strong>${activeProjectsFor(m.id)}</strong><span>Active projects</span></div>
          <div><strong>${fmtNum(completedBy(m))}</strong><span>Tasks completed</span></div>
        </div>
        <div class="member-actions">
          <a class="btn btn-secondary btn-sm" href="mailto:${esc(m.email)}">${icon('mail', 'icon-sm')}Message</a>
          <a class="btn btn-secondary btn-sm" href="tasks.html?assignee=${m.id}">${icon('check-square', 'icon-sm')}Tasks</a>
        </div>
      </article>`;
    };

    const render = () => {
      const departments = [...new Set(d.members.map((m) => m.department))].sort();
      if (!departments.includes(state.department)) state.department = 'all';
      deptSel.innerHTML = `<option value="all">All departments</option>${departments
        .map((dep) => `<option${dep === state.department ? ' selected' : ''}>${esc(dep)}</option>`)
        .join('')}`;

      const total = d.members.length;
      $('[data-team-stat="total"]').textContent = total;
      $('[data-team-stat="online"]').textContent = d.members.filter((m) => m.status === 'online').length;
      $('[data-team-stat="avg"]').textContent = total ? Math.round(d.members.reduce((s, m) => s + completedBy(m), 0) / total) : 0;
      $('[data-team-stat="departments"]').textContent = departments.length;

      const q = state.q.trim().toLowerCase();
      const items = d.members
        .filter((m) => state.department === 'all' || m.department === state.department)
        .filter((m) => state.status === 'all' || m.status === state.status)
        .filter((m) => !q || `${m.name} ${m.role} ${m.email}`.toLowerCase().includes(q));

      const asTable = state.view === 'table' && !narrow.matches;
      grid.classList.toggle('is-table', asTable || !items.length);
      grid.innerHTML = !items.length
        ? `<div class="grid-empty">${emptyState('users', 'No team members found', 'Try another search or filter, or invite someone new.', `${clearFiltersBtn}<button type="button" class="btn btn-primary btn-sm" data-open-modal="member-modal">Invite member</button>`)}</div>`
        : asTable
          ? table(items)
          : items.map(card).join('');
      $('#member-count').textContent = `Showing ${items.length} of ${plural(total, 'member')}`;
    };

    $$('button', viewGroup).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
    initPressedGroup(viewGroup, (btn) => {
      state.view = btn.dataset.view;
      d.prefs.teamView = state.view;
      store.save();
      render();
    });
    narrow.addEventListener('change', () => render());

    actions['clear-filters'] = () => {
      Object.assign(state, { q: '', department: 'all', status: 'all' });
      search.value = '';
      $('#member-status').value = 'all';
      render();
    };

    search.addEventListener('input', debounce(() => {
      state.q = search.value;
      render();
    }));
    deptSel.addEventListener('change', (e) => {
      state.department = e.target.value;
      render();
    });
    $('#member-status').addEventListener('change', (e) => {
      state.status = e.target.value;
      render();
    });

    actions['member-copy'] = async (el) => {
      const m = d.members.find((x) => x.id === el.dataset.id);
      if (!m) return;
      try {
        await navigator.clipboard.writeText(m.email);
        toast(`${m.email} copied to clipboard.`);
      } catch (e) {
        toast(`Copy failed. ${m.name}'s email is ${m.email}.`, { type: 'warning' });
      }
    };
    actions['member-resend'] = (el) => {
      const m = d.members.find((x) => x.id === el.dataset.id);
      if (m) toast(`A new invitation was sent to ${m.email}.`, { title: 'Invite resent' });
    };
    actions['member-remove'] = async (el) => {
      const m = d.members.find((x) => x.id === el.dataset.id);
      if (!m) return;
      const openTasks = d.tasks.filter((t) => t.assignee === m.id && t.status !== 'done');
      const ok = await confirmDialog({
        title: `Remove ${m.name}?`,
        message: `${m.name} will lose access to the workspace.${openTasks.length ? ` Their ${plural(openTasks.length, 'open task')} will be reassigned to you.` : ''}`,
        confirmLabel: 'Remove member',
      });
      if (!ok) return;
      d.members = d.members.filter((x) => x.id !== m.id);
      d.projects.forEach((p) => {
        p.members = p.members.filter((id) => id !== m.id);
        if (p.owner === m.id) p.owner = p.members[0] || 'me';
      });
      d.tasks.forEach((t) => {
        if (t.assignee === m.id) t.assignee = 'me';
      });
      logActivity('removed', m.name);
      emitChange('team');
      render();
      toast(`${m.name} was removed from the team.`, { title: 'Member removed', type: 'info' });
    };

    const form = $('#member-form');
    const dlg = $('#member-modal');
    const field = (name) => form.elements.namedItem(name);

    dlg.addEventListener('nexora:open', () => {
      const m = d.members.find((x) => x.id === form.dataset.editId);
      if (!m) return;
      const dept = field('department');
      if (![...dept.options].some((o) => o.value === m.department)) dept.add(new Option(m.department, m.department));
      field('name').value = m.name;
      field('email').value = m.email;
      field('role').value = m.role;
      dept.value = m.department;
    });

    actions['member-edit'] = (el) => {
      if (!d.members.some((x) => x.id === el.dataset.id)) return toast('That member is no longer on the team.', { type: 'warning' });
      openModal('member-modal', el.dataset.id);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.dataset.editId && d.members.length + 1 >= SEAT_LIMIT) {
        toast(`Your plan includes ${SEAT_LIMIT} seats. Remove a member or upgrade to add more.`, { title: 'Seat limit reached', type: 'warning' });
        return;
      }
      if (validateForm(form)) submitWithBusy(form, form.dataset.editId ? updateMember : inviteMember);
    });

    const updateMember = () => {
      const m = d.members.find((x) => x.id === form.dataset.editId);
      if (!m) return dlg.close();
      Object.assign(m, {
        name: formVal(form, 'name'),
        email: formVal(form, 'email').toLowerCase(),
        role: formVal(form, 'role'),
        department: formVal(form, 'department'),
      });
      logActivity('updated the profile of', m.name);
      dlg.close();
      emitChange('team');
      render();
      toast(`${m.name}'s details were saved.`, { title: 'Member updated' });
    };
    const inviteMember = () => {
      const member = {
        id: uid('m'),
        name: formVal(form, 'name'),
        email: formVal(form, 'email').toLowerCase(),
        role: formVal(form, 'role'),
        department: formVal(form, 'department'),
        status: 'invited',
        tasksCompleted: 0,
        hue: Math.floor(Math.random() * 360),
      };
      d.members.push(member);
      logActivity('invited', member.name);
      pushNotification('team', 'Invitation sent', `${member.name} was invited to join as ${member.role}.`);
      dlg.close();
      emitChange('team');
      render();
      toast(`An invitation was sent to ${member.email}.`, { title: `${member.name} invited` });
    };

    render();
  };

  // Analytics -------------------------------------------------------------
  PAGES.analytics = () => {
    const d = store.data;
    const RANGE_LABEL = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days (weekly)' };
    const TREND = { '7d': 12.4, '30d': 18.2, '90d': 24.7 };
    const CYCLE = { '7d': [2.1, 9], '30d': [2.6, 14], '90d': [2.9, 11] };
    let range = '30d';

    const setKpi = (key, value) => {
      const el = $(`[data-kpi="${key}"]`);
      if (el) el.textContent = value;
    };

    const drawRange = () => {
      const s = activitySeries(range);
      const { a, b } = chartColors();
      const completed = s.completed.reduce((x, y) => x + y, 0);
      const created = s.created.reduce((x, y) => x + y, 0);
      setKpi('completed', fmtNum(completed));
      setKpi('productivity', `${Math.round((completed / created) * 100)}%`);
      setKpi('cycle', `${CYCLE[range][0]}d`);
      $('[data-kpi-trend="completed"]').textContent = `+${TREND[range]}%`;
      $('[data-kpi-trend="cycle"]').textContent = `${CYCLE[range][1]}%`;
      $('[data-range-label]').textContent = RANGE_LABEL[range];
      lineChart($('#trend-chart'), {
        labels: s.labels,
        height: 280,
        label: `Tasks completed and created, ${RANGE_LABEL[range].toLowerCase()}`,
        series: [
          { name: 'Completed', values: s.completed, color: a },
          { name: 'Created', values: s.created, color: b },
        ],
      });
    };

    const drawStatic = () => {
      const { a, b } = chartColors();
      const avg = d.projects.length ? Math.round(d.projects.reduce((s, p) => s + p.progress, 0) / d.projects.length) : 0;
      setKpi('completion', `${avg}%`);

      const statusColor = {
        active: `rgb(${cssVar('--info-rgb')})`,
        planning: `rgb(${cssVar('--violet-rgb')})`,
        review: `rgb(${cssVar('--warning-rgb')})`,
        'on-hold': `rgb(${cssVar('--neutral-rgb')})`,
        completed: `rgb(${cssVar('--success-rgb')})`,
      };
      const completedCount = d.projects.filter((p) => p.status === 'completed').length;
      compositionChart($('#completion-donut'), {
        centerValue: `${d.projects.length ? Math.round((completedCount / d.projects.length) * 100) : 0}%`,
        centerLabel: 'of projects completed',
        segments: Object.entries(PROJECT_STATUS).map(([key, cfg]) => ({
          label: cfg.label,
          value: d.projects.filter((p) => p.status === key).length,
          color: statusColor[key],
        })),
      });

      const week = activitySeries('7d');
      barChart($('#weekly-chart'), {
        labels: week.labels,
        height: 240,
        label: 'Tasks created and completed per day this week',
        series: [
          { name: 'Completed', values: week.completed, color: a },
          { name: 'Created', values: week.created, color: b },
        ],
      });

      const year = activitySeries('12m');
      barChart($('#monthly-chart'), {
        labels: year.labels,
        height: 240,
        label: 'Tasks completed per month over the last 12 months',
        series: [{ name: 'Completed', values: year.completed, color: a }],
      });

      const people = d.members.map((m) => ({ m, value: completedBy(m) })).sort((x, y) => y.value - x.value).slice(0, 6);
      const top = people[0]?.value || 1;
      $('#team-bars').innerHTML = people.length
        ? people
            .map(
              ({ m, value }) => `<li class="hbar">
                <span class="hbar-label">${avatar(m, 'avatar-sm')}<span class="truncate">${esc(m.name)}</span></span>
                <span class="hbar-track" role="img" aria-label="${esc(m.name)}: ${value} tasks completed"><span class="hbar-fill" style="--value:${Math.round((value / top) * 100)}%"></span></span>
                <span class="hbar-value">${value}</span>
              </li>`
            )
            .join('')
        : `<li>${emptyState('users', 'No team data yet', 'Invite teammates to see productivity.')}</li>`;

      const rand = rng(2026);
      const weeks = 20;
      let cells = '';
      for (let i = 0; i < weeks * 7; i++) {
        const weekday = i % 7;
        const base = weekday === 0 || weekday === 6 ? 0.15 : 0.55;
        const level = Math.min(4, Math.floor((base + rand() * 0.6 + (i / (weeks * 7)) * 0.25) * 4));
        cells += `<span class="heat-cell" style="--l:${level}"></span>`;
      }
      $('#heatmap').innerHTML = cells;

      const rows = d.projects
        .slice()
        .sort((x, y) => y.progress - x.progress)
        .map((p) => {
          const tasks = tasksFor(p.id);
          const done = tasks.filter((t) => t.status === 'done').length;
          return `<tr>
            <td><div class="cell-main">${projectGlyph(p)}<a class="cell-name truncate" href="projects.html?q=${encodeURIComponent(p.name)}">${esc(p.name)}</a></div></td>
            <td class="hide-sm">${badge(PROJECT_STATUS[p.status], true)}</td>
            <td class="num hide-sm">${done} / ${tasks.length}</td>
            <td><div class="cell-progress">${progressBar(p.progress, `${p.name} progress`)}<span class="num">${p.progress}%</span></div></td>
            <td class="hide-md num mono-cell"><span class="due ${dueState(p.due, p.status === 'completed')}">${fmtDate(p.due)}</span></td>
          </tr>`;
        })
        .join('');
      $('#project-progress').innerHTML = rows
        ? `<table class="table">
            <caption class="sr-only">Progress by project</caption>
            <thead><tr><th scope="col">Project</th><th scope="col" class="hide-sm">Status</th><th scope="col" class="num hide-sm">Tasks done</th><th scope="col">Progress</th><th scope="col" class="num hide-md">Deadline</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
        : emptyState('folder', 'No projects yet', 'Create a project to track its progress here.');
    };

    initPressedGroup($('#analytics-range'), (btn) => {
      range = btn.dataset.range;
      drawRange();
    });

    actions['export-report'] = () => {
      const s = activitySeries(range);
      const rows = [['Period', 'Completed', 'Created'], ...s.labels.map((l, i) => [l, s.completed[i], s.created[i]])];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexora-analytics-${range}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(`Report for the ${RANGE_LABEL[range].toLowerCase()} downloaded as CSV.`, { title: 'Export ready' });
    };

    drawRange();
    drawStatic();
  };

  // Settings --------------------------------------------------------------
  PAGES.settings = () => {
    const d = store.data;

    const selectTab = initTabs($('[data-tabs]'), {
      onChange: (tab) => history.replaceState(null, '', `#${tab.dataset.hash}`),
    });
    const fromHash = () => {
      const tab = $(`[role="tab"][data-hash="${location.hash.slice(1)}"]`);
      if (tab) selectTab(tab);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);

    // Profile
    const pf = $('#profile-form');
    const bio = $('#profile-bio');
    const bioCount = $('#bio-count');
    const updateBio = () => (bioCount.textContent = `${bio.value.length} / ${bio.maxLength}`);
    const fill = () => {
      const u = d.user;
      pf.elements.namedItem('firstName').value = u.firstName;
      pf.elements.namedItem('lastName').value = u.lastName;
      pf.elements.namedItem('email').value = u.email;
      pf.elements.namedItem('title').value = u.title;
      pf.elements.namedItem('timezone').value = u.timezone;
      bio.value = u.bio || '';
      updateBio();
      syncUser();
    };
    fill();
    bio.addEventListener('input', updateBio);
    pf.addEventListener('input', (e) => {
      if (e.target.name === 'firstName' || e.target.name === 'lastName') {
        const preview = `${formVal(pf, 'firstName')} ${formVal(pf, 'lastName')}`;
        $('.profile-top [data-user-avatar]').textContent = initials(preview) || '?';
      }
    });
    pf.addEventListener('reset', (e) => {
      e.preventDefault();
      fill();
      clearErrors(pf);
      toast('Your unsaved changes were discarded.', { type: 'info' });
    });
    pf.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(pf)) {
        toast('Please fix the highlighted fields.', { type: 'error' });
        return;
      }
      submitWithBusy(pf, () => {
        Object.assign(d.user, {
          firstName: formVal(pf, 'firstName'),
          lastName: formVal(pf, 'lastName'),
          email: formVal(pf, 'email'),
          title: formVal(pf, 'title'),
          timezone: formVal(pf, 'timezone'),
          bio: bio.value.trim(),
        });
        store.save();
        syncUser();
        toast('Your profile has been updated.', { title: 'Profile saved' });
      });
    });

    // Notification + security preferences
    $$('[data-pref]').forEach((input) => {
      const key = input.dataset.pref;
      if (input.type === 'checkbox') input.checked = !!d.prefs[key];
      else input.value = d.prefs[key];
      input.addEventListener('change', () => {
        d.prefs[key] = input.type === 'checkbox' ? input.checked : input.value;
        store.save();
        if (key === 'twoFactor') {
          toast(input.checked ? 'Two-factor authentication is now required when you sign in.' : 'Two-factor authentication has been turned off.', {
            title: input.checked ? '2FA enabled' : '2FA disabled',
            type: input.checked ? 'success' : 'warning',
          });
          if (input.checked) pushNotification('security', 'Two-factor enabled', 'Your account is now protected with 2FA.');
        } else {
          toast('Notification preferences saved.');
        }
      });
    });

    // Appearance
    const ap = readAppearance();
    const accents = $$('input[name="accent"]').map((r) => r.value);
    const accent = accents.includes(ap.accent) ? ap.accent : 'forest';
    $$('input[name="accent"]').forEach((r) => (r.checked = r.value === accent));
    $$('input[name="density"]').forEach((r) => (r.checked = r.value === (ap.density || 'comfortable')));
    $('#a-contrast').checked = ap.contrast === 'more';
    $('#a-motion').checked = ap.motion === 'reduced';

    const updateAppearance = (key, value, message) => {
      const next = readAppearance();
      if (value) next[key] = value;
      else delete next[key];
      applyAppearance(next);
      toast(message);
    };
    $$('input[name="accent"]').forEach((r) =>
      r.addEventListener('change', () => updateAppearance('accent', r.value === 'forest' ? '' : r.value, `Accent color set to ${r.value}.`))
    );
    $$('input[name="density"]').forEach((r) =>
      r.addEventListener('change', () => updateAppearance('density', r.value === 'compact' ? 'compact' : '', `${r.value === 'compact' ? 'Compact' : 'Comfortable'} layout enabled.`))
    );
    $$('[data-appearance]').forEach((sw) =>
      sw.addEventListener('change', () => {
        const key = sw.dataset.appearance;
        const on = key === 'contrast' ? 'more' : 'reduced';
        updateAppearance(key, sw.checked ? on : '', `${key === 'contrast' ? 'Higher contrast' : 'Reduced motion'} ${sw.checked ? 'on' : 'off'}.`);
      })
    );

    // Password
    const pw = $('#password-form');
    const newPw = $('#pw-new');
    const meter = $('#pw-strength');
    const meterLabel = $('#pw-strength-label');
    const LEVELS = ['—', 'Weak', 'Fair', 'Good', 'Strong'];
    const score = (v) => {
      if (!v) return 0;
      let s = 0;
      if (v.length >= 8) s++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
      if (/\d/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      return Math.max(1, s);
    };
    const updateMeter = () => {
      const s = score(newPw.value);
      meter.dataset.score = s;
      meterLabel.textContent = `Password strength: ${LEVELS[s]}`;
    };
    newPw.addEventListener('input', updateMeter);
    pw.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(pw)) return;
      if (score(newPw.value) < 3) {
        setError(newPw, 'Choose a stronger password: mix upper and lower case letters, numbers and symbols.');
        newPw.focus();
        return;
      }
      if (newPw.value === $('#pw-current').value) {
        setError(newPw, 'Your new password must be different from the current one.');
        newPw.focus();
        return;
      }
      submitWithBusy(pw, () => {
        pw.reset();
        clearErrors(pw);
        updateMeter();
        pushNotification('security', 'Password changed', 'Your password was updated successfully.');
        toast('Use your new password next time you sign in.', { title: 'Password updated' });
      });
    });

    // Sessions
    const renderSessions = () => {
      $('#session-list').innerHTML = d.sessions
        .map(
          (s) => `<li class="session">
            <span class="icon-tile" data-tone="${s.current ? 'success' : 'neutral'}">${icon(s.icon)}</span>
            <div class="min0 grow">
              <p class="item-title">${esc(s.device)} ${s.current ? '<span class="badge" data-tone="success">This device</span>' : ''}</p>
              <p class="item-meta">${esc(s.location)} · ${esc(s.lastActive)}</p>
            </div>
            ${s.current ? '' : `<button type="button" class="btn btn-ghost btn-sm" data-action="revoke-session" data-id="${s.id}" aria-label="Sign out ${esc(s.device)}">Sign out</button>`}
          </li>`
        )
        .join('');
    };
    actions['revoke-session'] = (el) => {
      const s = d.sessions.find((x) => x.id === el.dataset.id);
      d.sessions = d.sessions.filter((x) => x.id !== el.dataset.id);
      store.save();
      renderSessions();
      toast(`${s ? s.device : 'Session'} was signed out.`);
    };
    actions['revoke-all'] = () => {
      const others = d.sessions.filter((s) => !s.current).length;
      if (!others) return toast('No other active sessions.', { type: 'info' });
      d.sessions = d.sessions.filter((s) => s.current);
      store.save();
      renderSessions();
      toast(`${plural(others, 'other session')} signed out.`);
    };
    renderSessions();

    actions['reset-demo'] = async () => {
      const ok = await confirmDialog({
        title: 'Reset demo data?',
        message: 'All projects, tasks, team changes and preferences saved in this browser will be replaced with the original sample data.',
        confirmLabel: 'Reset data',
      });
      if (!ok) return;
      store.reset();
      applyAppearance({});
      toast('Sample workspace restored. Reloading…', { title: 'Demo data reset' });
      setTimeout(() => location.reload(), 900);
    };
  };

  /* 9. Init --------------------------------------------------------------- */
  function init() {
    store.load();
    const page = document.body.dataset.page;
    const sidebar = $('[data-shell="sidebar"]');
    const topbar = $('[data-shell="topbar"]');
    if (sidebar) renderSidebar(sidebar, page);
    if (topbar) renderTopbar(topbar, page);
    hydrateIcons();
    initDropdowns();
    initModals();
    initLiveValidation();
    if (topbar) {
      initSearch();
      renderNotifications();
      initMobileNav();
      initShortcuts();
    }
    syncUser();
    initTaskForm();
    if (PAGES[page]) PAGES[page]();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
