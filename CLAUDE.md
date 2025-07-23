# Directus Compare Tool - AI Context

A comprehensive tool to compare two Directus instances by connecting directly to their databases and visualizing differences in permissions.

## Technical Implementation

### Architecture
- **Backend**: Next.js API routes with TypeScript
- **Frontend**: React with Tailwind CSS
- **Database**: Multi-database support (SQL Server, MySQL, PostgreSQL, SQLite) using Knex.js
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS with custom component classes

### Key Files Structure
```
/pages/api/
├── compare.ts - Main comparison endpoint
├── sync.ts - Permission synchronization endpoint
└── test-connection.ts - Database connection testing

/lib/
├── database.ts - DatabaseConnection class with multi-database support
└── permissions.ts - PermissionComparator class with comparison logic

/components/
├── DiffViewer.tsx - Modal for detailed diff visualization with CollapsiblePanel
├── PermissionsList.tsx - Main comparison table with optimized column widths
├── SummaryCard.tsx - Statistics display
└── CollapsiblePanel.tsx - Reusable collapsible component

/pages/
├── index.tsx - Main application page with sides flipping functionality
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
- **Multi-database support**: SQL Server, MySQL, PostgreSQL, SQLite via Knex.js
- **Individual configuration**: Uses separate environment variables (HOST, PORT, USER, PASSWORD)
- **Connection pooling and reuse**
- **Connection testing with error handling**
- **Displays server/database info in UI**

#### 2. Permission Comparison Logic
- **PermissionComparator class** in `lib/permissions.ts`
- **Composite key**: `collection:action:policy`
- **Policy filtering**: Only compares policies that exist in both servers
- **Field normalization**: Sorts comma-separated field lists before comparison
- **Status determination**: added, removed, modified, identical
- **Sides flipping support**: Backend handles data swapping when sides are flipped

#### 3. UI Components

##### Main Interface (`pages/index.tsx`)
- **Database connection status display**: Always shows "Source" and "Target" labels consistently
- **Sides flipping**: Toggle button to swap which database is considered source vs target
- **Test connections button**
- **Compare permissions button**
- **Filtering system**: Policy dropdown + status checkboxes
- **Sync selected permissions functionality**
- **Toast notifications**: Using react-hot-toast

##### Permissions Table (`components/PermissionsList.tsx`)
- **Column Order**: Checkbox, Status, Policy, Collection, Action, Source, Target, Fields Added, Fields Removed, Actions
- **Optimized column widths**: Source and Target columns use `max-w-24` for compact display
- **Sorting**: Policy → Collection → Action (read, create, update, delete)
- **Action badges**: Colored badges (READ=light blue, CREATE=green, UPDATE=yellow, DELETE=red)
- **Field analysis**: Shows added/removed fields with truncation for long lists
- **Bulk selection**: Header checkbox with proper state management
- **Individual row selection**: Disabled for identical permissions

##### Diff Viewer (`components/DiffViewer.tsx`)
- **Modal overlay** for detailed comparison
- **Structured layout**: Detailed Changes section followed by collapsible Full Permission Data
- **CollapsiblePanel integration**: Raw JSON data in expandable panel at bottom
- **Field-by-field change analysis**
- **JSON diff visualization** with word-break support for long content
- **Normalized field display**

##### CollapsiblePanel (`components/CollapsiblePanel.tsx`)
- **Reusable component** for expandable content sections
- **Smooth animations** with rotating chevron icon
- **Configurable** title, default state, and styling
- **Accessibility support** with proper button semantics

#### 4. Filtering System
- **Policy filter**: Dropdown with counts, filters first
- **Status filter**: Checkboxes (added/modified default checked)
- **Computed counts**: Updates based on policy selection
- **Selection management**: Clears selections when filters change

#### 5. Synchronization
- **Sync API** (`pages/api/sync.ts`)
- **Sides-aware**: Respects flipped state for correct source/target direction
- **Only syncs selected and filtered items**
- **Handles create, update, and delete operations**
- **Success/failure reporting** with toast notifications
- **Refreshes comparison after sync**

#### 6. Sides Flipping Functionality
- **Backend data swapping**: `getSourceDb()` and `getTargetDb()` functions handle database connection swapping
- **Consistent UI labels**: Source and Target labels remain fixed while data swaps behind the scenes
- **API integration**: All endpoints respect the `flipped` parameter
- **Comparison logic**: Field change analysis accounts for flipped perspective

#### 7. Error Handling & UX
- **Toast notifications**: Success/error messages with icons
- **Connection validation**: Tests before comparison
- **Loading states**: Buttons show loading during operations
- **Responsive design**: Works on desktop and mobile
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Word-break support**: Long JSON content properly wrapped in pre tags

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

#### Sides Flipping Logic
- **Backend handles data swapping**: When `flipped=true`, source and target database connections are swapped
- **UI remains consistent**: Labels always show "Source" and "Target" regardless of flip state
- **Comparison perspective**: Field change analysis adapts to flipped state for correct added/removed field detection

### Development Notes

#### Environment Variables
Current format (individual configuration):
```
DB_TYPE=mssql
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=1433
SOURCE_DB_NAME=directus_source
SOURCE_DB_USER=username
SOURCE_DB_PASSWORD=password
SOURCE_DB_SSL=false
TARGET_DB_HOST=localhost
TARGET_DB_PORT=1433
TARGET_DB_NAME=directus_target
TARGET_DB_USER=username
TARGET_DB_PASSWORD=password
TARGET_DB_SSL=false
```

SQLite support:
```
DB_TYPE=sqlite3
SOURCE_DB_FILENAME=./source.db
TARGET_DB_FILENAME=./target.db
```

#### CSS Classes
- `.status-badge` - Status indicators
- `.action-badge` - Action type badges  
- `.card` - Container styling
- `.btn-*` - Button variants

### Database Support
- **SQL Server**: Primary support with TrustServerCertificate option
- **MySQL**: Full support with SSL configuration
- **PostgreSQL**: Complete support with SSL options
- **SQLite**: File-based database support for development

### Recent Improvements
1. **Multi-database support**: Migrated from mssql-specific to Knex.js for broader database compatibility
2. **CollapsiblePanel component**: Added reusable expandable sections for better UX
3. **Optimized table layout**: Reduced Source/Target column widths for better space utilization
4. **Enhanced diff viewer**: Organized with detailed changes first, raw data in collapsible panel
5. **Consistent UI labeling**: Fixed confusing label switching in sides flipping functionality
6. **Word-break support**: Improved handling of long JSON content in pre tags

### Known Limitations
- Direct database access required
- No authentication system
- Development tool only (not production-ready)

### Testing Strategy
- Connection testing before operations
- Error handling for database failures
- Toast notifications for user feedback
- Validation of required fields

This tool is designed for development/staging environments to sync Directus permissions between instances without API dependencies. The multi-database support makes it flexible for various Directus deployment configurations.