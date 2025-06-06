# SSL Certificate Issues and HTTP Fallback Plan

## SSL Rate Limit Reset Calendar Event
```
Title: SSL Rate Limit Reset - Renew pickleyourspot.com Certificate
Date: June 8th, 2025
Time: 08:09:48 UTC
Description: Let's Encrypt rate limit resets. Follow the steps in SSL_NOTES.md to re-enable HTTPS for pickleyourspot.com and www.pickleyourspot.com
```

Add this event to your calendar system (Google Calendar, Outlook, etc.)

## Current Issue
- Hit Let's Encrypt rate limit: 5 certificates issued for same domains in last 168 hours
- Error message: "too many certificates (5) already issued for this exact set of domains"
- Next available certificate date: June 8th, 2025, 08:09:48 UTC
- Domains affected: pickleyourspot.com and www.pickleyourspot.com

## Temporary HTTP Configuration
Current nginx configuration (`/etc/nginx/sites-available/pickleyourspot.conf`):
```nginx
server {
    listen 80;
    server_name pickleyourspot.com www.pickleyourspot.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Commands to Apply HTTP-only Configuration
```bash
# On EC2 server (18.204.218.155):
1. sudo mv ~/pickleyourspot.conf /etc/nginx/sites-available/pickleyourspot.conf
2. sudo ln -sf /etc/nginx/sites-available/pickleyourspot.conf /etc/nginx/sites-enabled/
3. sudo rm -f /etc/nginx/sites-enabled/default  # Remove default config if exists
4. sudo nginx -t  # Test configuration
5. sudo systemctl restart nginx
```

## Detailed HTTPS Re-enablement Procedure

### Pre-requisites
1. Verify rate limit has reset:
   ```bash
   # Check current time in UTC
   date -u
   
   # Should be after: June 8th, 2025, 08:09:48 UTC
   ```

2. Backup current configuration:
   ```bash
   sudo cp /etc/nginx/sites-available/pickleyourspot.conf /etc/nginx/sites-available/pickleyourspot.conf.http.backup
   sudo tar -czf ~/nginx-config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/
   ```

### SSL Certificate Installation
1. Stop nginx temporarily:
   ```bash
   sudo systemctl stop nginx
   ```

2. Request new certificate:
   ```bash
   sudo certbot --nginx -d pickleyourspot.com -d www.pickleyourspot.com
   ```
   - Select option to redirect HTTP to HTTPS when prompted
   - Let certbot modify nginx configuration automatically

3. Verify certificate installation:
   ```bash
   sudo certbot certificates
   ```

4. Check nginx configuration:
   ```bash
   sudo nginx -t
   ```

5. Start nginx:
   ```bash
   sudo systemctl start nginx
   ```

### Verification Steps
1. Test HTTPS access:
   ```bash
   curl -I https://pickleyourspot.com
   curl -I https://www.pickleyourspot.com
   ```

2. Verify HTTP to HTTPS redirect:
   ```bash
   curl -I http://pickleyourspot.com
   # Should show 301 redirect to https://pickleyourspot.com
   ```

3. Check SSL certificate details in browser:
   - Visit https://pickleyourspot.com
   - Click padlock icon
   - Verify certificate details and expiration

### Troubleshooting
If issues occur:
1. Check nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Verify certbot renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

3. Restore from backup if needed:
   ```bash
   sudo cp /etc/nginx/sites-available/pickleyourspot.conf.http.backup /etc/nginx/sites-available/pickleyourspot.conf
   sudo systemctl restart nginx
   ```

### Auto-renewal Verification
```bash
# Check certbot timer status
sudo systemctl status certbot.timer

# Verify renewal hook
sudo ls -l /etc/letsencrypt/renewal-hooks/deploy/
```

## Certificate Locations
When SSL is re-enabled, certificates will be stored in:
- Live certificates: `/etc/letsencrypt/live/pickleyourspot.com/`
- Archive: `/etc/letsencrypt/archive/pickleyourspot.com/`

## Important Files
- fullchain.pem - Full SSL certificate chain
- privkey.pem - Private key
- cert.pem - Domain certificate
- chain.pem - Intermediate certificates

## Troubleshooting
To check certificate status:
```bash
sudo certbot certificates
```

To check nginx status:
```bash
sudo systemctl status nginx
sudo journalctl -u nginx
```

## Testing HTTP Configuration
1. Basic HTTP Test:
   ```bash
   # Test nginx configuration syntax
   sudo nginx -t
   
   # Check if nginx is running
   sudo systemctl status nginx
   
   # Test HTTP response
   curl -I http://pickleyourspot.com
   curl -I http://www.pickleyourspot.com
   ```

2. Common Issues and Solutions:
   - If nginx test fails: Check error logs at `/var/log/nginx/error.log`
   - If site unreachable: Verify EC2 security group allows port 80
   - If proxy error: Ensure Next.js is running on port 3000

3. Expected Results:
   - HTTP response should be 200 OK
   - No SSL/HTTPS redirects should be present
   - Next.js app should be visible at http://pickleyourspot.com

4. Monitor Logs:
   ```bash
   # Watch nginx access logs
   sudo tail -f /var/log/nginx/access.log
   
   # Watch nginx error logs
   sudo tail -f /var/log/nginx/error.log
   ``` 