// src/scripts/trap-manager.ts
import { 
    TrapConfig, 
    TrapTriggerResult, 
    TriggerType, 
    SavingThrowResult 
} from './types';
import { log, error, warn } from './utils/logger';

/**
 * Main class for managing traps
 */
export class TrapManager {
    private traps: Map<string, TrapConfig> = new Map();
    private initialized: boolean = false;
    
    constructor() {
        this.initialize();
    }
    
    /**
     * Initialize the trap manager
     */
    private initialize(): void {
        // Register hooks
        Hooks.once('ready', this.onReady.bind(this));
        
        // Register token movement hook for step triggers
        Hooks.on('updateToken', this.onTokenMove.bind(this));
        
        // Register socket for multi-user support
        if (game.socket) {
            game.socket.on('module.trap-macros', this.onSocketMessage.bind(this));
        }
    }
    
    /**
     * Ready hook - called when Foundry is fully loaded
     */
    private onReady(): void {
        log('Trap Manager Ready');
        
        // Load saved traps from settings
        this.loadTraps();
        
        // Create default traps if none exist
        if (this.traps.size === 0) {
            this.createDefaultTraps();
        }
        
        // Create macros
        this.createMacros();
        
        this.initialized = true;
        log(`Loaded ${this.traps.size} traps`);
    }
    
    /**
     * Socket message handler
     */
    private onSocketMessage(message: any): void {
        if (!message || !message.action) return;
        
        switch (message.action) {
            case 'triggerTrap':
                if (game.user?.isGM) {
                    this.triggerTrap(message.data.trapId, message.data.tokenId);
                }
                break;
        }
    }
    
    /**
     * Handle token movement to check for step triggers
     */
    private onTokenMove(token: Token, changes: any): void {
        // Only process if position changed
        if (!changes.x && !changes.y) return;
        
        // Get token position
        const position = {
            x: changes.x ?? token.x,
            y: changes.y ?? token.y
        };
        
        // Check if token stepped on any traps
        this.checkStepTriggers(token, position);
    }
    
    /**
     * Check if token stepped on any traps
     */
    private checkStepTriggers(token: Token, position: {x: number, y: number}): void {
        // Only proceed if we're the GM
        if (!game.user?.isGM) return;
        
        // Get all step triggers
        for (const [id, trap] of this.traps.entries()) {
            if (trap.triggerType !== TriggerType.STEP || trap.triggered) continue;
            
            // Get trap token if it exists
            const trapToken = this.findTrapToken(trap);
            if (!trapToken) continue;
            
            // Check if token is on trap
            const tokenIsOnTrap = this.isTokenOnTrap(token, trapToken);
            if (tokenIsOnTrap) {
                // Trigger the trap
                this.triggerTrap(id, token.id);
            }
        }
    }
    
    /**
     * Check if a token is on a trap
     */
    private isTokenOnTrap(token: Token, trapToken: Token): boolean {
        // Simple overlap check
        const tokenPos = {
            x: token.x,
            y: token.y,
            width: token.width * canvas.grid.size,
            height: token.height * canvas.grid.size
        };
        
        const trapPos = {
            x: trapToken.x,
            y: trapToken.y,
            width: trapToken.width * canvas.grid.size,
            height: trapToken.height * canvas.grid.size
        };
        
        return !(
            tokenPos.x > trapPos.x + trapPos.width ||
            tokenPos.x + tokenPos.width < trapPos.x ||
            tokenPos.y > trapPos.y + trapPos.height ||
            tokenPos.y + tokenPos.height < trapPos.y
        );
    }
    
    /**
     * Find a token for a trap
     */
    private findTrapToken(trap: TrapConfig): Token | null {
        if (!canvas.tokens) return null;
        
        const tokens = canvas.tokens.placeables || [];
        return tokens.find(t => t.name === trap.id || t.document.getFlag('trap-macros', 'trapId') === trap.id) || null;
    }
    
    /**
     * Load traps from settings
     */
    private loadTraps(): void {
        try {
            const savedTraps = game.settings.get('trap-macros', 'savedTraps');
            if (savedTraps) {
                const trapData = JSON.parse(savedTraps);
                trapData.forEach((trap: TrapConfig) => {
                    this.traps.set(trap.id, trap);
                });
            }
        } catch (e) {
            error('Error loading saved traps:', e);
        }
    }
    
