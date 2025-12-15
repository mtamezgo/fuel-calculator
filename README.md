# Fuel Margin Calculator

A modern web application for converting fuel prices between USD/Gallon and MXN/Liter for Mexican fuel businesses.

## 🚀 Tech Stack

- **Frontend**: React 19 + React Router 7
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Better Auth (email/password + Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **Image Generation**: html2canvas
- **Deployment**: Vercel

## ✨ Features

- **Currency Conversion**: Automatically converts between USD per Gallon and MXN per Liter
- **Live Exchange Rate**: Fetches current USD to MXN exchange rate from the internet
- **User Authentication**: Secure login with email/password or Google OAuth
- **Cloud Database**: All presets saved to Supabase (accessible from any device)
- **5-Column View**: See prices in multiple formats simultaneously:
  - Concept (name of the cost item)
  - MXN/Ltr (Mexican Pesos per Liter)
  - MXN (Total Mexican Pesos)
  - USD (Total US Dollars)
  - USD/Gal (US Dollars per Gallon)
- **Dynamic Cost Concepts**: Add as many cost items as needed (transportation, taxes, margins, etc.)
- **Drag & Drop**: Reorder cost concepts with drag and drop
- **Preset Management**: Save and load different calculation scenarios (synced to cloud)
- **Volume Sync**: Gallons and Liters automatically stay synchronized
- **Margin Calculator**: Enter margin in any format (MXN/Ltr, MXN, USD, USD/Gal)
- **Decimal Toggle**: Switch between 2 or 4 decimal places
- **WhatsApp Sharing**: Export cost breakdown as JPG and share via WhatsApp (Web Share API on mobile)

## 📋 Setup & Installation

**For detailed setup instructions, see [SETUP.md](./SETUP.md)**

Quick start:
```bash
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run db:push
npm run dev
```

## 🔨 Development Status

**✅ COMPLETE**: The application is fully implemented and ready for use!

**What's Done:**
- ✅ Database schema (Drizzle + Supabase)
- ✅ Authentication system (Better Auth with Google OAuth)
- ✅ API routes for presets CRUD
- ✅ shadcn/ui components
- ✅ Login/Register pages with Google OAuth
- ✅ Calculator UI with React components
- ✅ Preset management UI
- ✅ WhatsApp sharing integration
- ✅ Drag-and-drop row reordering
- ✅ Decimal precision toggle (2 vs 4 decimals)
- ✅ Margin calculator with multiple input formats
- ✅ Instagram-style design system

## 📖 How to Use

### Getting Started

1. **Create an Account**
   - Navigate to `/register`
   - Sign up with email and password OR use "Continue with Google"

2. **Set the Exchange Rate**
   - Click the "Fetch Current Rate" button to get the latest USD to MXN rate
   - OR manually enter your preferred exchange rate

3. **Enter Base Information**
   - **Base Price (USD/Gal)**: Enter the molecule price in dollars per gallon
   - **Gallons**: Enter the volume in gallons (liters will auto-calculate)
   - **Liters**: Or enter the volume in liters (gallons will auto-calculate)

### Working with Cost Concepts

The calculator starts with one row: "Molecule Price" (the base fuel cost).

**Adding More Concepts:**
1. Click the "+ Add Cost Concept" button
2. Click on the concept name to rename it (e.g., "Transportation", "Taxes", "Margin")
3. Enter a value in ANY of the four price columns:
   - Enter in MXN/Ltr if you know the cost per liter in pesos
   - Enter in MXN if you know the total cost in pesos
   - Enter in USD if you know the total cost in dollars
   - Enter in USD/Gal if you know the cost per gallon in dollars
4. All other columns will automatically calculate

**Reordering Concepts:**
- Drag and drop any row using the grip handle on the left to reorder

**Deleting Concepts:**
- Click the trash icon next to any concept (except Molecule Price)

**Setting Margin:**
- Use the MARGIN row in the footer to enter your desired profit margin
- Enter margin in any format (MXN/Ltr, MXN, USD, or USD/Gal)
- The SALE PRICE row shows your total price including margin

### Saving and Loading Presets

**To Save:**
1. Set up your calculator with all desired values
2. Enter a name in the "Save New Preset" field (e.g., "Regular Gasoline - December")
3. Click "Save"
4. Your preset is now saved to the cloud

**To Load:**
1. Select your saved preset from the dropdown in the Presets section
2. Click the "Load" button
3. All values will be restored

**To Update:**
1. Select a preset from the dropdown
2. Make your changes to the calculator
3. Click the "Update" button to overwrite the existing preset

**To Delete:**
1. Select a preset from the dropdown
2. Click the "Delete" button
3. Confirm the deletion

### Sharing to WhatsApp

1. Fill in your calculator with the desired values
2. Click the "Share to WhatsApp" button in the top right
3. **On Mobile**: Use the native share sheet to send directly to WhatsApp
4. **On Desktop**: The table will be downloaded as a JPG image, and you'll be prompted to open WhatsApp Web or Desktop

## Conversion Formulas

The calculator uses these standard conversions:

- **1 Gallon = 3.78541 Liters**
- **USD to MXN**: Amount in USD × Exchange Rate = Amount in MXN
- **MXN to USD**: Amount in MXN ÷ Exchange Rate = Amount in USD
- **USD/Gal to MXN/Ltr**: (USD/Gal ÷ 3.78541) × Exchange Rate = MXN/Ltr
- **MXN/Ltr to USD/Gal**: (MXN/Ltr ÷ Exchange Rate) × 3.78541 = USD/Gal

## Tips

- The **TOTAL COST** row sums all cost concepts
- The **MARGIN** row lets you add profit margin in any format
- The **SALE PRICE** row shows total cost + margin (your final selling price)
- You can enter values in any column - the others will auto-calculate
- Presets are saved to Supabase cloud and accessible from any device
- Use "Switch to 2 Decimals" button for cleaner display
- The exchange rate API is free and updates daily
- All calculations happen instantly as you type
- Drag and drop rows to organize your cost breakdown
- Numbers are formatted with commas for easier reading

## 🗄️ Database Schema

```typescript
// Users table
users {
  id: uuid (PK)
  email: string (unique)
  name: string
  createdAt: timestamp
  updatedAt: timestamp
}

// Presets table
presets {
  id: uuid (PK)
  userId: uuid (FK -> users)
  name: string
  exchangeRate: number
  basePrice: number
  gallons: number
  liters: number
  margin: number
  marginInputType: string
  concepts: json
  createdAt: timestamp
  updatedAt: timestamp
}
```

## 🚀 Deployment

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

Quick deploy to Vercel:
```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git push

# Deploy with Vercel
npx vercel --prod
```

Don't forget to add environment variables in Vercel dashboard!

## 📱 Mobile Support

The calculator is fully responsive and optimized for mobile devices:
- Touch-friendly buttons and inputs
- Horizontal scrolling for the table on smaller screens
- Optimized font sizes and spacing
- Native WhatsApp sharing on mobile devices

## 🤝 Contributing

This project was built with:
- React Router 7 for routing and SSR
- Better Auth for secure authentication
- Drizzle ORM for type-safe database queries
- shadcn/ui for beautiful, accessible components
- Tailwind CSS for styling

## 📄 License

Private project for fuel business operations.

---

**Modern Fuel Price Conversion Tool** 🚛⛽
