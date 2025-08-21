import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getBackendUrl, config } from '../../lib/config';

interface InsertRequest {
    key: string;
    value: string;
}

interface InsertResponse {
    success: boolean;
    message: string;
    data: Array<{ key: string; value: string; operation?: string; timestamp?: string }>;
    rows_affected: number;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<InsertResponse>
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
        const { key, value }: InsertRequest = req.body;

        if (!key || !value || typeof key !== 'string' || typeof value !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Both key and value are required and must be strings',
                data: [],
                rows_affected: 0
            });
        }

        // Connect to C++ backend
        const backendUrl = getBackendUrl();

        // Convert to SQL-like INSERT query
        const query = `INSERT INTO data VALUES ('${key}', '${value}')`;

        console.log('Sending query to backend:', query);

        const response = await axios.post(`${backendUrl}/query`, {
            query: query
        }, {
            timeout: config.apiTimeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data;

        // Add operation type and timestamp to the response
        const enhancedData = [{
            key,
            value,
            operation: 'Inserted',
            timestamp: new Date().toISOString()
        }];

        return res.status(200).json({
            success: result.success || true,
            message: result.message || 'Data inserted successfully',
            data: enhancedData,
            rows_affected: result.rows_affected || 1
        });

    } catch (error: any) {
        console.error('Insert API error:', error);

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


