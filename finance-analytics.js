/**
 * ============================================================================
 * FINANCE ANALYTICS MODULE
 * Charts and financial metrics visualization using Chart.js
 * ============================================================================
 */

const FinanceAnalytics = (() => {
    let collectionVsExpensesChart = null;
    let revenueByPackageChart = null;
    const escapeHTML = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    /**
     * Get current year
     */
    const getCurrentYear = () => new Date().getFullYear();

    /**
     * Get monthly collection data for current year
     */
    const getMonthlyCollectionData = () => {
        const receipts = StateManager.Receipts.getAll() || [];
        const currentYear = getCurrentYear();
        const monthlyData = Array(12).fill(0);

        receipts.forEach((receipt) => {
            const receiptDate = receipt.receiptDate || receipt.createdAt?.split('T')[0];
            if (!receiptDate) return;

            const [year, month] = receiptDate.split('-');
            if (parseInt(year, 10) === currentYear) {
                const monthIndex = parseInt(month, 10) - 1;
                monthlyData[monthIndex] += parseFloat(receipt.amount || 0);
            }
        });

        return monthlyData;
    };

    /**
     * Get monthly expense data for current year
     */
    const getMonthlyExpenseData = () => {
        const expenses = StateManager.Expenses.getAll() || [];
        const currentYear = getCurrentYear();
        const monthlyData = Array(12).fill(0);

        expenses.forEach((expense) => {
            const expenseDate = expense.expenseDate || expense.createdAt?.split('T')[0];
            if (!expenseDate) return;

            const [year, month] = expenseDate.split('-');
            if (parseInt(year, 10) === currentYear) {
                const monthIndex = parseInt(month, 10) - 1;
                monthlyData[monthIndex] += parseFloat(expense.amount || 0);
            }
        });

        return monthlyData;
    };

    /**
     * Get revenue breakdown by package type
     */
    const getRevenueByPackage = () => {
        const receipts = StateManager.Receipts.getAll() || [];
        const packageData = {};

        receipts.forEach((receipt) => {
            const packageName = receipt.package || 'Other';
            packageData[packageName] = (packageData[packageName] || 0) + parseFloat(receipt.amount || 0);
        });

        return packageData;
    };

    /**
     * Get formatted package names
     */
    const formatPackageName = (pkg) => {
        const names = {
            'basic-3m': 'Basic (3M)',
            'basic-6m': 'Basic (6M)',
            'basic-12m': 'Basic (12M)',
            'premium-3m': 'Premium (3M)',
            'premium-6m': 'Premium (6M)',
            'premium-12m': 'Premium (12M)',
            'elite-3m': 'Elite (3M)',
            'elite-6m': 'Elite (6M)',
            'elite-12m': 'Elite (12M)',
            'pt-session': 'PT Sessions'
        };
        return names[pkg] || pkg;
    };

    /**
     * Chart tick formatter for compact INR values
     */
    const formatINRTick = (value) => {
        const numericValue = Number(value || 0);
        if (Math.abs(numericValue) >= 1000) {
            return `${formatINR(Math.round(numericValue / 1000))}K`;
        }
        return formatINR(numericValue);
    };

    /**
     * Create Collection vs Expenses line chart
     */
    const renderCollectionVsExpensesChart = () => {
        const ctx = document.getElementById('collectionVsExpensesChart');
        if (!ctx) return;

        const collectionData = getMonthlyCollectionData();
        const expenseData = getMonthlyExpenseData();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (collectionVsExpensesChart) {
            collectionVsExpensesChart.destroy();
        }

        collectionVsExpensesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Collection',
                        data: collectionData,
                        borderColor: '#2e7d32',
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#2e7d32',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#ba1a1a',
                        backgroundColor: 'rgba(186, 26, 26, 0.08)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ba1a1a',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: '600' },
                            color: '#464555',
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 28, 47, 0.9)',
                        padding: 12,
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        displayColors: true,
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatINR(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(13, 28, 47, 0.08)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#464555',
                            callback: (value) => formatINRTick(value)
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 11 },
                            color: '#464555'
                        }
                    }
                }
            }
        });
    };

    /**
     * Create Revenue by Package doughnut chart
     */
    const renderRevenueByPackageChart = () => {
        const ctx = document.getElementById('revenueByPackageChart');
        if (!ctx) return;

        const packageData = getRevenueByPackage();
        const labels = Object.keys(packageData).map((pkg) => formatPackageName(pkg));
        const data = Object.values(packageData);
        const colors = ['#3525cd', '#4f46e5', '#2e7d32', '#1976d2', '#ed6c02', '#ba1a1a', '#7c3aed', '#0891b2'];

        if (revenueByPackageChart) {
            revenueByPackageChart.destroy();
        }

        revenueByPackageChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length > 0 ? labels : ['No Data'],
                datasets: [
                    {
                        data: data.length > 0 ? data : [1],
                        backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
                        borderColor: '#fff',
                        borderWidth: 2,
                        hoverOffset: 10
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12, weight: '600' },
                            color: '#464555',
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 28, 47, 0.9)',
                        padding: 12,
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                const value = Number(context.parsed || 0);
                                const total = context.dataset.data.reduce((sum, item) => sum + Number(item || 0), 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                return `${formatINR(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    };

    /**
     * Calculate total income
     */
    const calculateTotalIncome = () => {
        const receipts = StateManager.Receipts.getAll() || [];
        return receipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0);
    };

    /**
     * Calculate total expenses
     */
    const calculateTotalExpenses = () => {
        const expenses = StateManager.Expenses.getAll() || [];
        return expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    };

    /**
     * Calculate net profit
     */
    const calculateNetProfit = () => calculateTotalIncome() - calculateTotalExpenses();

    /**
     * Render finance metric cards
     */
    const renderFinanceMetrics = () => {
        const totalIncome = calculateTotalIncome();
        const totalExpenses = calculateTotalExpenses();
        const netProfit = calculateNetProfit();

        const metricsHTML = `
            <div class="card stat-card metric-card finance-click-card" style="cursor: pointer; transition: transform 0.2s;" data-action="view-revenue-details">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">${formatINR(totalIncome)}</div>
                <div class="metric-trend" style="color: var(--success);">
                    <span class="material-icons-round" style="font-size: 0.9rem;">trending_up</span> Memberships
                </div>
            </div>

            <div class="card stat-card metric-card finance-click-card" style="cursor: pointer; transition: transform 0.2s;" data-action="view-expense-details">
                <div class="metric-label">Total Expenses</div>
                <div class="metric-value">${formatINR(totalExpenses)}</div>
                <div class="metric-trend" style="color: var(--warning);">
                    <span class="material-icons-round" style="font-size: 0.9rem;">trending_down</span> Operating Costs
                </div>
            </div>

            <div class="card stat-card metric-card finance-click-card" style="background: var(--primary-gradient); color: white; cursor: pointer; transition: transform 0.2s;" data-action="view-profit-details">
                <div class="metric-label">Net Profit</div>
                <div class="metric-value">${formatINR(netProfit)}</div>
                <div class="metric-trend" style="color: rgba(255,255,255,0.8);">
                    <span class="material-icons-round" style="font-size: 0.9rem;">account_balance</span> Bottom Line
                </div>
            </div>
        `;

        const metricsContainer = document.querySelector('[data-metrics-container="finance"]');
        if (metricsContainer) {
            metricsContainer.innerHTML = metricsHTML;
        }
    };

    const getRecords = (source) => {
        if (!source) return [];
        if (typeof source.getAll === 'function') {
            return source.getAll() || [];
        }
        return Array.isArray(source) ? source : [];
    };

    const openTransactionDetails = (type = 'revenue') => {
        let title = '';
        let tableHTML = '<table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">';
        tableHTML += '<thead><tr style="border-bottom: 2px solid var(--border-color);"><th style="padding: 10px;">Date</th>';

        if (type === 'revenue') {
            title = 'Revenue Breakdown';
            tableHTML += '<th style="padding: 10px;">Member / Detail</th><th style="padding: 10px;">Amount</th></tr></thead><tbody>';
            const receipts = getRecords(window.StateManager?.Receipts);

            if (receipts.length === 0) {
                tableHTML += '<tr><td colspan="3" style="padding: 15px; text-align: center;">No revenue recorded yet.</td></tr>';
            } else {
                [...receipts]
                    .sort((a, b) => new Date(b.date || b.receiptDate || b.createdAt || 0) - new Date(a.date || a.receiptDate || a.createdAt || 0))
                    .forEach((r) => {
                        const dateValue = r.date || r.receiptDate || r.createdAt || '';
                        const parsedDate = new Date(dateValue);
                        const dateStr = Number.isNaN(parsedDate.getTime())
                            ? escapeHTML(String(dateValue || 'N/A'))
                            : parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        const amount = parseFloat(r.amount || 0).toLocaleString('en-IN');
                        tableHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 10px;">${dateStr}</td><td style="padding: 10px;">${escapeHTML(r.memberName || r.description || r.package || 'Payment')}</td><td style="padding: 10px; color: #25D366; font-weight: bold;">₹${amount}</td></tr>`;
                    });
            }
        } else if (type === 'expenses') {
            title = 'Expense Breakdown';
            tableHTML += '<th style="padding: 10px;">Category / Vendor</th><th style="padding: 10px;">Amount</th></tr></thead><tbody>';
            const expenses = getRecords(window.StateManager?.Expenses);

            if (expenses.length === 0) {
                tableHTML += '<tr><td colspan="3" style="padding: 15px; text-align: center;">No expenses recorded yet.</td></tr>';
            } else {
                [...expenses]
                    .sort((a, b) => new Date(b.date || b.expenseDate || b.createdAt || 0) - new Date(a.date || a.expenseDate || a.createdAt || 0))
                    .forEach((e) => {
                        const dateValue = e.date || e.expenseDate || e.createdAt || '';
                        const parsedDate = new Date(dateValue);
                        const dateStr = Number.isNaN(parsedDate.getTime())
                            ? escapeHTML(String(dateValue || 'N/A'))
                            : parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        const amount = parseFloat(e.amount || 0).toLocaleString('en-IN');
                        tableHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 10px;">${dateStr}</td><td style="padding: 10px;">${escapeHTML(`${e.category || 'Expense'} - ${e.vendor || e.title || ''}`.trim())}</td><td style="padding: 10px; color: #ff4d4d; font-weight: bold;">₹${amount}</td></tr>`;
                    });
            }
        } else if (type === 'profit') {
            title = 'Net Profit Analysis';
            tableHTML += '<th style="padding: 10px;">Metric</th><th style="padding: 10px;">Total</th></tr></thead><tbody>';

            const receipts = getRecords(window.StateManager?.Receipts);
            const expenses = getRecords(window.StateManager?.Expenses);

            const totalRev = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
            const totalExp = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            const net = totalRev - totalExp;
            const netColor = net >= 0 ? '#25D366' : '#ff4d4d';

            tableHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 10px;">Total Revenue Generated</td><td style="padding: 10px; font-weight: bold;">₹${totalRev.toLocaleString('en-IN')}</td></tr>`;
            tableHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 10px;">Total Expenses Incurred</td><td style="padding: 10px; font-weight: bold;">₹${totalExp.toLocaleString('en-IN')}</td></tr>`;
            tableHTML += `<tr style="background: var(--bg-soft);"><td style="padding: 10px; font-weight: bold;">Overall Net Profit</td><td style="padding: 10px; color: ${netColor}; font-weight: bold; font-size: 1.1rem;">₹${net.toLocaleString('en-IN')}</td></tr>`;
        }

        tableHTML += '</tbody></table>';

        if (window.UIComponents && window.UIComponents.openModal) {
            window.UIComponents.openModal(title, { content: tableHTML });
        } else {
            console.error('UIComponents.openModal is not available.');
        }
    };

    window.FinanceAnalytics = window.FinanceAnalytics || {};
    window.FinanceAnalytics.openTransactionDetails = openTransactionDetails;

    /**
     * Initialize finance analytics
     */
    const initialize = () => {
        renderFinanceMetrics();
        renderCollectionVsExpensesChart();
        renderRevenueByPackageChart();
        console.log('[FinanceAnalytics] Initialized with Chart.js');
    };

    /**
     * Refresh all charts and metrics
     */
    const refresh = () => {
        initialize();
        window.DashboardAnalytics?.refresh?.();
    };

    /**
     * Public API
     */
    return {
        getMonthlyCollectionData,
        getMonthlyExpenseData,
        getRevenueByPackage,
        calculateTotalIncome,
        calculateTotalExpenses,
        calculateNetProfit,
        renderFinanceMetrics,
        renderCollectionVsExpensesChart,
        renderRevenueByPackageChart,
        openTransactionDetails,
        initialize,
        refresh
    };
})();

window.addEventListener('DOMContentLoaded', () => {
    if (typeof FinanceAnalytics !== 'undefined') {
        const checkChartJS = setInterval(() => {
            if (typeof Chart !== 'undefined') {
                clearInterval(checkChartJS);
                setTimeout(() => {
                    FinanceAnalytics.initialize();
                }, 100);
            }
        }, 100);
    }
});
