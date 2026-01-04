# Bitvise SSH Setup Guide

## Quick Setup for VPS Access

### VPS Information
- **Host:** 103.54.153.248
- **Port:** 22
- **Username:** root
- **Authentication:** publickey
- **Key Location:** C:\Users\luaho\.ssh\amp_vps_key

---

## Step-by-Step Import Key to Bitvise

### Option 1: Import from Clipboard (FASTEST)

1. **Copy private key to clipboard:**
   ```powershell
   Get-Content C:\Users\luaho\.ssh\amp_vps_key | Set-Clipboard
   ```

2. **In Bitvise Client Key Manager:**
   - Click **"Import"** dropdown button
   - Select **"From Clipboard"**
   - Key will be automatically imported

3. **Select the imported key:**
   - In "Client key" dropdown, select the newly imported key
   - Key fingerprint: `SHA256:Emv7ruosypKMh6jd+nt5qBxfr0zvjAtliRYL6twm7e4`

### Option 2: Import from File

1. **Key file location:**
   ```
   C:\Users\luaho\.ssh\amp_vps_key
   ```

2. **In Bitvise Client Key Manager:**
   - Click **"Import"** dropdown
   - Select **"Import from file"**
   - Browse to: `C:\Users\luaho\.ssh\amp_vps_key`
   - Click Open

3. **Select imported key** from dropdown

### Option 3: Direct File Path (if Bitvise supports OpenSSH format)

1. In **Client key** dropdown, select **"Browse for key file"**
2. Navigate to: `C:\Users\luaho\.ssh\amp_vps_key`
3. Select the file

---

## Bitvise Profile Configuration

**Login Tab:**
- Server → Host: `103.54.153.248`
- Server → Port: `22`
- Authentication → Username: `root`
- Authentication → Initial method: `publickey`
- Authentication → Client key: `[Select imported key]`

**Save profile as:** `VPS-VEdFinance`

---

## Test Connection

1. Click **"Login"** button
2. If first time: Accept host key fingerprint
3. Should connect without password prompt
4. Terminal will open with root@vps

---

## Quick Commands After Connection

### Check System
```bash
# System info
uname -a
cat /etc/os-release

# Disk space
df -h

# Memory
free -h

# Running services
systemctl list-units --type=service --state=running
```

### Check Docker/Dokploy
```bash
# Docker status
docker ps

# Dokploy containers
docker ps | grep dokploy

# PostgreSQL
docker ps | grep postgres
```

### Check PostgreSQL
```bash
# Connect to PostgreSQL
docker exec -it <postgres-container-id> psql -U vedfinance -d v_edfinance

# Or if PostgreSQL is direct install
psql -U postgres

# Check databases
\l

# Check extensions
\dx
```

---

## Save Session for Future Use

**In Bitvise:**
1. Click **"Save profile as"** (floppy disk icon)
2. Name: `VPS-VEdFinance`
3. Location: Desktop or Documents
4. Next time: Just open profile and click Login

---

## Troubleshooting

### Error: "Key not accepted"
- Verify key fingerprint matches: `SHA256:Emv7ruosypKMh6jd+nt5qBxfr0zvjAtliRYL6twm7e4`
- Check VPS authorized_keys: `cat ~/.ssh/authorized_keys`

### Error: "Connection timeout"
- Check VPS is running
- Check port 22 is open: `telnet 103.54.153.248 22`
- Check firewall rules

### Error: "Permission denied"
- Verify username is `root`
- Verify key is imported correctly
- Try password authentication temporarily to debug

---

## Alternative: Save Profile for Script Access

**For automation/scripting:**
```bash
# Use ssh command with key file
ssh -i C:\Users\luaho\.ssh\amp_vps_key root@103.54.153.248 "command"

# Or create SSH config (~/.ssh/config)
Host vps
    HostName 103.54.153.248
    User root
    IdentityFile C:\Users\luaho\.ssh\amp_vps_key
    
# Then just: ssh vps
```

---

**Next:** After successful connection, we can proceed with **ved-y1u** (Enable pg_stat_statements) 🚀
