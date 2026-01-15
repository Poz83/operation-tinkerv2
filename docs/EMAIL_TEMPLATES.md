# Myjoe Premium Email Templates

Copy and paste these HTML codes into your Supabase Dashboard > Authentication > Email Templates.

## 1. Magic Link (Sign In)

**Subject:** Login to Myjoe Creative Suite

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to Myjoe</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff;">
  
  <!-- Main Container -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d; padding: 40px 0;">
    <tr>
      <td align="center">
        
        <!-- Content Card -->
        <table role="presentation" width="100%" maxWidth="480" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #1a1a1a; border-radius: 16px; border: 1px solid #333333; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.5);">
          
          <!-- Header / Logo Area -->
          <tr>
            <td align="center" style="padding: 40px 0 20px 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(90deg, #FFFFFF 0%, #A3A3A3 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #ffffff; letter-spacing: -0.5px;">Myjoe</h1>
            </td>
          </tr>

          <!-- Body Text -->
          <tr>
            <td align="center" style="padding: 0 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e5e5e5;">
                Welcome back! Click the button below to sign in to your creative suite.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 10px 40px 40px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                Sign In Now
              </a>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #666666;">
                Or copy and paste this link:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #3b82f6; text-decoration: none; word-break: break-all; font-size: 12px;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #141414; padding: 24px 40px; border-top: 1px solid #333333;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666666; text-align: center;">
                If you didn't request this login link, you can safely ignore this email.
                <br><br>
                &copy; {{ .CurrentYear }} Myjoe Creative Suite
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 2. Confirm Sign Up (Verification)

**Subject:** Confirm your Myjoe account

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d; padding: 40px 0;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" maxWidth="480" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #1a1a1a; border-radius: 16px; border: 1px solid #333333; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 0 20px 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Myjoe</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding: 0 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Verify your identity</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e5e5e5;">
                Thanks for joining! Please verify your email address to get access to the full creative suite.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding: 10px 40px 40px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                Confirm Email
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #141414; padding: 24px 40px; border-top: 1px solid #333333;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666666; text-align: center;">
                &copy; {{ .CurrentYear }} Myjoe Creative Suite
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```
