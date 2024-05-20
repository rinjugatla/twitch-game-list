export const printLog = (message: string) => {
    const today = new Date();
    console.info(`[${today.getFullYear()}/${today.getMonth()}/${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}] ${message}`);
}