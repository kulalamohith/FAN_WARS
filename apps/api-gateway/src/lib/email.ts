import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST || 'smtp.ethereal.email',
  port: config.SMTP_PORT || 587,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  if (!config.SMTP_USER) {
    console.log(`\n\n[DEV-EMAIL] OTP for ${to} is: ${otp}\n\n`);
    return true;
  }

  // Use PUBLIC_URL for production emails, fallback to local for dev
  const publicUrl = process.env.PUBLIC_URL || `http://localhost:${config.PORT}`;
  const bannerUrl = `${publicUrl}/email/rivalry-banner.png`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #080A0E; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">

        <!-- HERO BANNER IMAGE -->
        <tr>
          <td style="padding: 0; text-align: center;">
            <img
              src="${bannerUrl}"
              alt="RIVALRY WARZONE"
              width="600"
              style="display: block; width: 100%; max-width: 600px; height: auto; border-radius: 16px 16px 0 0;"
            />
          </td>
        </tr>

        <!-- MAIN CONTENT BODY -->
        <tr>
          <td style="background-color: #12151B; padding: 0;">
            <!-- Red accent line below banner -->
            <div style="height: 3px; background: linear-gradient(90deg, #FF2D55, #FF6B2C, #FF2D55);"></div>

            <div style="padding: 40px 35px 30px 35px;">
              <!-- Dispatch label -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #FF2D55; color: #ffffff; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; padding: 5px 14px; border-radius: 4px;">
                      ⚡ SECURE DISPATCH
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="color: #ffffff; font-size: 22px; margin-top: 20px; margin-bottom: 8px; font-weight: 800; letter-spacing: 0.5px;">
                Your Access Code is Ready
              </h1>
              <p style="color: #6B7394; font-size: 14px; line-height: 1.7; margin-bottom: 30px; margin-top: 0;">
                Warrior, the Warzone awaits. Use the classified clearance code below to authenticate your identity and begin your campaign.
              </p>

              <!-- OTP CODE BOX -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background: linear-gradient(135deg, #1A0F14 0%, #200E18 50%, #1A0F14 100%); border: 2px solid #FF2D55; border-radius: 16px; padding: 35px 20px; text-align: center;">
                    <p style="color: #FF2D55; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; margin: 0 0 12px 0;">
                      ONE-TIME ACCESS CODE
                    </p>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 48px; font-weight: 900; letter-spacing: 14px; color: #FFFFFF; text-shadow: 0 0 20px rgba(255,45,85,0.5);">
                      ${otp}
                    </span>
                    <p style="color: #663040; font-size: 11px; margin: 15px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
                      Self-destructs in 5 minutes
                    </p>
                  </td>
                </tr>
              </table>

              <!-- WARNING STRIP -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 25px;">
                <tr>
                  <td style="background-color: rgba(255,45,85,0.08); border-left: 3px solid #FF2D55; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                    <p style="color: #FF6B7A; font-size: 11px; margin: 0; font-weight: 600;">
                      ⚠️ Never share this code with anyone. Rivalry HQ will never ask for your codes.
                    </p>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color: #0A0C10; padding: 25px 35px; border-radius: 0 0 16px 16px; border-top: 1px solid #1A1D25;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <p style="color: #FF2D55; font-size: 14px; font-weight: 900; letter-spacing: 3px; margin: 0 0 6px 0; text-transform: uppercase;">
                    RIVALRY
                  </p>
                  <p style="color: #3A3F52; font-size: 10px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
                    Where Fans Go To War
                  </p>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <p style="color: #2A2E3A; font-size: 9px; margin: 0; letter-spacing: 0.5px;">
                    If you didn't request this,<br/>safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.SMTP_FROM,
      to,
      subject: '⚔️ Your WARZONE Access Code',
      html,
    });
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    throw new Error('Failed to send OTP email');
  }
};
