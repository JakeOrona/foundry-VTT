// src/scripts/settings.ts
import { log } from './utils/logger';
/**
 * Register module settings
 */
export function registerSettings() {
    // Storage for saved traps
    game.settings.register('trap-macros', 'savedTraps', {
        name: 'Saved Traps',
        hint: 'Storage for saved trap configurations',
        scope: 'world',
        config: false,
        type: String,
        default: ''
    });
    // Module settings
    game.settings.register('trap-macros', 'autoRevealTraps', {
        name: 'Auto-Reveal Traps',
        hint: 'Automatically reveal trap tokens when triggered',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register('trap-macros', 'enableProximityTriggers', {
        name: 'Enable Proximity Triggers',
        hint: 'Enable traps to be triggered by proximity',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });
    game.settings.register('trap-macros', 'proximityDistance', {
        name: 'Proximity Trigger Distance',
        hint: 'Distance in grid squares for proximity triggers',
        scope: 'world',
        config: true,
        type: Number,
        default: 1,
        range: {
            min: 1,
            max: 5,
            step: 1
        }
    });
    log('Settings registered');
}
