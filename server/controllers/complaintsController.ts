import prisma from '../prisma';
import { audit } from '../middleware/audit';

export const submitComplaint = async (req: any, res: any) => {
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
    
    // AUDIT
    audit(parentId, 'SUBMIT_COMPLAINT', 'Complaint', complaint.id, `Complaint submitted by ${req.user.name}`, req.ip);

    res.status(201).json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit complaint', details: err.message });
  }
};

export const getComplaints = async (req: any, res: any) => {
  const { role, campus, id: userId } = req.user;
  try {
    let where: any = {};

    if (role === 'DIRECTOR') {
      // Director sees all
    } else if (role === 'PARENT') {
      // Parents only see complaints they submitted
      where.parentId = userId;
    } else if (['TEACHER', 'FORM_TEACHER'].includes(role)) {
      // Teachers only see complaints TARGETED at their role
      where.targetRole = role;
      
      // Campus Lockdown (Crucial for Wajina data safety)
      if (campus) {
        where.student = { campus };
      }
    } else {
      // MANAGEMENT (VP_ADMIN, PRINCIPAL, HT, etc.)
      const allowedRoles = ['ADMIN', 'VP_ADMIN', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ACADEMICS', 'DEAN_STUDENTS'];
      where.targetRole = { in: allowedRoles };
      
      // Campus Lockdown
      if (campus) {
        where.student = { campus };
      }
    }

    const { status } = req.query;
    if (status) where.status = status;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        parent: { select: { name: true } },
        student: { select: { name: true, campus: true } },
        resolver: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(complaints);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch complaints', details: err.message });
  }
};

export const resolveComplaint = async (req: any, res: any) => {
  const { id } = req.params;
  const { response } = req.body; 
  const resolverId = req.user.id;
  try {
    const oldComplaint = await prisma.complaint.findUnique({ 
      where: { id },
      include: { student: true }
    });
    if (!oldComplaint) return res.status(404).json({ error: 'Complaint not found' });

    // Enforce campus lockdown
    if (req.user.role !== 'DIRECTOR' && oldComplaint.student.campus !== req.user.campus) {
      return res.status(403).json({ error: 'Unauthorised. Complaint belongs to another campus.' });
    }

    // Role check: Only those allowed in OPS_LEADERS can resolve
    // (This is already guarded by the route's requireRole, but good to be safe)

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: { 
        status: 'RESOLVED', 
        resolvedBy: resolverId,
        response: response || 'Resolved by staff'
      },
    });

    // AUDIT LOG (Decision Log requirement)
    audit(resolverId, 'RESOLVE_COMPLAINT', 'Complaint', id, `Complaint resolved by ${req.user.name} (${req.user.role}). Response: ${response || 'None provided'}`, req.ip);

    res.json(updatedComplaint);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve complaint', details: err.message });
  }
};
