# OTP (One-Time Password) Verification Explained

## For Non-Technical Stakeholders

---

## What is OTP Verification?

OTP stands for **One-Time Password** - a temporary, unique code that is valid for only one login session or transaction. Think of it as a digital key that self-destructs after use.

**Real-world analogy:** It's like a temporary access code a hotel gives you that works only once and expires after a short time.

---

## How Does OTP Work? (Step-by-Step)

### 1️⃣ User Initiates Action
A user tries to:
- Sign up for a new account
- Log in to their existing account
- Reset their forgotten password
- Complete a sensitive transaction (like a payment)

### 2️⃣ OTP is Generated
The system creates a **random, unique code** (typically 4-6 digits):
```
Example: 847291
```

**How it's generated:**
- Uses cryptographically secure random number generators
- Each code is unique and unpredictable
- Codes are tied to a specific user and action
- Has a short validity period (usually 5-10 minutes)

### 3️⃣ OTP is Sent to User
The code is delivered via:

| Method | Example |
|--------|---------|
| **Email** | "Your verification code is: 847291" sent to user@email.com |
| **SMS** | Text message to +64 22 123 4567 |
| **Authenticator App** | Google Authenticator, Microsoft Authenticator |

### 4️⃣ User Enters the Code
The user receives the OTP and enters it on the website/app.

### 5️⃣ System Verifies the Code
The backend checks:
- ✅ Is the code correct?
- ✅ Has it expired?
- ✅ Has it been used before?
- ✅ Does it match this specific user?

If all checks pass → **Access Granted!**

---

## Visual Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    USER     │     │   SERVER    │     │ EMAIL/SMS   │
│             │     │             │     │  PROVIDER   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. Request OTP   │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │  2. Generate code │
       │                   │  (e.g., 847291)   │
       │                   │                   │
       │                   │  3. Send code     │
       │                   │──────────────────>│
       │                   │                   │
       │                   │                   │  4. Deliver
       │<──────────────────────────────────────│  to user
       │                   │                   │
       │  5. Enter code    │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │  6. Verify code   │
       │                   │                   │
       │  7. Access granted│                   │
       │<──────────────────│                   │
       │                   │                   │
```

---

## Why OTP Improves Security

### 🛡️ Protection Against Password Theft
Even if someone steals a user's password, they **cannot log in without the OTP** sent to the user's phone or email.

### ⏰ Time-Limited Validity
OTPs expire quickly (5-10 minutes), so even if intercepted, they become useless.

### 🔄 One-Time Use
Each OTP works only once. If used, it's immediately invalidated.

### 📱 Proves Device Ownership
By requiring access to the user's phone/email, OTP confirms the person logging in has control of a trusted device.

### 🎯 Two-Factor Authentication (2FA)
OTP provides a **second layer of security**:
- **Factor 1:** Something you **know** (password)
- **Factor 2:** Something you **have** (phone/email for OTP)

---

## Common OTP Delivery Methods

### 📧 Email OTP
**Pros:**
- Free to implement
- Works for all users with email
- No additional hardware needed

**Cons:**
- Can end up in spam folders
- Slower delivery (seconds to minutes)
- Email accounts can be hacked

### 📱 SMS OTP
**Pros:**
- Fast delivery (seconds)
- High user familiarity
- Works on basic phones

**Cons:**
- Cost per SMS (service provider fees)
- SIM swap attacks possible
- Requires valid phone number

### 🔐 Authenticator Apps (TOTP)
**Pros:**
- Most secure option
- Works offline
- No delivery costs

**Cons:**
- Requires app installation
- More complex for non-technical users
- Device dependency

---

## Implementation for noso company

### Recommended Approach:

1. **Email OTP for Registration**
   - Low cost
   - Verifies email ownership
   - Good for initial account creation

2. **Optional SMS OTP for High-Value Actions**
   - Password resets
   - Payment confirmations
   - Account changes

3. **Consider Authenticator Apps for Business Accounts**
   - Partners and Admins
   - Higher security requirements

---

## Cost Considerations

| Method | Estimated Cost |
|--------|----------------|
| Email OTP | Free (using existing email service) |
| SMS OTP (NZ) | $0.05-0.15 per SMS |
| Authenticator | Free |

**Recommended Email Providers for OTP:**
- SendGrid (100 emails/day free)
- Amazon SES ($0.10 per 1,000 emails)
- Mailgun (5,000 emails/month free)

---

## Security Best Practices

1. **Rate Limiting** - Limit OTP requests (e.g., max 5 per hour)
2. **Short Expiry** - OTPs should expire within 5-10 minutes
3. **Lockout Policy** - Lock account after 5 failed attempts
4. **Secure Generation** - Use cryptographic randomness
5. **HTTPS Only** - Never transmit OTPs over unencrypted connections
6. **No Reuse** - Invalidate OTP immediately after use

---

## Summary

OTP verification is a simple yet powerful security measure that:
- ✅ Protects against password theft
- ✅ Confirms user identity
- ✅ Is familiar to most users
- ✅ Can be implemented cost-effectively
- ✅ Significantly reduces unauthorized access

For noso company, implementing email-based OTP for registration and password resets would provide excellent security without significant cost or complexity.
