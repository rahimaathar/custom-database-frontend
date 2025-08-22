import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getApiUrl, config } from '../../lib/config';

interface StatsResponse {
    success: boolean;
    message: string;
    data: {
        size: number;
        height: number;
        node_count: number;
        total_records: number;
    } | null;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StatsResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
            data: null
        });
    }

    try {
        // Connect to C++ backend
        const apiUrl = getApiUrl('stats');

        const response = await axios.get(apiUrl, {
            timeout: config.apiTimeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data;

        return res.status(200).json({
            success: result.success || true,
            message: result.message || 'Statistics retrieved successfully',
            data: result.data || {
                size: 0,
                height: 0,
                node_count: 0,
                total_records: 0
            }
        });

    } catch (error: any) {
        console.error('Stats API error:', error);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'Backend server is not running. Please start the C++ backend server.',
                data: null
            });
        }

        // Return default stats if backend is not available
        return res.status(200).json({
            success: false,
            message: 'Using default statistics (backend not available)',
            data: {
                size: 0,
                height: 0,
                node_count: 0,
                total_records: 0
            }
        });
    }
}


