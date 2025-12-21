# DevOps Test Plan - V-EdFinance

This plan outlines the verification steps for infrastructure integrity, security, and reliability within the Dokploy-managed environment.

## 1. UFW/Firewall Rules Verification
**Objective**: Ensure only required ports are accessible to the public.
- **Test Case**: Run `ufw status verbose` on the VPS.
- **Expected Results**:
    - Port 22 (SSH): ALLOW (Limited to internal or specific IPs if possible).
    - Port 80 (HTTP): ALLOW (Redirects to HTTPS).
    - Port 443 (HTTPS): ALLOW.
    - Port 3000 (Dokploy): ALLOW.
    - Port 5432 (PostgreSQL): DENY (Only accessible via Docker network or localhost).
- **Tool**: `nmap -F 103.54.153.248` from an external machine to verify closed ports.

## 2. SSL Certificate Expiry Checks
**Objective**: Prevent service downtime due to expired certificates.
- **Test Case**: Verify Traefik/Let's Encrypt auto-renewal via Dokploy.
- **Expected Results**:
    - `curl -vI https://staging.v-edfinance.com` shows a valid certificate.
    - Expiry date is > 30 days from today.
- **Monitoring**: Uptime Kuma (at `monitoring.v-edfinance.com`) must have SSL Expiry monitors configured for all subdomains.

## 3. Database Backup Integrity
**Objective**: Ensure `pg_dump` backups are functional and not just empty files.
- **Test Case**: 
    1. Locate the latest backup in `/backups/postgres` on the VPS.
    2. Download the `.sql` or `.dump` file.
    3. Run `pg_restore --list <file>` or `grep "PostgreSQL database dump" <file>` to verify structure.
    4. (Monthly) Restore the backup to a local `test_db` to verify data consistency.
- **Expected Results**: Restore completes without errors; row counts match production/staging samples.

## 4. Zero-Downtime Deployment (ZDD)
**Objective**: Verify that Traefik switches traffic only after the new container is healthy.
- **Test Case**: 
    1. Start a continuous ping/curl loop: `while true; do curl -s -o /dev/null -w "%{http_code}\n" https://api-staging.v-edfinance.com; sleep 1; done`.
    2. Trigger a "Redeploy" in the Dokploy dashboard.
- **Expected Results**: Zero `502` or `504` errors during the switch. The healthy container should serve traffic throughout the process.

## 5. Secret Encryption at Rest
**Objective**: Ensure environment variables and secrets are not stored in plain text in the repo or accessible via unauthorized shell.
- **Test Case**: 
    1. Verify `dokploy.yaml` uses `${VARIABLE}` syntax for sensitive data (e.g., `POSTGRES_PASSWORD`).
    2. Check that `.env` files are in `.gitignore`.
    3. Verify that Dokploy stores secrets in its internal encrypted database (check Dokploy documentation/volumes).
- **Expected Results**: No plain-text secrets found in `v-edfinance` codebase or public configuration files.
