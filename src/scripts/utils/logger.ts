// src/scripts/utils/logger.ts
const MODULE_ID = 'trap-macros';

/**
 * Log a message with the module prefix
 */
export function log(...args: any[]): void {
    console.log(`${MODULE_ID} |`, ...args);
}

/**
 * Log a warning with the module prefix
 */
export function warn(...args: any[]): void {
    console.warn(`${MODULE_ID} |`, ...args);
}

/**
 * Log an error with the module prefix
 */
export function error(...args: any[]): void {
    console.error(`${MODULE_ID} |`, ...args);
}

/**
 * Get a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}