# 🏢 AModern Apartment Management System

A modern web-based apartment management system for landlords and tenants. With payment handling via Stripe. Deployed on Heroku and AWS Amplify.

---

## 📑 Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Features

- 🧾 Rent collection with Stripe
- 👥 Tenant and landlord dashboards
- 🏘️ Add and manage properties and units
- 🛠️ Maintenance request system
- 📊 Analytics and reporting
- ✉️ Notifications and email reminders
- 🔐 Secure authentication and authorization

---

## 🔗 Demo

Spinned Server: [https://murandi-apartments-d3ba7e492c04.herokuapp.com/](https://murandi-apartments-d3ba7e492c04.herokuapp.com/)

> Note: Demo uses a test Stripe account. Use test card: `4242 4242 4242 4242` with any valid expiration and CVC.

---

## 🧰 Tech Stack

**Frontend:** React (Vite), Tailwind CSS  
**Backend:** Node.js, Express  
**Database:** PostgreSQL  
**Payments:** Stripe  
**Deployment:**

- Frontend: Heroku (main), AWS Amplify(fallback)
- Backend: Heroku
- Database: Heroku PostgreSQL

---

## 🛠️ Installation

Clone the project and install dependencies:

```bash
git clone git@github.com:Allan-Binga/Apartment-Management-System.git

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install

# Spin the backend Server
npm run dev

#Spin the frontend
npm run dev
```
