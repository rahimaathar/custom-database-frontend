import { useState, useEffect } from 'react';
import axios from 'axios';

interface DatabaseStats {
    size: number;
    height: number;
    node_count: number;
    total_records: number;
}

export default function Test() {
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching stats...');
            const response = await axios.get('/api/stats');
            console.log('Stats response:', response.data);
            
            if (response.data.success) {
                setStats(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch stats');
            }
        } catch (err: any) {
            console.error('Stats fetch error:', err);
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">Database Statistics Test</h1>
            
            <div className="mb-4">
                <button 
                    onClick={fetchStats}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Refresh Stats
                </button>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Status:</h2>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>Error: {error || 'None'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border-blue-200 border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="text-blue-500 p-2 rounded-lg bg-white shadow-sm">
                            <span className="text-lg">📊</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">Total Records</p>
                            <p className="text-2xl font-bold text-blue-700">{stats?.total_records || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-green-50 border-green-200 border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="text-green-500 p-2 rounded-lg bg-white shadow-sm">
                            <span className="text-lg">🌳</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">Tree Height</p>
                            <p className="text-2xl font-bold text-green-700">{stats?.height || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-purple-50 border-purple-200 border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="text-purple-500 p-2 rounded-lg bg-white shadow-sm">
                            <span className="text-lg">🔗</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900">Node Count</p>
                            <p className="text-2xl font-bold text-purple-700">{stats?.node_count || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-orange-50 border-orange-200 border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="text-orange-500 p-2 rounded-lg bg-white shadow-sm">
                            <span className="text-lg">💾</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-orange-900">Database Size</p>
                            <p className="text-2xl font-bold text-orange-700">{((stats?.size || 0) / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Raw Stats Data:</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                    {JSON.stringify(stats, null, 2)}
                </pre>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Error: {error}</p>
                </div>
            )}
        </div>
    );
}
