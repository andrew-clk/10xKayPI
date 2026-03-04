import { Resend } from 'resend';

// Lazy initialization — Resend requires an API key at runtime only
function getResend() { return new Resend(process.env.RESEND_API_KEY ?? 're_placeholder'); }
const FROM = 'PerformX <notifications@performx.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendReviewOpenedEmail(
  to: string,
  employeeName: string,
  periodName: string,
  dueDate: string,
  reviewId: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${periodName} Performance Review - Self-Rating Due ${dueDate}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Hi ${employeeName},</h2>
        <p>Your monthly performance review for <strong>${periodName}</strong> is now open.</p>
        <p>Please complete your self-rating by <strong>${dueDate}</strong>.</p>
        <p><a href="${APP_URL}/dashboard/reviews/${reviewId}/self-rating" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">Start Self-Rating</a></p>
        <p style="color:#6b7280;font-size:14px">Need help? Log in to view the scoring guide.</p>
      </div>
    `,
  });
}

export async function sendReminderEmail(
  to: string,
  employeeName: string,
  periodName: string,
  dueDate: string,
  reviewId: string,
  daysLeft: number,
  ratedCount: number,
  totalCount: number
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${periodName} Self-Rating Due in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Hi ${employeeName},</h2>
        <p>Your <strong>${periodName}</strong> self-rating is due in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> (${dueDate}).</p>
        <p>Progress: ${ratedCount}/${totalCount} criteria rated.</p>
        <p><a href="${APP_URL}/dashboard/reviews/${reviewId}/self-rating" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">Continue Self-Rating</a></p>
      </div>
    `,
  });
}

export async function sendSupervisorNotificationEmail(
  to: string,
  supervisorName: string,
  employeeName: string,
  periodName: string,
  dueDate: string,
  reviewId: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${employeeName}'s Self-Rating Completed — Your Review Needed`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Hi ${supervisorName},</h2>
        <p><strong>${employeeName}</strong> has completed their self-rating for <strong>${periodName}</strong>.</p>
        <p>Please complete your supervisor rating by <strong>${dueDate}</strong>.</p>
        <p><a href="${APP_URL}/dashboard/reviews/${reviewId}/supervisor-rating" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">Review Now</a></p>
      </div>
    `,
  });
}

export async function sendReviewCompletedEmail(
  to: string,
  employeeName: string,
  supervisorName: string,
  periodName: string,
  score: number,
  grade: string,
  reviewId: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your ${periodName} Performance Review is Ready`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Hi ${employeeName},</h2>
        <p><strong>${supervisorName}</strong> has completed your <strong>${periodName}</strong> review.</p>
        <p style="font-size:24px;font-weight:bold;color:#4f46e5">Final Score: ${score}/100 (Grade ${grade})</p>
        <p>Please acknowledge your review.</p>
        <p><a href="${APP_URL}/dashboard/reviews/${reviewId}/acknowledge" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">View Review</a></p>
      </div>
    `,
  });
}
