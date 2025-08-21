import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
    blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-500',
        title: 'text-blue-900',
        value: 'text-blue-700',
    },
    green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-500',
        title: 'text-green-900',
        value: 'text-green-700',
    },
    purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-500',
        title: 'text-purple-900',
        value: 'text-purple-700',
    },
    orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-500',
        title: 'text-orange-900',
        value: 'text-orange-700',
    },
    red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500',
        title: 'text-red-900',
        value: 'text-red-700',
    },
};

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
    const colors = colorClasses[color];

    return (
        <div className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
            <div className="flex items-center space-x-3">
                <div className={`${colors.icon} p-2 rounded-lg bg-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-medium ${colors.title}`}>{title}</p>
                    <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}
