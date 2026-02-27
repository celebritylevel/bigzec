# Cloudflare Zero Trust Access Setup Guide

## Protecting the BigZec Admin Dashboard

This guide walks you through setting up Cloudflare Zero Trust Access to protect the `/admin` route of your BigZec dashboard, ensuring only authorized users can access administrative functions.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Enable Zero Trust](#2-enable-zero-trust)
3. [Create an Application](#3-create-an-application)
4. [Configure Access Policy](#4-configure-access-policy)
5. [DNS & Deployment Configuration](#5-dns--deployment-configuration)
6. [Testing the Setup](#6-testing-the-setup)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have:

- [ ] A Cloudflare account (free tier works)
- [ ] Your domain (`bigzec.com`) added to Cloudflare with nameservers configured
- [ ] Dashboard deployed or ready to deploy
- [ ] Access to the email: `razvan@razvantoma.com` (for authentication)

### Quick Checklist

```bash
# Verify your domain is active on Cloudflare
# Go to: https://dash.cloudflare.com
# Navigate to your domain and confirm status shows "Active"
```

---

## 2. Enable Zero Trust

### Step 2.1: Access Zero Trust Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Zero Trust** in the left sidebar
3. If not already enabled, click **Get Started**

```
[Screenshot: Cloudflare Dashboard with Zero Trust highlighted in sidebar]
```

### Step 2.2: Choose Your Team Name

1. Enter a team name (e.g., `bigzec-team`)
2. This becomes your team's identity: `bigzec-team.cloudflareaccess.com`
3. Click **Continue**

### Step 2.3: Select Plan

1. For basic email authentication, the **Free** plan is sufficient
2. Select **Free** and click **Continue**
3. Complete the setup wizard

```
[Screenshot: Zero Trust plan selection with Free plan highlighted]
```

---

## 3. Create an Application

### Step 3.1: Navigate to Access Applications

1. In Zero Trust dashboard, go to **Access** → **Applications**
2. Click **Add an application**

```
[Screenshot: Access Applications page with "Add an application" button]
```

### Step 3.2: Choose Application Type

1. Select **Self-hosted** (for your own dashboard)

```
[Screenshot: Application type selection showing Self-hosted option]
```

### Step 3.3: Configure Application Settings

Fill in the application details:

| Field | Value |
|-------|-------|
| **Application name** | `BigZec Admin Dashboard` |
| **Session Duration** | `24 hours` (or your preference) |

### Step 3.4: Configure Domain/Path Protection

**Option A: Subdomain Protection (Recommended)**

```
Application Domain:
  - Subdomain: dashboard
  - Domain: bigzec.com
  - Path: (leave empty for entire subdomain)
```

**Option B: Path-Based Protection**

```
Application Domain:
  - Subdomain: www (or root)
  - Domain: bigzec.com
  - Path: /admin/*
```

```
[Screenshot: Application domain configuration form]
```

### Step 3.5: Save Application (Don't Add Policy Yet)

Click **Next** to proceed to policy configuration.

---

## 4. Configure Access Policy

### Step 4.1: Create the Policy

1. Enter **Policy name**: `Admin Access Policy`
2. **Session Duration**: `24 hours` (default is fine)

```
[Screenshot: Policy configuration form]
```

### Step 4.2: Add Policy Rules

Click **Add a rule** and configure:

**Rule Configuration:**

| Field | Value |
|-------|-------|
| **Rule name** | `Allow Admin Email` |
| **Selector** | `Emails` |
| **Value** | `razvan@razvantoma.com` |

**How to configure:**

1. Click **Add a rule**
2. Under **Selector**, choose **Emails** from the dropdown
3. In the **Value** field, enter: `razvan@razvantoma.com`
4. The **Action** should be **Allow**

```
[Screenshot: Policy rule configuration with Email selector and value filled]
```

### Step 4.3: Complete Policy Setup

Your policy should look like this:

```
Policy: Admin Access Policy
├── Rule: Allow Admin Email
│   ├── Selector: Emails
│   ├── Value: razvan@razvantoma.com
│   └── Action: Allow
```

Click **Save policy** and then **Add application**.

### Alternative: Using Email Domain (Less Secure)

If you want to allow anyone with a specific domain:

```
Selector: Email domains
Value: razvantoma.com
Action: Allow
```

> ⚠️ **Warning**: This allows ANY email @razvantoma.com. Use specific emails for better security.

---

## 5. DNS & Deployment Configuration

### Step 5.1: Configure DNS for Subdomain (Option A - Recommended)

If using `dashboard.bigzec.com`:

1. Go to your domain's DNS settings in Cloudflare
2. Add a new record:

```
Type: CNAME
Name: dashboard
Target: your-deployment-url (e.g., bigzec.pages.dev)
Proxy status: Proxied (orange cloud) ✓
```

```
[Screenshot: DNS record configuration with orange cloud enabled]
```

### Step 5.2: Cloudflare Pages Deployment

If deploying via Cloudflare Pages:

1. Go to **Workers & Pages** → Create → **Pages**
2. Connect your Git repository
3. Configure build settings:

```yaml
Framework preset: Next.js (or your framework)
Build command: npm run build
Build output directory: .next (or dist, build, etc.)
Root directory: dashboard/
```

4. After deployment, go to **Settings** → **Builds & deployments**
5. Add a **Custom domain**: `dashboard.bigzec.com`

### Step 5.3: Verify Application is Protected

1. Go back to **Zero Trust** → **Access** → **Applications**
2. You should see your application listed
3. Click on it to verify the domain and policy are correct

```
[Screenshot: Applications list showing BigZec Admin Dashboard]
```

---

## 6. Testing the Setup

### Step 6.1: Test Unauthorized Access

1. Open an incognito/private browser window
2. Navigate to: `https://dashboard.bigzec.com/admin`
3. **Expected behavior**: You should see a Cloudflare Access login page

```
[Screenshot: Cloudflare Access login page with email input]
```

### Step 6.2: Test Authorized Access

1. Enter your email: `razvan@razvantoma.com`
2. Click **Send me a code**
3. Check your email for a 6-digit code
4. Enter the code to authenticate
5. **Expected behavior**: You're redirected to the admin dashboard

### Step 6.3: Verify Session

After authentication:

1. Open browser DevTools (F12)
2. Go to **Application** → **Cookies**
3. Look for Cloudflare Access cookies:
   - `CF_Authorization`
   - `CF_AppSession`

### Step 6.4: Test Session Expiry

1. Wait for session duration to expire (or clear cookies)
2. Try accessing the protected route again
3. You should be prompted to re-authenticate

---

## 7. Troubleshooting

### Issue: "Access Denied" Even with Correct Email

**Causes & Solutions:**

1. **Email not exactly matching**
   ```
   ✗ razvan@RazvanToma.com (different case)
   ✓ razvan@razvantoma.com (exact match)
   ```

2. **Policy not applied correctly**
   - Go to Applications → Your App → Policies
   - Verify the email is exactly `razvan@razvantoma.com`

3. **Cache issues**
   ```bash
   # Clear browser cache and cookies, then retry
   # Or use incognito mode
   ```

### Issue: Redirect Loops

**Causes & Solutions:**

1. **Application domain mismatch**
   - Ensure the domain in Access Application matches your actual domain
   - Check for trailing slashes or incorrect paths

2. **Multiple applications on same domain**
   - Review all Access applications
   - Ensure no overlapping rules

### Issue: Login Page Not Appearing

**Causes & Solutions:**

1. **DNS not proxied**
   - Ensure the DNS record has the orange cloud enabled
   - Without proxy, Access policies won't apply

2. **Application not saved**
   - Double-check the application exists in Access → Applications

### Issue: Email Code Not Arriving

**Causes & Solutions:**

1. **Check spam/junk folder**
   - Emails from Cloudflare Access may be filtered

2. **Email typos**
   - Verify the email in the policy exactly matches

3. **Resend code**
   - Click "Resend code" on the login page

### Debug Mode

Enable debug mode in Cloudflare:

```
1. Go to Zero Trust → Settings → Authentication
2. Enable "Debug mode" temporarily
3. Check logs in Zero Trust → Logs
```

### Useful Commands

```bash
# Check DNS resolution
dig dashboard.bigzec.com

# Check if site is behind Cloudflare
curl -I https://dashboard.bigzec.com
# Look for: cf-ray, cf-cache-status headers

# Test from command line
curl -v https://dashboard.bigzec.com/admin
# Should return 302 redirect to Cloudflare Access
```

---

## Quick Reference

### Access Application Configuration Summary

```yaml
Application:
  Name: BigZec Admin Dashboard
  Domain: dashboard.bigzec.com
  Path: /admin (optional)

Policy:
  Name: Admin Access Policy
  Session: 24 hours
  
  Rules:
    - Selector: Emails
      Value: razvan@razvantoma.com
      Action: Allow
```

### DNS Configuration

```yaml
Record:
  Type: CNAME
  Name: dashboard
  Target: bigzec.pages.dev (or your deployment)
  Proxy: Enabled (orange cloud)
```

### Authentication Flow

```
User visits dashboard.bigzec.com/admin
        ↓
Cloudflare intercepts request
        ↓
No valid session? → Show login page
        ↓
User enters email → Cloudflare sends code
        ↓
User enters code → Cloudflare validates
        ↓
Session created → User redirected to app
        ↓
Subsequent requests authenticated via cookie
```

---

## Additional Resources

- [Cloudflare Zero Trust Documentation](https://developers.cloudflare.com/cloudflare-one/)
- [Access Policy Rules Reference](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

---

## Support

If you encounter issues not covered in this guide:

1. Check Cloudflare Status: https://www.cloudflarestatus.com/
2. Review Access Logs: Zero Trust → Logs
3. Contact Cloudflare Support (paid plans)

---

*Last updated: February 2026*
*Protected route: `/admin` or `dashboard.bigzec.com`*
*Authorized email: `razvan@razvantoma.com`*
