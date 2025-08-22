import { useState, useEffect, useRef } from 'react';
import { Database, RefreshCw, Eye, EyeOff, Search, Filter, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface DatabaseRecord {
    key: string;
    value: string;
    timestamp?: string;
}

interface DatabaseStats {
    size: number;
    height: number;
    node_count: number;
    total_records: number;
}

// Tree-related interfaces removed since tree visualization is now handled by BPTreeVisualizer

export default function DatabaseDisplay() {
    const [records, setRecords] = useState<DatabaseRecord[]>([]);
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    // Removed treeData state since tree API calls are now handled by BPTreeVisualizer
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showValues, setShowValues] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'key' | 'value' | 'timestamp'>('key');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default
    const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch all database data
    const fetchDatabaseData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all records
            const recordsResponse = await axios.post('/api/query', {
                query: 'SELECT * FROM data'
            });

            // Fetch stats
            const statsResponse = await axios.get('/api/stats');

            if (recordsResponse.data.success) {
                setRecords(recordsResponse.data.data || []);
            }

            if (statsResponse.data.success) {
                setStats(statsResponse.data.data);
            }

            // Removed tree API call to prevent excessive requests
            // Tree data is now only fetched in the BPTreeVisualizer component

        } catch (error: any) {
            console.error('Database fetch error:', error);
            setError(error.message || 'Failed to fetch database data');
            toast.error('Failed to fetch database data');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch and auto-refresh setup
    useEffect(() => {
        // Always fetch data on initial mount
        fetchDatabaseData();

        // Set up auto-refresh if enabled
        if (autoRefresh) {
            intervalRef.current = setInterval(fetchDatabaseData, refreshInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []); // Only run on mount

    // Handle auto-refresh changes
    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(fetchDatabaseData, refreshInterval);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRefresh, refreshInterval]);

    // Manual refresh
    const handleRefresh = () => {
        fetchDatabaseData();
        toast.success('Database refreshed');
    };

    // Filter and sort records
    const filteredAndSortedRecords = records
        .filter(record => {
            if (!searchTerm) return true;
            return record.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.value.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            // Handle timestamp sorting
            if (sortBy === 'timestamp') {
                aValue = new Date(a.timestamp || 0).getTime();
                bValue = new Date(b.timestamp || 0).getTime();
            } else {
                // For key and value, we know they exist
                aValue = a[sortBy];
                bValue = b[sortBy];
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    // Export data
    const handleExport = () => {
        const dataStr = JSON.stringify(filteredAndSortedRecords, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `database-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Database exported successfully');
    };

    // Tree visualization is now handled by the BPTreeVisualizer component

    return (
        <div className="space-y-6">
            {/* Header with controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <Database className="h-6 w-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Database Overview</h2>
                            <p className="text-sm text-gray-500">Real-time database structure and data</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="btn-primary btn-sm flex items-center space-x-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="btn-outline btn-sm flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="text-sm font-medium text-blue-900">Total Records</div>
                        <div className="text-2xl font-bold text-blue-700">{records.length}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="text-sm font-medium text-green-900">Tree Height</div>
                        <div className="text-2xl font-bold text-green-700">{stats?.height || 0}</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                        <div className="text-sm font-medium text-purple-900">Nodes</div>
                        <div className="text-2xl font-bold text-purple-700">{stats?.node_count || 0}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                        <div className="text-sm font-medium text-orange-900">Size</div>
                        <div className="text-2xl font-bold text-orange-700">
                            {((stats?.size || 0) / 1024).toFixed(1)} KB
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto-refresh</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Interval:</span>
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                            <option value={1000}>1s</option>
                            <option value={3000}>3s</option>
                            <option value={5000}>5s</option>
                            <option value={10000}>10s</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowValues(!showValues)}
                            className="btn-outline btn-sm flex items-center space-x-2"
                        >
                            {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span>{showValues ? 'Hide' : 'Show'} Values</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tree visualization is now handled by the BPTreeVisualizer component */}

            {/* Data Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Database Records</h3>
                    <div className="text-sm text-gray-500">
                        {filteredAndSortedRecords.length} of {records.length} records
                    </div>
                </div>

                {/* Search and Sort Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search keys or values..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'key' | 'value' | 'timestamp')}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="key">Sort by Key</option>
                            <option value="value">Sort by Value</option>
                            <option value="timestamp">Sort by Time</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>

                {/* Records Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Key
                                </th>
                                {showValues && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Value
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Timestamp
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={showValues ? 3 : 2} className="px-6 py-4 text-center text-gray-500">
                                        {searchTerm ? 'No records match your search' : 'No records found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedRecords.map((record, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                            {record.key}
                                        </td>
                                        {showValues && (
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                {record.value}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.timestamp ? <span suppressHydrationWarning>{new Date(record.timestamp).toLocaleString()}</span> : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination or load more */}
                {filteredAndSortedRecords.length > 50 && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500">
                            Showing first 50 records. Use search to find specific records.
                        </p>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-red-400" />
                        <h3 className="text-sm font-medium text-red-900">Error Loading Database</h3>
                    </div>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 btn-primary btn-sm"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                        <span className="text-sm font-medium text-blue-900">Updating database...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
