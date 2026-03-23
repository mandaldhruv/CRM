/**
 * ============================================================================
 * FINANCE ANALYTICS MODULE
 * Charts and financial metrics visualization using Chart.js
 * ============================================================================
 */

const FinanceAnalytics = (() => {
    let collectionVsExpensesChart = null;
    let revenueByPackageChart = null;

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
            <div class="card stat-card metric-card">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">${formatINR(totalIncome)}</div>
                <div class="metric-trend" style="color: var(--success);">
                    <span class="material-icons-round" style="font-size: 0.9rem;">trending_up</span> Memberships
                </div>
            </div>

            <div class="card stat-card metric-card">
                <div class="metric-label">Total Expenses</div>
                <div class="metric-value">${formatINR(totalExpenses)}</div>
                <div class="metric-trend" style="color: var(--warning);">
                    <span class="material-icons-round" style="font-size: 0.9rem;">trending_down</span> Operating Costs
                </div>
            </div>

            <div class="card stat-card metric-card" style="background: var(--primary-gradient); color: white;">
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
