import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: SESClient;
  private readonly fromAddress: string;

  constructor(private configService: ConfigService) {
    const useLocalStack = this.configService.get<string>('USE_LOCALSTACK', 'false') === 'true';

    if (useLocalStack) {
      this.client = new SESClient({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        endpoint: this.configService.get<string>('LOCALSTACK_ENDPOINT', 'http://localhost:4566'),
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      });
      this.fromAddress = 'noreply@localhost.com';
    } else {
      this.client = new SESClient({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
        },
      });
      this.fromAddress = this.configService.get<string>('MAIL_FROM', '');
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromAddress,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          ...(text && {
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    });

    try {
      await this.client.send(command);
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('EMAIL_VERIFICATION_URL')}?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Verify Your Email</h2>
            <p>Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #007bff;
                      color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
              Verify Email
            </a>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link: <br/>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 32px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;
    await this.sendMail(email, 'Verify your email', html);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('PASSWORD_RESET_URL')}?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #007bff;
                      color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link: <br/>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 32px;">
              If you didn't request a password reset, you can safely ignore this email.
              This link will expire in 1 hour.
            </p>
          </div>
        </body>
      </html>
    `;
    await this.sendMail(email, 'Reset your password', html);
  }

  async sendEmailChangeVerification(newEmail: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Verify Your New Email Address</h2>
            <p>You requested to change your email address. Use the code below to verify this new email:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 32px;">
              If you didn't request this email change, please ignore this email and your email address will remain unchanged.
            </p>
          </div>
        </body>
      </html>
    `;
    await this.sendMail(newEmail, 'Verify your new email address', html);
  }

  async sendEmailChangeNotification(oldEmail: string, newEmail: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Email Address Changed</h2>
            <p>Your account email address has been changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
            <p style="color: #666; font-size: 14px;">
              If you did not make this change, please contact support immediately.
            </p>
          </div>
        </body>
      </html>
    `;
    await this.sendMail(oldEmail, 'Your email address has been changed', html);
  }
}
