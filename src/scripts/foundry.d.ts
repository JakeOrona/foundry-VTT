// src/scripts/foundry.d.ts
// Simple type declarations for Foundry VTT's global objects

declare const game: any;
declare const canvas: any;
declare const Hooks: any;
declare const Dialog: any;
declare const ui: any;
declare const ChatMessage: any;
declare const Roll: any;
declare const Macro: any;
declare const CONST: any;

declare namespace PIXI {
    class Sprite {
        width: number;
        height: number;
        alpha: number;
        position: {
            set: (x: number, y: number) => void;
        };
        parent: any;
        constructor(texture: any);
    }
    
    namespace Texture {
        function from(path: string): any;
    }
    
    interface InteractionEvent {
        data: {
            global: {
                x: number;
                y: number;
            };
            origin: {
                x: number;
                y: number;
            };
        };
    }
}

// Declare these to avoid TypeScript errors
type Token = any;
type Actor = any;
type SceneControl = any;
type Scene = any;