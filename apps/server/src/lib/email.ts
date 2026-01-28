import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface EnrollmentEmailParams {
  to: string;
  userName: string;
  courseName: string;
  courseSlug: string;
  locale?: 'vi' | 'en' | 'zh';
}

const templates = {
  vi: {
    subject: (courseName: string) => `🎉 Chúc mừng bạn đã đăng ký khóa học: ${courseName}`,
    body: (userName: string, courseName: string, courseUrl: string) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Xin chào ${userName}!</h1>
        <p>Chúc mừng bạn đã đăng ký thành công khóa học <strong>${courseName}</strong>.</p>
        <p>Bạn đã sẵn sàng bắt đầu hành trình học tập tài chính của mình!</p>
        <a href="${courseUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          Bắt đầu học ngay
        </a>
        <p style="margin-top: 24px; color: #666;">
          Chúc bạn học tập vui vẻ!<br/>
          Đội ngũ V-EdFinance
        </p>
      </div>
    `,
  },
  en: {
    subject: (courseName: string) => `🎉 Welcome! You've enrolled in: ${courseName}`,
    body: (userName: string, courseName: string, courseUrl: string) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Hello ${userName}!</h1>
        <p>Congratulations on enrolling in <strong>${courseName}</strong>.</p>
        <p>You're ready to start your financial learning journey!</p>
        <a href="${courseUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          Start Learning
        </a>
        <p style="margin-top: 24px; color: #666;">
          Happy learning!<br/>
          The V-EdFinance Team
        </p>
      </div>
    `,
  },
  zh: {
    subject: (courseName: string) => `🎉 恭喜您注册课程：${courseName}`,
    body: (userName: string, courseName: string, courseUrl: string) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">您好 ${userName}!</h1>
        <p>恭喜您成功注册<strong>${courseName}</strong>课程。</p>
        <p>您已准备好开始您的金融学习之旅！</p>
        <a href="${courseUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          开始学习
        </a>
        <p style="margin-top: 24px; color: #666;">
          祝您学习愉快！<br/>
          V-EdFinance 团队
        </p>
      </div>
    `,
  },
};

export async function sendEnrollmentEmail({
  to,
  userName,
  courseName,
  courseSlug,
  locale = 'vi',
}: EnrollmentEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const template = templates[locale];
  const baseUrl = process.env.APP_URL || 'https://hochcungkhoan.com.vn';
  const courseUrl = `${baseUrl}/courses/${courseSlug}`;

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'V-EdFinance <noreply@hochcungkhoan.com.vn>',
      to: [to],
      subject: template.subject(courseName),
      html: template.body(userName, courseName, courseUrl),
    });

    if (error) {
      console.error('[Email] Failed to send enrollment email:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Enrollment email sent to ${to}, id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Exception sending email:', message);
    return { success: false, error: message };
  }
}
