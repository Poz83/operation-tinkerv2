/**
 * Supabase Edge Function: send-contact-message
 * 
 * Triggered by database webhook when a new row is inserted into the contact_messages table.
 * Sends an email to support@myjoe.app using Resend API.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ContactRecord {
    id: string;
    full_name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
}

interface WebhookPayload {
    type: 'INSERT';
    table: 'contact_messages';
    record: ContactRecord;
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const SUPPORT_EMAIL = 'support@myjoe.app';
const FROM_EMAIL = 'noreply@myjoe.app';

Deno.serve(async (req: Request) => {
    // CORS headers
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
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
        }

        const payload: WebhookPayload = await req.json();

        // Validate
        if (!payload.record || !payload.record.email || !payload.record.message) {
            console.error('Invalid payload:', payload);
            return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
        }

        const { full_name, email, subject, message, id } = payload.record;
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!resendApiKey) {
            console.error('RESEND_API_KEY missing');
            return new Response(JSON.stringify({ error: 'Configuration error' }), { status: 500 });
        }

        // Email HTML Template
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background-color: #f4f4f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { border-bottom: 1px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 20px; }
    .label { font-size: 12px; color: #71717a; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 16px; color: #18181b; margin-bottom: 16px; line-height: 1.5; }
    .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0; color:#18181b;">New Contact Message</h2>
      <p style="margin:5px 0 0; color:#71717a; font-size:14px;">Received via myjoe contact form</p>
    </div>

    <div class="label">From</div>
    <div class="value"><strong>${full_name}</strong> (${email})</div>

    <div class="label">Subject</div>
    <div class="value">${subject}</div>

    <div class="label">Message</div>
    <div class="message-box value">
      ${message.replace(/\n/g, '<br>')}
    </div>

    <div style="margin-top:30px; font-size:12px; color:#a1a1aa; border-top:1px solid #e4e4e7; padding-top:20px;">
      Message ID: ${id}<br>
      To reply, simply reply to this email (Reply-To set to sender).
    </div>
  </div>
</body>
</html>
        `.trim();

        // Send Email
        const resendResponse = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [SUPPORT_EMAIL],
                reply_to: email, // Direct reply to user
                subject: `[Contact Form] ${subject} - ${full_name}`,
                html: emailHtml,
            }),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('Resend Error:', errorText);
            throw new Error(errorText);
        }

        const data = await resendResponse.json();
        console.log('Email sent:', data);

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