    /**
     * Save traps to settings
     */
    private saveTraps(): void {
        try {
            const trapData = Array.from(this.traps.values());
            game.settings.set('trap-macros', 'savedTraps', JSON.stringify(trapData));
        } catch (e) {
            error('Error saving traps:', e);
        }
    }
    
    /**
     * Create default macros
     */
    private createMacros(): void {
        // Create a macro for triggering traps
        const macroName = 'TriggerTrap';
        const existingMacro = game.macros?.find(m => m.name === macroName);
        
        if (!existingMacro && game.user?.isGM) {
            Macro.create({
                name: macroName,
                type: 'script',
                img: 'icons/svg/trap.svg',
                command: `
// Trigger a trap by ID
// Example: game.trapMacros.api.triggerTrap('ice-pit');

// Get selected token
const token = canvas.tokens.controlled[0];
if (!token) {
    ui.notifications.error('Please select a token to trigger the trap on.');
    return;
}

// Show trap selector dialog
const trapIds = Array.from(game.trapMacros.api.trapManager.getTraps().keys());
const content = \`
    <form>
        <div class="form-group">
            <label>Select Trap:</label>
            <select name="trapId">
                \${trapIds.map(id => \`<option value="\${id}">\${game.trapMacros.api.trapManager.getTrap(id).name}</option>\`).join('')}
            </select>
        </div>
    </form>
\`;

new Dialog({
    title: 'Trigger Trap',
    content,
    buttons: {
        trigger: {
            label: 'Trigger',
            callback: (html) => {
                const trapId = html.find('[name="trapId"]').val();
                game.trapMacros.api.triggerTrap(trapId, token.id);
            }
        },
        cancel: {
            label: 'Cancel'
        }
    }
}).render(true);`
            });
        }
    }
    
    /**
     * Create default traps
     */
    private createDefaultTraps(): void {
        // Default traps will be created by the specific trap modules
        // This is intentionally left empty
    }
    
    /**
     * Register a new trap
     */
    public registerTrap(config: TrapConfig): void {
        this.traps.set(config.id, config);
        this.saveTraps();
        log(`Registered trap: ${config.name} (${config.id})`);
    }
    
    /**
     * Get a trap by ID
     */
    public getTrap(id: string): TrapConfig | undefined {
        return this.traps.get(id);
    }
    
    /**
     * Get all registered traps
     */
    public getTraps(): Map<string, TrapConfig> {
        return this.traps;
    }
    
