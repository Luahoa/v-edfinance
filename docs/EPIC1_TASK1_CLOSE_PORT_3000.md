# Epic 1: Security Hardening & Critical Fixes - Implementation Guide

**Status:** 🟢 IN PROGRESS  
**Started:** 2025-12-23  
**Priority:** P0 CRITICAL  
**Estimated Duration:** 2 days

---

## Task 1.1: Close Dokploy Dashboard Port 3000 🔒

**Status:** IN PROGRESS  
**ETA:** 5 minutes  
**Impact:** Security - prevents unauthorized access to Dokploy dashboard

### Current Security Risk

**Problem:** Port 3000 is publicly accessible
```bash
# Anyone can access:
http://103.54.153.248:3000
# No authentication required before reaching login page
```

**Risk Level:** 🔴 HIGH - Exposed admin interface

### Implementation Steps

#### Step 1: Verify Current Firewall Status

```bash
# SSH into VPS
ssh deployer@103.54.153.248

# Check current UFW rules
sudo ufw status verbose
```

**Expected Output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere  ⚠️ THIS NEEDS TO GO
```

#### Step 2: Close Port 3000

```bash
# Remove public access to port 3000
sudo ufw delete allow 3000/tcp

# Verify removal
sudo ufw status verbose

# Should NO LONGER show 3000/tcp
```

**Expected Output:**
```
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
✅ Port 3000 removed
```

#### Step 3: Access Dokploy via SSH Tunnel (New Method)

**From your local machine:**

```bash
# Create SSH tunnel
ssh -L 3000:localhost:3000 deployer@103.54.153.248

# Now access Dokploy via:
# http://localhost:3000

# The tunnel encrypts traffic and requires SSH auth
```

**For persistent access (optional):**

Create `~/.ssh/config` entry:
```bash
Host v-edfinance-dokploy
    HostName 103.54.153.248
    User deployer
    LocalForward 3000 localhost:3000
    IdentityFile ~/.ssh/id_ed25519
```

Then simply run:
```bash
ssh v-edfinance-dokploy
# Access at http://localhost:3000
```

#### Step 4: Verification

```bash
# Test from external network (should timeout)
curl -m 5 http://103.54.153.248:3000
# Expected: Connection timeout (port closed)

# Test SSH tunnel (should work)
ssh -L 3000:localhost:3000 deployer@103.54.153.248
curl http://localhost:3000
# Expected: Dokploy login page HTML
```

### Alternative: Cloudflare Access (More Secure)

**If you want web-based access without SSH:**

1. **Install Cloudflare Tunnel (cloudflared):**
   ```bash
   ssh deployer@103.54.153.248
   
   # Install cloudflared
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # Login to Cloudflare
   cloudflared tunnel login
   ```

2. **Create Tunnel:**
   ```bash
   # Create tunnel named "dokploy"
   cloudflared tunnel create dokploy
   
   # Note the tunnel ID (save this)
   ```

3. **Configure Tunnel:**
   ```yaml
   # /home/deployer/.cloudflared/config.yml
   tunnel: <TUNNEL_ID>
   credentials-file: /home/deployer/.cloudflared/<TUNNEL_ID>.json
   
   ingress:
     - hostname: dokploy.v-edfinance.com
       service: http://localhost:3000
     - service: http_status:404
   ```

4. **Add DNS Record (Cloudflare Dashboard):**
   ```
   Type: CNAME
   Name: dokploy
   Target: <TUNNEL_ID>.cfargotunnel.com
   Proxy: ON
   ```

5. **Run Tunnel as Service:**
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   sudo systemctl enable cloudflared
   ```

6. **Enable Cloudflare Access (Free Tier):**
   - Cloudflare Dashboard → Zero Trust → Access → Applications
   - Add Application: dokploy.v-edfinance.com
   - Authentication: Email OTP (free)
   - Policy: Allow only your email

**Result:** Dokploy accessible at `https://dokploy.v-edfinance.com` with email authentication

### Rollback Plan (If Issues)

```bash
# If you need to re-open port 3000 temporarily:
ssh deployer@103.54.153.248
sudo ufw allow 3000/tcp

# To close again:
sudo ufw delete allow 3000/tcp
```

### Success Criteria

- ✅ Port 3000 NOT in `ufw status`
- ✅ External `curl http://103.54.153.248:3000` times out
- ✅ SSH tunnel access works: `http://localhost:3000`
- ✅ (Optional) Cloudflare Access requires authentication

### Security Improvement

**Before:**
```
Internet → Port 3000 → Dokploy (public)
Risk: Brute force attacks on login page
```

**After:**
```
Internet → SSH Tunnel → Port 3000 → Dokploy
Risk: Requires SSH key (much harder to breach)
```

Or with Cloudflare:
```
Internet → Cloudflare Access → Email OTP → Dokploy
Risk: Multi-factor authentication required
```

---

## Next Steps

After completing Task 1.1:
1. Verify security improvement
2. Update DEVOPS_GUIDE.md with new access method
3. Proceed to Task 1.2: Security Scanning

**Estimated Total Time for Epic 1:** 3 hours  
**Current Progress:** 0/4 tasks (0%)
