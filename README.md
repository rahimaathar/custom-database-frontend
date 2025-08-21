# Mini-Postgres Frontend

A modern React/Next.js frontend for the Mini-Postgres database system.

## Features

### 🚀 Enhanced Query Interface
- **SQL-like Query Editor**: Write queries with syntax highlighting and auto-resize
- **Query Examples**: Built-in examples for common operations
- **Keyboard Shortcuts**: Ctrl+Enter to execute queries quickly
- **Query Tips**: Helpful tips and syntax guidance

### 📊 Improved Results Display
- **Enhanced Table**: Shows Key, Value, Operation Status, and Timestamp
- **Operation Status**: Color-coded badges for Inserted, Updated, Deleted, Retrieved
- **Responsive Design**: Works on desktop and mobile devices

### 📝 Query History
- **Persistent History**: Queries are saved in localStorage
- **Re-run Queries**: Click to re-execute previous queries
- **History Management**: Clear individual queries or entire history
- **Success/Failure Tracking**: Visual indicators for query results

### 🎨 Modern UI/UX
- **Clean Design**: Modern, responsive interface with Tailwind CSS
- **Tab Navigation**: Easy switching between different features
- **Real-time Stats**: Live database statistics display
- **Loading States**: Proper loading indicators and disabled states

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Backend URL**:
   Create a `.env.local` file in the frontend directory:
   ```env
   BACKEND_URL=http://localhost:8080
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## API Routes

The frontend includes API routes that connect to the C++ backend:

- `/api/query` - Execute SQL-like queries
- `/api/insert` - Insert key-value pairs
- `/api/stats` - Get database statistics

## Components

- **QueryEditor**: Enhanced query input with examples and tips
- **QueryResultsTable**: Improved results display with operation status
- **QueryHistory**: Persistent query history with re-run functionality
- **KeyValueForm**: Simple form for inserting data
- **BPTreeVisualizer**: B+ Tree structure visualization
- **StatsCard**: Database statistics display

## Query Examples

```sql
-- Insert data
INSERT INTO data VALUES ("user:123", "John Doe")

-- Get specific key
GET "user:123"

-- Select all data
SELECT * FROM data

-- Delete data
DELETE FROM data WHERE key = "user:123"

-- Update data
UPDATE data SET value = "Jane Doe" WHERE key = "user:123"
```

## Development

The frontend is built with:
- **Next.js 13+** with App Router
- **React 18** with hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Backend Integration

The frontend expects the C++ backend to be running on `http://localhost:8080` (or the URL specified in `BACKEND_URL`). The backend should provide these endpoints:

- `POST /query` - Execute queries
- `GET /stats` - Get database statistics

If the backend is not running, the frontend will show appropriate error messages and fallback to default statistics.


