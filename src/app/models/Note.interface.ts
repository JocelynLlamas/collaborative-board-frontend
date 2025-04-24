export interface Note {
    id?: string;
    connectionId?: string;
    text: string;
    x: number;
    y: number;
    color: string;
    createdAt?: Date;
    updatedAt?: Date;
}
