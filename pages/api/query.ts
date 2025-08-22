import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getApiUrl, config } from '../../lib/config';

interface QueryRequest {
    query: string;
}

interface QueryResponse {
    success: boolean;
    message: string;
    data: Array<{ key: string; value: string; operation?: string; timestamp?: string }>;
    rows_affected: number;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<QueryResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
            data: [],
            rows_affected: 0
        });
    }

    try {
        const { query }: QueryRequest = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Query is required and must be a string',
                data: [],
                rows_affected: 0
            });
        }

        // Connect to C++ backend
        const apiUrl = getApiUrl('query');

        console.log('Sending query to backend:', query.trim());

        const response = await axios.post(apiUrl, {
            query: query.trim()
        }, {
            timeout: config.apiTimeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Backend response:', response.data);

        const result = response.data;

        // Add operation type and timestamp to the response
        const enhancedData = result.data?.map((item: any) => ({
            ...item,
            operation: getOperationType(query),
            timestamp: new Date().toISOString()
        })) || [];

        return res.status(200).json({
            success: result.success || true,
            message: result.message || 'Query executed successfully',
            data: enhancedData,
            rows_affected: result.rows_affected || 0
        });

    } catch (error: any) {
        console.error('Query API error:', error);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'Backend server is not running. Please start the C++ backend server.',
                data: [],
                rows_affected: 0
            });
        }

        return res.status(500).json({
            success: false,
            message: error.response?.data?.message || error.message || 'Internal server error',
            data: [],
            rows_affected: 0
        });
    }
}

function getOperationType(query: string): string {
    const upperQuery = query.toUpperCase().trim();

    if (upperQuery.startsWith('INSERT')) return 'Inserted';
    if (upperQuery.startsWith('UPDATE')) return 'Updated';
    if (upperQuery.startsWith('DELETE')) return 'Deleted';
    if (upperQuery.startsWith('GET') || upperQuery.startsWith('SELECT')) return 'Retrieved';

    return 'Executed';
}


