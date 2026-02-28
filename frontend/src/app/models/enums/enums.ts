export enum ClaimStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Paid = 'Paid'
}

export enum PaymentFrequency {
    Monthly = 'Monthly',
    Quarterly = 'Quarterly',
    Yearly = 'Yearly'
}

export enum PaymentStatus {
    Pending = 'Pending',
    Paid = 'Paid',
    Failed = 'Failed',
    Overdue = 'Overdue'
}

export enum PolicyStatus {
    Active = 'Active',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    Suspended = 'Suspended'
}

export enum UserRole {
    Admin = 'Admin',
    Agent = 'Agent',
    Customer = 'Customer',
    ClaimOfficer = 'ClaimOfficer'
}
