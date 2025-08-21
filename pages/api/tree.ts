import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getBackendUrl, config } from '../../lib/config';

interface TreeResponse {
    success: boolean;
    message: string;
    root: any;
    depth: number;
    node_count: number;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TreeResponse>
) {
    // RE-ENABLE TREE API WITH PERFORMANCE OPTIMIZATIONS
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
            root: null,
            depth: 0,
            node_count: 0
        });
    }

    try {
        // Enhanced rate limiting - only allow one request per 10 seconds per IP
        const now = Date.now();
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

        // Simple in-memory rate limiting
        if (!global.treeApiLastCall) global.treeApiLastCall = {};
        const lastCall = global.treeApiLastCall[clientIP] || 0;

        if (now - lastCall < 10000) { // 10 second rate limit
            console.log(`🌳 Tree API: Rate limited for ${clientIP}, last call was ${now - lastCall}ms ago`);
            return res.status(429).json({
                success: false,
                message: 'Rate limited - please wait 10 seconds between requests',
                root: null,
                depth: 0,
                node_count: 0
            });
        }

        global.treeApiLastCall[clientIP] = now;
        console.log('🌳 Tree API: Fetching tree data from backend...');

        const backendUrl = getBackendUrl();
        const response = await axios.get(`${backendUrl}/tree`, {
            timeout: config.apiTimeout * 3, // Longer timeout for tree data
            headers: {
                'Accept': 'application/json',
                'Connection': 'close',
                'Cache-Control': 'no-cache'
            },
            maxContentLength: 10 * 1024 * 1024, // 10MB limit
            maxBodyLength: 10 * 1024 * 1024, // 10MB limit
        });

        console.log('🌳 Tree API: Backend response received');

        if (response.data.success) {
            const treeData = response.data.data;

            // Transform the data to match our interface
            const transformedData: TreeResponse = {
                success: true,
                message: response.data.message || 'Tree retrieved',
                root: response.data.root, // Fixed: root is at top level, not in data
                depth: treeData.depth,
                node_count: treeData.node_count
            };

            console.log('🌳 Tree API: Sending transformed data to frontend');
            return res.status(200).json(transformedData);
        } else {
            console.error('🌳 Tree API: Backend returned error:', response.data.message);
            return res.status(500).json({
                success: false,
                message: response.data.message || 'Backend error',
                root: null,
                depth: 0,
                node_count: 0
            });
        }
    } catch (error: any) {
        console.error('🌳 Tree API error:', error);

        let errorMessage = 'Failed to fetch tree data';
        let statusCode = 500;

        if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection reset by backend. The tree data may be too large.';
            statusCode = 503; // Service Unavailable
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Backend server is not running. Please start the C++ backend.';
            statusCode = 503;
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timed out. The tree data may be too large.';
            statusCode = 504; // Gateway Timeout
        } else if (error.response) {
            errorMessage = `Backend error: ${error.response.data?.message || error.response.statusText}`;
            statusCode = error.response.status;
        } else if (error.request) {
            errorMessage = 'No response from backend server';
            statusCode = 503;
        }

        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            root: null,
            depth: 0,
            node_count: 0
        });
    }
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
            root: null,
            depth: 0,
            node_count: 0
        });
    }

    try {
        // Add rate limiting - only allow one request per 5 seconds per IP
        const now = Date.now();
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

        // Simple in-memory rate limiting (in production, use Redis or similar)
        if (!global.treeApiLastCall) global.treeApiLastCall = {};
        const lastCall = global.treeApiLastCall[clientIP] || 0;

        if (now - lastCall < 5000) { // 5 second rate limit
            console.log(`Tree API: Rate limited for ${clientIP}, last call was ${now - lastCall}ms ago`);
            return res.status(429).json({
                success: false,
                message: 'Rate limited - please wait 5 seconds between requests',
                root: null,
                depth: 0,
                node_count: 0
            });
        }

        global.treeApiLastCall[clientIP] = now;
        console.log('Tree API: Fetching tree data from backend...');

        const response = await axios.get('http://localhost:8080/tree', {
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'Connection': 'close',
                'Cache-Control': 'no-cache'
            },
            maxContentLength: 10 * 1024 * 1024, // 10MB limit
            maxBodyLength: 10 * 1024 * 1024, // 10MB limit
        });

        console.log('Tree API: Backend response received');

        if (response.data.success) {
            const treeData = response.data.data;

            // Transform the data to match our interface
            const transformedData: TreeResponse = {
                success: true,
                message: response.data.message || 'Tree retrieved',
                root: response.data.root, // Fixed: root is at top level, not in data
                depth: treeData.depth,
                node_count: treeData.node_count
            };

            console.log('Tree API: Sending transformed data to frontend');
            return res.status(200).json(transformedData);
        } else {
            console.error('Tree API: Backend returned error:', response.data.message);
            return res.status(500).json({
                success: false,
                message: response.data.message || 'Backend error',
                root: null,
                depth: 0,
                node_count: 0
            });
        }
    } catch (error: any) {
        console.error('Tree API error:', error);

        let errorMessage = 'Failed to fetch tree data';
        let statusCode = 500;

        if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection reset by backend. The tree data may be too large.';
            statusCode = 503; // Service Unavailable
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Backend server is not running. Please start the C++ backend.';
            statusCode = 503;
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timed out. The tree data may be too large.';
            statusCode = 504; // Gateway Timeout
        } else if (error.response) {
            errorMessage = `Backend error: ${error.response.data?.message || error.response.statusText}`;
            statusCode = error.response.status;
        } else if (error.request) {
            errorMessage = 'No response from backend server';
            statusCode = 503;
        }

        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            root: null,
            depth: 0,
            node_count: 0
        });
    }
}


