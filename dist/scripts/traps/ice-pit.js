// src/scripts/traps/ice-pit.ts
import { TriggerType } from '../types';
import { log } from '../utils/logger';
/**
 * Create an Ice Pit trap
 */
export function createIcePitTrap(options) {
    const id = options.id || `ice-pit-${Date.now()}`;
    const name = options.name || 'Ice Pit';
    const effects = [
        {
            name: 'Prone',
            duration: 1,
            icon: 'icons/svg/falling.svg'
        },
        {
            name: 'Slowed',
            duration: 2,
            icon: 'icons/svg/snowflake.svg'
        }
    ];
    return {
        id,
        name,
        description: 'A hidden pit covered with a thin layer of ice that breaks when stepped on.',
        triggerType: TriggerType.STEP,
        visible: false,
        savingThrow: {
            type: 'dex',
            dc: options.dc || 15,
            successMultiplier: 0.5 // Half damage on successful save
        },
        damage: {
            formula: options.damage || '2d6',
            type: 'cold'
        },
        effects,
        tokenImagePath: 'icons/svg/ice-aura.svg',
        detectionDC: options.detectionDC || 14,
        disarmDC: options.disarmDC || 16,
        oneTimeUse: true // Ice pits break after use
    };
}
/**
 * Add special behavior for ice pit traps
 * This function will be called when an ice pit trap is triggered
 */
export async function handleIcePitTrigger(trap, victimToken, victimActor, damage, saveSuccess) {
    const tokenCenter = {
        x: victimToken.x + (victimToken.width * canvas.grid.size) / 2,
        y: victimToken.y + (victimToken.height * canvas.grid.size) / 2
    };
    // Ice breaking effect
    if (game.modules.get('sequencer')?.active) {
        // If Sequencer module is available, create a nice effect
        // @ts-ignore
        new Sequencer.Sequence()
            .effect()
            .file('modules/jb2a_patreon/Library/Generic/Ice/IceBreak_01_Regular_Blue_600x600.webm')
            .atLocation(tokenCenter)
            .scale(0.8)
            .play();
    }
    else {
        // Fallback without Sequencer
        canvas.interface?.createScrollingText(tokenCenter, 'CRACK!', {
            anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
            fontSize: 36,
            fill: '#88ccff'
        });
    }
    // Create custom chat message
    let messageContent;
    if (saveSuccess) {
        messageContent = `
            <div class="ice-pit-message">
                <h3>Ice Pit Trap!</h3>
                <p>The thin layer of ice cracks beneath ${victimActor.name}'s feet!</p>
                <p>${victimActor.name} manages to catch the edge but still takes ${damage} cold damage.</p>
            </div>
        `;
    }
    else {
        messageContent = `
            <div class="ice-pit-message">
                <h3>Ice Pit Trap!</h3>
                <p>The thin layer of ice cracks beneath ${victimActor.name}'s feet!</p>
                <p>${victimActor.name} falls into the icy pit, taking ${damage} cold damage, falling prone, and becoming slowed by the freezing temperature.</p>
            </div>
        `;
    }
    await ChatMessage.create({
        content: messageContent,
        speaker: ChatMessage.getSpeaker({ alias: trap.name }),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    log(`Ice Pit trap triggered on ${victimActor.name}`);
}
// Register the trap handler
Hooks.on('trapMacros.icePitTrigger', handleIcePitTrigger);
