import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email Service - Send notifications and reports via email
 * 
 * Configuration via environment variables:
 * - EMAIL_HOST (e.g., smtp.gmail.com)
 * - EMAIL_PORT (e.g., 587)
 * - EMAIL_USER (your email)
 * - EMAIL_PASSWORD (app password)
 * - EMAIL_FROM (sender name/email)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private initialize() {
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASSWORD,
      EMAIL_FROM,
    } = process.env;

    // Check if email is configured
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
      console.warn('⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT || '587'),
        secure: EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send email (generic)
   */
  async send({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || `"VB Coaching" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send new session notification
   */
  async sendNewSessionEmail(
    athleteEmail: string,
    athleteName: string,
    sessionTitle: string,
    sessionDate: string,
    coachName: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .session-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Nouvelle Séance Programmée</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${athleteName}</strong>,</p>
            <p>Ton coach <strong>${coachName}</strong> t'a assigné une nouvelle séance d'entraînement :</p>
            
            <div class="session-card">
              <h2 style="margin-top: 0; color: #6366f1;">🏃 ${sessionTitle}</h2>
              <p><strong>📆 Date :</strong> ${sessionDate}</p>
            </div>

            <p>Connecte-toi pour voir les détails de ta séance :</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">
              Voir ma séance
            </a>

            <p style="margin-top: 30px; color: #6b7280;">À bientôt sur la piste ! 🏃‍♂️💨</p>
          </div>
          <div class="footer">
            <p>VB Coaching - Plateforme d'entraînement personnalisée</p>
            <p>Tu reçois cet email car tu es inscrit(e) sur VB Coaching</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: athleteEmail,
      subject: `📅 Nouvelle séance : ${sessionTitle}`,
      html,
    });
  }

  /**
   * Send session modified notification
   */
  async sendSessionModifiedEmail(
    athleteEmail: string,
    athleteName: string,
    sessionTitle: string,
    coachName: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✏️ Séance Modifiée</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${athleteName}</strong>,</p>
            <p>Ton coach <strong>${coachName}</strong> a modifié ta séance :</p>
            <h3 style="color: #f59e0b;">🏃 ${sessionTitle}</h3>
            <p>Consulte les nouvelles consignes :</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">
              Voir les modifications
            </a>
          </div>
          <div class="footer">
            <p>VB Coaching</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: athleteEmail,
      subject: `✏️ Séance modifiée : ${sessionTitle}`,
      html,
    });
  }

  /**
   * Send new message notification
   */
  async sendNewMessageEmail(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    messagePreview: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .message-preview { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; font-style: italic; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 Nouveau Message</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${recipientName}</strong>,</p>
            <p><strong>${senderName}</strong> vous a envoyé un message :</p>
            
            <div class="message-preview">
              ${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}
            </div>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">
              Lire le message
            </a>
          </div>
          <div class="footer">
            <p>VB Coaching</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: recipientEmail,
      subject: `💬 Nouveau message de ${senderName}`,
      html,
    });
  }

  /**
   * Send session reminder (24h before)
   */
  async sendSessionReminderEmail(
    athleteEmail: string,
    athleteName: string,
    sessionTitle: string,
    sessionDate: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .reminder-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Rappel Séance Demain</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${athleteName}</strong>,</p>
            
            <div class="reminder-box">
              <h2 style="margin-top: 0; color: #10b981;">🏃 ${sessionTitle}</h2>
              <p style="font-size: 18px;"><strong>📆 ${sessionDate}</strong></p>
            </div>

            <p>N'oublie pas ta séance d'entraînement demain !</p>
            <p>Prépare ton matériel et hydrate-toi bien. 💪</p>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">
              Voir les détails
            </a>
          </div>
          <div class="footer">
            <p>VB Coaching</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: athleteEmail,
      subject: `⏰ Rappel : ${sessionTitle} demain`,
      html,
    });
  }

  /**
   * Send weekly report
   */
  async sendWeeklyReportEmail(
    athleteEmail: string,
    athleteName: string,
    stats: {
      totalDistance: number;
      totalDuration: number;
      sessionsCompleted: number;
      averagePace: string;
    }
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background: white; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .stat-value { font-size: 32px; font-weight: bold; color: #8b5cf6; }
          .stat-label { color: #6b7280; margin-top: 5px; }
          .btn { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Ton Bilan Hebdomadaire</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${athleteName}</strong>,</p>
            <p>Voici le résumé de ta semaine d'entraînement :</p>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${stats.totalDistance} km</div>
                <div class="stat-label">Distance totale</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${Math.round(stats.totalDuration / 60)}h</div>
                <div class="stat-label">Temps total</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.sessionsCompleted}</div>
                <div class="stat-label">Séances réalisées</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.averagePace}</div>
                <div class="stat-label">Allure moyenne</div>
              </div>
            </div>

            <p>Continue comme ça ! 💪🔥</p>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">
              Voir mes statistiques
            </a>
          </div>
          <div class="footer">
            <p>VB Coaching</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: athleteEmail,
      subject: '📊 Ton bilan hebdomadaire VB Coaching',
      html,
    });
  }
}

export default new EmailService();
