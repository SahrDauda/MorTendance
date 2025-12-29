# 🚀 Bridge Platform - Setup Guide

This guide will help you set up the Bridge Platform with a real database and authentication.

## Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** database (local or cloud)
- **Git** installed

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Prisma ORM
- NextAuth.js
- bcryptjs
- And all other dependencies

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/bridge_platform?schema=public"

# NextAuth - Generate a secret key
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET` value.

## Step 3: Set Up Database

### Option A: Local PostgreSQL

1. Install PostgreSQL if you haven't already
2. Create a new database:
```sql
CREATE DATABASE bridge_platform;
```

3. Update your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/bridge_platform?schema=public"
```

### Option B: Cloud Database (Recommended for Production)

Use services like:
- **Vercel Postgres** (easiest with Vercel deployment)
- **Supabase** (free tier available)
- **Neon** (serverless PostgreSQL)
- **Railway** (simple PostgreSQL hosting)

## Step 4: Run Database Migrations

1. Generate Prisma Client:
```bash
npm run db:generate
```

2. Push the schema to your database:
```bash
npm run db:push
```

This will create all tables in your database based on the Prisma schema.

### Alternative: Use SQL Scripts

If you prefer using the SQL scripts directly:

```bash
psql -U your_user -d bridge_platform -f scripts/01-create-tables.sql
psql -U your_user -d bridge_platform -f scripts/02-seed-data.sql
```

Then generate Prisma Client:
```bash
npm run db:generate
```

## Step 5: Seed Initial Data (Optional)

You can seed your database with initial data:

```bash
# Using Prisma Studio (GUI)
npm run db:studio

# Or create a seed script in prisma/seed.ts
```

## Step 6: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 7: Create Your First Account

1. Navigate to `http://localhost:3000/auth/signup`
2. Fill in your details and create an account
3. You'll be redirected to sign in
4. After signing in, you'll see the dashboard

## 🎉 You're All Set!

The application now has:
- ✅ Real database connection
- ✅ User authentication
- ✅ API routes for all features
- ✅ Functional forms that persist data

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings if using a remote database

### Prisma Client Errors

If you see Prisma client errors:
```bash
npm run db:generate
```

### Authentication Not Working

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your app URL
- Clear browser cookies and try again

### API Routes Returning 401

- Make sure you're signed in
- Check that middleware is properly configured
- Verify session is being created

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Vercel will automatically detect Next.js and deploy

### Environment Variables for Production

Make sure to set:
- `DATABASE_URL` (production database)
- `NEXTAUTH_SECRET` (different from development)
- `NEXTAUTH_URL` (your production domain)

## Database Management

### View Database in Prisma Studio

```bash
npm run db:studio
```

This opens a GUI to view and edit your database.

### Create a Migration

```bash
npm run db:migrate
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```

## Next Steps

- Add more skills to the database
- Create opportunities/jobs
- Set up email notifications (optional)
- Configure file uploads for project media
- Set up blockchain verification (for credentials)

## Support

If you encounter issues:
1. Check the console for error messages
2. Review the Prisma logs
3. Verify all environment variables are set
4. Ensure database migrations ran successfully

