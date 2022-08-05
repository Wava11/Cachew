export const milliseconds = (ms: number) =>
    new Promise<void>(res => setTimeout(res, ms));