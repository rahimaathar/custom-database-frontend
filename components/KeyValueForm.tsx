import { useState } from 'react';
import { Save } from 'lucide-react';

interface KeyValueFormProps {
    onSubmit: (key: string, value: string) => void;
    isLoading?: boolean;
}

export default function KeyValueForm({ onSubmit, isLoading = false }: KeyValueFormProps) {
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim() && value.trim()) {
            onSubmit(key.trim(), value.trim());
            setKey('');
            setValue('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-2">
                        Key
                    </label>
                    <input
                        id="key"
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter key"
                        className="input"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                        Value
                    </label>
                    <input
                        id="value"
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Enter value"
                        className="input"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    type="submit"
                    disabled={isLoading || !key.trim() || !value.trim()}
                    className="btn-primary btn-md"
                >
                    {isLoading ? (
                        <div className="spinner w-4 h-4" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    <span>Insert Data</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setKey('');
                        setValue('');
                    }}
                    className="btn-outline btn-md"
                    disabled={isLoading}
                >
                    Clear
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Examples</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <button
                        type="button"
                        onClick={() => {
                            setKey('user:1');
                            setValue('John Doe');
                        }}
                        className="text-left p-2 rounded hover:bg-blue-100 transition-colors"
                        disabled={isLoading}
                    >
                        <div className="font-medium text-blue-900">User Record</div>
                        <div className="text-blue-700">user:1 → John Doe</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setKey('product:101');
                            setValue('Laptop Computer');
                        }}
                        className="text-left p-2 rounded hover:bg-blue-100 transition-colors"
                        disabled={isLoading}
                    >
                        <div className="font-medium text-blue-900">Product Record</div>
                        <div className="text-blue-700">product:101 → Laptop Computer</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setKey('config:theme');
                            setValue('dark');
                        }}
                        className="text-left p-2 rounded hover:bg-blue-100 transition-colors"
                        disabled={isLoading}
                    >
                        <div className="font-medium text-blue-900">Config Record</div>
                        <div className="text-blue-700">config:theme → dark</div>
                    </button>
                </div>
            </div>
        </form>
    );
}
