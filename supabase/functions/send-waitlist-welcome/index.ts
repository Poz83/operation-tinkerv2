/**
 * Supabase Edge Function: send-waitlist-welcome
 * 
 * Triggered by database webhook when a new row is inserted into the waitlist table.
 * - Sends a "Welcome to the Waitlist" email via Resend API
 * - Adds the contact to a Resend Audience for future broadcasts
 * - Includes a working unsubscribe link
 * 
 * Optimized: Reduced API calls and added delay to avoid rate limits.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface WaitlistRecord {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface WebhookPayload {
  type: 'INSERT';
  table: 'waitlist';
  record: WaitlistRecord;
}

const RESEND_API_URL = 'https://api.resend.com';
const FROM_EMAIL = 'noreply@myjoe.app';

// Simple hash for unsubscribe verification
function generateUnsubscribeToken(email: string, secret: string): string {
  const data = email.toLowerCase() + secret;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json();

    // Validate payload
    if (!payload.record || !payload.record.email || !payload.record.full_name) {
      console.error('Invalid payload received:', payload);
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { full_name, email } = payload.record;

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unsubscribe token and links
    const unsubscribeSecret = Deno.env.get('UNSUBSCRIBE_SECRET') || 'myjoe-waitlist-2026';
    const unsubscribeToken = generateUnsubscribeToken(email, unsubscribeSecret);
    const unsubscribeUrl = `https://jjlbdzwuhvupggfhhxiz.supabase.co/functions/v1/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}&action=unsubscribe`;
    const removeUrl = `https://jjlbdzwuhvupggfhhxiz.supabase.co/functions/v1/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}&action=remove`;

    // Build the welcome email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Waitlist</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0b; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="text-align: center; padding-bottom: 30px;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 600; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          myjoe
        </h1>
      </td>
    </tr>
    <tr>
      <td style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px;">
        <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 500;">
          Welcome to the Waitlist! ✨
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
          Hey ${full_name},
        </p>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
          You're officially on the waitlist for <strong style="color: #ffffff;">myjoe</strong>. We're thrilled to have you!
        </p>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
          We're working hard to bring you something special. When we're ready to welcome you in, you'll be the first to know.
        </p>
        <div style="margin: 30px 0; padding: 20px; background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.2); border-radius: 12px;">
          <p style="margin: 0; font-size: 14px; color: #60a5fa;">
            🎯 Your spot is secured. We'll reach out soon with exclusive early access.
          </p>
        </div>
        <p style="margin: 0; font-size: 14px; color: #71717a;">
          In the meantime, stay tuned!
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 30px;">
        <p style="margin: 0; font-size: 12px; color: #52525b;">
          © 2026 myjoe. All rights reserved.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #3f3f46;">
          <a href="${unsubscribeUrl}" style="color: #3f3f46; text-decoration: underline;">Unsubscribe</a>
          &nbsp;•&nbsp;
          <a href="${removeUrl}" style="color: #3f3f46; text-decoration: underline;">Remove from Waitlist</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Send email via Resend (priority - do this first)
    const resendResponse = await fetch(`${RESEND_API_URL}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Welcome to the Waitlist, ${full_name}! ✨`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorText);
      return new Response(JSON.stringify({
        error: 'Failed to send email',
        details: errorText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resendData = await resendResponse.json();
    console.log('Email sent successfully:', resendData);

    // Add to Audience in the background (non-blocking, with delay to avoid rate limit)
    // We don't await this - let it run after response is sent
    (async () => {
      try {
        await delay(1000); // Wait 1 second to avoid rate limit

        // List audiences
        const listResponse = await fetch(`${RESEND_API_URL}/audiences`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${resendApiKey}` },
        });

        if (!listResponse.ok) return;

        const listData = await listResponse.json();
        let audienceId = listData.data?.find((a: { name: string; id: string }) => a.name === 'Myjoe Waitlist')?.id;

        // Create audience if not found
        if (!audienceId) {
          await delay(600);
          const createResponse = await fetch(`${RESEND_API_URL}/audiences`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'Myjoe Waitlist' }),
          });
          if (createResponse.ok) {
            const createData = await createResponse.json();
            audienceId = createData.id;
          }
        }

        if (!audienceId) return;

        // Add contact
        await delay(600);
        const nameParts = full_name.split(' ');
        await fetch(`${RESEND_API_URL}/audiences/${audienceId}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            unsubscribed: false,
          }),
        });
        console.log('Contact added to audience:', email);
      } catch (e) {
        console.error('Background audience task failed:', e);
      }
    })();

    return new Response(JSON.stringify({
      success: true,
      message: `Welcome email sent to ${email}`,
      emailId: resendData.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
