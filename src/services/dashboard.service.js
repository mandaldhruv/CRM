const db = require('../../db');

const mapBirthdayRows = (rows = []) => rows.map((member) => ({
    first_name: member.first_name || '',
    last_name: member.last_name || '',
    date_of_birth: member.date_of_birth || null
}));

const getDashboardStats = async (branchId = null) => {
    try {
        const resolvedBranchId = branchId || '00000000-0000-0000-0000-000000000001';

        const statsQuery = `
            SELECT
                COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN total_paid ELSE 0 END), 0) AS todays_collection,
                COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions,
                COUNT(*) FILTER (
                    WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                ) AS expiring_soon
            FROM members
            WHERE branch_id = $1::uuid;
        `;

        const recentActivityQuery = `
            SELECT
                first_name,
                last_name,
                COALESCE(total_paid, 0) AS amount,
                created_at,
                status
            FROM members
            WHERE branch_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT 5;
        `;

        const birthdaysQuery = `
            SELECT
                first_name,
                last_name,
                date_of_birth
            FROM members
            WHERE branch_id = $1::uuid
              AND status = 'active'
              AND EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(DAY FROM date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
            ORDER BY first_name ASC, last_name ASC;
        `;

        const activeMembersListQuery = `
            SELECT
                first_name,
                last_name,
                contact_no,
                end_date
            FROM members
            WHERE branch_id = $1::uuid
              AND status = 'active'
            ORDER BY first_name ASC, last_name ASC;
        `;

        const todaysIncomeListQuery = `
            SELECT
                first_name,
                last_name,
                COALESCE(total_paid, 0) AS amount,
                package_name
            FROM members
            WHERE branch_id = $1::uuid
              AND created_at::date = CURRENT_DATE
              AND COALESCE(total_paid, 0) > 0
            ORDER BY first_name ASC, last_name ASC;
        `;

        const expiringSoonListQuery = `
            SELECT
                first_name,
                last_name,
                end_date,
                contact_no
            FROM members
            WHERE branch_id = $1::uuid
              AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
            ORDER BY end_date ASC, first_name ASC, last_name ASC;
        `;

        const [
            statsResult,
            recentActivityResult,
            birthdaysResult,
            activeMembersListResult,
            todaysIncomeListResult,
            expiringSoonListResult
        ] = await Promise.all([
            db.query(statsQuery, [resolvedBranchId]),
            db.query(recentActivityQuery, [resolvedBranchId]),
            db.query(birthdaysQuery, [resolvedBranchId]),
            db.query(activeMembersListQuery, [resolvedBranchId]),
            db.query(todaysIncomeListQuery, [resolvedBranchId]),
            db.query(expiringSoonListQuery, [resolvedBranchId])
        ]);

        const stats = statsResult.rows[0] || {};

        return {
            todays_collection: Number(stats.todays_collection || 0),
            active_subscriptions: Number(stats.active_subscriptions || 0),
            expiring_soon: Number(stats.expiring_soon || 0),
            birthdays: mapBirthdayRows(birthdaysResult.rows),
            activeMembersList: activeMembersListResult.rows.map((member) => ({
                first_name: member.first_name || '',
                last_name: member.last_name || '',
                contact_no: member.contact_no || '',
                end_date: member.end_date || null
            })),
            todaysIncomeList: todaysIncomeListResult.rows.map((member) => ({
                first_name: member.first_name || '',
                last_name: member.last_name || '',
                amount: Number(member.amount || 0),
                package_name: member.package_name || ''
            })),
            expiringSoonList: expiringSoonListResult.rows.map((member) => ({
                first_name: member.first_name || '',
                last_name: member.last_name || '',
                end_date: member.end_date || null,
                contact_no: member.contact_no || ''
            })),
            recent_activity: recentActivityResult.rows.map((member) => ({
                user: [member.first_name, member.last_name].filter(Boolean).join(' ').trim() || 'Unnamed Member',
                type: 'New Member',
                amount: Number(member.amount || 0),
                status: member.status || 'active',
                created_at: member.created_at
            }))
        };
    } catch (error) {
        console.error('[DashboardService] Failed to fetch dashboard stats.', error);
        throw new Error('Unable to fetch dashboard stats');
    }
};

const getBirthdays = async (branchId = null) => {
    try {
        const resolvedBranchId = branchId || '00000000-0000-0000-0000-000000000001';

        const query = `
            SELECT
                first_name,
                last_name,
                date_of_birth,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))::int AS age
            FROM members
            WHERE branch_id = $1::uuid
              AND status = 'active'
              AND EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(DAY FROM date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
            ORDER BY first_name ASC, last_name ASC;
        `;

        const { rows } = await db.query(query, [resolvedBranchId]);
        return rows.map((member) => ({
            id: `${member.first_name || ''}-${member.last_name || ''}-${member.date_of_birth || ''}`,
            branch_id: resolvedBranchId,
            display_name: [member.first_name, member.last_name].filter(Boolean).join(' ').trim() || 'Member',
            contact_no: '',
            date_of_birth: member.date_of_birth,
            age: member.age
        }));
    } catch (error) {
        console.error('[DashboardService] Failed to fetch birthdays.');
        throw new Error('Unable to fetch dashboard birthdays');
    }
};

const getRenewals = async (branchId = null) => {
    try {
        const query = `
            SELECT
                id,
                branch_id,
                display_name,
                contact_no,
                package_name,
                end_date,
                (end_date - CURRENT_DATE) AS days_left
            FROM members
            WHERE ($1::uuid IS NULL OR branch_id = $1::uuid)
              AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
            ORDER BY end_date ASC, display_name ASC;
        `;

        const { rows } = await db.query(query, [branchId]);
        return rows;
    } catch (error) {
        console.error('[DashboardService] Failed to fetch renewals.');
        throw new Error('Unable to fetch dashboard renewals');
    }
};

const getRecentActivity = async (branchId = null) => {
    try {
        const query = `
            SELECT
                id AS activity_id,
                branch_id,
                created_at AS activity_date,
                'income' AS activity_type,
                TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) AS entity_name,
                'New Member' AS activity_label,
                COALESCE(total_paid, 0) AS amount,
                'Success' AS status_text
            FROM members
            WHERE ($1::uuid IS NULL OR branch_id = $1::uuid)
            ORDER BY created_at DESC
            LIMIT 5;
        `;

        const { rows } = await db.query(query, [branchId]);
        return rows;
    } catch (error) {
        console.error('[DashboardService] Failed to fetch recent activity.');
        throw new Error('Unable to fetch dashboard recent activity');
    }
};

module.exports = {
    getDashboardStats,
    getBirthdays,
    getRenewals,
    getRecentActivity
};
