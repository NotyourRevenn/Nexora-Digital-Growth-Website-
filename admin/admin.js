/**
 * NEXORA DIGITAL – CREATIVE AGENCY CRM CONTROLLER
 * Supports Table & Kanban Pipeline Views, Live Clock, Multi-Channel Distribution,
 * Manual Lead Creator, Slide-Over Inspection Drawer, and 1-Click WhatsApp Dispatch.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Authentication State Guard ---
  let token = localStorage.getItem('nexora_admin_token');
  let storedUser = localStorage.getItem('nexora_admin_user') || 'Admin';

  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';

  // If accessing locally on dev machine, automatically initialize local session
  if (!token && isLocalHost) {
    token = 'local_session_admin';
    localStorage.setItem('nexora_admin_token', token);
    localStorage.setItem('nexora_admin_user', 'Admin');
  } else if (!token) {
    window.location.href = '/admin/login.html';
    return;
  }

  // Display user badge
  const displayUsername = document.getElementById('displayUsername');
  const userAvatar = document.getElementById('userAvatar');
  if (displayUsername) displayUsername.textContent = storedUser;
  if (userAvatar) userAvatar.textContent = storedUser.charAt(0).toUpperCase();

  // Verify session with server when on a live production domain
  if (!isLocalHost) {
    fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(res => {
      if (!res.ok) {
        localStorage.removeItem('nexora_admin_token');
        localStorage.removeItem('nexora_admin_user');
        window.location.href = '/admin/login.html';
      }
    }).catch(() => {});
  }

  // --- 2. Live Clock in Hero Command Banner ---
  const liveClockEl = document.getElementById('currentLiveClock');
  function updateLiveClock() {
    if (!liveClockEl) return;
    const now = new Date();
    liveClockEl.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) + ' • ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // --- 3. Minimalist Toast Notification Engine ---
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  // --- 4. Navigation & Tab Switching ---
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
  const tabBlocks = {
    leads: document.getElementById('tabLeadsSection'),
    subscribers: document.getElementById('tabSubscribersSection'),
    settings: document.getElementById('tabSettingsSection')
  };
  const viewTitle = document.getElementById('viewTitle');
  const viewSubtitle = document.getElementById('viewSubtitle');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      Object.keys(tabBlocks).forEach(key => {
        if (tabBlocks[key]) {
          tabBlocks[key].style.display = (key === tab) ? 'block' : 'none';
        }
      });

      if (tab === 'leads') {
        viewTitle.textContent = 'Agency Leads & Growth Pipeline';
        viewSubtitle.textContent = 'Real-time consultation requests, ad spend forecasts & client status.';
        loadLeads();
        loadStats();
      } else if (tab === 'subscribers') {
        viewTitle.textContent = 'Newsletter Subscribers';
        viewSubtitle.textContent = 'Active email audience for Nexora Growth Insights.';
        loadSubscribers();
      } else if (tab === 'settings') {
        viewTitle.textContent = 'Portal Settings & Security';
        viewSubtitle.textContent = 'Manage admin credentials and local database storage.';
      }
    });
  });

  // Logout Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token }
        });
      } catch (e) {}
      localStorage.removeItem('nexora_admin_token');
      localStorage.removeItem('nexora_admin_user');
      document.cookie = "nexora_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = 'login.html';
    });
  }

  // --- 5. Live Stats & KPIs ---
  async function loadStats() {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      const data = await res.json();
      const s = data.stats;

      document.getElementById('kpiTotalLeads').textContent = s.total_leads || 0;
      document.getElementById('kpiNewInquiries').textContent = s.new_inquiries || 0;
      document.getElementById('kpiInPipeline').textContent = s.in_pipeline || 0;
      document.getElementById('kpiWonClients').textContent = s.won_clients || 0;
      document.getElementById('kpiWinRate').textContent = s.win_rate + ' Win';

      const leadsCounter = document.getElementById('leadsCounter');
      const subsCounter = document.getElementById('subsCounter');
      if (leadsCounter) leadsCounter.textContent = s.total_leads || 0;
      if (subsCounter) subsCounter.textContent = s.total_subscribers || 0;
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  // --- 6. View Switcher (Table vs. Kanban Board) ---
  let currentViewMode = 'table';
  const btnViewTable = document.getElementById('btnViewTable');
  const btnViewKanban = document.getElementById('btnViewKanban');
  const tableViewContainer = document.getElementById('tableViewContainer');
  const kanbanViewContainer = document.getElementById('kanbanViewContainer');

  function setViewMode(mode) {
    currentViewMode = mode;
    if (mode === 'table') {
      btnViewTable.classList.add('active');
      btnViewKanban.classList.remove('active');
      tableViewContainer.style.display = 'block';
      kanbanViewContainer.style.display = 'none';
      renderLeadsTable(activeLeadsList);
    } else {
      btnViewKanban.classList.add('active');
      btnViewTable.classList.remove('active');
      tableViewContainer.style.display = 'none';
      kanbanViewContainer.style.display = 'grid';
      renderKanbanBoard(allLeadsUnfiltered);
    }
  }

  if (btnViewTable) btnViewTable.addEventListener('click', () => setViewMode('table'));
  if (btnViewKanban) btnViewKanban.addEventListener('click', () => setViewMode('kanban'));

  // --- 7. Leads Pipeline & Filtering ---
  let currentStatus = 'ALL';
  let currentGoal = 'ALL';
  let searchQuery = '';
  let activeLeadsList = [];
  let allLeadsUnfiltered = [];
  let currentSelectedLead = null;

  const leadsTableBody = document.getElementById('leadsTableBody');
  const leadSearchInput = document.getElementById('leadSearchInput');
  const goalFilterSelect = document.getElementById('goalFilterSelect');
  const statusFilterTabs = document.querySelectorAll('#statusFilterTabs .status-tab');

  // Search input debouncer
  let searchTimer;
  if (leadSearchInput) {
    leadSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchQuery = e.target.value.trim();
      searchTimer = setTimeout(() => {
        loadLeads();
      }, 250);
    });
  }

  // Goal Select Filter
  if (goalFilterSelect) {
    goalFilterSelect.addEventListener('change', (e) => {
      currentGoal = e.target.value;
      loadLeads();
    });
  }

  // Status Tabs Filter
  statusFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statusFilterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatus = tab.getAttribute('data-status');
      loadLeads();
    });
  });

  // Fetch Leads from Backend
  async function loadLeads() {
    try {
      const params = new URLSearchParams();
      if (currentStatus !== 'ALL') params.append('status', currentStatus);
      if (currentGoal !== 'ALL') params.append('goal', currentGoal);
      if (searchQuery) params.append('q', searchQuery);

      const [filteredRes, allRes] = await Promise.all([
        fetch(`/api/leads?${params.toString()}`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch('/api/leads', { headers: { 'Authorization': 'Bearer ' + token } })
      ]);

      if (!filteredRes.ok || !allRes.ok) {
        if (filteredRes.status === 401 || allRes.status === 401) {
          window.location.href = 'login.html';
          return;
        }
        throw new Error('Failed to fetch leads');
      }

      const filteredData = await filteredRes.json();
      const allData = await allRes.json();

      activeLeadsList = filteredData.leads || [];
      allLeadsUnfiltered = allData.leads || [];

      updateCountBadges(allLeadsUnfiltered);
      updateDistributionBar(allLeadsUnfiltered);

      if (currentViewMode === 'table') {
        renderLeadsTable(activeLeadsList);
      } else {
        renderKanbanBoard(allLeadsUnfiltered);
      }
    } catch (err) {
      if (leadsTableBody) {
        leadsTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 45px; color: var(--rose);">
              <i class="fa-solid fa-triangle-exclamation"></i> Error communicating with SQLite database.
            </td>
          </tr>
        `;
      }
    }
  }

  // Update Dynamic Status Count Badges
  function updateCountBadges(leads) {
    const counts = {
      ALL: leads.length,
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      PROPOSAL_SENT: 0,
      WON: 0,
      LOST: 0
    };

    leads.forEach(l => {
      const st = (l.status || 'NEW').toUpperCase();
      if (counts[st] !== undefined) counts[st]++;
    });

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };

    setBadge('countAll', counts.ALL);
    setBadge('countNew', counts.NEW);
    setBadge('countContacted', counts.CONTACTED);
    setBadge('countQualified', counts.QUALIFIED);
    setBadge('countProposal', counts.PROPOSAL_SENT);
    setBadge('countWon', counts.WON);
    setBadge('countLost', counts.LOST);

    // Kanban header badges
    setBadge('kCountNew', counts.NEW);
    setBadge('kCountContacted', counts.CONTACTED);
    setBadge('kCountQualified', counts.QUALIFIED);
    setBadge('kCountProposal', counts.PROPOSAL_SENT);
    setBadge('kCountWon', counts.WON);
  }

  // Dynamic Channel Distribution Calculator
  function updateDistributionBar(leads) {
    const bar = document.getElementById('distributionBar');
    const summary = document.getElementById('distributionSummary');
    if (!bar || leads.length === 0) return;

    let meta = 0, google = 0, viral = 0, linkedin = 0, full = 0;
    leads.forEach(l => {
      const g = (l.goal || '').toLowerCase();
      if (g.includes('meta') || g.includes('social') || g.includes('fb')) meta++;
      else if (g.includes('google') || g.includes('p-max') || g.includes('search')) google++;
      else if (g.includes('viral') || g.includes('video') || g.includes('reel') || g.includes('tiktok')) viral++;
      else if (g.includes('linkedin') || g.includes('b2b')) linkedin++;
      else full++;
    });

    const total = leads.length;
    const pMeta = Math.max(8, Math.round((meta / total) * 100));
    const pGoogle = Math.max(8, Math.round((google / total) * 100));
    const pViral = Math.max(8, Math.round((viral / total) * 100));
    const pLinkedin = Math.max(6, Math.round((linkedin / total) * 100));
    const pFull = Math.max(6, Math.round((full / total) * 100));

    const segMeta = bar.querySelector('.bar-segment.meta');
    const segGoogle = bar.querySelector('.bar-segment.google');
    const segViral = bar.querySelector('.bar-segment.viral');
    const segLinkedin = bar.querySelector('.bar-segment.linkedin');
    const segFull = bar.querySelector('.bar-segment.full');

    if (segMeta) { segMeta.style.width = pMeta + '%'; segMeta.title = `Meta Ads (${pMeta}%)`; }
    if (segGoogle) { segGoogle.style.width = pGoogle + '%'; segGoogle.title = `Google Ads (${pGoogle}%)`; }
    if (segViral) { segViral.style.width = pViral + '%'; segViral.title = `Viral Reels (${pViral}%)`; }
    if (segLinkedin) { segLinkedin.style.width = pLinkedin + '%'; segLinkedin.title = `LinkedIn B2B (${pLinkedin}%)`; }
    if (segFull) { segFull.style.width = pFull + '%'; segFull.title = `Full-Funnel (${pFull}%)`; }

    if (summary) {
      summary.textContent = `${meta} Meta • ${google} Google • ${viral} Viral • ${total} Total Leads`;
    }
  }

  // --- 8. Render Table View ---
  function renderLeadsTable(leads) {
    if (!leadsTableBody) return;

    if (leads.length === 0) {
      leadsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 50px; color: var(--text-dim);">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
            No inquiries matching your filter.
          </td>
        </tr>
      `;
      return;
    }

    leadsTableBody.innerHTML = leads.map(lead => {
      const dateStr = formatDateTime(lead.created_at);
      const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');
      const waMsg = encodeURIComponent(`Hi ${lead.name}, following up from Nexora Digital regarding your proposal request for ${lead.goal || 'Growth Scaling'}. Would love to connect!`);
      const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waMsg}`;
      const initial = (lead.name || 'G').charAt(0).toUpperCase();

      return `
        <tr class="lead-row" onclick="window.openLeadDrawer(${lead.id})">
          <td>
            <div class="client-identity">
              <div class="client-avatar-mini">${initial}</div>
              <div class="client-meta">
                <span class="client-name">${escapeHtml(lead.name)}</span>
                <span class="client-date">${dateStr}</span>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size: 0.84rem;">
              <span style="color: #fff; cursor: pointer;" onclick="event.stopPropagation(); window.copyToClipboard('${escapeHtml(lead.phone)}', 'Phone copied!')" title="Click to copy">
                <i class="fa-solid fa-phone" style="font-size: 0.72rem; color: var(--cyan); margin-right: 5px;"></i> ${escapeHtml(lead.phone)}
              </span>
              <div style="color: var(--text-dim); font-size: 0.75rem; cursor: pointer;" onclick="event.stopPropagation(); window.copyToClipboard('${escapeHtml(lead.email || '')}', 'Email copied!')" title="Click to copy">
                ${escapeHtml(lead.email || 'No email')}
              </div>
            </div>
          </td>
          <td>
            <span class="channel-tag">${escapeHtml(lead.goal || 'General')}</span>
          </td>
          <td>
            <strong style="color: var(--emerald); font-weight: 700;">${escapeHtml(lead.budget || 'Custom')}</strong>
          </td>
          <td>
            <span style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(lead.source || 'Website')}</span>
          </td>
          <td onclick="event.stopPropagation();">
            <select class="filter-select" style="padding: 4px 8px; font-size: 0.74rem; font-weight: 700;" onchange="window.updateLeadStatus(${lead.id}, this.value)">
              <option value="NEW" ${lead.status === 'NEW' ? 'selected' : ''}>NEW</option>
              <option value="CONTACTED" ${lead.status === 'CONTACTED' ? 'selected' : ''}>CONTACTED</option>
              <option value="QUALIFIED" ${lead.status === 'QUALIFIED' ? 'selected' : ''}>QUALIFIED</option>
              <option value="PROPOSAL_SENT" ${lead.status === 'PROPOSAL_SENT' ? 'selected' : ''}>PROPOSAL SENT</option>
              <option value="WON" ${lead.status === 'WON' ? 'selected' : ''}>WON 🏆</option>
              <option value="LOST" ${lead.status === 'LOST' ? 'selected' : ''}>LOST</option>
            </select>
          </td>
          <td onclick="event.stopPropagation();">
            <div class="actions-cell" style="justify-content: flex-end;">
              <a href="${waUrl}" target="_blank" class="btn-icon-action btn-wa-action" title="Quick WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
              </a>
              <button type="button" class="btn-icon-action btn-view-action" onclick="window.openLeadDrawer(${lead.id})" title="Inspect Lead">
                <i class="fa-regular fa-eye"></i>
              </button>
              <button type="button" class="btn-icon-action btn-delete-action" onclick="window.deleteLead(${lead.id})" title="Delete Lead">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- 9. Render Visual Kanban Board View ---
  function renderKanbanBoard(leads) {
    const cols = {
      NEW: document.getElementById('kColNew'),
      CONTACTED: document.getElementById('kColContacted'),
      QUALIFIED: document.getElementById('kColQualified'),
      PROPOSAL_SENT: document.getElementById('kColProposal'),
      WON: document.getElementById('kColWon')
    };

    Object.values(cols).forEach(col => { if (col) col.innerHTML = ''; });

    const pipelineStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON'];

    leads.forEach(lead => {
      const status = (lead.status || 'NEW').toUpperCase();
      const colEl = cols[status];
      if (!colEl) return;

      const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');
      const waMsg = encodeURIComponent(`Hi ${lead.name}, following up from Nexora Digital regarding your growth proposal.`);
      const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waMsg}`;
      
      const currentIdx = pipelineStages.indexOf(status);
      const prevStatus = currentIdx > 0 ? pipelineStages[currentIdx - 1] : null;
      const nextStatus = currentIdx < pipelineStages.length - 1 ? pipelineStages[currentIdx + 1] : null;
      const initial = (lead.name || 'G').charAt(0).toUpperCase();

      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.onclick = () => window.openLeadDrawer(lead.id);

      card.innerHTML = `
        <div class="kanban-card-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="client-avatar-mini" style="width: 26px; height: 26px; font-size: 0.7rem;">${initial}</div>
            <span class="kanban-card-title">${escapeHtml(lead.name)}</span>
          </div>
          <span class="kanban-card-date">${formatDateTime(lead.created_at)}</span>
        </div>
        <div class="kanban-card-budget">${escapeHtml(lead.budget || 'Custom Spend')}</div>
        <div style="margin-bottom: 10px;">
          <span class="channel-tag" style="font-size: 0.7rem; padding: 2px 8px;">${escapeHtml(lead.goal || 'General')}</span>
        </div>
        <div class="kanban-card-footer" onclick="event.stopPropagation();">
          <a href="${waUrl}" target="_blank" style="color: #25d366; font-weight: 700; display: flex; align-items: center; gap: 4px;">
            <i class="fa-brands fa-whatsapp"></i> Chat
          </a>
          <div class="kanban-move-btns">
            ${prevStatus ? `<button type="button" class="btn-kanban-shift" onclick="window.updateLeadStatus(${lead.id}, '${prevStatus}')" title="Move back to ${prevStatus}">&#8592;</button>` : ''}
            ${nextStatus ? `<button type="button" class="btn-kanban-shift" onclick="window.updateLeadStatus(${lead.id}, '${nextStatus}')" title="Move forward to ${nextStatus}">&#8594;</button>` : ''}
          </div>
        </div>
      `;
      colEl.appendChild(card);
    });

    Object.values(cols).forEach(col => {
      if (col && col.children.length === 0) {
        col.innerHTML = `<div style="text-align: center; padding: 35px 10px; color: var(--text-dim); font-size: 0.75rem;">No leads in stage</div>`;
      }
    });
  }

  // --- 10. Slide-Over Inspection Drawer Logic ---
  const drawerBackdrop = document.getElementById('leadDrawerBackdrop');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const btnSaveDrawerNotes = document.getElementById('btnSaveDrawerNotes');

  window.openLeadDrawer = function(leadId) {
    const lead = allLeadsUnfiltered.find(l => l.id === leadId);
    if (!lead) return;
    currentSelectedLead = lead;

    document.getElementById('drawerLeadName').textContent = `${lead.name} (#${lead.id})`;
    document.getElementById('drawerLeadDate').textContent = formatDateTime(lead.created_at);
    document.getElementById('drawerStatusPill').innerHTML = `<span class="status-pill ${lead.status.toLowerCase()}">${lead.status}</span>`;
    document.getElementById('drawerPhone').textContent = lead.phone;
    document.getElementById('drawerEmail').textContent = lead.email || 'None';
    document.getElementById('drawerGoal').textContent = lead.goal || 'Growth Scaling';
    document.getElementById('drawerBudget').textContent = lead.budget || 'Custom';
    document.getElementById('drawerSource').textContent = lead.source || 'Website';
    document.getElementById('drawerNotes').textContent = lead.notes || 'No custom client notes provided.';
    document.getElementById('drawerInternalNotes').value = lead.internal_notes || '';

    // Connect CTAs
    const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');
    const waMsg = encodeURIComponent(`Hi ${lead.name}, connecting from Nexora Digital about your growth consultation request for ${lead.goal || 'performance marketing'}.`);
    document.getElementById('drawerWaBtn').href = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waMsg}`;
    document.getElementById('drawerCallBtn').href = `tel:${cleanPhone}`;

    // Click to copy handlers
    document.getElementById('drawerPhone').onclick = () => window.copyToClipboard(lead.phone, 'Phone number copied!');
    document.getElementById('drawerEmail').onclick = () => window.copyToClipboard(lead.email, 'Email address copied!');

    drawerBackdrop.classList.add('open');
  };

  function closeDrawer() {
    drawerBackdrop.classList.remove('open');
    currentSelectedLead = null;
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) closeDrawer();
    });
  }

  // Save Internal Notes
  if (btnSaveDrawerNotes) {
    btnSaveDrawerNotes.addEventListener('click', async () => {
      if (!currentSelectedLead) return;
      const internal_notes = document.getElementById('drawerInternalNotes').value.trim();
      const indicator = document.getElementById('notesSaveIndicator');
      if (indicator) indicator.textContent = 'Saving...';

      try {
        const res = await fetch(`/api/leads/${currentSelectedLead.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ internal_notes })
        });

        if (res.ok) {
          currentSelectedLead.internal_notes = internal_notes;
          showToast(`Notes saved for ${currentSelectedLead.name}`);
          if (indicator) indicator.textContent = 'Saved!';
          setTimeout(() => { if (indicator) indicator.textContent = ''; }, 2000);
        } else {
          showToast('Failed to save notes', 'error');
        }
      } catch (err) {
        showToast('Network error saving notes', 'error');
      }
    });
  }

  // --- 11. Manual Log Lead Modal Logic ---
  const manualLeadModal = document.getElementById('manualLeadModal');
  const btnOpenNewLeadModal = document.getElementById('btnOpenNewLeadModal');
  const btnBannerNewLead = document.getElementById('btnBannerNewLead');
  const btnCloseManualLeadModal = document.getElementById('btnCloseManualLeadModal');
  const btnCancelManualLead = document.getElementById('btnCancelManualLead');
  const manualLeadForm = document.getElementById('manualLeadForm');

  function openManualModal() {
    if (manualLeadModal) manualLeadModal.classList.add('open');
  }
  function closeManualModal() {
    if (manualLeadModal) manualLeadModal.classList.remove('open');
  }

  if (btnOpenNewLeadModal) btnOpenNewLeadModal.addEventListener('click', openManualModal);
  if (btnBannerNewLead) btnBannerNewLead.addEventListener('click', openManualModal);
  if (btnCloseManualLeadModal) btnCloseManualLeadModal.addEventListener('click', closeManualModal);
  if (btnCancelManualLead) btnCancelManualLead.addEventListener('click', closeManualModal);

  if (manualLeadForm) {
    manualLeadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('mLeadName').value.trim();
      const phone = document.getElementById('mLeadPhone').value.trim();
      const email = document.getElementById('mLeadEmail').value.trim();
      const goal = document.getElementById('mLeadGoal').value;
      const budget = document.getElementById('mLeadBudget').value.trim() || 'Custom Retainer';
      const source = document.getElementById('mLeadSource').value;
      const notes = document.getElementById('mLeadNotes').value.trim();

      const submitBtn = document.getElementById('btnSubmitManualLead');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
      }

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, goal, budget, source, notes })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Lead for "${name}" logged into pipeline!`);
          manualLeadForm.reset();
          closeManualModal();
          loadLeads();
          loadStats();
        } else {
          showToast(data.message || 'Error saving lead', 'error');
        }
      } catch (err) {
        showToast('Server connection error', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Save to Pipeline</span>';
        }
      }
    });
  }

  // --- 12. Global Status Changer & Actions ---
  window.updateLeadStatus = async function(leadId, newStatus) {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`Lead #${leadId} shifted to ${newStatus}`);
        loadLeads();
        loadStats();
        if (currentSelectedLead && currentSelectedLead.id === leadId) {
          currentSelectedLead.status = newStatus;
          document.getElementById('drawerStatusPill').innerHTML = `<span class="status-pill ${newStatus.toLowerCase()}">${newStatus}</span>`;
        }
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Network error updating status', 'error');
    }
  };

  window.deleteLead = async function(leadId) {
    if (!confirm(`Are you sure you want to permanently delete Lead #${leadId}?`)) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (res.ok) {
        showToast(`Lead #${leadId} deleted`);
        closeDrawer();
        loadLeads();
        loadStats();
      } else {
        showToast('Failed to delete lead', 'error');
      }
    } catch (err) {
      showToast('Network error deleting lead', 'error');
    }
  };

  window.deleteCurrentLead = function() {
    if (currentSelectedLead) {
      window.deleteLead(currentSelectedLead.id);
    }
  };

  // Click-to-copy utility
  window.copyToClipboard = function(text, successMsg = 'Copied to clipboard!') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      showToast('Could not copy', 'error');
    });
  };

  // --- 13. Keyboard Shortcuts Engine ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeManualModal();
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      if (leadSearchInput) leadSearchInput.focus();
    }
    if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      loadStats();
      loadLeads();
      showToast('Data refreshed');
    }
  });

  // --- 14. Newsletter Tab Logic ---
  const subsTableBody = document.getElementById('subsTableBody');
  async function loadSubscribers() {
    if (!subsTableBody) return;
    subsTableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-dim);">
          <i class="fa-solid fa-circle-notch fa-spin"></i> Loading Subscribers...
        </td>
      </tr>
    `;

    try {
      const res = await fetch('/api/newsletter', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      const subs = data.subscribers || [];

      if (subs.length === 0) {
        subsTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-dim);">
              No newsletter subscribers yet.
            </td>
          </tr>
        `;
        return;
      }

      subsTableBody.innerHTML = subs.map(sub => `
        <tr>
          <td><strong style="color: var(--cyan);">#${sub.id}</strong></td>
          <td><strong style="color: #fff;"><i class="fa-regular fa-envelope" style="color: var(--violet); margin-right: 6px;"></i> ${escapeHtml(sub.email)}</strong></td>
          <td><span style="color: var(--text-dim); font-size: 0.78rem;">${formatDateTime(sub.created_at)}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn-icon-action btn-delete-action" onclick="window.deleteSubscriber(${sub.id})" title="Remove Subscriber">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      subsTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px; color: var(--rose);">
            Error loading subscribers.
          </td>
        </tr>
      `;
    }
  }

  window.deleteSubscriber = async function(id) {
    if (!confirm('Remove this email from subscribers list?')) return;
    try {
      const res = await fetch(`/api/newsletter/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        showToast('Subscriber removed');
        loadSubscribers();
        loadStats();
      }
    } catch (e) {
      showToast('Error removing subscriber', 'error');
    }
  };

  // --- 15. Change Password Form ---
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current_password = document.getElementById('currentPassword').value;
      const new_password = document.getElementById('newPassword').value;

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ current_password, new_password })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Password updated successfully!');
          changePasswordForm.reset();
        } else {
          showToast(data.message || 'Error updating password', 'error');
        }
      } catch (err) {
        showToast('Server connection error', 'error');
      }
    });
  }

  // --- 16. Toolbar Actions: Refresh & CSV Export ---
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadStats();
      loadLeads();
      showToast('Pipeline synchronized');
    });
  }

  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      fetch('/api/leads/export', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexora_leads_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Leads CSV exported');
      })
      .catch(() => showToast('Failed to export CSV', 'error'));
    });
  }

  // --- Helpers ---
  function formatDateTime(isoStr) {
    if (!isoStr) return '--';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Load
  loadStats();
  loadLeads();

});
