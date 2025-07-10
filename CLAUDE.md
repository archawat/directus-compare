# Directus Compare Tool - AI Context

A comprehensive tool to compare two Directus instances by connecting directly to their databases and visualizing differences in permissions.

## Technical Implementation

### Architecture
- **Backend**: Next.js API routes with TypeScript
- **Frontend**: React with Tailwind CSS
- **Database**: Direct SQL Server connection using mssql library
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS with custom component classes

### Key Files Structure
```
/pages/api/
├── compare.ts - Main comparison endpoint
├── sync.ts - Permission synchronization endpoint
└── test-connection.ts - Database connection testing

/lib/
├── database.ts - DatabaseConnection class with SQL Server support
└── permissions.ts - PermissionComparator class with comparison logic

/components/
├── DiffViewer.tsx - Modal for detailed diff visualization
├── PermissionsList.tsx - Main comparison table
└── SummaryCard.tsx - Statistics display

/pages/
├── index.tsx - Main application page
└── _app.tsx - Toast notification provider setup
```

### Database Schema
Directus permissions table structure:
- `id` - Primary key
- `policy` - Policy UUID (not role - discovered during development)
- `collection` - Collection name
- `action` - CRUD operation (read, create, update, delete)
- `permissions` - JSON permissions object
- `validation` - Validation rules
- `presets` - Default values
- `fields` - Comma-separated field list

### Core Features Implemented

#### 1. Database Connection Management
- **DatabaseConnection class** in `lib/database.ts`
- Parses SQL Server connection strings
- Connection pooling and reuse
- Connection testing with error handling
- Displays server/database info in UI

#### 2. Permission Comparison Logic
- **PermissionComparator class** in `lib/permissions.ts`
- Composite key: `collection:action:policy`
- Policy filtering: Only compares policies that exist in both servers
- Field normalization: Sorts comma-separated field lists before comparison
- Status determination: added, removed, modified, identical

#### 3. UI Components

##### Main Interface (`pages/index.tsx`)
- Database connection status display (source → target format)
- Test connections button
- Compare permissions button
- Filtering system (policy dropdown + status checkboxes)
- Sync selected permissions functionality
- Toast notifications using react-hot-toast

##### Permissions Table (`components/PermissionsList.tsx`)
- **Column Order**: Status, Policy, Collection, Action, Source, Target, Fields Added, Fields Removed, Actions
- **Sorting**: Policy → Collection → Action (read, create, update, delete)
- **Action badges**: Colored badges (READ=light blue, CREATE=green, UPDATE=yellow, DELETE=red)
- **Field analysis**: Shows added/removed fields with truncation for long lists
- **Bulk selection**: Header checkbox with proper state management
- **Individual row selection**: Disabled for identical permissions

##### Diff Viewer (`components/DiffViewer.tsx`)
- Modal overlay for detailed comparison
- Field-by-field change analysis
- JSON diff visualization
- Normalized field display

#### 4. Filtering System
- **Policy filter**: Dropdown with counts, filters first
- **Status filter**: Checkboxes (added/modified default checked)
- **Computed counts**: Updates based on policy selection
- **Selection management**: Clears selections when filters change

#### 5. Synchronization
- **Sync API** (`pages/api/sync.ts`)
- Only syncs selected and filtered items
- Handles create, update, and delete operations
- Success/failure reporting with toast notifications
- Refreshes comparison after sync

#### 6. Error Handling & UX
- **Toast notifications**: Success/error messages with icons
- **Connection validation**: Tests before comparison
- **Loading states**: Buttons show loading during operations
- **Responsive design**: Works on desktop and mobile
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Business Logic

#### Permission Comparison Algorithm
1. **Fetch permissions** from both databases with policy names
2. **Filter by common policies** to avoid false positives
3. **Create composite keys** for each permission
4. **Compare data** with field normalization
5. **Determine status** (added/removed/modified/identical)
6. **Sort results** by policy, collection, action order

#### Field Normalization
- Splits comma-separated field lists
- Trims whitespace
- Filters empty values
- Sorts alphabetically
- Rejoins with consistent formatting

#### Sync Strategy
- **Create**: Insert new permission in target
- **Update**: Update existing permission by ID
- **Delete**: Remove permission from target
- **Normalization**: Applied to fields before storage

### Development Notes

#### SQL Server Connection String Format
```
Server=server;Database=database;User Id=user;Password=pass;TrustServerCertificate=true
```

#### Environment Variables
- `SOURCE_DB_CONNECTION_STRING` - Source database
- `TARGET_DB_CONNECTION_STRING` - Target database

#### CSS Classes
- `.status-badge` - Status indicators
- `.action-badge` - Action type badges
- `.card` - Container styling
- `.btn-*` - Button variants

### Known Limitations
- SQL Server only (no MySQL/PostgreSQL)
- Direct database access required
- No authentication system
- Development tool only

### Testing Strategy
- Connection testing before operations
- Error handling for database failures
- Toast notifications for user feedback
- Validation of required fields

This tool is designed for development/staging environments to sync Directus permissions between instances without API dependencies.