import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Debug() {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching stats from /api/stats...');
            const response = await axios.get('/api/stats');
            console.log('Stats response:', response.data);
            setStats(response.data);
        } catch (err: any) {
            console.error('Error fetching stats:', err);
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
            
            <div className="mb-4">
                <button 
                    onClick={fetchStats}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Fetch Stats
                </button>
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-semibold">Status:</h2>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>Error: {error || 'None'}</p>
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-semibold">Stats Data:</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(stats, null, 2)}
                </pre>
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-semibold">Direct API Test:</h2>
                <button 
                    onClick={async () => {
                        try {
                            const response = await fetch('/api/stats');
                            const data = await response.json();
                            console.log('Fetch API response:', data);
                            alert('Check console for response');
                        } catch (err) {
                            console.error('Fetch error:', err);
                            alert('Error: ' + err);
                        }
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Test with Fetch
                </button>
            </div>
        </div>
    );
}
