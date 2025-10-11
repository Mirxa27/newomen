# Supabase MCP Quick Reference

## Connection Status ✅

Your Supabase MCP server is **successfully connected** and configured.

### Connection Details
- **Project URL**: https://fkikaozubngmzcrnhkqe.supabase.co
- **Project Ref**: fkikaozubngmzcrnhkqe
- **MCP Server**: https://mcp.supabase.com/mcp

### Database Status
```
✓ profiles: 0 records
✓ wellness_resources: 24 records
✓ community_posts: 0 records
✓ ai_providers: 0 records
✓ user_profiles: 2 records
```

## Quick Commands

### Verification
```bash
# Test MCP connection
npm run verify:mcp

# Check database status
npm run db:status

# Run database tests
npm run db:test
```

### Database Operations
```bash
# Push local migrations to remote
npx supabase db push

# Pull remote schema to local
npx supabase db pull

# Reset local database
npx supabase db reset

# View migration history
npx supabase migration list
```

### Edge Functions
```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy <function-name>

# View function logs
npx supabase functions logs <function-name>

# Test function locally
npx supabase functions serve <function-name>
```

### Storage Management
```bash
# List all storage buckets
npx supabase storage list

# Create new bucket
npx supabase storage create <bucket-name>

# List files in bucket
npx supabase storage list <bucket-name>
```

## MCP Features Enabled

✅ **Documentation** - Inline Supabase docs  
✅ **Account** - Account management  
✅ **Debugging** - Enhanced error tracking  
✅ **Database** - Direct DB operations  
✅ **Functions** - Edge function management  
✅ **Development** - Development tools  
✅ **Branching** - Database branching  
✅ **Storage** - File & CDN management

## Configuration Files

### `.mcp-servers.json` (Project Level)
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=fkikaozubngmzcrnhkqe&features=docs%2Caccount%2Cdebugging%2Cdatabase%2Cfunctions%2Cdevelopment%2Cbranching%2Cstorage"
    }
  }
}
```

### `.env` (Environment Variables)
```env
VITE_SUPABASE_URL="https://fkikaozubngmzcrnhkqe.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="fkikaozubngmzcrnhkqe"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_DB_PASSWORD="your-db-password"
```

## Troubleshooting

### Connection Issues
```bash
# Verify environment variables
cat .env | grep SUPABASE

# Test connection
npm run verify:mcp

# Check project status (requires login)
npx supabase projects list
```

### Authentication Required
If commands require authentication:
```bash
# Login to Supabase CLI
npx supabase login

# Link project
npx supabase link --project-ref fkikaozubngmzcrnhkqe
```

### Common Errors

**Error**: "Could not find table"
- **Solution**: Run migrations with `npx supabase db push`

**Error**: "Access denied"
- **Solution**: Check your service role key in `.env`

**Error**: "Project not linked"
- **Solution**: Run `npx supabase login` and link the project

## Direct Database Access

### Connection String
```
postgresql://postgres:Newomen@331144@db.fkikaozubngmzcrnhkqe.supabase.co:5432/postgres
```

### Using psql
```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.fkikaozubngmzcrnhkqe.supabase.co:5432/postgres"
```

## Security Reminders

⚠️ **Never commit** `.env` to version control  
⚠️ **Rotate keys** regularly  
⚠️ **Use service role** only for admin operations  
⚠️ **Enable RLS** on all tables  

## Additional Resources

- 📖 [Full Setup Guide](./MCP_SETUP_GUIDE.md)
- 📖 [Supabase README](./README_SUPABASE.md)
- 🌐 [Supabase Docs](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🐙 [CLI Issues](https://github.com/supabase/cli/issues)

---

**Last Verified**: October 11, 2025  
**Status**: ✅ Connected  
**Tables**: 5 accessible  
**Records**: 26 total
