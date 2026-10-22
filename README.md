# RAYAN GUARDIAN — Device Monitoring API (Backend)

Production-ready Express + Firebase Admin + Firestore + Socket.IO backend for RAYAN GUARDIAN.
Compatible with a React + Vite frontend hosted on Vercel. Deployed on Railway.

Scope is limited to six features: Camera Monitoring, Screen Monitoring, Gallery,
Notifications, SMS, Contacts — all mediated by explicit user consent and OS-level
permissions. This backend does not bypass OS permissions and does not store SMS
content, contacts, photos, videos, or sensor recordings automatically.

> **Status:** This repository contains source code and deployment instructions only.
> It does not ship an APK, and it does not claim to be deployed until you deploy it.

---

## 1. Requirements

- Node.js LTS (>= 20)
- A Firebase project (Authentication + Firestore)
- A GitHub account
- A Railway account
- A Vercel account (frontend already deployed or to be deployed separately)

---

## 2. Local development

```bash
git clone https://github.com/YOUR-USERNAME/rayan-guardian-backend.git
cd rayan-guardian-backend
npm install
cp .env.example .env
# fill .env with your Firebase service account values (see section 4)
npm run dev
