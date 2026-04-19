import { Resend } from 'resend';
import prisma from '../prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export class AdmissionsEmailService {
  /**
   * Sends entrance exam details to parent after fee confirmation.
   */
  static async sendExamDetails(parentEmail: string, applicantName: string) {
    try {
      if (!parentEmail) return;

      // Fetch dynamic logistics from GlobalConfig
      const config = await prisma.globalConfig.findUnique({
        where: { id: 'SCHOOL_CONFIG' },
        select: { admissionExamLogistics: true, schoolName: true }
      });

      const logistics = config?.admissionExamLogistics || 'Please check your portal for the upcoming entrance exam schedule.';
      const schoolName = config?.schoolName || 'Wajina International Schools';

      const { data, error } = await resend.emails.send({
        from: 'Admissions <admissions@wajina.org>',
        to: parentEmail,
        subject: `Entrance Exam Details: ${applicantName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2c3e50;">Entrance Exam Schedule</h2>
            <p>Dear Parent/Guardian,</p>
            <p>We are pleased to confirm that the entrance fee for <strong>${applicantName}</strong> has been received.</p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #519CAB; margin: 20px 0;">
              <h4 style="margin-top: 0;">Logistics & Instructions:</h4>
              <p style="white-space: pre-line;">${logistics}</p>
            </div>
            <p>Please ensure the candidate arrives at least 30 minutes before the scheduled time with necessary writing materials.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8rem; color: #7f8c8d;">Best regards,<br>${schoolName} Admissions Team</p>
          </div>
        `
      });

      if (error) {
        console.error('[EmailService Error]', error);
      }
      return { data, error };
    } catch (err) {
      console.error('[EmailService Fatal Error]', err);
      throw err;
    }
  }
}
