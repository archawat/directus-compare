# Directus Compare Tool

A powerful web application for comparing and synchronizing permissions between two Directus instances using direct database connections.

## 🌟 Features

- **Multi-Database Support** - Works with SQL Server, MySQL, PostgreSQL, and SQLite
- **Direct Database Access** - Connect directly to Directus databases without API keys
- **Permission Comparison** - Compare permissions between source and target instances
- **Visual Diff Interface** - Clean, intuitive interface with expandable sections
- **Sides Flipping** - Toggle source/target direction with a single click
- **Selective Sync** - Choose which permissions to synchronize
- **Real-time Filtering** - Filter by policy and status for focused comparison
- **Field Analysis** - See exactly which fields were added or removed
- **Bulk Operations** - Select multiple permissions for batch synchronization
- **Collapsible Details** - Expandable panels for detailed permission data

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Access to both Directus database instances

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd directus-compare
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your databases**
   
   Edit `.env` file with your database configuration:
   ```env
   # Database Type
   DB_TYPE=mssql
   
   # Source Database
   SOURCE_DB_HOST=localhost
   SOURCE_DB_PORT=1433
   SOURCE_DB_NAME=directus_source
   SOURCE_DB_USER=your_username
   SOURCE_DB_PASSWORD=your_password
   SOURCE_DB_SSL=false
   
   # Target Database
   TARGET_DB_HOST=localhost
   TARGET_DB_PORT=1433
   TARGET_DB_NAME=directus_target
   TARGET_DB_USER=your_username
   TARGET_DB_PASSWORD=your_password
   TARGET_DB_SSL=false
   ```

5. **Start the application**
   ```bash
   pnpm dev
   ```

6. **Open in browser**
   
   Navigate to `http://localhost:3000`

## 🎯 How to Use

### 1. Test Connections
- Click "Test Connections" to verify database connectivity
- Green checkmarks indicate successful connections
- Connection details are displayed (server/database names)
- Use the flip button (⇄) to swap source and target directions

### 2. Compare Permissions
- Click "Compare Permissions" to analyze differences
- View summary statistics of changes
- Results are sorted by Policy → Collection → Action

### 3. Filter Results
- **Policy Filter**: Select specific policies to focus on
- **Status Filter**: Show/hide different types of changes:
  - ➕ **Added** - Permissions that exist in source but not target
  - ➖ **Removed** - Permissions that exist in target but not source  
  - 🔄 **Modified** - Permissions that differ between instances
  - ✅ **Identical** - Permissions that are the same (hidden by default)

### 4. Review Changes
- **Action Badges**: Color-coded action types (READ, CREATE, UPDATE, DELETE)
- **Field Changes**: See which fields were added/removed with truncation for long lists
- **View Diff**: Click to see detailed changes in a modal with expandable sections

### 5. Sync Permissions
- Select individual permissions or use "Select All Visible"
- Click "Sync Selected" to apply changes to target database
- Progress is shown with success/error notifications
- Comparison refreshes automatically after sync

## 🎨 Interface Overview

### Main Dashboard
- **Connection Status**: Source and Target with consistent labeling
- **Sides Flipping**: Toggle button to swap database roles
- **Action Buttons**: Test, Compare, Sync operations with loading states
- **Filter Controls**: Policy dropdown and status checkboxes
- **Results Table**: Detailed comparison with optimized column widths

### Permissions Table
| Column | Description | Width |
|--------|-------------|-------|
| ☑️ | Selection checkbox | Auto |
| Status | Change type with icons and color coding | Auto |
| Policy | Policy name and UUID (truncated) | Auto |
| Collection | Directus collection name | Auto |
| Action | CRUD operation with colored badges | Auto |
| Source | Source permission summary | Compact |
| Target | Target permission summary | Compact |
| Fields Added | New fields with truncation | Medium |
| Fields Removed | Removed fields with truncation | Medium |
| Actions | View detailed diff button | Auto |

### Diff Viewer Modal
- **Header**: Permission details with status badge
- **Detailed Changes**: Field-by-field comparison with visual indicators
- **Full Permission Data**: Collapsible panel with complete JSON data
- **Word-break Support**: Proper handling of long JSON content

