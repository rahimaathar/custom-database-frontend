import { useState, useRef, useEffect } from 'react';
import { Play, Save, RotateCcw, Zap, HelpCircle } from 'lucide-react';

interface QueryEditorProps {
    onExecute: (query: string) => void;
    isLoading?: boolean;
    placeholder?: string;
}

const QUERY_EXAMPLES = [
    {
        name: 'Insert Data',
        query: 'INSERT INTO data VALUES ("user:123", "John Doe")',
        description: 'Insert a new key-value pair'
    },
    {
        name: 'Get Data',
        query: 'GET "user:123"',
        description: 'Retrieve a value by key'
    },
    {
        name: 'Select All',
        query: 'SELECT * FROM data',
        description: 'Retrieve all data'
    },
    {
        name: 'Delete Data',
        query: 'DELETE FROM data WHERE key = "user:123"',
        description: 'Delete a key-value pair'
    },
    {
        name: 'Update Data',
        query: 'UPDATE data SET value = "Jane Doe" WHERE key = "user:123"',
        description: 'Update an existing value'
    }
];

export default function QueryEditor({ onExecute, isLoading = false, placeholder }: QueryEditorProps) {
    const [query, setQuery] = useState('');
    const [showExamples, setShowExamples] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onExecute(query.trim());
        }
    };

    const handleExampleClick = (exampleQuery: string) => {
        setQuery(exampleQuery);
        setShowExamples(false);
        // Focus the textarea after setting the query
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 100);
    };

    const handleClear = () => {
        setQuery('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl+Enter to execute
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (query.trim()) {
                onExecute(query.trim());
            }
        }
        // Tab to indent
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.currentTarget as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newQuery = query.substring(0, start) + '  ' + query.substring(end);
            setQuery(newQuery);
            // Set cursor position after tab
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 2;
            }, 0);
        }
    };

    return (
        <div className="space-y-4">
            {/* Query Input */}
            <div className="relative">
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                    SQL Query Editor
                    <span className="text-xs text-gray-500 ml-2">(Ctrl+Enter to execute)</span>
                </label>

                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        id="query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Enter your SQL query here...\nExamples:\nINSERT INTO data VALUES ('key', 'value')\nGET 'key'\nSELECT * FROM data\nDELETE FROM data WHERE key = 'key'"}
                        className="textarea font-mono text-sm min-h-[120px] resize-none"
                        disabled={isLoading}
                    />

                    {/* Character count */}
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {query.length} chars
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || !query.trim()}
                        className="btn-primary btn-md"
                    >
                        {isLoading ? (
                            <div className="spinner w-4 h-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        <span>Execute Query</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleClear}
                        className="btn-outline btn-md"
                        disabled={isLoading}
                    >
                        <RotateCcw className="h-4 w-4" />
                        <span>Clear</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowExamples(!showExamples)}
                        className="btn-outline btn-md"
                        disabled={isLoading}
                    >
                        <HelpCircle className="h-4 w-4" />
                        <span>Examples</span>
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => handleExampleClick('SELECT * FROM data')}
                        className="text-xs text-gray-500 hover:text-primary-600 px-2 py-1 rounded border hover:border-primary-300 transition-colors"
                        disabled={isLoading}
                    >
                        <Zap className="h-3 w-3 inline mr-1" />
                        Quick Select
                    </button>
                </div>
            </div>

            {/* Query Examples */}
            {showExamples && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Query Examples</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {QUERY_EXAMPLES.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => handleExampleClick(example.query)}
                                className="text-left p-3 rounded border border-blue-200 bg-white hover:bg-blue-50 transition-colors"
                                disabled={isLoading}
                            >
                                <div className="font-medium text-blue-900 text-sm">{example.name}</div>
                                <div className="font-mono text-xs text-blue-700 mt-1 break-all">{example.query}</div>
                                <div className="text-xs text-blue-600 mt-1">{example.description}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Query Tips */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Query Tips</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Use <code className="bg-gray-200 px-1 rounded">INSERT INTO data VALUES ("key", "value")</code> to add data</li>
                    <li>• Use <code className="bg-gray-200 px-1 rounded">GET "key"</code> or <code className="bg-gray-200 px-1 rounded">SELECT * FROM data</code> to retrieve data</li>
                    <li>• Use <code className="bg-gray-200 px-1 rounded">DELETE FROM data WHERE key = "key"</code> to remove data</li>
                    <li>• Press <kbd className="bg-white border px-1 rounded text-xs">Ctrl+Enter</kbd> to execute queries quickly</li>
                </ul>
            </div>
        </div>
    );
}


