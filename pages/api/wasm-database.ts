import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

// WebAssembly module interface
interface MiniPostgresWASM {
    ccall: (funcName: string, returnType: string, argTypes: string[], args: any[]) => any;
    cwrap: (funcName: string, returnType: string, argTypes: string[]) => (...args: any[]) => any;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    HEAPU8: Uint8Array;
}

let wasmModule: MiniPostgresWASM | null = null;

// Load WebAssembly module
async function loadWASMModule(): Promise<MiniPostgresWASM> {
    if (wasmModule) {
        return wasmModule;
    }

    try {
        // In production, this would be served from the public directory
        const wasmPath = path.join(process.cwd(), 'public', 'mini_postgres.wasm');
        const jsPath = path.join(process.cwd(), 'public', 'mini_postgres.js');

        // Load the JavaScript wrapper
        const jsCode = await fs.readFile(jsPath, 'utf-8');

        // Create a module factory
        const moduleFactory = new Function(jsCode + '; return MiniPostgres;')();

        // Initialize the WASM module
        wasmModule = await moduleFactory({
            locateFile: (filename: string) => {
                if (filename.endsWith('.wasm')) {
                    return '/mini_postgres.wasm';
                }
                return filename;
            }
        });

        if (!wasmModule) {
            throw new Error('Failed to initialize WASM module');
        }
        return wasmModule;
    } catch (error) {
        console.error('Failed to load WASM module:', error);
        throw new Error('Database engine not available');
    }
}

// Wrapper functions for database operations
async function executeQuery(query: string): Promise<any> {
    const module = await loadWASMModule();

    // Allocate memory for the query string
    const queryPtr = module._malloc(query.length + 1);

    try {
        // Copy query string to WASM memory
        for (let i = 0; i < query.length; i++) {
            module.HEAPU8[queryPtr + i] = query.charCodeAt(i);
        }
        module.HEAPU8[queryPtr + query.length] = 0; // null terminator

        // Execute query
        const result = module.ccall('query', 'string', ['number'], [queryPtr]);

        return JSON.parse(result || '{"success": false, "message": "Query failed"}');
    } finally {
        // Free allocated memory
        module._free(queryPtr);
    }
}

async function insertKeyValue(key: string, value: string): Promise<any> {
    const module = await loadWASMModule();

    // Allocate memory for key and value
    const keyPtr = module._malloc(key.length + 1);
    const valuePtr = module._malloc(value.length + 1);

    try {
        // Copy strings to WASM memory
        for (let i = 0; i < key.length; i++) {
            module.HEAPU8[keyPtr + i] = key.charCodeAt(i);
        }
        module.HEAPU8[keyPtr + key.length] = 0;

        for (let i = 0; i < value.length; i++) {
            module.HEAPU8[valuePtr + i] = value.charCodeAt(i);
        }
        module.HEAPU8[valuePtr + value.length] = 0;

        // Execute insert
        const result = module.ccall('insert', 'string', ['number', 'number'], [keyPtr, valuePtr]);

        return JSON.parse(result || '{"success": false, "message": "Insert failed"}');
    } finally {
        // Free allocated memory
        module._free(keyPtr);
        module._free(valuePtr);
    }
}

async function getValue(key: string): Promise<any> {
    const module = await loadWASMModule();

    // Allocate memory for key
    const keyPtr = module._malloc(key.length + 1);

    try {
        // Copy key to WASM memory
        for (let i = 0; i < key.length; i++) {
            module.HEAPU8[keyPtr + i] = key.charCodeAt(i);
        }
        module.HEAPU8[keyPtr + key.length] = 0;

        // Execute get
        const result = module.ccall('get', 'string', ['number'], [keyPtr]);

        return JSON.parse(result || '{"success": false, "message": "Get failed"}');
    } finally {
        // Free allocated memory
        module._free(keyPtr);
    }
}

// API handler
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
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
        const { operation, query, key, value } = req.body;

        let result;

        switch (operation) {
            case 'query':
                if (!query) {
                    return res.status(400).json({
                        success: false,
                        message: 'Query is required',
                        data: [],
                        rows_affected: 0
                    });
                }
                result = await executeQuery(query);
                break;

            case 'insert':
                if (!key || !value) {
                    return res.status(400).json({
                        success: false,
                        message: 'Key and value are required',
                        data: [],
                        rows_affected: 0
                    });
                }
                result = await insertKeyValue(key, value);
                break;

            case 'get':
                if (!key) {
                    return res.status(400).json({
                        success: false,
                        message: 'Key is required',
                        data: [],
                        rows_affected: 0
                    });
                }
                result = await getValue(key);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid operation',
                    data: [],
                    rows_affected: 0
                });
        }

        return res.status(200).json({
            success: result.success || true,
            message: result.message || 'Operation completed successfully',
            data: result.data || [],
            rows_affected: result.rows_affected || 0
        });

    } catch (error: any) {
        console.error('WASM Database API error:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
            data: [],
            rows_affected: 0
        });
    }
}

