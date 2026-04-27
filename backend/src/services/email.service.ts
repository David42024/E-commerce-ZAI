import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Correo enviado a: ${mailOptions.to}`);
    } catch (error) {
      console.error('[EmailService] Error enviando correo:', error);
      throw new Error('Error al enviar el correo electrónico');
    }
  }

  async sendReportEmail(
    to: string | string[],
    reportName: string,
    filename: string,
    content: Buffer,
    contentType: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Reporte Programado: ${reportName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Reporte Programado</h2>
          <p>Adjunto encontrarás el reporte <strong>${reportName}</strong> generado automáticamente por el sistema.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Este es un mensaje automático, por favor no respondas.</p>
        </div>
      `,
      attachments: [
        {
          filename,
          content,
          contentType,
        },
      ],
    });
  }
}
