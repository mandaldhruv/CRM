/**
 * ============================================================================
 * DASHBOARD ANALYTICS MODULE
 * API-backed dashboard rendering for live backend data
 * ============================================================================
 */

const DashboardAnalytics = (() => {
    const DASHBOARD_API_URL = 'http://localhost:5000/api/v1/dashboard';

    let dashboardState = {
        pulse: {
            todaysCollection: 0,
            activeSubscriptions: 0,
            expiringSoon: 0,
            netProfit: 0
        },
        birthdays: [],
        renewals: [],
        recentActivity: [],
        activeMembersList: [],
        todaysIncomeList: [],
        expiringSoonList: []
    };

    const showToast = (message, type = 'info', title = 'Dashboard') => {
        if (window.UIComponents?.showToast) {
            UIComponents.showToast(message, type, title);
        } else {
            console[type === 'error' ? 'error' : 'log'](`[Dashboard] ${message}`);
        }
    };

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const renderLoadingState = () => {
        const metricsContainer = document.querySelector('[data-metrics-container="dashboard"]');
        if (metricsContainer) {
            metricsContainer.innerHTML = `
                <div class="card stat-card"><div class="metric-label">Loading dashboard...</div><div class="metric-value">...</div></div>
                <div class="card stat-card"><div class="metric-label">Loading dashboard...</div><div class="metric-value">...</div></div>
                <div class="card stat-card"><div class="metric-label">Loading dashboard...</div><div class="metric-value">...</div></div>
                <div class="card stat-card"><div class="metric-label">Loading dashboard...</div><div class="metric-value">...</div></div>
            `;
        }

        const birthdaysContainer = document.querySelector('[data-widget="birthdays"]');
        if (birthdaysContainer) {
            birthdaysContainer.innerHTML = '<div class="card follow-up-widget"><div class="widget-content"><p style="color: var(--text-secondary);">Loading birthdays...</p></div></div>';
        }

        const renewalsContainer = document.querySelector('[data-widget="renewals"]');
        if (renewalsContainer) {
            renewalsContainer.innerHTML = '<div class="card follow-up-widget"><div class="widget-content"><p style="color: var(--text-secondary);">Loading renewals...</p></div></div>';
        }

        const recentActivityTableBody = document.querySelector('#recent-activity-table tbody');
        if (recentActivityTableBody) {
            recentActivityTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-secondary);">Loading recent activity...</td>
                </tr>
            `;
        }
    };

    const fetchDashboardData = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const requestUrl = new URL(DASHBOARD_API_URL);
            const branchId = String(window.APP_DEFAULT_BRANCH_ID || '').trim();

            if (branchId) {
                requestUrl.searchParams.set('branchId', branchId);
            }

            const response = await fetch(requestUrl.toString(), {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                cache: 'no-store',
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log('Dashboard API Response:', data);

            if (!data?.success || !data?.data) {
                throw new Error('Dashboard API returned an invalid payload');
            }

            dashboardState = {
                pulse: {
                    todaysCollection: Number(data.data.pulse?.todaysCollection || data.data.todays_collection || 0),
                    activeSubscriptions: Number(data.data.pulse?.activeSubscriptions || data.data.active_subscriptions || 0),
                    expiringSoon: Number(data.data.pulse?.expiringSoon || data.data.expiring_soon || 0),
                    netProfit: Number(data.data.pulse?.netProfit || data.data.net_profit || data.data.pulse?.todaysCollection || data.data.todays_collection || 0)
                },
                birthdays: Array.isArray(data.data.birthdays) ? data.data.birthdays : [],
                renewals: Array.isArray(data.data.renewals) ? data.data.renewals : [],
                activeMembersList: Array.isArray(data.data.activeMembersList) ? data.data.activeMembersList : [],
                todaysIncomeList: Array.isArray(data.data.todaysIncomeList) ? data.data.todaysIncomeList : [],
                expiringSoonList: Array.isArray(data.data.expiringSoonList) ? data.data.expiringSoonList : [],
                recentActivity: Array.isArray(data.data.recentActivity)
                    ? data.data.recentActivity
                    : (Array.isArray(data.data.recent_activity) ? data.data.recent_activity : [])
            };

            return dashboardState;
        } catch (error) {
            console.error('[DashboardAnalytics] Failed to fetch dashboard data', error);
            showToast('Unable to reach the dashboard server. Showing empty dashboard state.', 'error', 'Dashboard Error');

            dashboardState = {
                pulse: {
                    todaysCollection: 0,
                    activeSubscriptions: 0,
                    expiringSoon: 0,
                    netProfit: 0
                },
                birthdays: [],
                renewals: [],
                recentActivity: [],
                activeMembersList: [],
                todaysIncomeList: [],
                expiringSoonList: []
            };

            return dashboardState;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    const calculateTodaysCollection = () => dashboardState.pulse.todaysCollection;

    const getActiveSubscriptions = () => dashboardState.pulse.activeSubscriptions;

    const getExpiringMembers = () => dashboardState.renewals;
    const getActiveMembersList = () => dashboardState.activeMembersList;
    const getTodaysIncomeList = () => dashboardState.todaysIncomeList;
    const getExpiringSoonList = () => dashboardState.expiringSoonList;

    const getUpcomingBirthdays = () => dashboardState.birthdays;

    const getRenewalFollowups = () => dashboardState.renewals;

    const getRecentActivityData = () => dashboardState.recentActivity;

    const getTotalIncome = () => dashboardState.pulse.todaysCollection;

    const getTotalExpenses = () => 0;

    const calculateNetProfit = () => dashboardState.pulse.netProfit;

    const getExpensesByCategory = () => ({
        'Monthly Expenses': 0
    });

    const updateDashboardUI = (apiResponse = dashboardState) => {
        const source = apiResponse?.data ? apiResponse.data : apiResponse;
        const pulse = source?.pulse || {};
        const recentActivity = Array.isArray(source?.recentActivity)
            ? source.recentActivity
            : (Array.isArray(source?.recent_activity) ? source.recent_activity : []);
        const birthdays = Array.isArray(source?.birthdays) ? source.birthdays : [];
        const renewals = Array.isArray(source?.renewals) ? source.renewals : [];
        const activeMembersList = Array.isArray(source?.activeMembersList) ? source.activeMembersList : [];
        const todaysIncomeList = Array.isArray(source?.todaysIncomeList) ? source.todaysIncomeList : [];
        const expiringSoonList = Array.isArray(source?.expiringSoonList) ? source.expiringSoonList : [];

        dashboardState.activeMembersList = activeMembersList;
        dashboardState.todaysIncomeList = todaysIncomeList;
        dashboardState.expiringSoonList = expiringSoonList;

        renderMetricCards({
            todaysCollection: Number(pulse.todaysCollection || source?.todays_collection || 0),
            activeSubscriptions: Number(pulse.activeSubscriptions || source?.active_subscriptions || 0),
            expiringSoon: Number(pulse.expiringSoon || source?.expiring_soon || 0),
            netProfit: Number(pulse.netProfit || source?.net_profit || pulse.todaysCollection || source?.todays_collection || 0)
        });
        renderBirthdaysWidget(birthdays);
        renderRenewalFollowupsWidget(renewals);
        renderRecentActivity(recentActivity);
    };

    const renderMetricCards = (pulse = dashboardState.pulse) => {
        const containerHTML = `
            <div class="card stat-card stat-card-collection" data-stat-type="collection" style="cursor:pointer;" title="Click to view today's receipts">
                <div class="metric-label">Today's Collection</div>
                <div class="metric-value">${formatINR(pulse.todaysCollection)}</div>
                <div class="metric-trend">
                    <span class="material-icons-round" style="font-size: 0.9rem;">trending_up</span> Live API
                </div>
            </div>

            <div class="card stat-card stat-card-active" data-stat-type="active" style="cursor:pointer;" title="Click to view active members">
                <div class="metric-label">Active Subscriptions</div>
                <div class="metric-value">${pulse.activeSubscriptions}</div>
                <div class="metric-trend">
                    <span class="material-icons-round" style="font-size: 0.9rem;">people</span> Active Members
                </div>
            </div>

            <div class="card stat-card stat-card-expiring" data-stat-type="expiring" style="cursor:pointer;" title="Click to view expiring memberships">
                <div class="metric-label">Expiring Soon</div>
                <div class="metric-value">${pulse.expiringSoon}</div>
                <div class="metric-trend">
                    <span class="material-icons-round" style="font-size: 0.9rem;">schedule</span> Next 7 Days
                </div>
            </div>

            <div class="card stat-card stat-card-profit" data-stat-type="profit" style="cursor:pointer;" title="Click to view income vs expenses">
                <div class="metric-label">Net Profit</div>
                <div class="metric-value" style="color: var(--success);">${formatINR(pulse.netProfit)}</div>
                <div class="metric-trend">
                    <span class="material-icons-round" style="font-size: 0.9rem;">account_balance</span> Income - Expenses
                </div>
            </div>
        `;

        const metricsContainer = document.querySelector('[data-metrics-container="dashboard"]');
        if (metricsContainer) {
            metricsContainer.innerHTML = containerHTML;
        }
    };

    const renderBirthdaysWidget = (birthdays = dashboardState.birthdays) => {
        const whatsappPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';
        const getContrastColor = (seed = '') => {
            const palette = ['#6D5EF5', '#F97316', '#0EA5E9', '#10B981', '#D946EF', '#F59E0B'];
            const hash = String(seed).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            return palette[hash % palette.length];
        };

        const party = String.fromCodePoint(0x1F382);

        let html = `
            <div class="card follow-up-widget bday-card-shell" id="birthdays-card">
                <div class="bday-card-header" style="margin-bottom: 0.75rem;">
                    <h3 class="card-title" style="font-size: 1.15rem; font-weight: 700; margin: 0;">${party} Upcoming Birthdays</h3>
                </div>
                <div class="bday-list-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
        `;

        if (birthdays.length === 0) {
            html += `
                <div class="birthday-empty">
                    <span class="material-icons-round">celebration</span>
                    <p>No birthdays today.</p>
                </div>
            `;
        } else {
            birthdays.forEach((member) => {
                const fullName = member.displayName || 'Member';
                const initials = fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase() || 'M';
                const dob = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
                const formattedBirthday = dob && !Number.isNaN(dob.getTime())
                    ? dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : 'Birthday';

                html += `
                    <div class="bday-list-item compact-item">
                        <div class="bday-avatar-circle compact-avatar" style="background: ${getContrastColor(fullName)};">
                            ${escapeHtml(initials)}
                        </div>
                        <div class="bday-details">
                            <span class="bday-name" style="font-size: 0.9rem;">${escapeHtml(fullName)}</span>
                            <span class="bday-subtext" style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">
                                Turning ${Number(member.age || 0)} today • ${escapeHtml(formattedBirthday)}
                            </span>
                        </div>
                        <button class="bday-wish-btn btn-pill" type="button" data-action="wish-birthday" data-phone="${escapeHtml(member.contactNo || '')}" data-name="${escapeHtml(fullName)}" title="Send Birthday Wish">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="${whatsappPath}"></path></svg>
                            Wish them
                        </button>
                    </div>
                `;
            });
        }

        html += '</div></div>';

        const birthdayContainer = document.querySelector('[data-widget="birthdays"]');
        if (birthdayContainer) {
            birthdayContainer.innerHTML = html;
        }
    };

    const renderRenewalFollowupsWidget = (renewals = dashboardState.renewals) => {
        const whatsappPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';

        let html = `
            <div class="card follow-up-widget">
                <div class="widget-header">
                    <span class="material-icons-round">event_repeat</span>
                    <h4>Renewal Follow-ups</h4>
                    <span class="widget-count">${renewals.length}</span>
                </div>
                <div class="widget-content">
        `;

        if (renewals.length === 0) {
            html += '<p style="color: var(--on-surface-variant); font-size: 0.9rem;">No renewals due this week</p>';
        } else {
            html += '<ul class="follow-up-list">';

            renewals.forEach((member) => {
                const daysLeft = Number(member.daysLeft || 0);
                const urgency = daysLeft <= 3 ? 'urgent' : daysLeft <= 5 ? 'warning' : 'info';

                html += `
                    <li class="follow-up-item">
                        <div class="item-info">
                            <span class="item-name">${escapeHtml(member.displayName || 'Member')}</span>
                            <span class="item-detail ${urgency}">${daysLeft} day${daysLeft === 1 ? '' : 's'} left • ${escapeHtml(member.packageName || 'Membership')}</span>
                        </div>
                        <div class="follow-up-actions">
                            <button class="btn-action" type="button" data-action="send-renewal" data-phone="${escapeHtml(member.contactNo || '')}" data-name="${escapeHtml(member.displayName || 'Member')}" data-date="${escapeHtml(member.endDate || '')}" title="Send Renewal Reminder" style="color: #25D366; background: rgba(37, 211, 102, 0.1); border-radius: 50%; padding: 6px;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="${whatsappPath}"></path></svg>
                            </button>
                        </div>
                    </li>
                `;
            });

            html += '</ul>';
        }

        html += '</div></div>';

        const followupContainer = document.querySelector('[data-widget="renewals"]');
        if (followupContainer) {
            followupContainer.innerHTML = html;
        }
    };

    const renderRecentActivity = (recentActivity = dashboardState.recentActivity) => {
        const tbody = document.querySelector('#recent-activity-table tbody');
        if (!tbody) {
            return;
        }

        if (recentActivity.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-secondary);">No recent activity yet.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentActivity.map((entry) => {
            const normalizedStatus = String(entry.status || '').toLowerCase();
            const statusClass = normalizedStatus === 'active' ? 'status-active' : 'status-inactive';
            const statusText = normalizedStatus ? `${normalizedStatus[0].toUpperCase()}${normalizedStatus.slice(1)}` : 'Processed';

            return `
                <tr>
                    <td>${escapeHtml(entry.user || 'Activity')}</td>
                    <td>${escapeHtml(entry.type || 'General')}</td>
                    <td>${formatINR(Number(entry.amount || 0))}</td>
                    <td><span class="status-pill ${statusClass}">${escapeHtml(statusText)}</span></td>
                </tr>
            `;
        }).join('');
    };

    const initialize = async () => {
        renderLoadingState();

        const data = await fetchDashboardData();
        updateDashboardUI(data);
        console.log('[DashboardAnalytics] Initialized with API data');
    };

    const refresh = async () => {
        await initialize();
    };

    return {
        fetchDashboardData,
        calculateTodaysCollection,
        getActiveSubscriptions,
        getExpiringMembers,
        getActiveMembersList,
        getTodaysIncomeList,
        getExpiringSoonList,
        getUpcomingBirthdays,
        getRenewalFollowups,
        getRecentActivity: getRecentActivityData,
        getTotalIncome,
        getTotalExpenses,
        calculateNetProfit,
        getExpensesByCategory,
        updateDashboardUI,
        renderMetricCards,
        renderBirthdaysWidget,
        renderRenewalFollowupsWidget,
        renderRecentActivity,
        initialize,
        refresh
    };
})();

window.addEventListener('DOMContentLoaded', () => {
    if (typeof DashboardAnalytics !== 'undefined') {
        setTimeout(() => {
            DashboardAnalytics.initialize();
        }, 500);
    }
});
