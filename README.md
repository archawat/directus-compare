# Directus Compare Tool

A powerful web application for comparing and synchronizing permissions between two Directus instances using direct database connections.

## 🌟 Features

- **Direct Database Access** - Connect directly to Directus databases without API keys
- **Permission Comparison** - Compare permissions between source and target instances
- **Visual Diff Interface** - Clean, intuitive interface to view differences
- **Selective Sync** - Choose which permissions to synchronize
- **Real-time Filtering** - Filter by policy and status for focused comparison
- **Field Analysis** - See exactly which fields were added or removed
- **Bulk Operations** - Select multiple permissions for batch synchronization

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Access to both Directus database instances (SQL Server)

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
   
   Edit `.env` file with your connection strings:
   ```env
   SOURCE_DB_CONNECTION_STRING="Server=your-source-server;Database=directus;User Id=username;Password=password;TrustServerCertificate=true"
   TARGET_DB_CONNECTION_STRING="Server=your-target-server;Database=directus;User Id=username;Password=password;TrustServerCertificate=true"
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

### 2. Compare Permissions
- Click "Compare Permissions" to analyze differences
- View summary statistics of changes
- Results are sorted by Policy → Collection → Action

### 3. Filter Results
- **Policy Filter**: Select specific policies to focus on
- **Status Filter**: Show/hide different types of changes:
  - ✅ **Added** - Permissions that exist in source but not target
  - ❌ **Removed** - Permissions that exist in target but not source  
  - 🔄 **Modified** - Permissions that differ between instances
  - ✅ **Identical** - Permissions that are the same (hidden by default)

### 4. Review Changes
- **Action Badges**: Color-coded action types (READ, CREATE, UPDATE, DELETE)
- **Field Changes**: See which fields were added/removed
- **View Diff**: Click to see detailed changes in a modal

### 5. Sync Permissions
- Select individual permissions or use "Select All Visible"
- Click "Sync Selected" to apply changes to target database
- Progress is shown with success/error notifications

## 🎨 Interface Overview

### Main Dashboard
- **Connection Status**: Source → Target with visual indicators
- **Action Buttons**: Test, Compare, Sync operations
- **Filter Controls**: Policy dropdown and status checkboxes
- **Results Table**: Detailed comparison with sorting and selection

### Permissions Table
| Column | Description |
|--------|-------------|
| ☑️ | Selection checkbox |
| Status | Change type with color coding |
| Policy | Policy name and UUID |
| Collection | Directus collection name |
| Action | CRUD operation with colored badges |
| Source | Source permission summary |
| Target | Target permission summary |
| Fields Added | New fields in source |
| Fields Removed | Fields removed from source |
| Actions | View detailed diff |

### Color Coding
- **Status Badges**: Green (added), Red (removed), Yellow (modified), Gray (identical)
- **Action Badges**: Light Blue (READ), Green (CREATE), Yellow (UPDATE), Red (DELETE)
- **Connection Status**: Green checkmark (connected), Red X (failed)

## ⚙️ Configuration

### Database Connection Strings

The application supports SQL Server connection strings with these formats:

```env
# Using SQL Server Authentication
SOURCE_DB_CONNECTION_STRING="Server=localhost;Database=directus;User Id=sa;Password=password;TrustServerCertificate=true"

# Using Windows Authentication
SOURCE_DB_CONNECTION_STRING="Server=localhost;Database=directus;Integrated Security=true;TrustServerCertificate=true"
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SOURCE_DB_CONNECTION_STRING` | Source Directus database connection | Yes |
| `TARGET_DB_CONNECTION_STRING` | Target Directus database connection | Yes |

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
- **Styling**: Tailwind CSS
- **Database**: SQL Server (mssql)
- **Notifications**: React Hot Toast
- **Language**: TypeScript

## 📋 Requirements

- **Database**: SQL Server only (MySQL/PostgreSQL not supported)
- **Access**: Direct database access required
- **Environment**: Development/staging use recommended
- **Security**: No authentication system included

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify database server is accessible
   - Check connection string format
   - Ensure user has proper permissions

2. **No Permissions Found**
   - Verify directus_permissions table exists
   - Check that policies exist in both databases
   - Ensure proper database name in connection string

3. **Sync Errors**
   - Check target database write permissions
   - Verify foreign key constraints
   - Review error messages in notifications

### Support

For issues and questions:
1. Check the browser console for error messages
2. Verify database connectivity
3. Review environment variable configuration

## 📄 License

This project is intended for development and staging environments. Use responsibly and ensure proper database backups before synchronization operations.