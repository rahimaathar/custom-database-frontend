import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Play, Database, BarChart3, TreePine, Plus, Search, Monitor } from 'lucide-react';
import axios from 'axios';
import KeyValueForm from '../components/KeyValueForm';
import QueryResultsTable from '../components/QueryResultsTable';
import BPTreeVisualizer from '../components/BPTreeVisualizer';
import StatsCard from '../components/StatsCard';
import QueryEditor from '../components/QueryEditor';
import DatabaseDisplay from '../components/DatabaseDisplay';


interface QueryResult {
    success: boolean;
    message: string;
    data: Array<{ key: string; value: string; operation?: string; timestamp?: string }>;
    rows_affected: number;
}

interface DatabaseStats {
    size: number;
    height: number;
    node_count: number;
    total_records: number;
}

export default function Home() {
    const [activeTab, setActiveTab] = useState<'database' | 'query' | 'insert' | 'tree' | 'stats'>('database');

  
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<Error | null>(null);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            console.log('Fetching stats...');
            const response = await axios.get('/api/stats');
            console.log('Stats response:', response.data);

            if (response.data.success) {
                setStats(response.data.data);
                setStatsError(null);
            } else {
                setStatsError(new Error(response.data.message || 'Failed to fetch stats'));
            }
        } catch (error) {
            console.error('Stats fetch error:', error);
            setStatsError(error as Error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); 
        return () => clearInterval(interval);
    }, []);

 
    const [executeQueryLoading, setExecuteQueryLoading] = useState(false);
    const [executeQueryResult, setExecuteQueryResult] = useState<QueryResult | null>(null);

    const executeQuery = async (sqlQuery: string) => {
        try {
            setExecuteQueryLoading(true);
            const response = await axios.post('/api/query', { query: sqlQuery });
            const result = response.data;
            setExecuteQueryResult(result);



            if (result.success) {
                toast.success(result.message || 'Query executed successfully');
                fetchStats(); 
            } else {
                toast.error(result.message || 'Query failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to execute query');
        } finally {
            setExecuteQueryLoading(false);
        }
    };

  
    const [insertLoading, setInsertLoading] = useState(false);

    const insertData = async (key: string, value: string) => {
        try {
            setInsertLoading(true);
            const response = await axios.post('/api/insert', { key, value });
            const result = response.data;



            if (result.success) {
                toast.success('Data inserted successfully');
                fetchStats(); 
            } else {
                toast.error(result.message || 'Insert failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to insert data');
        } finally {
            setInsertLoading(false);
        }
    };

    const handleQuerySubmit = (query: string) => {
        if (query.trim()) {
            executeQuery(query);
        }
    };

    const handleInsert = (key: string, value: string) => {
        insertData(key, value);
    };

    const tabs = [
        { id: 'database', label: 'Database', icon: Monitor },
        { id: 'query', label: 'Query Editor', icon: Search },
        { id: 'insert', label: 'Insert Data', icon: Plus },

        { id: 'tree', label: 'B+ Tree', icon: TreePine },
        { id: 'stats', label: 'Statistics', icon: BarChart3 },
    ] as const;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <Database className="h-8 w-8 text-primary-600" />
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Custom Database</h1>
                                
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <div className={`w-2 h-2 rounded-full ${statsLoading ? 'bg-yellow-400' : statsError ? 'bg-red-400' : 'bg-green-400'}`} />
                                <span>
                                    {statsLoading ? 'Connecting...' :
                                        statsError ? 'Error' :
                                            'Connected'}
                                </span>
                            </div>
                            {statsError && (
                                <div className="text-xs text-red-500">
                                    {statsError.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

    
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    
                    <div className="p-6">
                        {activeTab === 'database' && (
                            <div className="animate-fade-in">
                                <DatabaseDisplay />
                            </div>
                        )}

                        {activeTab === 'query' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">SQL Query Editor</h3>
                                    <QueryEditor
                                        onExecute={handleQuerySubmit}
                                        isLoading={executeQueryLoading}
                                    />
                                </div>

                                {executeQueryResult && (
                                    <div className="animate-fade-in">
                                        <h4 className="text-md font-medium text-gray-900 mb-3">Query Results</h4>
                                        <QueryResultsTable
                                            data={executeQueryResult.data}
                                            success={executeQueryResult.success}
                                            message={executeQueryResult.message}
                                            rowsAffected={executeQueryResult.rows_affected}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'insert' && (
                            <div className="animate-fade-in">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Insert Key-Value Pair</h3>
                                <KeyValueForm onSubmit={handleInsert} isLoading={insertLoading} />
                            </div>
                        )}



                        {activeTab === 'tree' && (
                            <div className="animate-fade-in">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">B+ Tree Visualization</h3>
                                <BPTreeVisualizer />
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="animate-fade-in">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Database Statistics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">Performance Metrics</h4>
                                        </div>
                                        <div className="card-content">
                                            <dl className="space-y-3">
                                                <div className="flex justify-between">
                                                    <dt className="text-sm font-medium text-gray-500">Tree Height</dt>
                                                    <dd className="text-sm text-gray-900">{stats?.height || 0}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-sm font-medium text-gray-500">Total Nodes</dt>
                                                    <dd className="text-sm text-gray-900">{stats?.node_count || 0}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-sm font-medium text-gray-500">Records</dt>
                                                    <dd className="text-sm text-gray-900">{stats?.total_records || 0}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-sm font-medium text-gray-500">Storage Used</dt>
                                                    <dd className="text-sm text-gray-900">
                                                        {((stats?.size || 0) / 1024).toFixed(1)} KB
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">System Status</h4>
                                        </div>
                                        <div className="card-content">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Database Status</span>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Online
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-500">WAL Status</span>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Transactions</span>
                                                    <span className="text-sm text-gray-900">0 Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
