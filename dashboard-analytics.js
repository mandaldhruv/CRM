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
     * Get members with birthdays today
     */
    const getTodaysBirthdays = () => {
        const members = StateManager.Members.getAll() || [];
        const today = new Date();
        const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        return members.filter((member) => {
            if (!member.dob) return false;
            const dobMMDD = member.dob.substring(5);
            return dobMMDD === todayMMDD;
        });
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
        const birthdays = getTodaysBirthdays();

        let html = `
            <div class="card follow-up-widget">
                <div class="widget-header">
                    <span class="material-icons-round">birthday_cake</span>
                    <h4>Today's Birthdays</h4>
                    <span class="widget-count">${birthdays.length}</span>
                </div>
                <div class="widget-content">
        `;

        if (birthdays.length === 0) {
            html += `<p style="color: var(--on-surface-variant); font-size: 0.9rem;">No birthdays today</p>`;
        } else {
            html += `<ul class="follow-up-list">`;
            birthdays.forEach((member) => {
                const age = new Date().getFullYear() - new Date(member.dob).getFullYear();
                html += `
                    <li class="follow-up-item">
                        <div class="item-info">
                            <span class="item-name">${member.firstName} ${member.lastName}</span>
                            <span class="item-detail">Turning ${age} today</span>
                        </div>
                        <button class="btn-action" onclick="UIComponents.showToast('Send birthday wishes to ${member.firstName}!', 'info', 'Reminder')">
                            <span class="material-icons-round">mail</span>
                        </button>
                    </li>
                `;
            });
            html += `</ul>`;
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
                        <button class="btn-action" onclick="MemberModule.openForm(StateManager.Members.getById('${member.id}'))">
                            <span class="material-icons-round">edit</span>
                        </button>
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

    /**
     * Initialize dashboard analytics
     */
    const initialize = () => {
        renderMetricCards();
        renderBirthdaysWidget();
        renderRenewalFollowupsWidget();
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
        getTodaysBirthdays,
        getRenewalFollowups,
        getTotalIncome,
        getTotalExpenses,
        calculateNetProfit,
        getExpensesByCategory,
        renderMetricCards,
        renderBirthdaysWidget,
        renderRenewalFollowupsWidget,
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
