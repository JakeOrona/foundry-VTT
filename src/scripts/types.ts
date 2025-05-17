// src/scripts/types.ts
/**
 * Type definitions for the trap macros system
 */

export interface TrapConfig {
    id: string;
    name: string;
    description: string;
    triggerType: TriggerType;
    visible: boolean;
    savingThrow?: SavingThrowConfig;
    damage?: DamageConfig;
    effects?: EffectConfig[];
    tokenImagePath?: string;
    detectionDC?: number;
    disarmDC?: number;
    oneTimeUse?: boolean;
    triggered?: boolean;
}

export enum TriggerType {
    STEP = "step",         // Triggered when stepped on
    INTERACT = "interact", // Triggered when interacted with
    PROXIMITY = "proximity", // Triggered when a token gets close
    TIMER = "timer"        // Triggered after a specified time
}

export interface SavingThrowConfig {
    type: string;          // "dex", "con", etc.
    dc: number;
    successMultiplier?: number; // Damage multiplier on success (e.g., 0.5 for half damage)
    failureMultiplier?: number; // Damage multiplier on failure (usually 1.0)
}

export interface DamageConfig {
    formula: string;       // e.g., "2d6+3"
    type: string;          // e.g., "fire", "piercing", "cold"
}

export interface EffectConfig {
    name: string;
    duration: number;      // Duration in rounds
    icon: string;          // Path to icon
    changes?: EffectChange[];
}

export interface EffectChange {
    key: string;
    value: any;
    mode: number;
}

export interface TrapTriggerResult {
    success: boolean;
    message: string;
    damage?: number;
    savingThrowResult?: SavingThrowResult;
}

export interface SavingThrowResult {
    roll: number;
    dc: number;
    success: boolean;
}

// Socket message types
export interface TrapSocketMessage {
    action: string;
    userId: string;
    data: any;
}

// Declare global API
declare global {
    interface Game {
        trapMacros: {
            api: {
                trapManager: any;
                createIcePitTrap: Function;
                createPressureDartTrap: Function;
            }
        }
    }
}