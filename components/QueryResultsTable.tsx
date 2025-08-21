import { CheckCircle, XCircle, Info } from 'lucide-react';

interface QueryResultsTableProps {
    data: Array<{ key: string; value: string; operation?: string; timestamp?: string }>;
    success: boolean;
    message: string;
    rowsAffected: number;
}

export default function QueryResultsTable({
    data,
    success,
    message,
    rowsAffected,
}: QueryResultsTableProps) {
    if (!success) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <h4 className="text-sm font-medium text-red-900">Query Failed</h4>
                </div>
                <p className="mt-2 text-sm text-red-700">{message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Status and Summary */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-900">Query Executed Successfully</span>
                </div>
                {rowsAffected > 0 && (
                    <div className="text-sm text-gray-500">
                        {rowsAffected} row{rowsAffected !== 1 ? 's' : ''} affected
                    </div>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-700">{message}</span>
                    </div>
                </div>
            )}

            {/* Results Table */}
            {data.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Key
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Operation / Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                                            {row.key}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.value}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.operation === 'Inserted' ? 'bg-green-100 text-green-800' :
                                                row.operation === 'Updated' ? 'bg-blue-100 text-blue-800' :
                                                    row.operation === 'Deleted' ? 'bg-red-100 text-red-800' :
                                                        row.operation === 'Retrieved' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {row.operation || 'Executed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.timestamp ? <span suppressHydrationWarning>{new Date(row.timestamp).toLocaleString()}</span> : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* No Results */}
            {data.length === 0 && rowsAffected === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                    <div className="text-gray-400 mb-2">
                        <Info className="h-8 w-8 mx-auto" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No Results</h3>
                    <p className="text-sm text-gray-500">
                        The query executed successfully but returned no data.
                    </p>
                </div>
            )}

            {/* Results Summary */}
            <div className="text-sm text-gray-500">
                {data.length > 0 ? (
                    <span>Returned {data.length} result{data.length !== 1 ? 's' : ''}</span>
                ) : (
                    <span>Query completed with no data returned</span>
                )}
            </div>
        </div>
    );
}
