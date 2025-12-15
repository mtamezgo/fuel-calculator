# Quick Start Guide

Get your Fuel Calculator running in 10 minutes!

## What You'll Need

- Node.js 18+ installed
- A free Supabase account
- (Optional) Google Cloud account for OAuth

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
cd "/Users/marcelotamez/Coding Projects/FuelCalculator"
npm install
```

### 2. Set Up Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) → Sign in → **New Project**
2. Fill in:
   - Name: `fuel-calculator`
   - Password: `[create a strong password]`
   - Region: `[closest to you]`
3. Wait 2 minutes for setup
4. Go to **Settings** → **Database** → **Connection string** → **URI**
5. Copy the connection string

### 3. Configure Environment (1 min)

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@..."
BETTER_AUTH_SECRET="run: openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:5173"
```

**Skip Google OAuth for now** - you can add it later!

### 4. Create Database Tables (30 sec)

```bash
npm run db:push
```

### 5. Run the App (10 sec)

```bash
npm run dev
```

Open `http://localhost:5173` 🎉

## First Steps

1. Go to `http://localhost:5173/register`
2. Create an account with email/password
3. You're in!

## Add Google OAuth (Optional - 5 min)

### Get Google Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create project → Enable "Google+ API"
3. **Credentials** → **Create** → **OAuth client ID**
4. Add redirect URI: `http://localhost:5173/api/auth/callback/google`
5. Copy Client ID & Secret

### Update .env

```env
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"
```

### Restart Server

```bash
# Ctrl+C to stop
npm run dev
```

Now "Continue with Google" button will work!

## Deploy to Vercel (5 min)

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/fuel-calculator.git
git push -u origin main
```

### Deploy

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Add environment variables:
   - `DATABASE_URL` (from Supabase)
   - `BETTER_AUTH_SECRET` (generate new one)
   - `BETTER_AUTH_URL` (your Vercel URL like `https://fuel-calculator.vercel.app`)
   - `GOOGLE_CLIENT_ID` (if using OAuth)
   - `GOOGLE_CLIENT_SECRET` (if using OAuth)
4. Click **Deploy**
5. **Update Google OAuth redirect** (if using):
   - Add `https://your-app.vercel.app/api/auth/callback/google` to Google Console

Done! Your app is live 🚀

## You're All Set! 🎉

The application is fully built and ready to use. Start using the calculator:

1. Visit `http://localhost:5173/register` to create an account
2. Sign in and start calculating fuel prices
3. Save presets to the cloud
4. Share results to WhatsApp

## Troubleshooting

### "Database connection failed"
- Check your `DATABASE_URL` in `.env`
- Make sure password is correct
- Verify Supabase project is active

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "Port 5173 is already in use"
```bash
# Kill the process on port 5173
lsof -ti:5173 | xargs kill -9
npm run dev
```

### Auth not working
- Make sure `BETTER_AUTH_SECRET` is at least 32 characters
- Check `BETTER_AUTH_URL` matches your current URL
- Clear browser cookies and try again

## Pro Tips

✅ **View your database**: `npm run db:studio`
✅ **Check API routes**: Visit `http://localhost:5173/api/auth`
✅ **Test OAuth locally**: Use `http://localhost:5173` in Google Console
✅ **Hot reload works**: Edit files and see changes instantly

## Features Included

- ✅ Authentication (email/password + Google OAuth)
- ✅ Protected routes with session management
- ✅ Database (users, accounts, sessions, presets)
- ✅ API routes for presets CRUD
- ✅ Beautiful login/register pages (Instagram-style)
- ✅ Full calculator UI with shadcn components
- ✅ Preset management (save, load, update, delete)
- ✅ WhatsApp sharing (native on mobile, download on desktop)
- ✅ Drag-and-drop row reordering
- ✅ Live exchange rate fetching
- ✅ Margin calculator with 4 input formats
- ✅ Decimal precision toggle (2 vs 4 decimals)
- ✅ Number formatting with commas
- ✅ Responsive design for mobile and desktop

---

**Need help?** Check [SETUP.md](./SETUP.md) for detailed instructions or [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for technical details.