### Color Coding
- **Status Badges**: Green (added), Red (removed), Yellow (modified), Gray (identical)
- **Action Badges**: Light Blue (READ), Green (CREATE), Yellow (UPDATE), Red (DELETE)
- **Connection Status**: Green checkmark (connected), Red X (failed)
- **Field Changes**: Green for added fields, Red for removed fields

## ⚙️ Configuration

### Database Types

The application supports multiple database types:

#### SQL Server
```env
DB_TYPE=mssql
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=1433
SOURCE_DB_NAME=directus
SOURCE_DB_USER=sa
SOURCE_DB_PASSWORD=password
SOURCE_DB_SSL=false
```

#### MySQL
```env
DB_TYPE=mysql
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=3306
SOURCE_DB_NAME=directus
SOURCE_DB_USER=root
SOURCE_DB_PASSWORD=password
SOURCE_DB_SSL=false
```

#### PostgreSQL
```env
DB_TYPE=pg
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=5432
SOURCE_DB_NAME=directus
SOURCE_DB_USER=postgres
SOURCE_DB_PASSWORD=password
SOURCE_DB_SSL=false
```

#### SQLite
```env
DB_TYPE=sqlite3
SOURCE_DB_FILENAME=./source.db
TARGET_DB_FILENAME=./target.db
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_TYPE` | Database type (mssql, mysql, pg, sqlite3) | Yes |
| `SOURCE_DB_HOST` | Source database host | Yes* |
| `SOURCE_DB_PORT` | Source database port | No |
| `SOURCE_DB_NAME` | Source database name | Yes* |
| `SOURCE_DB_USER` | Source database username | Yes* |
| `SOURCE_DB_PASSWORD` | Source database password | Yes* |
| `SOURCE_DB_SSL` | Enable SSL for source (true/false) | No |
| `TARGET_DB_*` | Same as source but for target database | Yes* |
| `SOURCE_DB_FILENAME` | SQLite file path for source | Yes** |
| `TARGET_DB_FILENAME` | SQLite file path for target | Yes** |

*Required for non-SQLite databases  
**Required only for SQLite databases

## 🔧 Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

### Tech Stack

- **Frontend**: React 18 + Next.js 14
- **Styling**: Tailwind CSS with custom components
- **Database**: Knex.js with multi-database support
- **Notifications**: React Hot Toast
- **Language**: TypeScript
- **Components**: Custom CollapsiblePanel, optimized table layouts

### Recent Improvements

1. **Multi-database support** - Migrated from SQL Server only to support MySQL, PostgreSQL, SQLite
2. **Enhanced UI/UX** - Added CollapsiblePanel component for better content organization
3. **Optimized layouts** - Reduced column widths for better space utilization
4. **Consistent labeling** - Fixed confusing label switching in sides flipping
5. **Word-break support** - Improved handling of long JSON content
6. **Better accessibility** - Enhanced keyboard navigation and ARIA support

## 📋 Requirements

- **Database**: SQL Server, MySQL, PostgreSQL, or SQLite
- **Access**: Direct database access required
- **Environment**: Development/staging use recommended
- **Security**: No authentication system included

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify database server is accessible
   - Check environment variable configuration
   - Ensure user has proper permissions
   - For SQLite, verify file paths are correct

2. **No Permissions Found**
   - Verify directus_permissions table exists
   - Check that policies exist in both databases
   - Ensure proper database name in configuration

3. **Sync Errors**
   - Check target database write permissions
   - Verify foreign key constraints
   - Review error messages in toast notifications
   - Ensure both databases have compatible schemas

4. **UI Issues**
   - Clear browser cache and refresh
   - Check browser console for JavaScript errors
   - Verify all environment variables are set

### Database-Specific Notes

- **SQL Server**: Use `TrustServerCertificate=true` for self-signed certificates
- **MySQL**: SSL support available via `SOURCE_DB_SSL=true`
- **PostgreSQL**: Full SSL configuration supported
- **SQLite**: Requires file system access to database files

### Support

For issues and questions:
1. Check the browser console for error messages
2. Verify database connectivity with "Test Connections"
3. Review environment variable configuration
4. Ensure database schema compatibility

## 📄 License

This project is intended for development and staging environments. Use responsibly and ensure proper database backups before synchronization operations.

---

**⚠️ Important**: Always backup your databases before performing sync operations. This tool directly modifies database content and should be used with caution in production environments.