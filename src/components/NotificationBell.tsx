import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService } from "@/lib/notification-service";
import { Notification } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const [notifsRes, countRes] = await Promise.all([
                notificationService.getNotifications(20, 0),
                notificationService.getUnreadCount()
            ]);
            if (notifsRes.success && notifsRes.data) {
                setNotifications(notifsRes.data);
            }
            if (countRes.success && countRes.count !== undefined) {
                setUnreadCount(countRes.count);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            fetchNotifications();
        }
    };

    const handleMarkRead = async (id: string) => {
        const res = await notificationService.markRead(id);
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleMarkAllRead = async () => {
        const res = await notificationService.markAllRead();
        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-accent rounded-full text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-auto py-1 px-2">
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notif) => (
                                <div key={notif.id} className={cn("p-4 transition-colors hover:bg-muted/50 flex gap-3", notif.is_read === 0 ? "bg-muted/30" : "")}>
                                    <div className="mt-1">
                                        {notif.type === 'budget_alert' ? (
                                            <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />
                                        ) : notif.is_read === 0 ? (
                                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                                        ) : <div className="w-2" />}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-none">{notif.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {notif.is_read === 0 && (
                                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }} title="Mark as read">
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
