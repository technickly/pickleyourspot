import { SESClient } from '@aws-sdk/client-ses';
import { SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize the SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SES_SECRET_KEY || '',
  },
});

interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailParams) {
  const fromAddress = from || `noreply@pickleyourspot.com`;
  const toAddresses = Array.isArray(to) ? to : [to];

  const params = {
    Source: fromAddress,
    Destination: {
      ToAddresses: toAddresses,
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
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
} 