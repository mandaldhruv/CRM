const express = require('express');

const membersController = require('../controllers/members.controller');
const {
    validateMemberId,
    validateCreateMember,
    validateUpdateMember
} = require('../validators/members.validator');

const router = express.Router();

router.get('/', membersController.getAllMembers);
router.get('/:id', validateMemberId, membersController.getMemberById);
router.post('/', validateCreateMember, membersController.createMember);
router.put('/:id', validateUpdateMember, membersController.updateMember);
router.delete('/:id', validateMemberId, membersController.deleteMember);

module.exports = router;
