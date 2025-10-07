# Production Deployment Checklist

## Pre-Deployment

### Environment Variables
- [ ] Set `NEXTAUTH_SECRET` to a secure random string (use `openssl rand -base64 32`)
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Set `NEXTAUTH_DEBUG="false"`
- [ ] Set `NEXT_PUBLIC_ENABLE_DEBUG="false"`
- [ ] Configure production OAuth credentials for Google and Strava
- [ ] Configure production Supabase credentials
- [ ] Configure production database URLs (use connection pooling)
- [ ] Set OpenAI API key with production limits

### Security
- [ ] Review and update CORS settings in middleware
- [ ] Ensure all API routes have proper authentication
- [ ] Enable rate limiting on all public endpoints
- [ ] Review security headers in `next.config.prod.ts`
- [ ] Set up SSL/TLS certificates
- [ ] Enable HSTS headers
- [ ] Configure CSP (Content Security Policy) if needed

### Database
- [ ] Run database migrations on production database
- [ ] Set up database backups
- [ ] Configure connection pooling (PgBouncer)
- [ ] Review and optimize slow queries
- [ ] Set up database monitoring

### Performance
- [ ] Enable production build optimizations
- [ ] Configure CDN for static assets
- [ ] Set up image optimization
- [ ] Enable compression (gzip/brotli)
- [ ] Configure caching headers
- [ ] Test with Lighthouse/PageSpeed Insights

### Monitoring & Logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure application monitoring
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up alerts for critical errors
- [ ] Monitor API rate limits

### Testing
- [ ] Run full test suite
- [ ] Test OAuth flows in production environment
- [ ] Test Strava API integration
- [ ] Test all API endpoints
- [ ] Test error boundaries
- [ ] Load testing for peak traffic

## Deployment

### Build
```bash
npm run build
```

### Environment Setup
1. Copy `.env.production.example` to `.env.production`
2. Fill in all production values
3. Verify no development/test values are present

### Deploy
```bash
# For Vercel
vercel --prod

# Or build and deploy manually
npm run build
npm run start
```

## Post-Deployment

### Verification
- [ ] Test sign-in flow with all OAuth providers
- [ ] Test Strava connection and data sync
- [ ] Verify all dashboard features work
- [ ] Test AI chat functionality
- [ ] Check all API endpoints respond correctly
- [ ] Verify error handling and logging
- [ ] Test mobile responsiveness

### Monitoring
- [ ] Check error rates
- [ ] Monitor API response times
- [ ] Review database query performance
- [ ] Check memory and CPU usage
- [ ] Monitor third-party API usage (Strava, OpenAI)

### Documentation
- [ ] Update README with production URLs
- [ ] Document any manual steps required
- [ ] Update API documentation
- [ ] Document troubleshooting steps

## Production Best Practices

### Security
- Rotate secrets regularly
- Review OAuth scopes and permissions
- Keep dependencies updated
- Monitor for security vulnerabilities
- Implement proper RBAC if needed

### Performance
- Monitor bundle size
- Optimize images and assets
- Use proper caching strategies
- Monitor Core Web Vitals
- Optimize database queries

### Reliability
- Set up proper error boundaries
- Implement graceful degradation
- Set up automated backups
- Have a rollback plan
- Document incident response procedures

## Troubleshooting

### Common Issues

1. **OAuth not working**
   - Verify callback URLs are correct
   - Check OAuth credentials
   - Review CORS settings

2. **Strava API errors**
   - Check token refresh logic
   - Verify API credentials
   - Review rate limits

3. **Database connection issues**
   - Verify connection string
   - Check connection pooling settings
   - Review firewall rules

4. **Performance issues**
   - Check database query performance
   - Review API response times
   - Monitor external API calls
   - Check bundle size

## Support

For issues, check:
- Application logs
- Error monitoring dashboard
- Database logs
- API status pages (Strava, OpenAI)
