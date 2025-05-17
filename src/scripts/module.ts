// src/scripts/module.ts
import { TrapManager } from './trap-manager';
import { createIcePitTrap } from './traps/ice-pit';
import { createPressureDartTrap } from './traps/pressure-dart';
import { registerSettings } from './settings';
import { log } from './utils/logger';
import './game-types'; // Import the game types

// Module ID
const MODULE_ID = 'trap-macros';

// Create trap manager instance
let trapManager: TrapManager;

/**
 * Initialize the module
 */
Hooks.once('init', () => {
    log('Initializing Trap Macros module');
    
    // Register module settings
    registerSettings();
    
    // Register API for external access
    (game as any).trapMacros = {
        api: {
            // These will be properly initialized in the ready hook
            trapManager: null,
            createIcePitTrap,
            createPressureDartTrap
        }
    };
});

/**
 * Ready hook - called when Foundry is fully loaded
 */
Hooks.once('ready', () => {
    log('Trap Macros module ready');
    
    // Create trap manager
    trapManager = new TrapManager();
    
    // Update API
    (game as any).trapMacros.api.trapManager = trapManager;
    
    // Register token controls
    registerTrapControls();
});

/**
 * Register trap controls in the token toolbar
 */
function registerTrapControls() {
    Hooks.on('getSceneControlButtons', (controls: any[]) => {
        if (!(game.user as any)?.isGM) return;
        
        // Find the token controls
        const tokenControls = controls.find(c => c.name === 'token');
        if (!tokenControls) return;
        
        // Add a trap button to the token controls
        tokenControls.tools.push({
            name: 'placeTrap',
            title: 'Place Trap',
            icon: 'fas fa-bomb',
            visible: true,
            onClick: showPlaceTrapDialog,
            button: true
        });
    });
}

/**
 * Show the dialog for placing a trap
 */
function showPlaceTrapDialog() {
    new (Dialog as any)({
        title: 'Place Trap',
        content: `
            <form>
                <div class="form-group">
                    <label>Trap Type:</label>
                    <select name="trapType">
                        <option value="ice-pit">Ice Pit</option>
                        <option value="pressure-dart">Pressure Pad Dart</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" name="trapName">
                </div>
                <div class="form-group">
                    <label>Save DC:</label>
                    <input type="number" name="saveDC" value="15">
                </div>
                <div class="form-group">
                    <label>Damage:</label>
                    <input type="text" name="damage" value="2d6">
                </div>
            </form>
        `,
        buttons: {
            place: {
                label: 'Place Trap',
                callback: async (html: JQuery) => {
                    const trapType = html.find('[name="trapType"]').val() as string;
                    const trapName = html.find('[name="trapName"]').val()?.toString() || 
                        (trapType === 'ice-pit' ? 'Ice Pit' : 'Pressure Pad Dart');
                    const saveDC = parseInt(html.find('[name="saveDC"]').val()?.toString() || "15") || 15;
                    const damage = html.find('[name="damage"]').val()?.toString() || '2d6';
                    
                    // Use canvas interaction to place the trap
                    const placeTrap = async (event: any) => {
                        if (!(canvas as any).grid) return;
                        
                        // Get position from event
                        const position = (canvas as any).grid.getSnappedPosition(event.data.origin.x, event.data.origin.y);
                        
                        // Create trap config based on type
                        let trap;
                        if (trapType === 'ice-pit') {
                            trap = createIcePitTrap({
                                name: trapName,
                                dc: saveDC,
                                damage
                            });
                        } else {
                            trap = createPressureDartTrap({
                                name: trapName,
                                dc: saveDC,
                                damage
                            });
                        }
                        
                        // Register the trap
                        (game as any).trapMacros.api.trapManager.registerTrap(trap);
                        
                        // Create the token
                        await (canvas as any).scene?.createEmbeddedDocuments('Token', [{
                            name: trap.id,
                            x: position.x,
                            y: position.y,
                            img: trap.tokenImagePath,
                            width: 1,
                            height: 1,
                            hidden: true,
                            flags: {
                                'trap-macros': {
                                    trapId: trap.id
                                }
                            }
                        }]);
                        
                        // Deactivate the listener
                        (canvas as any).app.renderer.plugins.interaction.off('pointerdown', placeTrap);
                        (canvas as any).stage.off('mousemove', preview);
                        
                        // Remove preview
                        if (trapPreview && trapPreview.parent) {
                            trapPreview.parent.removeChild(trapPreview);
                        }
                        
                        (ui as any).notifications?.info(`${trapName} trap placed!`);
                    };
                    
                    // Preview function for showing trap position
                    let trapPreview: any = null;
                    const preview = (event: any) => {
                        if (!trapPreview) {
                            trapPreview = new (PIXI as any).Sprite((PIXI as any).Texture.from(
                                trapType === 'ice-pit' ? 'icons/svg/ice-aura.svg' : 'icons/svg/trap.svg'
                            ));
                            trapPreview.width = trapPreview.height = (canvas as any).grid?.size || 50;
                            trapPreview.alpha = 0.5;
                            (canvas as any).stage.addChild(trapPreview);
                        }
                        
                        if ((canvas as any).grid) {
                            const pos = (canvas as any).grid.getSnappedPosition(event.data.global.x, event.data.global.y);
                            trapPreview.position.set(pos.x, pos.y);
                        }
                    };
                    
                    // Activate the listener
                    (canvas as any).app.renderer.plugins.interaction.once('pointerdown', placeTrap);
                    (canvas as any).stage.on('mousemove', preview);
                }
            },
            cancel: {
                label: 'Cancel'
            }
        }
    }).render(true);
}