
export interface DrawPoint {
    connectionId?: string;
    x: number;
    y: number;
    color: string;
    size: number;
    isNewLine: boolean;
    timestamp?: Date;
}