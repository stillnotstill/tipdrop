# TipDrop - Setup Guide

Tip sheet viewer for Break Room 86 and Kiss Kiss Bang Bang.
Staff uploads a photo, everyone else bookmarks the link and checks whenever.

---

## What you need (all free)

1. **Supabase account** (free) - stores the images and data
2. **Netlify account** (free) - hosts the website
3. **GitHub account** (free) - holds the code so Netlify can deploy it

---

## Step 1: Set up Supabase (5 minutes)

1. Go to https://supabase.com and sign up / sign in
2. Click "New Project", name it `tipdrop`, pick a region close to LA, set a database password (save it somewhere)
3. Wait for the project to finish creating

### Create the database table

4. In your Supabase dashboard, click **SQL Editor** in the left sidebar
5. Paste this and click **Run**:

```sql
create table sheets (
  id uuid default gen_random_uuid() primary key,
  venue text not null check (venue in ('br86', 'kkbb')),
  date date not null,
  label text not null default 'Tip Sheet',
  image_url text not null,
  created_at timestamptz default now()
);

-- Let anyone read sheets (no login needed to view)
alter table sheets enable row level security;

create policy "Anyone can view sheets"
  on sheets for select
  using (true);

create policy "Anyone can insert sheets"
  on sheets for insert
  with check (true);

-- Index for fast lookups by venue and date
create index idx_sheets_venue_date on sheets (venue, date desc);
```

### Create the image storage bucket

6. Click **Storage** in the left sidebar
7. Click **New bucket**
8. Name it `tipsheets` (exact spelling)
9. Toggle **Public bucket** to ON
10. Click **Create bucket**
11. Click on the `tipsheets` bucket, then click **Policies**
12. Under "Other policies under storage.objects", click **New Policy**
13. Choose **For full customization**
14. Policy name: `Allow public uploads`
15. Allowed operation: **INSERT**
16. Target roles: leave as default
17. WITH CHECK expression: `true`
18. Click **Review** then **Save policy**
19. Add one more policy, same steps but for **SELECT** with USING expression: `true`

### Grab your API keys

20. Go to **Settings** > **API** in the left sidebar
21. Copy your **Project URL** (looks like `https://abc123.supabase.co`)
22. Copy your **anon public** key (the long string)

---

## Step 2: Push code to GitHub (3 minutes)

1. Go to https://github.com and create a new repository called `tipdrop`
2. On your computer, open Terminal and run:

```bash
cd path/to/tipdrop
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tipdrop.git
git push -u origin main
```

---

## Step 3: Deploy on Netlify (3 minutes)

1. Go to https://app.netlify.com
2. Click **Add new site** > **Import an existing project**
3. Connect to GitHub and select your `tipdrop` repo
4. Build settings (Netlify usually auto-detects these):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Show advanced** > **New variable** and add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy site**

Your site will be live at something like `tipdrop.netlify.app` in about 60 seconds.

---

## Step 4: Pick a better URL (optional, 1 minute)

1. In Netlify, go to **Site settings** > **Domain management**
2. Click **Options** > **Edit site name**
3. Change it to something like `tipdrop` or `br86tips` or `tips86`
4. Your URL is now `tipdrop.netlify.app` (or whatever you picked)

---

## Later: Add a custom domain ($12ish/year)

1. Buy a domain on Cheapnames (e.g. tipdrop.co, tip86.com)
2. In Netlify, go to **Domain management** > **Add custom domain**
3. Follow the DNS instructions Netlify gives you
4. SSL certificate is automatic and free

---

## How it works for staff

- **To view tips**: Open the bookmarked link, tap the venue, scroll to find your night
- **To upload**: Tap Upload, enter PIN (default: `8686`), snap or pick the photo, hit Upload
- **PIN can be changed**: In the App.jsx file, find `UPLOAD_PIN = "8686"` and change it

---

## Notes

- Free Supabase tier gives 1GB storage, which is roughly 2,000+ tip sheet photos
- Free Netlify tier handles unlimited visitors
- No maintenance needed, it just runs
- Works on any phone browser, iPhone or Android
