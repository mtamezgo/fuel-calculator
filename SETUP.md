# Fuel Calculator - Setup Guide

This guide will help you set up the Fuel Calculator with React Router 7, Better Auth, Drizzle ORM, and Supabase.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great!)
- Terminal access

## Step 1: Install Dependencies

```bash
cd "/Users/marcelotamez/Coding Projects/FuelCalculator"
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: `fuel-calculator`
   - Database Password: (choose a strong password and save it!)
   - Region: Choose closest to you
4. Wait for the project to be created (takes ~2 minutes)

## Step 3: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** → **URI**
3. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@...`)
4. Replace `[YOUR-PASSWORD]` with the password you set in Step 2

## Step 4: Set Up Google OAuth (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
4. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `http://localhost:5173/api/auth/callback/google` (for local development)
     - `https://your-app.vercel.app/api/auth/callback/google` (for production - add later)
   - Click **Create**
5. Copy your **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your details:
   ```env
   DATABASE_URL="your-supabase-connection-string"
   BETTER_AUTH_SECRET="any-random-string-at-least-32-characters-long"
   BETTER_AUTH_URL="http://localhost:5173"
   GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

   **Generate a secure secret:**
   ```bash
   openssl rand -base64 32
   ```

   **Note:** If you skip Google OAuth setup, users can still sign up with email/password!

## Step 6: Push Database Schema

Run Drizzle to create your database tables:

```bash
npm run db:push
```

You should see a success message indicating the tables were created.

## Step 7: Run Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`!

## Step 8: Create Your First Account

1. Navigate to `http://localhost:5173/register`
2. Sign up using either:
   - **Google OAuth**: Click "Continue with Google" (if you set up OAuth)
   - **Email/Password**: Fill in the form and create an account
3. You'll be redirected to the calculator!

## Deploying to Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with React Router 7"
   git branch -M main
   # Create a repo on GitHub, then:
   git remote add origin https://github.com/your-username/fuel-calculator.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure environment variables in Vercel:
   - `DATABASE_URL`: Your Supabase connection string
   - `BETTER_AUTH_SECRET`: Your auth secret
   - `BETTER_AUTH_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID (if using Google OAuth)
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret (if using Google OAuth)
6. **Important**: Go back to Google Cloud Console and add your Vercel URL to authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/google`
7. Click **Deploy**!

### Option 2: Using Vercel CLI

```bash
npx vercel
# Follow the prompts

# Add environment variables
npx vercel env add DATABASE_URL
npx vercel env add BETTER_AUTH_SECRET
npx vercel env add BETTER_AUTH_URL

# Deploy to production
npx vercel --prod
```

## Troubleshooting

### Database Connection Issues

- Make sure your DATABASE_URL is correct
- Check that your Supabase project is active
- Verify the password in the connection string is correct

### Authentication Not Working

- Ensure BETTER_AUTH_SECRET is at least 32 characters
- Check that BETTER_AUTH_URL matches your deployment URL
- Clear browser cookies and try again

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules build .react-router
npm install
npm run build
```

## Database Management

View your database in Drizzle Studio:

```bash
npm run db:studio
```

This opens a visual database editor at `https://local.drizzle.studio`

## Tech Stack

- **Frontend**: React 19 + React Router 7
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Better Auth
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **Deployment**: Vercel

## Next Steps

Now you need to complete the calculator UI! The API and database are ready. Check `TODO.md` for remaining tasks.
