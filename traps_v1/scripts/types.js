// src/scripts/types.ts
/**
 * Type definitions for the trap macros system
 */
export var TriggerType;
(function (TriggerType) {
    TriggerType["STEP"] = "step";
    TriggerType["INTERACT"] = "interact";
    TriggerType["PROXIMITY"] = "proximity";
    TriggerType["TIMER"] = "timer"; // Triggered after a specified time
})(TriggerType || (TriggerType = {}));
