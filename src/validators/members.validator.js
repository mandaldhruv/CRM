const { body, param } = require('express-validator');

const GENDER_ENUM = ['male', 'female', 'other', 'prefer_not_to_say'];
const MEMBER_STATUS_ENUM = ['active', 'inactive', 'frozen', 'pending'];

const validateMemberId = [
    param('id')
        .isUUID()
        .withMessage('Member id must be a valid UUID')
];

const validateCreateMember = [
    body('branch_id')
        .trim()
        .notEmpty()
        .withMessage('branch_id is required')
        .bail()
        .isString()
        .withMessage('branch_id must be a string')
        .bail()
        .isLength({ min: 36, max: 36 })
        .withMessage('branch_id must be exactly 36 characters'),
    body('member_code')
        .trim()
        .notEmpty()
        .withMessage('member_code is required')
        .bail()
        .isLength({ max: 30 })
        .withMessage('member_code must be 30 characters or fewer'),
    body('first_name')
        .trim()
        .notEmpty()
        .withMessage('first_name is required')
        .bail()
        .isLength({ max: 80 })
        .withMessage('first_name must be 80 characters or fewer'),
    body('last_name')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 80 })
        .withMessage('last_name must be 80 characters or fewer'),
    body('gender')
        .optional({ nullable: true })
        .isIn(GENDER_ENUM)
        .withMessage(`gender must be one of: ${GENDER_ENUM.join(', ')}`),
    body('date_of_birth')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('date_of_birth must be a valid date in YYYY-MM-DD format'),
    body('email')
        .optional({ nullable: true })
        .trim()
        .isEmail()
        .withMessage('email must be a valid email address')
        .bail()
        .isLength({ max: 180 })
        .withMessage('email must be 180 characters or fewer'),
    body('contact_no')
        .trim()
        .notEmpty()
        .withMessage('contact_no is required')
        .bail()
        .isLength({ max: 20 })
        .withMessage('contact_no must be 20 characters or fewer'),
    body('alternate_contact')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 20 })
        .withMessage('alternate_contact must be 20 characters or fewer'),
    body('address')
        .optional({ nullable: true })
        .trim(),
    body('city')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 80 })
        .withMessage('city must be 80 characters or fewer'),
    body('photo_url')
        .optional({ nullable: true })
        .trim()
        .isURL()
        .withMessage('photo_url must be a valid URL'),
    body('package_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage('package_id must be a valid UUID'),
    body('package_name')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('package_name must be 120 characters or fewer'),
    body('start_date')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('start_date must be a valid date in YYYY-MM-DD format'),
    body('end_date')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('end_date must be a valid date in YYYY-MM-DD format'),
    body('status')
        .optional({ nullable: true })
        .isIn(MEMBER_STATUS_ENUM)
        .withMessage(`status must be one of: ${MEMBER_STATUS_ENUM.join(', ')}`),
    body('balance')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('balance must be a number greater than or equal to 0'),
    body('total_paid')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('total_paid must be a number greater than or equal to 0'),
    body('referred_by')
        .optional({ nullable: true })
        .isUUID()
        .withMessage('referred_by must be a valid UUID'),
    body('notes')
        .optional({ nullable: true })
        .trim()
];

const validateUpdateMember = [
    ...validateMemberId,
    body('branch_id')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('branch_id cannot be empty')
        .bail()
        .isString()
        .withMessage('branch_id must be a string')
        .bail()
        .isLength({ min: 36, max: 36 })
        .withMessage('branch_id must be exactly 36 characters'),
    body('member_code')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('member_code cannot be empty')
        .bail()
        .isLength({ max: 30 })
        .withMessage('member_code must be 30 characters or fewer'),
    body('first_name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('first_name cannot be empty')
        .bail()
        .isLength({ max: 80 })
        .withMessage('first_name must be 80 characters or fewer'),
    body('last_name')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 80 })
        .withMessage('last_name must be 80 characters or fewer'),
    body('gender')
        .optional({ nullable: true })
        .isIn(GENDER_ENUM)
        .withMessage(`gender must be one of: ${GENDER_ENUM.join(', ')}`),
    body('date_of_birth')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('date_of_birth must be a valid date in YYYY-MM-DD format'),
    body('email')
        .optional({ nullable: true })
        .trim()
        .isEmail()
        .withMessage('email must be a valid email address')
        .bail()
        .isLength({ max: 180 })
        .withMessage('email must be 180 characters or fewer'),
    body('contact_no')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('contact_no cannot be empty')
        .bail()
        .isLength({ max: 20 })
        .withMessage('contact_no must be 20 characters or fewer'),
    body('alternate_contact')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 20 })
        .withMessage('alternate_contact must be 20 characters or fewer'),
    body('address')
        .optional({ nullable: true })
        .trim(),
    body('city')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 80 })
        .withMessage('city must be 80 characters or fewer'),
    body('photo_url')
        .optional({ nullable: true })
        .trim()
        .isURL()
        .withMessage('photo_url must be a valid URL'),
    body('package_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage('package_id must be a valid UUID'),
    body('package_name')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('package_name must be 120 characters or fewer'),
    body('start_date')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('start_date must be a valid date in YYYY-MM-DD format'),
    body('end_date')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('end_date must be a valid date in YYYY-MM-DD format'),
    body('status')
        .optional({ nullable: true })
        .isIn(MEMBER_STATUS_ENUM)
        .withMessage(`status must be one of: ${MEMBER_STATUS_ENUM.join(', ')}`),
    body('balance')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('balance must be a number greater than or equal to 0'),
    body('total_paid')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('total_paid must be a number greater than or equal to 0'),
    body('referred_by')
        .optional({ nullable: true })
        .isUUID()
        .withMessage('referred_by must be a valid UUID'),
    body('notes')
        .optional({ nullable: true })
        .trim()
];

module.exports = {
    validateMemberId,
    validateCreateMember,
    validateUpdateMember
};
