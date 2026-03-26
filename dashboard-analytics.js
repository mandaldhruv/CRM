/**
 * ============================================================================
 * DASHBOARD ANALYTICS MODULE
 * Real-time metrics calculation and widget rendering
 * ============================================================================
 */

const DashboardAnalytics = (() => {
    /**
     * Get today's date as string (YYYY-MM-DD)
     */
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    /**
     * Get date N days ago
     */
    const getDateNDaysAgo = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    };

    /**
     * Get future date N days from now
     */
    const getDateNDaysFromNow = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    };

    /**
     * Calculate today's collection
     * Sum of all receipts from today
     */
    const calculateTodaysCollection = () => {
        const today = getTodayDate();
        const receipts = StateManager.Receipts.getAll() || [];

        return receipts
            .filter((receipt) => receipt.receiptDate === today || receipt.createdAt?.split('T')[0] === today)
            .reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
    };

    /**
     * Count active gym memberships
     * Members with status = "active"
     */
    const getActiveSubscriptions = () => {
        const members = StateManager.Members.getAll() || [];
        return members.filter((member) => member.status === 'active').length;
    };

    /**
     * Get memberships expiring in less than 7 days
     */
    const getExpiringMembers = (days = 7) => {
        const members = StateManager.Members.getAll() || [];
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

        return members.filter((member) => {
            if (!member.endDate || member.status !== 'active') return false;
            const endDate = new Date(member.endDate);
            return endDate <= futureDate && endDate >= today;
        });
    };

    /**
     * Get upcoming birthdays in the next N days
     */
    const getUpcomingBirthdays = (days = 30) => {
        const members = StateManager.Members.getAll() || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return members
            .map((member) => {
                if (!member.dob) return null;
                const dob = new Date(member.dob);
                if (Number.isNaN(dob.getTime())) return null;

                const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                }

                const diffMs = nextBirthday.getTime() - today.getTime();
                const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
                if (daysUntil < 0 || daysUntil > days) return null;

                return {
                    ...member,
                    nextBirthday,
                    daysUntil,
                    upcomingAge: nextBirthday.getFullYear() - dob.getFullYear()
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.nextBirthday - b.nextBirthday);
    };

    /**
     * Get renewal follow-ups (expiring in 7 days)
     */
    const getRenewalFollowups = () => getExpiringMembers(7);

    /**
     * Get total income (sum of receipts)
     */
    const getTotalIncome = () => {
        const receipts = StateManager.Receipts.getAll() || [];
        return receipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
    };

    /**
     * Get total expenses (sum of expense amounts, not discounts)
     */
    const getTotalExpenses = () => {
        const expenses = StateManager.Expenses.getAll() || [];
        return expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    };

    /**
     * Calculate net profit
     * Total Income - Total Expenses
     */
    const calculateNetProfit = () => getTotalIncome() - getTotalExpenses();

    /**
     * Get expenses by category for current month
     */
    const getExpensesByCategory = () => {
        const expenses = StateManager.Expenses.getAll() || [];
        const today = new Date();
        const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');

        const thisMonthExpenses = expenses.filter((expense) => {
            const expenseMonth = expense.createdAt?.split('T')[0].substring(0, 7) || expense.expenseDate?.substring(0, 7);
            return expenseMonth === currentMonth;
        });

        const categories = {};
        thisMonthExpenses.forEach((expense) => {
            const category = expense.category || 'Other';
            categories[category] = (categories[category] || 0) + parseFloat(expense.amount || 0);
        });

        return categories;
    };

    /**
     * Render metric cards dynamically
     */
    const renderMetricCards = () => {
        const todaysCollection = calculateTodaysCollection();
        const activeMembers = getActiveSubscriptions();
        const expiringCount = getExpiringMembers().length;
        const netProfit = calculateNetProfit();

        const containerHTML = `
            <div class="card stat-card stat-card-collection" data-stat-type="collection" style="cursor:pointer;" title="Click to view today's receipts">
                <div class="metric-label">Today's Collection</div>
                <div class="metric-value">${formatINR(todaysCollection)}</div>
                <div class="metric-trend">
                    <span class="material-icons-round" style="font-size: 0.9rem;">trending_up</span> Real-time
                </div>
            </div>

            <div class="card stat-card stat-card-active" data-stat-type="active" style="cursor:pointer;" title="Click to view active members">
                <div class="metric-label">Active Subscriptions</div>
                <div class="metric-value">${activeMembers}</div>
                <div class="metric-trend">
                    <span class="material-icons-round" style="font-size: 0.9rem;">people</span> Active Members
                </div>
            </div>

            <div class="card stat-card stat-card-expiring" data-stat-type="expiring" style="cursor:pointer;" title="Click to view expiring memberships">
                <div class="metric-label">Expiring Soon</div>
                <div class="metric-value">${expiringCount}</div>
                <div class="metric-trend">
                    <span class="material-icons-round" style="font-size: 0.9rem;">schedule</span> Next 7 Days
                </div>
            </div>

            <div class="card stat-card stat-card-profit" data-stat-type="profit" style="cursor:pointer;" title="Click to view income vs expenses">
                <div class="metric-label">Net Profit</div>
                <div class="metric-value" style="color: var(--success);">${formatINR(netProfit)}</div>
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

    /**
     * Render today's birthdays widget
     */
    const renderBirthdaysWidget = () => {
        const birthdays = getUpcomingBirthdays();
        const whatsappPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';
        const getContrastColor = (seed = '') => {
            const palette = ['#6D5EF5', '#F97316', '#0EA5E9', '#10B981', '#D946EF', '#F59E0B'];
            const hash = String(seed).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            return palette[hash % palette.length];
        };
        const party = String.fromCodePoint(0x1F382);
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();

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
                    <p>No upcoming birthdays.</p>
                </div>
            `;
        } else {
            birthdays.forEach((member) => {
                const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member';
                const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'M';
                const formattedBday = member.nextBirthday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                const dob = new Date(member.dob);
                const isToday = dob.getDate() === currentDay && dob.getMonth() === currentMonth;
                const gender = (member.gender || '').toLowerCase();
                let pronoun = 'them';
                if (gender === 'male') pronoun = 'him';
                if (gender === 'female') pronoun = 'her';
                html += `
                    <div class="bday-list-item compact-item">
                        <div class="bday-avatar-circle compact-avatar" style="background: ${getContrastColor(fullName)};">
                            ${initials}
                        </div>
                        <div class="bday-details">
                            <span class="bday-name" style="font-size: 0.9rem;">${fullName}</span>
                            ${isToday
                                ? `<span class="bday-subtext" style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">Turning ${member.upcomingAge} TODAY! ${String.fromCodePoint(0x1F389)}</span>`
                                : `<span class="bday-subtext" style="font-size: 0.75rem;">Turning ${member.upcomingAge} on ${formattedBday}</span>`}
                        </div>
                        ${isToday ? `
                            <button class="bday-wish-btn btn-pill" type="button" data-action="wish-birthday" data-phone="${String(member.contact || '').replace(/"/g, '&quot;')}" data-name="${String(member.firstName || '').replace(/"/g, '&quot;')}" title="Send Birthday Wish">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="${whatsappPath}"></path></svg>
                                Wish ${pronoun}
                            </button>
                        ` : ''}
                    </div>
                `;
            });
        }

        html += `</div></div>`;

        const birthdayContainer = document.querySelector('[data-widget="birthdays"]');
        if (birthdayContainer) {
            birthdayContainer.innerHTML = html;
        }
    };

    /**
     * Render renewal follow-ups widget
     */
    const renderRenewalFollowupsWidget = () => {
        const followups = getRenewalFollowups();

        let html = `
            <div class="card follow-up-widget">
                <div class="widget-header">
                    <span class="material-icons-round">event_repeat</span>
                    <h4>Renewal Follow-ups</h4>
                    <span class="widget-count">${followups.length}</span>
                </div>
                <div class="widget-content">
        `;

        if (followups.length === 0) {
            html += `<p style="color: var(--on-surface-variant); font-size: 0.9rem;">No renewals due this week</p>`;
        } else {
            html += `<ul class="follow-up-list">`;
            followups.forEach((member) => {
                const endDate = new Date(member.endDate);
                const today = new Date();
                const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                const urgency = daysLeft <= 3 ? 'urgent' : daysLeft <= 5 ? 'warning' : 'info';

                html += `
                    <li class="follow-up-item">
                        <div class="item-info">
                            <span class="item-name">${member.firstName} ${member.lastName}</span>
                            <span class="item-detail ${urgency}">${daysLeft} day${daysLeft === 1 ? '' : 's'} left • ${member.package}</span>
                        </div>
                        <div class="follow-up-actions">
                            <button class="btn-action" type="button" data-action="send-renewal" data-phone="${String(member.contact || '').replace(/"/g, '&quot;')}" data-name="${String(member.firstName || '').replace(/"/g, '&quot;')}" data-date="${String(member.endDate || '').replace(/"/g, '&quot;')}" title="Send Renewal Reminder" style="color: #25D366; background: rgba(37, 211, 102, 0.1); border-radius: 50%; padding: 6px;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            </button>
                            <button class="btn-action" onclick="MemberModule.openForm(StateManager.Members.getById('${member.id}'))">
                                <span class="material-icons-round">edit</span>
                            </button>
                        </div>
                    </li>
                `;
            });
            html += `</ul>`;
        }

        html += `</div></div>`;

        const followupContainer = document.querySelector('[data-widget="renewals"]');
        if (followupContainer) {
            followupContainer.innerHTML = html;
        }
    };

    const parseActivityDate = (value) => {
        if (!value) return new Date(0);
        if (value instanceof Date) return value;

        const raw = String(value).trim();
        if (!raw) return new Date(0);

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
            const [day, month, year] = raw.split('/').map(Number);
            return new Date(year, month - 1, day);
        }

        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    const renderRecentActivity = () => {
        const tbody = document.querySelector('#recent-activity-table tbody');
        if (!tbody) return;

        const receipts = (StateManager.Receipts.getAll?.() || []).map((receipt) => ({
            date: parseActivityDate(receipt.receiptDate || receipt.createdAt),
            user: receipt.memberName || receipt.name || receipt.memberId || 'Member Payment',
            type: receipt.package ? `Revenue • ${receipt.package}` : 'Revenue • Membership',
            amount: Number(receipt.amount) || 0,
            statusText: 'Processed',
            statusClass: 'status-active'
        }));

        const expenses = (StateManager.Expenses.getAll?.() || []).map((expense) => ({
            date: parseActivityDate(expense.expenseDate || expense.createdAt),
            user: expense.vendor || expense.title || expense.name || expense.category || 'Expense',
            type: expense.category ? `Expense • ${expense.category}` : 'Expense • General',
            amount: Number(expense.amount) || 0,
            statusText: 'Success',
            statusClass: 'status-inactive'
        }));

        const rows = [...receipts, ...expenses]
            .sort((a, b) => b.date - a.date)
            .slice(0, 6);

        if (rows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-secondary);">No recent activity yet.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rows.map((entry) => `
            <tr>
                <td>${entry.user}</td>
                <td>${entry.type}</td>
                <td>${formatINR(entry.amount)}</td>
                <td><span class="status-pill ${entry.statusClass}">${entry.statusText}</span></td>
            </tr>
        `).join('');
    };

    /**
     * Initialize dashboard analytics
     */
    const initialize = () => {
        renderMetricCards();
        renderBirthdaysWidget();
        renderRenewalFollowupsWidget();
        renderRecentActivity();
        console.log('[DashboardAnalytics] Initialized');
    };

    /**
     * Refresh all dashboard components
     */
    const refresh = () => {
        initialize();
    };

    /**
     * Public API
     */
    return {
        calculateTodaysCollection,
        getActiveSubscriptions,
        getExpiringMembers,
        getUpcomingBirthdays,
        getRenewalFollowups,
        getTotalIncome,
        getTotalExpenses,
        calculateNetProfit,
        getExpensesByCategory,
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
