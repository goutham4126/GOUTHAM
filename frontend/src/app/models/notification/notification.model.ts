export interface NotificationMessage {
    id: number;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}
