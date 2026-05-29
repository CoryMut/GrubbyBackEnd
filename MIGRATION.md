# Migration Guide: DigitalOcean → Railway + Neon + MongoDB Atlas

> **All commands in this guide are for Windows Command Prompt.** Open Command Prompt
> by pressing `Win + R`, typing `cmd`, and pressing Enter.

## Overview

| Service      | From                                | To                      | Est. Cost |
| ------------ | ----------------------------------- | ----------------------- | --------- |
| App hosting  | DigitalOcean App Platform (~$12/mo) | Railway Hobby           | $5/mo     |
| PostgreSQL   | DigitalOcean Managed PG (~$15/mo)   | Neon (free tier)        | $0/mo     |
| MongoDB      | (existing)                          | MongoDB Atlas (free M0) | $0/mo     |
| File storage | AWS S3                              | AWS S3 (no change)      | same      |
| **Total**    | **~$27+/mo**                        | **~$5/mo**              |           |

---

## Prerequisites — Install These Tools First

### PostgreSQL 16 client tools (`pg_dump`, `psql`)

Your DigitalOcean database runs PostgreSQL 16. Your local tools must match.

1. Download the installer from https://www.postgresql.org/download/windows/
2. Run the installer — on the component screen, check only **Command Line Tools** (uncheck Server, pgAdmin, Stack Builder)
3. Open a **new** Command Prompt and prepend the v16 bin folder to your PATH for this session:
    ```cmd
    set PATH=C:\Program Files\PostgreSQL\16\bin;%PATH%
    ```
4. Verify:
    ```cmd
    pg_dump --version
    psql --version
    ```
    Both should report `16.x`.

> **Tip:** To avoid running the `set PATH=...` command every session, add
> `C:\Program Files\PostgreSQL\16\bin` permanently via:
> Start → Search "Edit the system environment variables" → Environment Variables →
> System variables → Path → Edit → New → paste the path → OK.

### MongoDB tools (`mongodump`, `mongorestore`)

1. Download MongoDB Database Tools from https://www.mongodb.com/try/download/database-tools
2. Choose **Windows x86_64**, **msi** package, and install it
3. Add the install bin folder to PATH (same method as above, typically `C:\Program Files\MongoDB\Tools\100\bin`)
4. Verify in a new Command Prompt:
    ```cmd
    mongodump --version
    mongorestore --version
    ```

---

## Phase 1: Back Up PostgreSQL from DigitalOcean

### Step 1.1 — Allow Your IP on the DigitalOcean Database

DigitalOcean Managed Databases block all external connections by default.

1. Find your public IP:
    ```cmd
    curl -s https://api.ipify.org
    ```
