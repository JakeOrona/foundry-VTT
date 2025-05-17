import { TrapConfig, TriggerType } from './types';

/**
 * Type declarations for module's global namespace
 */
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

// This line exports an empty object to make this file a module
export {};