# Supabase MCP Server Setup Guide

## Overview
This guide explains how to connect and use the Supabase Model Context Protocol (MCP) server with your Newomen application for enhanced database management, debugging, and development capabilities.

## What is MCP?
The Model Context Protocol (MCP) is a standard that connects AI systems with external tools and data sources. The Supabase MCP server provides:

- **Database Management**: Direct database access and querying
- **Schema Inspection**: Real-time schema exploration
- **Debugging Tools**: Enhanced error tracking and logging
- **Function Development**: Edge function management
- **Storage Operations**: File and bucket management
- **Branching Support**: Database branching workflows
- **Documentation Access**: Inline Supabase documentation

## Configuration Files

### 1. MCP Server Configuration (`.mcp-servers.json`)
Located at project root, this file defines your MCP server connection:

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

### 2. Environment Variables (`.env`)
Required credentials for database connection:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://fkikaozubngmzcrnhkqe.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Supabase Project Details
VITE_SUPABASE_PROJECT_ID="fkikaozubngmzcrnhkqe"

# Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_DB_PASSWORD="your-db-password"
```

## Setup Instructions

### Step 1: Verify Installation
Ensure Supabase CLI is installed:

```bash
# Check if Supabase CLI is installed
supabase --version

# If not installed, install via npm
npm install supabase --save-dev
```

### Step 2: Link Your Project
Link your local environment to the Supabase project:

```bash
# Link to remote project
npx supabase link --project-ref fkikaozubngmzcrnhkqe

# Test connection
npx supabase db status
```

### Step 3: Verify MCP Connection
Run the verification script to test database connectivity:

```bash
# Install tsx if not already present
npm install -D tsx

# Run MCP connection verification
npm run verify:mcp
```

Expected output:
```
✓ Step 1: Checking environment variables...
  ✓ SUPABASE_URL: https://fkikaozubngmzcrnhkqe.supabase.co
  ✓ SUPABASE_ANON_KEY: Present
  ✓ SUPABASE_SERVICE_ROLE_KEY: Present

✓ Step 2: Testing anonymous client connection...
  ✓ Anonymous client connected successfully

✓ Step 3: Testing service role client connection...
  ✓ Service role client connected successfully

✓ Step 4: Verifying database schema...
  ✓ Table 'profiles': X records
  ✓ Table 'wellness_resources': X records
  ✓ Table 'community_posts': X records
  ✓ Table 'ai_providers': X records

✅ MCP Connection Verification Complete!
```

## Available Features

### 1. **Database Operations**
- Direct SQL queries via MCP
- Schema migrations management
- Table inspection and manipulation
- Real-time data viewing

### 2. **Debugging**
- Enhanced error messages
- Query performance analysis
- RLS policy testing
- Connection diagnostics

### 3. **Functions Development**
- Edge function deployment
- Function logs and debugging
- Local function testing
- Environment variable management

### 4. **Storage Management**
- Bucket creation and management
- File upload/download operations
- Storage policy configuration
- CDN integration

### 5. **Documentation Access**
- Inline API documentation
- Quick reference guides
- Code examples
- Best practices

## Common Commands

### Database Management
```bash
# Check database status
npm run db:status

# Run database tests
npm run db:test

# Push local migrations
npx supabase db push

# Pull remote schema
npx supabase db pull

# Reset local database
npx supabase db reset
```

### Function Management
```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy function-name

# View function logs
npx supabase functions logs function-name
```

### Storage Operations
```bash
# List storage buckets
npx supabase storage list

# Create new bucket
npx supabase storage create bucket-name

# Upload file
npx supabase storage upload bucket-name file-path
```

## Troubleshooting

### Connection Issues
If you encounter connection errors:

1. **Verify credentials**:
   ```bash
   cat .env | grep SUPABASE
   ```

2. **Test direct connection**:
   ```bash
   npx supabase db remote status
   ```

3. **Check project status**:
   ```bash
   npx supabase projects list
   ```

### Authentication Errors
If you get authentication errors:

1. **Relink project**:
   ```bash
   npx supabase unlink
   npx supabase link --project-ref fkikaozubngmzcrnhkqe
   ```

2. **Refresh access token**:
   ```bash
   npx supabase login
   ```

### RLS Policy Issues
If Row Level Security (RLS) blocks your queries:

1. **Use service role key** for admin operations
2. **Check policy definitions** in Supabase Dashboard
3. **Test with authenticated user** context

## Security Best Practices

### 1. Environment Variables
- **Never commit** `.env` files to version control
- **Use service role key** only for admin operations
- **Rotate keys** regularly
- **Limit key exposure** in client-side code

### 2. Database Access
- **Enable RLS** on all tables
- **Test policies** thoroughly
- **Audit database logs** regularly
- **Use prepared statements** to prevent SQL injection

### 3. API Security
- **Rate limit** API endpoints
- **Validate inputs** on all operations
- **Use HTTPS** for all connections
- **Monitor suspicious activity**

## MCP Server URL Parameters

The MCP URL includes several feature flags:

```
https://mcp.supabase.com/mcp?
  project_ref=fkikaozubngmzcrnhkqe
  &features=docs,account,debugging,database,functions,development,branching,storage
```

### Feature Flags Explained:
- **docs**: Access to Supabase documentation
- **account**: Account management operations
- **debugging**: Enhanced debugging tools
- **database**: Direct database operations
- **functions**: Edge function management
- **development**: Development workflow tools
- **branching**: Database branching support
- **storage**: Storage and CDN operations

## Integration with Windsurf IDE

If using Windsurf IDE, the MCP configuration is automatically loaded from:
- Global: `~/.codeium/windsurf/mcp_config.json`
- Project: `.mcp-servers.json` (recommended)

Your IDE will automatically connect to the MCP server when:
1. The configuration file is present
2. The project is opened
3. Supabase credentials are valid

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## Support

For issues or questions:
1. Check the [Supabase Discord](https://discord.supabase.com)
2. Review [GitHub Issues](https://github.com/supabase/cli/issues)
3. Consult the [Documentation](https://supabase.com/docs)
4. Run diagnostics: `npm run verify:mcp`

---

**Last Updated**: October 11, 2025  
**Project**: Newomen  
**Supabase Project ID**: fkikaozubngmzcrnhkqe
