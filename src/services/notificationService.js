const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.emailTransporter = this.createEmailTransporter();
  }

  createEmailTransporter() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email configuration missing. Email notifications will be disabled.');
      return null;
    }

    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendCompletionNotification(data) {
    try {
      const notifications = [];

      if (this.emailTransporter) {
        notifications.push(this.sendEmailNotification(data));
      }

      if (process.env.SLACK_WEBHOOK_URL) {
        notifications.push(this.sendSlackNotification(data));
      }

      if (process.env.MAKE_WEBHOOK_URL) {
        notifications.push(this.sendWebhookNotification(data, 'completion'));
      }

      await Promise.allSettled(notifications);
      console.log(`Completion notifications sent for paper: ${data.paperName}`);
    } catch (error) {
      console.error('Error sending completion notifications:', error);
    }
  }

  async sendErrorNotification(data) {
    try {
      const notifications = [];

      if (this.emailTransporter) {
        notifications.push(this.sendErrorEmail(data));
      }

      if (process.env.SLACK_WEBHOOK_URL) {
        notifications.push(this.sendSlackError(data));
      }

      if (process.env.MAKE_WEBHOOK_URL) {
        notifications.push(this.sendWebhookNotification(data, 'error'));
      }

      await Promise.allSettled(notifications);
      console.log(`Error notifications sent for paper: ${data.paperName}`);
    } catch (error) {
      console.error('Error sending error notifications:', error);
    }
  }

  async sendEmailNotification(data) {
    if (!this.emailTransporter) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER,
      subject: `📄 Paper Analysis Complete: ${data.paperName}`,
      html: this.buildEmailTemplate(data)
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log('Email notification sent successfully');
    } catch (error) {
      console.error('Email notification failed:', error);
    }
  }

  async sendErrorEmail(data) {
    if (!this.emailTransporter) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER,
      subject: `⚠️ Paper Processing Error: ${data.paperName}`,
      html: this.buildErrorEmailTemplate(data)
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log('Error email notification sent successfully');
    } catch (error) {
      console.error('Error email notification failed:', error);
    }
  }

  async sendSlackNotification(data) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const message = {
      text: "📄 New paper analysis completed!",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📄 Paper Analysis Complete"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Paper:*\n${data.paperName}`
            },
            {
              type: "mrkdwn",
              text: `*Field:*\n${data.analysis?.field || 'Unknown'}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Summary:*\n${data.analysis?.summary || 'No summary available'}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Keywords:*\n${data.analysis?.keywords?.join(', ') || 'No keywords'}`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in Drive"
              },
              url: data.driveUrl
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in Notion"
              },
              url: data.notionUrl
            }
          ]
        }
      ]
    };

    try {
      await axios.post(process.env.SLACK_WEBHOOK_URL, message);
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Slack notification failed:', error);
    }
  }

  async sendSlackError(data) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const message = {
      text: "⚠️ Paper processing failed!",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "⚠️ Paper Processing Error"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Paper:*\n${data.paperName}`
            },
            {
              type: "mrkdwn",
              text: `*Error:*\n${data.error}`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Drive Folder"
              },
              url: data.driveUrl
            }
          ]
        }
      ]
    };

    try {
      await axios.post(process.env.SLACK_WEBHOOK_URL, message);
      console.log('Slack error notification sent successfully');
    } catch (error) {
      console.error('Slack error notification failed:', error);
    }
  }

  async sendWebhookNotification(data, type) {
    if (!process.env.MAKE_WEBHOOK_URL) return;

    const payload = {
      type: type,
      timestamp: new Date().toISOString(),
      data: data
    };

    try {
      await axios.post(process.env.MAKE_WEBHOOK_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`Webhook notification sent successfully (${type})`);
    } catch (error) {
      console.error('Webhook notification failed:', error);
    }
  }

  buildEmailTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007acc;">📄 Paper Analysis Complete</h2>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #007acc;">Paper Details</h3>
          <p><strong>Title:</strong> ${data.paperName}</p>
          <p><strong>Field:</strong> ${data.analysis?.field || 'Unknown'}</p>
          <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h4 style="color: #333;">Summary</h4>
          <p style="line-height: 1.6;">${data.analysis?.summary || 'No summary available'}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h4 style="color: #333;">Keywords</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            ${data.analysis?.keywords?.map(keyword => 
              `<span style="background-color: #007acc; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">${keyword}</span>`
            ).join('') || 'No keywords'}
          </div>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${data.driveUrl}" style="background-color: #007acc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">View in Drive</a>
          <a href="${data.notionUrl}" style="background-color: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View in Notion</a>
        </div>
        
        <div style="border-top: 1px solid #ccc; padding-top: 15px; font-size: 12px; color: #666;">
          <p>This is an automated notification from the Academic Paper Analyzer system.</p>
        </div>
      </div>
    `;
  }

  buildErrorEmailTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f;">⚠️ Paper Processing Error</h2>
        
        <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #d32f2f;">
          <h3 style="margin-top: 0; color: #d32f2f;">Error Details</h3>
          <p><strong>Paper:</strong> ${data.paperName}</p>
          <p><strong>Error:</strong> ${data.error}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h4 style="color: #333;">Next Steps</h4>
          <ul style="line-height: 1.6;">
            <li>Check the server logs for detailed error information</li>
            <li>Verify that the PDF and PPTX files are not corrupted</li>
            <li>Ensure all API credentials are valid</li>
            <li>Try reprocessing the paper manually</li>
          </ul>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${data.driveUrl}" style="background-color: #007acc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Drive Folder</a>
        </div>
        
        <div style="border-top: 1px solid #ccc; padding-top: 15px; font-size: 12px; color: #666;">
          <p>This is an automated error notification from the Academic Paper Analyzer system.</p>
        </div>
      </div>
    `;
  }
}

module.exports = NotificationService;