    /**
     * Trigger a trap by ID
     */
    public async triggerTrap(trapId: string, tokenId?: string): Promise<TrapTriggerResult> {
        // Get the trap
        const trap = this.traps.get(trapId);
        if (!trap) {
            return {
                success: false,
                message: `Trap with ID ${trapId} not found`
            };
        }
        
        // Check if one-time use and already triggered
        if (trap.oneTimeUse && trap.triggered) {
            return {
                success: false,
                message: `${trap.name} has already been triggered`
            };
        }
        
        // Get the victim token
        let victimToken: Token | null = null;
        if (tokenId && canvas.tokens) {
            victimToken = canvas.tokens.placeables.find(t => t.id === tokenId) || null;
        } else if (canvas.tokens?.controlled.length) {
            victimToken = canvas.tokens.controlled[0];
        }
        
        if (!victimToken) {
            return {
                success: false,
                message: 'No victim token specified or selected'
            };
        }
        
        // Get the victim actor
        const victimActor = victimToken.actor;
        if (!victimActor) {
            return {
                success: false,
                message: 'No actor associated with victim token'
            };
        }
        
        // Mark as triggered if one-time use
        if (trap.oneTimeUse) {
            trap.triggered = true;
            this.saveTraps();
        }
        
        // Show the trap
        if (!trap.visible) {
            const trapToken = this.findTrapToken(trap);
            if (trapToken) {
                await trapToken.document.update({ hidden: false });
            }
        }
        
        // Announce the trap
        await ChatMessage.create({
            content: `<h3>${trap.name} Triggered!</h3><p>${trap.description}</p><p>${victimActor.name} has triggered a trap!</p>`,
            speaker: ChatMessage.getSpeaker({ alias: trap.name })
        });
        
        // Handle damage
        let damage = 0;
        let savingThrowResult: SavingThrowResult | undefined;
        
        if (trap.damage) {
            // Roll damage
            const damageRoll = await new Roll(trap.damage.formula).evaluate({ async: true });
            damage = damageRoll.total;
            
            // Show damage roll
            await damageRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ alias: trap.name }),
                flavor: `${trap.damage.type} damage from ${trap.name}`
            });
            
            // Handle saving throw if applicable
            if (trap.savingThrow) {
                savingThrowResult = await this.handleSavingThrow(victimActor, trap, damage);
                damage = savingThrowResult.success ? 
                    Math.floor(damage * (trap.savingThrow.successMultiplier || 0.5)) : 
                    damage;
            }
            
            // Apply damage
            this.applyDamage(victimActor, damage, trap.damage.type);
        }
        
        // Apply effects
        if (trap.effects && trap.effects.length > 0) {
            await this.applyEffects(victimActor, trap.effects);
        }
        
        // Call trap-specific handlers if they exist
        const trapTypeId = trapId.split('-')[0];
        Hooks.callAll(`trapMacros.${trapTypeId}Trigger`, trap, victimToken, victimActor, damage, savingThrowResult?.success);
        
        return {
            success: true,
            message: `${trap.name} triggered successfully on ${victimActor.name}`,
            damage,
            savingThrowResult
        };
    }
    
    /**
     * Handle saving throw for a trap
     */
    private async handleSavingThrow(actor: Actor, trap: TrapConfig, damage: number): Promise<SavingThrowResult> {
        if (!trap.savingThrow) {
            return { roll: 0, dc: 0, success: false };
        }
        
        const dc = trap.savingThrow.dc;
        const saveType = trap.savingThrow.type;
        
        // System-specific saving throw handling
        let rollFormula = `1d20`;
        let saveModifier = 0;
        
        // Handle different game systems
        if (game.system.id === 'dnd5e') {
            // D&D 5e saving throw
            const saveData = actor.getRollData().abilities[saveType]?.save || 0;
            saveModifier = saveData;
            rollFormula = `1d20 + ${saveModifier}`;
        } else if (game.system.id === 'pf2e') {
            // Pathfinder 2e saving throw
            const saveData = actor.getRollData().saves[saveType]?.totalModifier || 0;
            saveModifier = saveData;
            rollFormula = `1d20 + ${saveModifier}`;
        }
        
        // Roll the save
        const saveRoll = await new Roll(rollFormula).evaluate({ async: true });
        const total = saveRoll.total;
        const success = total >= dc;
        
        // Show save result
        const saveResult = success ? 'Success' : 'Failure';
        const saveDamage = success ? 
            Math.floor(damage * (trap.savingThrow.successMultiplier || 0.5)) : 
            damage;
        
        await ChatMessage.create({
            content: `
                <h3>${trap.name} - Saving Throw</h3>
                <p>${actor.name} must make a DC ${dc} ${saveType.toUpperCase()} saving throw.</p>
                <p>Roll: ${total} (${saveResult})</p>
                <p>${actor.name} takes ${saveDamage} damage.</p>
            `,
            speaker: ChatMessage.getSpeaker({ alias: trap.name })
        });
        
        return {
            roll: total,
            dc,
            success
        };
    }
    
    /**
     * Apply damage to an actor
     */
    private applyDamage(actor: Actor, amount: number, type: string): void {
        if (amount <= 0) return;
        
        // System-specific damage application
        if (game.system.id === 'dnd5e' && actor.applyDamage) {
            actor.applyDamage(amount, 1); // 1 = normal damage
        } else if (game.system.id === 'pf2e' && actor.applyDamage) {
            actor.applyDamage(amount, { type });
        } else {
            // Generic approach - just subtract from HP if available
            const hp = actor.data.data.attributes?.hp;
            if (hp && typeof hp.value === 'number') {
                actor.update({
                    'data.attributes.hp.value': Math.max(0, hp.value - amount)
                });
            }
        }
    }
    
    /**
     * Apply status effects to an actor
     */
    private async applyEffects(actor: Actor, effects: any[]): Promise<void> {
        // System-specific effect application
        if (game.system.id === 'dnd5e') {
            for (const effect of effects) {
                await actor.createEmbeddedDocuments('ActiveEffect', [{
                    label: effect.name,
                    icon: effect.icon,
                    duration: {
                        rounds: effect.duration
                    }
                }]);
            }
        } else if (game.system.id === 'pf2e') {
            // PF2e uses a different approach
            for (const effect of effects) {
                await actor.createEmbeddedDocuments('Effect', [{
                    name: effect.name,
                    img: effect.icon,
                    duration: {
                        unit: 'rounds',
                        value: effect.duration
                    }
                }]);
            }
        }
    }
}