2. Log into [DigitalOcean](https://cloud.digitalocean.com) → **Databases** → click your PostgreSQL cluster
3. Go to the **Settings** tab → scroll to **Trusted Sources** → click **Edit**
4. Add the IP from step 1 → click **Save**
5. Wait ~30 seconds for the rule to apply

> Remove this IP from trusted sources after the backup is complete.

### Step 1.2 — Get Your DigitalOcean Connection String

1. Still on your database cluster page, click the **Connection Details** tab
2. From the dropdown select **Connection String**
3. Copy the full URI. It looks like:
    ```
    postgresql://doadmin:YOURPASSWORD@db-postgresql-nyc3-xxxxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require
    ```
4. Set it as a variable in Command Prompt (paste your real URI):
    ```cmd
    set DO_DB_URL=postgresql://doadmin:YOURPASSWORD@your-host.db.ondigitalocean.com:25060/defaultdb?sslmode=require
    ```

### Step 1.3 — Create the Backup

```cmd
"C:\Program Files\PostgreSQL\16\bin\pg_dump" --no-owner --no-acl --format=plain --file=grubby_backup.sql "%DO_DB_URL%"
```

**What each flag does:**
- `--no-owner`: Strips `ALTER TABLE ... OWNER TO doadmin` commands that would fail on Neon
- `--no-acl`: Strips GRANT/REVOKE statements tied to DigitalOcean roles
- `--format=plain`: Produces a plain `.sql` text file
- `--file`: Output file name

### Step 1.4 — Verify the Backup

Check the file exists and contains your tables:

```cmd
dir grubby_backup.sql
```

The file size should be non-trivial (not 0 bytes). Then spot-check the contents:

```cmd
findstr "CREATE TABLE" grubby_backup.sql
```

Expected output should include lines like:
```
CREATE TABLE public.characters
CREATE TABLE public.comics
CREATE TABLE public.users
CREATE TABLE public.favorites
...
```

If the file is empty or missing tables, re-check the connection string and retry.

---

## Phase 2: Set Up Neon PostgreSQL and Restore

### Step 2.1 — Create a Neon Account and Database

1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Click **New Project**
3. Name it `grubby` (or anything you like)
4. Select a region closest to your users (pick the same region as Railway later for lower latency)
5. Neon creates a default database called `neondb` — you can use it as-is
6. Click **Create Project**

### Step 2.2 — Get Your Neon Connection String

1. On the Neon dashboard, click **Connect**
2. Under **Connection string**, select **psql** mode
3. Copy the URI. It looks like:
    ```
    postgresql://neondb_owner:YOURPASSWORD@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
    ```
4. Set it in Command Prompt:
    ```cmd
    set NEON_DB_URL=postgresql://neondb_owner:YOURPASSWORD@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
    ```

### Step 2.3 — Restore the Backup to Neon

The dump file contains a `\connect grubby_db` line that causes psql to silently fail on Neon. Strip it first using PowerShell:

```powershell
Get-Content C:\Users\mutch\grubby_backup.sql | Where-Object { $_ -notmatch '\\connect|^\\c ' } | Set-Content C:\Users\mutch\grubby_backup_clean.sql
```

Then restore:
```cmd
"C:\Program Files\PostgreSQL\16\bin\psql" "%NEON_DB_URL%" < grubby_backup_clean.sql
```

**If you see `relation already exists` errors:** The restore already ran successfully — these are harmless duplicate warnings.

**If you see `role "doadmin" does not exist`:** Re-run the dump with `--no-owner --no-acl` (see Step 1.3).

### Step 2.3a — Fix the search_path (required)

pg_dump v14+ intentionally blanks the `search_path` during restore as a security measure. Without this fix, all queries will fail unless you prefix every table name with `public.`.

Connect to Neon interactively:
```cmd
"C:\Program Files\PostgreSQL\16\bin\psql" "%NEON_DB_URL%"
```

Run this at the `neondb=>` prompt:
```sql
ALTER DATABASE neondb SET search_path TO public;
```

Then disconnect and reconnect:
```
\q
```
```cmd
"C:\Program Files\PostgreSQL\16\bin\psql" "%NEON_DB_URL%"
```

Confirm it works:
```sql
SELECT COUNT(*) FROM comics;
```

### Step 2.4 — Verify the Restore

At the `neondb=>` prompt, check all tables exist:
```sql
SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

Spot-check row counts and compare against your DigitalOcean database:
```sql
SELECT COUNT(*) FROM comics;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM characters;
```

Type `\q` to exit when done.

---

## Phase 3: MongoDB

> **No migration needed** — MongoDB is already hosted on MongoDB Atlas free tier.
> Copy the existing `MONGO_DB_URI` value from your DigitalOcean App Platform environment
> variables directly into Railway in Phase 4.

---

## Phase 4: Deploy to Railway

### Step 4.1 — Create a Railway Account

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Upgrade to the **Hobby plan** ($5/month) — required for persistent deployments

### Step 4.2 — Create a New Project from GitHub

1. Click **New Project** → **Deploy from GitHub repo**
2. Authorize Railway to access your GitHub account
3. Select the `GrubbyBackEnd` repository
4. Railway detects Node.js and begins an initial build automatically

### Step 4.3 — Set All Environment Variables

In the Railway project, go to your service → **Variables** tab → **Raw Editor** and paste the following with your real values filled in:

```
NODE_ENV=production
PORT=5000
SECRET_KEY=<your existing SECRET_KEY from DigitalOcean>
KEY_SECRET=<your existing KEY_SECRET from DigitalOcean>
CLIENT_SECRET=<your existing CLIENT_SECRET from DigitalOcean>
DATABASE_URL=<your NEON_DB_URL from Phase 2>
MONGO_DB_URI=<your ATLAS_MONGO_URI from Phase 3>
accessKeyId=<your AWS access key>
secretAccessKey=<your AWS secret key>
GOOGLE_CLIENT_ID=<your Google OAuth client ID>
SENDGRID_API_KEY=<your SendGrid API key>
SENDGRID_EMAIL=<your sender email>
SENDGRID_NAME=<your sender name>
VERIFY_EMAIL=<your SendGrid verify email template ID>
PASS_RESET=<your SendGrid password reset template ID>
BASE_URL=https://<your-railway-domain>.up.railway.app
CLIENT_URL=https://grubbythegrape.com
ORIGIN1=https://grubbythegrape.com
ORIGIN2=https://www.grubbythegrape.com
ORIGIN3=
```

> **Important:** Copy the exact values of `SECRET_KEY`, `KEY_SECRET`, and `CLIENT_SECRET`
> from your DigitalOcean App Platform env vars. Changing these invalidates all existing
> JWTs and will log out every user.

### Step 4.4 — Trigger a Redeploy

After setting variables, click **Deploy** (or push a commit). Watch the build logs — a successful deploy ends with:
```
Server starting on port 5000!
Mongoose connected
```

### Step 4.5 — Get Your Railway Domain

Go to your service → **Settings** → **Domains** → **Generate Domain**.
Copy the domain (e.g., `grubby-backend-production.up.railway.app`) and update `BASE_URL` in your Railway env vars to match.

### Step 4.6 — Add a Custom Domain (Optional)

If your API uses a custom domain like `api.grubbythegrape.com`:

1. In Railway: **Settings** → **Domains** → **Custom Domain** → enter `api.grubbythegrape.com`
2. Railway gives you a CNAME value to add
3. In your DNS provider (Cloudflare, Namecheap, etc.), add:
    ```
    Type:  CNAME
    Name:  api
    Value: <value Railway provided>.up.railway.app
    ```
4. Wait for DNS propagation (up to 24h, usually under 30 min)

---

## Phase 5: Verify Everything Before Cutover

Run these checks from Command Prompt against your new Railway URL:

```cmd
set NEW_API=https://your-app.up.railway.app

REM Health check
curl -I %NEW_API%/

REM Auth endpoint responds (expect 200 or 401, not 502/503)
curl -s -o NUL -w "%%{http_code}" %NEW_API%/login

REM WebSocket handshake (expect 401 Unauthorized — means the server is reachable)
curl -I --http1.1 -H "Connection: Upgrade" -H "Upgrade: websocket" %NEW_API%/comic/upload
```

Also manually test in the browser/app:
- [ ] Login / registration
- [ ] Viewing a comic
- [ ] Favoriting a comic
- [ ] Google OAuth login
- [ ] Trivia leaderboard loads
- [ ] Admin routes respond correctly
- [ ] Email verification sends

---

## Phase 6: Decommission DigitalOcean

Only do this **after** confirming Railway is fully working and stable for 24–48 hours.

1. Update your frontend to point to the new Railway URL (or custom domain)
2. Monitor Railway logs for 24–48 hours after cutover
3. Once stable:
    - Remove your local IP from DigitalOcean's trusted sources (if not already done)
    - Delete the DigitalOcean App Platform app
    - Delete the DigitalOcean Managed PostgreSQL cluster
    - Cancel the DigitalOcean project if nothing else is running there

---

## Troubleshooting

### `Connection timed out` during `pg_dump`
Your local IP is not in the DigitalOcean trusted sources list. See Step 1.1.

### `pg_dump: server version mismatch`
Your local pg tools version doesn't match the server (v16). Use the full path:
```cmd
"C:\Program Files\PostgreSQL\16\bin\pg_dump" ...
```

### `role "doadmin" does not exist` during restore
Re-dump with `--no-owner --no-acl` flags (see Step 1.3).

### `ECONNREFUSED` or `connect ETIMEDOUT` on Railway startup
Check that `DATABASE_URL` is set in Railway env vars and includes `?sslmode=require`.

### WebSocket connections failing
Railway supports WebSockets natively on the Hobby plan.
Ensure your frontend WS URL uses `wss://` (not `ws://`) for the Railway domain.

### Mongoose connection errors on Atlas
- Confirm the Atlas URI includes the database name before `?`
- Confirm the database user has read/write permissions
- Confirm `0.0.0.0/0` is in Network Access

### JWTs invalid / all users logged out after cutover
`SECRET_KEY` was changed. Copy the exact original value from DigitalOcean env vars.

### Neon "too many connections" error
Neon's free tier has a connection limit. The app uses a single persistent `pg.Client`.
If you scale up, switch to `pg.Pool` in `db.js` and set `max: 5`.
