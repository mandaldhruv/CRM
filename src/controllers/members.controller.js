const { validationResult } = require('express-validator');

const membersService = require('../services/members.service');

const buildValidationError = (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return null;
    }

    return res.status(400).json({
        success: false,
        errors: errors.array().map((error) => ({
            field: error.path,
            message: error.msg
        }))
    });
};

const getAllMembers = async (req, res, next) => {
    try {
        const search = req.query.search || '';
        const branchId = req.query.branchId || null;

        const members = await membersService.getAllMembers({ search, branchId });

        return res.status(200).json({
            success: true,
            data: {
                members
            }
        });
    } catch (error) {
        const controllerError = new Error('Failed to fetch members');
        controllerError.statusCode = 500;
        controllerError.publicMessage = 'Unable to load members at the moment';
        return next(controllerError);
    }
};

const getMemberById = async (req, res, next) => {
    const validationResponse = buildValidationError(req, res);
    if (validationResponse) {
        return validationResponse;
    }

    try {
        const member = await membersService.getMemberById(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                member
            }
        });
    } catch (error) {
        const controllerError = new Error('Failed to fetch member');
        controllerError.statusCode = 500;
        controllerError.publicMessage = 'Unable to load member at the moment';
        return next(controllerError);
    }
};

const createMember = async (req, res, next) => {
    const validationResponse = buildValidationError(req, res);
    if (validationResponse) {
        return validationResponse;
    }

    try {
        const member = await membersService.createMember(req.body);

        return res.status(201).json({
            success: true,
            data: {
                member
            }
        });
    } catch (error) {
        const controllerError = new Error('Failed to create member');
        controllerError.statusCode = 500;
        controllerError.publicMessage = 'Unable to create member at the moment';
        return next(controllerError);
    }
};

const updateMember = async (req, res, next) => {
    const validationResponse = buildValidationError(req, res);
    if (validationResponse) {
        return validationResponse;
    }

    try {
        const member = await membersService.updateMember(req.params.id, req.body);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                member
            }
        });
    } catch (error) {
        const controllerError = new Error('Failed to update member');
        controllerError.statusCode = 500;
        controllerError.publicMessage = 'Unable to update member at the moment';
        return next(controllerError);
    }
};

const deleteMember = async (req, res, next) => {
    const validationResponse = buildValidationError(req, res);
    if (validationResponse) {
        return validationResponse;
    }

    try {
        const member = await membersService.deleteMember(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                member
            }
        });
    } catch (error) {
        const controllerError = new Error('Failed to delete member');
        controllerError.statusCode = 500;
        controllerError.publicMessage = 'Unable to delete member at the moment';
        return next(controllerError);
    }
};

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember
};
