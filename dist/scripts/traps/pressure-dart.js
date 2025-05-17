// src/scripts/traps/pressure-dart.ts
import { TriggerType } from '../types';
import { log, randomInt } from '../utils/logger';
/**
 * Create a Pressure Pad Dart trap
 */
export function createPressureDartTrap(options) {
    const id = options.id || `pressure-dart-${Date.now()}`;
    const name = options.name || 'Pressure Pad Dart';
    const poisoned = options.poisoned !== undefined ? options.poisoned : true;
    const effects = poisoned ? [
        {
            name: 'Poisoned',
            duration: 3,
            icon: 'icons/svg/poison.svg'
        }
    ] : [];
    return {
        id,
        name,
        description: `A hidden pressure plate that shoots ${poisoned ? 'poisoned ' : ''}darts when stepped on.`,
        triggerType: TriggerType.STEP,
        visible: false,
        savingThrow: {
            type: 'dex',
            dc: options.dc || 12,
            successMultiplier: 0 // No damage on successful save
        },
        damage: {
            formula: options.damage || '1d4 + 2',
            type: 'piercing'
        },
        effects,
        tokenImagePath: 'icons/svg/trap.svg',
        detectionDC: options.detectionDC || 16,
        disarmDC: options.disarmDC || 14,
        oneTimeUse: false // Dart traps can fire multiple times
    };
}
/**
 * Add special behavior for pressure dart traps
 * This function will be called when a pressure dart trap is triggered
 */
export async function handlePressureDartTrigger(trap, victimToken, victimActor, damage, saveSuccess) {
    const tokenCenter = {
        x: victimToken.x + (victimToken.width * canvas.grid.size) / 2,
        y: victimToken.y + (victimToken.height * canvas.grid.size) / 2
    };
    // Determine direction of dart (from nearest wall)
    const sceneWidth = canvas.dimensions?.width || 1000;
    const sceneHeight = canvas.dimensions?.height || 1000;
    // Calculate distances to edges
    const distToLeft = tokenCenter.x;
    const distToRight = sceneWidth - tokenCenter.x;
    const distToTop = tokenCenter.y;
    const distToBottom = sceneHeight - tokenCenter.y;
    // Find closest edge
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    let dartDirection;
    if (minDist === distToLeft)
        dartDirection = 'right'; // Dart comes from left
    else if (minDist === distToRight)
        dartDirection = 'left'; // Dart comes from right
    else if (minDist === distToTop)
        dartDirection = 'bottom'; // Dart comes from top
    else
        dartDirection = 'top'; // Dart comes from bottom
    // Create dart firing effect
    if (game.modules.get('sequencer')?.active) {
        // If Sequencer module is available, create a nice effect
        // @ts-ignore
        let seq = new Sequencer.Sequence()
            .effect()
            .file('modules/jb2a_patreon/Library/Generic/Weapon_Attacks/Ranged/Arrow01_01_Regular_Green_30ft_1600x400.webm');
        // Position based on direction
        const distance = 600; // How far away to start the dart
        let startPos;
        switch (dartDirection) {
            case 'left':
                startPos = { x: tokenCenter.x + distance, y: tokenCenter.y };
                seq.atLocation(startPos).stretchTo(tokenCenter);
                break;
            case 'right':
                startPos = { x: tokenCenter.x - distance, y: tokenCenter.y };
                seq.atLocation(startPos).stretchTo(tokenCenter);
                break;
            case 'top':
                startPos = { x: tokenCenter.x, y: tokenCenter.y + distance };
                seq.atLocation(startPos).stretchTo(tokenCenter);
                break;
            case 'bottom':
                startPos = { x: tokenCenter.x, y: tokenCenter.y - distance };
                seq.atLocation(startPos).stretchTo(tokenCenter);
                break;
        }
        seq.play();
        // Add hit or miss effect
        if (!saveSuccess) {
            // Hit effect
            // @ts-ignore
            new Sequencer.Sequence()
                .effect()
                .file('modules/jb2a_patreon/Library/Generic/Impact/Impact_01_Regular_Green_400x400.webm')
                .atLocation(tokenCenter)
                .scale(0.5)
                .delay(500) // Delay to sync with arrow
                .play();
        }
    }
    else {
        // Fallback without Sequencer
        canvas.interface?.createScrollingText(tokenCenter, saveSuccess ? 'DODGE!' : 'HIT!', {
            anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
            fontSize: 36,
            fill: saveSuccess ? '#88ff88' : '#ff8888'
        });
    }
    // Create custom chat message
    let messageContent;
    if (saveSuccess) {
        messageContent = `
            <div class="pressure-dart-message">
                <h3>Pressure Pad Dart Trap!</h3>
                <p>A dart shoots out from a hidden nozzle as ${victimActor.name} steps on a pressure plate!</p>
                <p>${victimActor.name} deftly dodges out of the way.</p>
            </div>
        `;
    }
    else {
        const isPoisoned = trap.effects?.some(e => e.name === "Poisoned");
        messageContent = `
            <div class="pressure-dart-message">
                <h3>Pressure Pad Dart Trap!</h3>
                <p>A dart shoots out from a hidden nozzle as ${victimActor.name} steps on a pressure plate!</p>
                <p>${victimActor.name} takes ${damage} piercing damage from the dart${isPoisoned ? ' and is poisoned' : ''}.</p>
            </div>
        `;
    }
    await ChatMessage.create({
        content: messageContent,
        speaker: ChatMessage.getSpeaker({ alias: trap.name }),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    log(`Pressure Dart trap triggered on ${victimActor.name}`);
    // If the trap is multiple use, simulate reloading after random delay
    if (game.user?.isGM) {
        setTimeout(() => {
            ChatMessage.create({
                content: `<p><em>*click*</em> The pressure dart trap resets.</p>`,
                speaker: ChatMessage.getSpeaker({ alias: trap.name }),
                whisper: game.users?.filter(u => u.isGM) || []
            });
        }, randomInt(8000, 15000)); // 8-15 second delay
    }
}
// Register the trap handler
Hooks.on('trapMacros.pressureDartTrigger', handlePressureDartTrigger);
