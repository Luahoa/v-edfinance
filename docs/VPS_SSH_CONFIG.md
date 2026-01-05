# VPS SSH Configuration

**VPS Details:**
- **IP:** 103.54.153.248
- **User:** root
- **SSH Key:** C:\Users\luaho\.ssh\amp_vps_key
- **Public Key:** ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance

## SSH Config Entry

Add to `~/.ssh/config`:

```
Host vps-vedfinance
    HostName 103.54.153.248
    User root
    IdentityFile C:\Users\luaho\.ssh\amp_vps_key
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
```

## Quick Connect Commands

```bash
# Connect to VPS
ssh -i C:\Users\luaho\.ssh\amp_vps_key root@103.54.153.248

# Or use alias (after adding to config)
ssh vps-vedfinance

# Copy file to VPS
scp -i C:\Users\luaho\.ssh\amp_vps_key file.txt root@103.54.153.248:/path/

# Copy from VPS
scp -i C:\Users\luaho\.ssh\amp_vps_key root@103.54.153.248:/path/file.txt ./

# Execute command on VPS
ssh -i C:\Users\luaho\.ssh\amp_vps_key root@103.54.153.248 "command"
```

## VPS Services (Expected)

**Dokploy (Port 3000):**
- Dashboard: http://103.54.153.248:3000
- Deployment platform

**Staging Environment:**
- API: http://103.54.153.248:3001
- Web: http://103.54.153.248:3002

**PostgreSQL:**
- Port: 5432
- Database: v_edfinance

**Monitoring (if deployed):**
- Prometheus: Port 9090
- Grafana: Port 3001

## Security Notes

- Private key stored locally: `C:\Users\luaho\.ssh\amp_vps_key`
- Never commit private key to git
- Public key added to VPS: `~/.ssh/authorized_keys`
- Key type: ED25519 (secure, modern)

---

**Created:** 2026-01-05  
**Purpose:** VPS access for infrastructure tasks (pg_stat_statements, AI agent deployment, monitoring)
