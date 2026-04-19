"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createAuditLog } = require('../services/auditService');
exports.submitComplaint = async (req, res) => {
    const { subject, message, studentId, targetRole } = req.body;
    const parentId = req.user.id;
    try {
        const complaint = await prisma.complaint.create({
            data: {
                parentId,
                studentId,
                subject,
                message,
                targetRole,
            },
        });
        await createAuditLog({
            action: 'SUBMIT_COMPLAINT',
            entity: 'Complaint',
            entityId: complaint.id,
            detail: 'Complaint submitted',
            actorId: parentId,
            oldValue: null,
            newValue: complaint,
        });
        res.status(201).json(complaint);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to submit complaint', details: err.message });
    }
};
exports.getComplaints = async (req, res) => {
    const { role, id: userId } = req.user;
    try {
        let complaints;
        if (role === 'DIRECTOR') {
            complaints = await prisma.complaint.findMany({
                where: {
                    OR: [
                        { targetRole: 'DIRECTOR' },
                        { status: 'RESOLVED' },
                    ],
                },
            });
        }
        else if (role === 'ADMIN_STAFF') {
            complaints = await prisma.complaint.findMany({
                where: {
                    status: 'PENDING',
                    targetRole: 'ADMIN',
                },
            });
        }
        else {
            return res.status(403).json({ error: 'Access Denied' });
        }
        res.json(complaints);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch complaints', details: err.message });
    }
};
exports.resolveComplaint = async (req, res) => {
    const { id } = req.params;
    const resolverId = req.user.id;
    try {
        const oldComplaint = await prisma.complaint.findUnique({ where: { id } });
        if (!oldComplaint)
            return res.status(404).json({ error: 'Complaint not found' });
        const updatedComplaint = await prisma.complaint.update({
            where: { id },
            data: { status: 'RESOLVED', resolvedBy: resolverId },
        });
        await createAuditLog({
            action: 'RESOLVE_COMPLAINT',
            entity: 'Complaint',
            entityId: id,
            detail: 'Complaint resolved',
            actorId: resolverId,
            oldValue: oldComplaint,
            newValue: updatedComplaint,
        });
        res.json(updatedComplaint);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to resolve complaint', details: err.message });
    }
};
