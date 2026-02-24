import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
    Bell,
    Check,
    Trash2,
    User as UserIcon,
    Calendar,
    DollarSign,
    Settings,
    Briefcase,
    Loader2,
    CheckCheck,
    ArrowLeft
} from 'lucide-react';

interface Notification {
    _id: string;
    title: string;
    description: string;
    type: 'account' | 'booking' | 'payment' | 'system' | 'partner';
    is_read: boolean;
    created_at: string;
    read_at?: string;
    related_id?: string;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [isOpen, filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/notifications/', {
                params: {
                    unread_only: filter === 'unread',
                    limit: 50
                }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await apiClient.get('/notifications/unread-count');
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await apiClient.put(`/notifications/${notificationId}/read`);
            await fetchNotifications();
            await fetchUnreadCount();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.put('/notifications/read-all');
            await fetchNotifications();
            await fetchUnreadCount();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            await apiClient.delete(`/notifications/${notificationId}`);
            await fetchNotifications();
            await fetchUnreadCount();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications?')) return;

        try {
            await apiClient.delete('/notifications/');
            await fetchNotifications();
            await fetchUnreadCount();
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'account':
                return <UserIcon className="w-5 h-5" />;
            case 'booking':
                return <Calendar className="w-5 h-5" />;
            case 'payment':
                return <DollarSign className="w-5 h-5" />;
            case 'partner':
                return <Briefcase className="w-5 h-5" />;
            case 'system':
                return <Settings className="w-5 h-5" />;
            default:
                return <Bell className="w-5 h-5" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'account':
                return 'from-blue-500 to-cyan-600';
            case 'booking':
                return 'from-blue-500 to-blue-700';
            case 'payment':
                return 'from-purple-500 to-pink-600';
            case 'partner':
                return 'from-amber-500 to-orange-600';
            case 'system':
                return 'from-slate-500 to-slate-600';
            default:
                return 'from-blue-500 to-blue-700';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    if (!isOpen) return null;

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors md:hidden"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hidden md:block">
                        <Bell className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h2>
                        <p className="text-slate-500 text-sm">Stay updated with your latest activity.</p>
                    </div>
                </div>

            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                {/* Filters Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50">
                    <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'all'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'unread'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Unread
                        </button>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex gap-2 self-end sm:self-auto">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark All Read
                                </button>
                            )}
                            <button
                                onClick={handleDeleteAll}
                                className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                            <p className="text-slate-500 text-sm">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-100">
                                <Bell className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No notifications</h3>
                            <p className="text-slate-500 max-w-xs">
                                {filter === 'unread'
                                    ? "You're all caught up! No unread notifications to show."
                                    : "You don't have any notifications at the moment."}
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`group p-4 rounded-2xl border transition-all relative ${!notification.is_read
                                    ? 'bg-blue-50/50 border-green-200/50 hover:bg-blue-50'
                                    : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    {/* Icon */}
                                    <div
                                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getNotificationColor(
                                            notification.type
                                        )} flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0 mt-1`}
                                    >
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <h4 className={`font-bold text-base ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                                                {notification.title}
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification._id);
                                                            }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white border border-slate-200"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(notification._id);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-white border border-slate-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-500 leading-relaxed mb-1 max-w-2xl">
                                            {notification.description}
                                        </p>
                                    </div>

                                    {/* Unread Indicator Dot */}
                                    {!notification.is_read && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full sm:hidden" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div >
    );
};

export default NotificationPanel;
