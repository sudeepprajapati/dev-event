<div align="center">
  <br />
    <a href="https://youtu.be/I1V9YWqRIeI" target="_blank">
      <img src="public/readme/readme-hero.webp" alt="Project Banner">    
    </a>
  <br />

  <div>
<img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logo=Next.js&logoColor=white" />
<img src="https://img.shields.io/badge/-Typescript-3178C6?style=for-the-badge&logo=Typescript&logoColor=white" />
<img src="https://img.shields.io/badge/-Tailwind-06B6D4?style=for-the-badge&logo=Tailwind%20CSS&logoColor=white" />
<img src="https://img.shields.io/badge/-MongoDB-47A248?style=for-the-badge&logo=MongoDB&logoColor=white" />
<img src="https://img.shields.io/badge/-NextAuth-000000?style=for-the-badge&logo=NextAuth&logoColor=white" /><br/>

<img src="https://img.shields.io/badge/-Cloudinary-002C73?style=for-the-badge&logo=Cloudinary&logoColor=white" />
<img src="https://img.shields.io/badge/-Razorpay-020066?style=for-the-badge&logo=Razorpay&logoColor=white" />
<img src="https://img.shields.io/badge/-Redis-DC382D?style=for-the-badge&logo=Redis&logoColor=white" />


  </div>

  <h3 align="center">Dev Event Platform</h3>
</div>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🔗 [Assets](#links)
6. 🚀 [More](#more)

## <a name="introduction">✨ Introduction</a>

A full-stack event management platform where users can discover, register, and manage events. Features include user authentication, event creation by organizers, secure payments via Razorpay, admin dashboard, and rate-limited API endpoints.

## <a name="tech-stack">⚙️ Tech Stack

- **[Next.js 16](https://nextjs.org/docs)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[MongoDB](https://www.mongodb.com/products/platform/atlas-database)** - NoSQL database
- **[Mongoose](https://mongoosejs.com/)** - MongoDB ODM
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication
- **[Cloudinary](https://cloudinary.com/)** - Image management
- **[Razorpay](https://razorpay.com/)** - Payment gateway
- **[Upstash Redis](https://upstash.com/)** - Rate limiting
- **[shadcn/ui](https://ui.shadcn.com/)** - Reusable UI components
- **[Aceternity UI](https://ui.aceternity.com/)** - Beautiful UI components
- **[Zod](https://zod.dev/)** - Schema validation
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Password hashing


## <a name="features">🔋 Features</a>

👉 **Authentication**: Sign up, sign in, and secure session management with NextAuth.js  

👉 **Event Management**: Create, edit, delete events with image uploads via Cloudinary  

👉 **Booking System**: Free and paid event bookings with Razorpay integration  

👉 **Admin Dashboard**: Manage users, events, and view all bookings  

👉 **Organizer Panel**: Create and manage your own events  

👉 **User Dashboard**: Track your event bookings and payment status  

👉 **Rate Limiting**: API protection with Upstash Redis  

👉 **Payment Integration**: Secure payments via Razorpay with webhook support

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/sudeepprajapati/dev-event.git
cd dev-events
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000/
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
NEXTAUTH_SECRET=<your-secret-key>
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=<admin-email>
RAZORPAY_KEY_ID=<your-key-id>
RAZORPAY_KEY_SECRET=<your-key-secret>
UPSTASH_REDIS_REST_URL=<redis-url>
UPSTASH_REDIS_REST_TOKEN=<redis-token>
```

Replace the placeholder values with your real credentials.

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.
