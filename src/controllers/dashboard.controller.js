const dashboardService = require('../services/dashboard.service');

const toNumber = (value) => Number(value || 0);

const mapBirthdays = (birthdays) => birthdays.map((birthday) => ({
    id: birthday.id,
    branchId: birthday.branch_id,
    displayName: birthday.display_name,
    contactNo: birthday.contact_no,
    dateOfBirth: birthday.date_of_birth,
    age: birthday.age === null ? null : Number(birthday.age)
}));

const mapRenewals = (renewals) => renewals.map((renewal) => ({
    id: renewal.id,
    branchId: renewal.branch_id,
    displayName: renewal.display_name,
    contactNo: renewal.contact_no,
    packageName: renewal.package_name,
    endDate: renewal.end_date,
    daysLeft: Number(renewal.days_left || 0)
}));

const mapRecentActivity = (recentActivity) => recentActivity.map((activity) => ({
    user: activity.user || 'Unnamed Member',
    type: activity.type || 'New Member',
    amount: toNumber(activity.amount),
    status: activity.status || 'active',
    created_at: activity.created_at || null
}));

const getDashboardData = async (req, res, next) => {
    try {
        const branchId = req.query.branchId || '00000000-0000-0000-0000-000000000001';

        const [stats, renewals] = await Promise.all([
            dashboardService.getDashboardStats(branchId),
            dashboardService.getRenewals(branchId)
        ]);

        return res.status(200).json({
            success: true,
            data: {
                pulse: {
                    todaysCollection: toNumber(stats?.todays_collection),
                    activeSubscriptions: Number(stats?.active_subscriptions || 0),
                    expiringSoon: Number(stats?.expiring_soon || 0),
                    netProfit: toNumber(stats?.todays_collection)
                },
                recentActivity: mapRecentActivity(stats?.recent_activity || []),
                activeMembersList: Array.isArray(stats?.activeMembersList) ? stats.activeMembersList : [],
                todaysIncomeList: Array.isArray(stats?.todaysIncomeList) ? stats.todaysIncomeList : [],
                expiringSoonList: Array.isArray(stats?.expiringSoonList) ? stats.expiringSoonList : [],
                todays_collection: toNumber(stats?.todays_collection),
                active_subscriptions: Number(stats?.active_subscriptions || 0),
                expiring_soon: Number(stats?.expiring_soon || 0),
                recent_activity: mapRecentActivity(stats?.recent_activity || []),
                birthdays: mapBirthdays((stats?.birthdays || []).map((birthday) => ({
                    id: `${birthday.first_name || ''}-${birthday.last_name || ''}-${birthday.date_of_birth || ''}`,
                    branch_id: branchId,
                    display_name: [birthday.first_name, birthday.last_name].filter(Boolean).join(' ').trim() || 'Member',
                    contact_no: '',
                    date_of_birth: birthday.date_of_birth,
                    age: birthday.date_of_birth
                        ? Math.max(0, new Date().getFullYear() - new Date(birthday.date_of_birth).getFullYear())
                        : null
                }))),
                renewals: mapRenewals(renewals),
                net_profit: toNumber(stats?.todays_collection)
            }
        });
    } catch (error) {
        const controllerError = new Error('Failed to fetch dashboard data');
        controllerError.statusCode = 500;
        controllerError.publicMessage = 'Unable to load dashboard data at the moment';
        return next(controllerError);
    }
};

module.exports = {
    getDashboardData
};
