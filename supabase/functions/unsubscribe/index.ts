/**
 * Supabase Edge Function: unsubscribe
 * 
 * Handles unsubscribe and removal requests from waitlist emails.
 * Supports two actions:
 * - unsubscribe: Stop receiving emails but stay on waitlist
 * - remove: Completely delete from waitlist and Resend Audience
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_URL = 'https://api.resend.com';

// Must match the function in send-waitlist-welcome
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

function htmlResponse(title: string, message: string, success: boolean): Response {
    const accentColor = success ? '#22c55e' : '#ef4444';
    const emoji = success ? '✓' : '✗';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0a0a0b;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            max-width: 400px;
            text-align: center;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 40px;
        }
        .icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: ${accentColor}20;
            border: 2px solid ${accentColor}50;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 28px;
            color: ${accentColor};
        }
        h1 { font-size: 24px; font-weight: 500; margin-bottom: 12px; }
        p { font-size: 14px; color: #a1a1aa; line-height: 1.6; }
        .footer { margin-top: 30px; font-size: 12px; color: #52525b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">${emoji}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="footer">© 2026 myjoe</div>
    </div>
</body>
</html>
    `.trim();

    return new Response(html, {
        status: success ? 200 : 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}

async function handleResendContact(apiKey: string, email: string, action: 'unsubscribe' | 'remove'): Promise<boolean> {
    try {
        // Find audience
        const listResponse = await fetch(`${RESEND_API_URL}/audiences`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!listResponse.ok) return false;

        const listData = await listResponse.json();
        const audience = listData.data?.find((a: { name: string; id: string }) => a.name === 'Myjoe Waitlist');
        if (!audience) return true; // No audience = nothing to do

        // Find contact
        const contactsResponse = await fetch(`${RESEND_API_URL}/audiences/${audience.id}/contacts?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!contactsResponse.ok) return false;

        const contactsData = await contactsResponse.json();
        const contact = contactsData.data?.[0];
        if (!contact) return true; // Contact doesn't exist = success

        if (action === 'remove') {
            // Delete contact entirely
            const deleteResponse = await fetch(`${RESEND_API_URL}/audiences/${audience.id}/contacts/${contact.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            console.log(action === 'remove' ? 'Contact deleted:' : 'Contact unsubscribed:', email);
            return deleteResponse.ok;
        } else {
            // Mark as unsubscribed
            const updateResponse = await fetch(`${RESEND_API_URL}/audiences/${audience.id}/contacts/${contact.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ unsubscribed: true }),
            });
            console.log('Contact unsubscribed:', email);
            return updateResponse.ok;
        }
    } catch (error) {
        console.error('Error handling Resend contact:', error);
        return false;
    }
}

Deno.serve(async (req: Request) => {
    try {
        const url = new URL(req.url);
        const email = url.searchParams.get('email');
        const token = url.searchParams.get('token');
        const action = (url.searchParams.get('action') || 'unsubscribe') as 'unsubscribe' | 'remove';

        // Validate parameters
        if (!email || !token) {
            return htmlResponse('Invalid Request', 'Missing email or token parameter.', false);
        }

        // Validate token
        const unsubscribeSecret = Deno.env.get('UNSUBSCRIBE_SECRET') || 'myjoe-waitlist-2026';
        const expectedToken = generateUnsubscribeToken(email, unsubscribeSecret);
        if (token !== expectedToken) {
            return htmlResponse('Invalid Link', 'This link is invalid or has expired.', false);
        }

        // Get API keys
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jjlbdzwuhvupggfhhxiz.supabase.co';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Handle Resend contact
        if (resendApiKey) {
            await handleResendContact(resendApiKey, email, action);
        }

        // Handle Supabase waitlist
        if (supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            if (action === 'remove') {
                // Delete from waitlist entirely
                const { error } = await supabase
                    .from('waitlist')
                    .delete()
                    .eq('email', email.toLowerCase());
                if (error) console.error('Failed to delete from waitlist:', error);
                else console.log('Deleted from waitlist:', email);
            } else {
                // Just mark as unsubscribed
                const { error } = await supabase
                    .from('waitlist')
                    .update({ unsubscribed: true })
                    .eq('email', email.toLowerCase());
                if (error) console.error('Failed to update waitlist:', error);
                else console.log('Marked as unsubscribed:', email);
            }
        }

        if (action === 'remove') {
            return htmlResponse(
                'Removed from Waitlist',
                `You've been completely removed from our waitlist. Your data has been deleted. We're sorry to see you go!`,
                true
            );
        } else {
            return htmlResponse(
                'Unsubscribed',
                `You've been unsubscribed from our mailing list. You're still on the waitlist, but you won't receive any more emails.`,
                true
            );
        }

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return htmlResponse('Error', 'An unexpected error occurred. Please try again later.', false);
    }
});
