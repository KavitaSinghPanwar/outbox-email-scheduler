import nodemailer, { Transporter } from 'nodemailer';

class MailerService {
  private transporter: Transporter | null = null;
  private etherealAccount: nodemailer.TestAccount | null = null;

  async init(): Promise<void> {
    try {
      if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS,
          },
        });
        console.log(`✉️ Mailer initialized with Ethereal account: ${process.env.ETHEREAL_USER}`);
      } else {
        console.log('✉️ Generating dynamic Ethereal Email test account...');
        this.etherealAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: this.etherealAccount.smtp.host,
          port: this.etherealAccount.smtp.port,
          secure: this.etherealAccount.smtp.secure,
          auth: {
            user: this.etherealAccount.user,
            pass: this.etherealAccount.pass,
          },
        });
        console.log(`✉️ Dynamic Ethereal Email test account created:`);
        console.log(`   User: ${this.etherealAccount.user}`);
        console.log(`   Pass: ${this.etherealAccount.pass}`);
        console.log(`   Web Webmail: https://ethereal.email/login`);
      }
    } catch (err: any) {
      console.error('❌ Failed to initialize Ethereal mailer:', err.message);
      throw err;
    }
  }

  async sendEmail(options: { to: string; subject: string; body: string }): Promise<{ messageId: string; previewUrl: string | false }> {
    if (!this.transporter) {
      await this.init();
    }

    const fromAddress = this.etherealAccount?.user || process.env.ETHEREAL_USER || 'no-reply@outbox-scheduler.local';

    const info = await this.transporter!.sendMail({
      from: `"Email Scheduler" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: `<div style="font-family: sans-serif; padding: 16px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563eb;">${options.subject}</h2>
        <p style="white-space: pre-wrap;">${options.body}</p>
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin-top: 24px;" />
        <p style="font-size: 12px; color: #64748b;">Sent automatically by Outbox Email Scheduler</p>
      </div>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`🚀 Email sent successfully to ${options.to}`);
    console.log(`   Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`   Preview URL: ${previewUrl}`);
    }

    return {
      messageId: info.messageId,
      previewUrl,
    };
  }
}

export const mailerService = new MailerService();
