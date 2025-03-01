export interface Job {
    id: number;
    execute: (arg: any) => Promise<void>;
    arg: any;
}
