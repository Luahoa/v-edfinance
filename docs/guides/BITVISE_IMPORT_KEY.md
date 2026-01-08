# 🔑 SSH Private Key for Bitvise - VPS Access

## ⚡ Quick Import to Bitvise

### Method 1: Import from File (EASIEST)

**File location:**
```
c:\Users\luaho\Demo project\v-edfinance\amp_vps_private_key.txt
```

**Steps:**
1. Open Bitvise SSH Client
2. In **"Client Key Manager"** section (bottom left)
3. Click **"Import"** dropdown button → Select **"Import from file"**
4. Browse to: `c:\Users\luaho\Demo project\v-edfinance\amp_vps_private_key.txt`
5. Click **"Open"**
6. Key will be imported automatically

### Method 2: Copy-Paste to Clipboard

**Copy this entire key (including BEGIN/END lines):**

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBsitS9LFnymVyiGA84tGAkIzmcyD5rNvTYhAaZFnLfWwAAAJix7tnGse7Z
xgAAAAtzc2gtZWQyNTUxOQAAACBsitS9LFnymVyiGA84tGAkIzmcyD5rNvTYhAaZFnLfWw
AAAEDk4OweMx69O6w7rgKz+vuHhhVdrMDDMEKc4b8eV58+ZGyK1L0sWfKZXKIYDzi0YCQj
OZzIPms29NiEBpkWct9bAAAAFWFtcC1hZ2VudEB2LWVkZmluYW5jZQ==
-----END OPENSSH PRIVATE KEY-----
```

**Steps:**
1. Select ALL text above (from -----BEGIN to -----END)
2. Copy to clipboard (Ctrl+C)
3. In Bitvise: Click **"Import"** → **"From Clipboard"**
4. Key imported!

---

## ⚙️ Configure Bitvise Connection

After importing key:

**Login Tab:**
- **Server → Host:** `103.54.153.248`
- **Server → Port:** `22`
- **Authentication → Username:** `root`
- **Authentication → Initial method:** `publickey`
- **Authentication → Client key:** Select the imported key (shows as amp-agent@v-edfinance)

**Click "Login"** → Should connect immediately!

---

## 💾 Save Profile for Future

1. Click **"Save profile as"** icon (floppy disk)
2. Name: `VPS-VEdFinance`
3. Save to Desktop or Documents
4. Next time: Double-click profile → Click Login

---

## 🔍 Verify Key Fingerprint

After import, verify this fingerprint appears:
```
SHA256:Emv7ruosypKMh6jd+nt5qBxfr0zvjAtliRYL6twm7e4
```

---

## ✅ Test Connection

After login, you should see:
```
root@vps:~#
```

Try these commands to verify VPS setup:
```bash
# System info
uname -a

# Check Docker
docker ps

# Check PostgreSQL
docker exec -it $(docker ps | grep postgres | awk '{print $1}') psql -U postgres -l

# Check Dokploy
curl -s http://localhost:3000 | head -n 5
```

---

## 🚨 SECURITY NOTE

**⚠️ NEVER commit amp_vps_private_key.txt to git!**

This file is for Bitvise import only. After importing to Bitvise, you can delete this file.

The key is already in your .gitignore pattern, but be careful!

---

## 📋 VPS Services (Expected)

Based on Dokploy setup:

- **Dokploy Dashboard:** http://103.54.153.248:3000
- **API Staging:** http://103.54.153.248:3001
- **Web Staging:** http://103.54.153.248:3002
- **PostgreSQL:** Port 5432 (internal)
- **Prometheus:** Port 9090 (if monitoring enabled)
- **Grafana:** Port 3001 (if monitoring enabled)

---

## 🎯 Next Task After Connection

Once connected, we'll execute **ved-y1u: Enable pg_stat_statements**:

```bash
# Enable extension in PostgreSQL
psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Verify
psql -U postgres -d v_edfinance -c "SELECT * FROM pg_stat_statements LIMIT 5;"
```

---

**Created:** 2026-01-05  
**Purpose:** Easy Bitvise SSH key import for VPS access  
**VPS:** 103.54.153.248 (V-EdFinance Staging)
