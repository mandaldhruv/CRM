const db = require('../../db');

const memberSelectColumns = `
    id,
    branch_id,
    member_code,
    first_name,
    last_name,
    display_name,
    gender,
    date_of_birth,
    email,
    contact_no,
    alternate_contact,
    address,
    city,
    photo_url,
    package_id,
    package_name,
    start_date,
    end_date,
    status,
    balance,
    total_paid,
    referred_by,
    notes,
    created_at,
    updated_at
`;

const getAllMembers = async ({ search = '', branchId = null }) => {
    try {
        const query = `
            SELECT ${memberSelectColumns}
            FROM members
            WHERE ($1::uuid IS NULL OR branch_id = $1::uuid)
              AND (
                    $2::text = ''
                    OR display_name ILIKE '%' || $2 || '%'
                    OR contact_no ILIKE '%' || $2 || '%'
                  )
            ORDER BY created_at DESC;
        `;

        const { rows } = await db.query(query, [branchId, search.trim()]);
        return rows;
    } catch (error) {
        console.error('[MembersService] Failed to fetch members.');
        throw new Error('Unable to fetch members');
    }
};

const getMemberById = async (id) => {
    try {
        const query = `
            SELECT ${memberSelectColumns}
            FROM members
            WHERE id = $1::uuid
            LIMIT 1;
        `;

        const { rows } = await db.query(query, [id]);
        return rows[0] || null;
    } catch (error) {
        console.error('[MembersService] Failed to fetch member by id.');
        throw new Error('Unable to fetch member');
    }
};

const createMember = async (memberData) => {
    try {
        const query = `
            INSERT INTO members (
                branch_id,
                member_code,
                first_name,
                last_name,
                gender,
                date_of_birth,
                email,
                contact_no,
                address,
                city,
                package_name,
                start_date,
                end_date,
                balance,
                total_paid,
                notes,
                status
            )
            VALUES (
                $1::uuid,
                $2,
                $3,
                $4,
                $5::gender_enum,
                $6::date,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12::date,
                $13::date,
                $14::numeric,
                $15::numeric,
                $16,
                $17::member_status_enum
            )
            RETURNING ${memberSelectColumns};
        `;

        const values = [
            memberData.branch_id,
            memberData.member_code,
            memberData.first_name,
            memberData.last_name || null,
            memberData.gender || 'prefer_not_to_say',
            memberData.date_of_birth || null,
            memberData.email || null,
            memberData.contact_no,
            memberData.address || null,
            memberData.city || null,
            memberData.package_name || null,
            memberData.start_date || null,
            memberData.end_date || null,
            memberData.balance ?? 0,
            memberData.total_paid ?? 0,
            memberData.notes || null,
            memberData.status || 'active'
        ];

        const { rows } = await db.query(query, values);
        return rows[0];
    } catch (error) {
        console.error("\n\n!!! DATABASE CRASH REPORT !!!");
        console.error(error);
        console.error("!!! END CRASH REPORT !!!\n\n");
        throw new Error("Unable to create member at the moment");
    }
};

const updateMember = async (id, memberData) => {
    try {
        const query = `
            UPDATE members
            SET
                branch_id = COALESCE($2::uuid, branch_id),
                member_code = COALESCE($3, member_code),
                first_name = COALESCE($4, first_name),
                last_name = COALESCE($5, last_name),
                gender = COALESCE($6::gender_enum, gender),
                date_of_birth = COALESCE($7::date, date_of_birth),
                email = COALESCE($8, email),
                contact_no = COALESCE($9, contact_no),
                alternate_contact = COALESCE($10, alternate_contact),
                address = COALESCE($11, address),
                city = COALESCE($12, city),
                photo_url = COALESCE($13, photo_url),
                package_id = COALESCE($14::uuid, package_id),
                package_name = COALESCE($15, package_name),
                start_date = COALESCE($16::date, start_date),
                end_date = COALESCE($17::date, end_date),
                status = COALESCE($18::member_status_enum, status),
                balance = COALESCE($19::numeric, balance),
                total_paid = COALESCE($20::numeric, total_paid),
                referred_by = COALESCE($21::uuid, referred_by),
                notes = COALESCE($22, notes),
                updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING ${memberSelectColumns};
        `;

        const values = [
            id,
            memberData.branch_id,
            memberData.member_code,
            memberData.first_name,
            memberData.last_name,
            memberData.gender,
            memberData.date_of_birth,
            memberData.email,
            memberData.contact_no,
            memberData.alternate_contact,
            memberData.address,
            memberData.city,
            memberData.photo_url,
            memberData.package_id,
            memberData.package_name,
            memberData.start_date,
            memberData.end_date,
            memberData.status,
            memberData.balance,
            memberData.total_paid,
            memberData.referred_by,
            memberData.notes
        ];

        const { rows } = await db.query(query, values);
        return rows[0] || null;
    } catch (error) {
        console.error('[MembersService] Failed to update member.');
        throw new Error('Unable to update member');
    }
};

const deleteMember = async (id) => {
    try {
        const query = `
            UPDATE members
            SET
                status = 'inactive',
                updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING ${memberSelectColumns};
        `;

        const { rows } = await db.query(query, [id]);
        return rows[0] || null;
    } catch (error) {
        console.error('[MembersService] Failed to delete member.');
        throw new Error('Unable to delete member');
    }
};

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember
};
