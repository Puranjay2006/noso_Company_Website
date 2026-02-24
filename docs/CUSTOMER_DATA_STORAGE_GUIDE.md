# NoSo Company - Customer Data Storage Guide

## 📋 Summary for Non-Technical Readers

This guide explains how NoSo Company stores and protects customer information. Written in plain English, it covers what data is collected, where it's stored, and how it's kept safe.

---

## 🗃️ Where Customer Data is Stored

### Database: MongoDB
NoSo uses **MongoDB**, a modern database system, to store all customer information. Think of it like a very organized digital filing cabinet where each customer has their own folder.

**Database Name:** `noso_company`

**Key Characteristics:**
- Cloud-hosted and backed up regularly
- Data is organized in "collections" (similar to tables/folders)
- Each piece of data has a unique ID for easy retrieval

---

## 📁 What Customer Data is Collected

### 1. **Account Information** (Users Collection)

| Data Type | Purpose | Example |
|-----------|---------|---------|
| Email Address | Login & communication | john@email.com |
| Name | Identification | John Smith |
| Password | Account security | *(Encrypted - see Security section)* |
| Phone Number | Contact for bookings | 021-123-4567 |
| Address | Service delivery | 123 Main St, Auckland |
| Location Coordinates | Find nearby service providers | GPS coordinates |
| Role | Access level | Customer, Partner, Admin |
| Account Status | Active/Inactive account | Active |
| Created Date | Account age | 2024-01-15 |

### 2. **Booking Information** (Bookings Collection)

| Data Type | Purpose | Example |
|-----------|---------|---------|
| Customer ID | Link booking to customer | *(Internal reference)* |
| Customer Name | For the service provider | John Smith |
| Service Details | What was booked | "Deep House Cleaning" |
| Booking Date & Time | When the service happens | March 15, 2024 at 10am |
| Service Address | Where to provide service | 123 Main St, Auckland |
| Status | Track booking progress | Pending → Confirmed → Completed |
| Special Instructions | Customer notes | "Please use eco-friendly products" |
| Total Price | Cost of service | $150.00 |

### 3. **Payment Information** (Transactions Collection)

| Data Type | Purpose | Example |
|-----------|---------|---------|
| Transaction ID | Track payments | *(Unique reference)* |
| Payment Status | Verify payment | Completed |
| Amount Paid | Record of payment | $150.00 |
| Payment Method | How they paid | Credit Card via Stripe |
| Date | When payment was made | 2024-03-10 |

> **Important:** NoSo does **NOT** store credit card numbers. Payment processing is handled by **Stripe** (a PCI-compliant payment processor). Only payment confirmation IDs are stored.

### 4. **Shopping Cart** (Cart Items Collection)

| Data Type | Purpose | Example |
|-----------|---------|---------|
| Services Selected | Items in cart | House Cleaning, Garden Work |
| Quantity | Number of each service | 1, 2 |
| Selected Date/Time | Preferred booking time | March 20, 2024 |

### 5. **Notifications** (Notifications Collection)

| Data Type | Purpose | Example |
|-----------|---------|---------|
| Message Content | System updates | "Your booking is confirmed" |
| Read Status | Track if seen | Read / Unread |
| Notification Type | Category | Booking, Payment, System |

---

## 🔒 How Customer Data is Protected

### Password Security
- Passwords are **never stored in plain text**
- We use **bcrypt encryption** (industry standard)
- Even administrators cannot see actual passwords
- Passwords are one-way encrypted (can't be reversed)

### Login Security
- **JWT Tokens**: When you log in, you receive a secure token that proves your identity
- **Token Expiration**: Access tokens expire after 1 day for safety
- **Refresh Tokens**: Long-term sessions can be renewed securely (7 days)
- **Secret Keys**: All tokens are signed with secure, random keys

### Database Security
- **Unique Indexes**: Prevents duplicate accounts (e.g., same email can't register twice)
- **Access Control**: Different user roles have different permissions
  - Customers: See only their own data
  - Partners: See their assigned bookings
  - Admins: Full system access

### Data Transmission
- All data sent between customer browsers and our servers uses **HTTPS** (encrypted connection)
- Like a sealed envelope that only the sender and receiver can open

---

## 🔐 Customer Privacy Controls

### What Customers Can Do
1. **View Their Data**: Access all stored personal information
2. **Update Information**: Change name, phone, address anytime
3. **Delete Account**: Request complete account removal
4. **Change Password**: Update login credentials securely

### What Customers Cannot Do (By Design)
- See other customers' information
- Access partner or admin data
- View raw database records

---

## 📊 Data Retention

| Data Type | How Long We Keep It |
|-----------|---------------------|
| Account Information | Until account is deleted |
| Booking History | Permanently (for records) |
| Payment Records | 7 years (legal requirement) |
| Cart Items | Until checkout or 30 days |
| Notifications | 90 days after being read |

---

## 🌍 Where Data is Physically Stored

- **Primary Location**: Cloud servers (MongoDB Atlas)
- **Backup**: Automatic daily backups
- **Region**: Configured based on business needs (typically nearest data center to NZ)

---

## ✅ Compliance & Best Practices

NoSo follows industry standards for data protection:

1. **Encryption**: All sensitive data is encrypted
2. **Minimal Collection**: We only collect necessary information
3. **Secure Authentication**: Modern JWT-based login system
4. **Password Standards**: Strong hashing with bcrypt
5. **Role-Based Access**: Users only see what they need
6. **Audit Trail**: Important actions are logged

---

## 📞 Questions?

If you have questions about customer data storage or privacy:
- **Email**: naveen@nosocompany.com
- **Website**: www.nosocompany.com

---

## 📝 Document Information

| Item | Details |
|------|---------|
| Last Updated | January 2026 |
| Version | 1.0 |
| Author | NoSo Development Team |
| Review Schedule | Quarterly |

---

*This document is intended for internal use and stakeholder communication. For the public-facing privacy policy, please refer to the website's Privacy Policy page.*
