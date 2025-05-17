# Trap Macros for Foundry VTT

![](https://img.shields.io/badge/Foundry-v10+-informational)

A TypeScript module for creating and managing trap macros in Foundry VTT.

## Features

- Easy creation and management of traps
- Multiple trap types included:
  - **Ice Pit**: Hidden pit covered with a thin layer of ice
  - **Pressure Pad Dart**: Hidden pressure plate that shoots darts
- Automatic trigger detection when tokens step on traps
- Saving throws with configurable DCs
- Damage application with configurable formulas
- Status effects application
- Visual and audio effects (with compatible modules)
- Integration with Trigger Happy module (optional)

## Installation

### Method 1: Install via Foundry VTT

1. In Foundry VTT, go to the "Add-on Modules" tab
2. Click "Install Module"
3. Search for "Trap Macros" or paste the manifest URL:
   `https://github.com/JakeOrona/foundry-VTT/releases/latest/download/module.json`
4. Click "Install"

### Method 2: Manual Installation

1. Download the latest release from the [Releases page](https://github.com/JakeOrona/foundry-VTT/releases)
2. Extract the ZIP file
3. Copy the extracted folder to your Foundry VTT `Data/modules/` directory
4. Restart Foundry VTT if it's running

## Usage

### Creating Traps

1. Enable the "Trap Macros" module in your world
2. In the scene controls, click on the token tool
3. Click the "Place Trap" button that appears in the toolbar
4. Select a trap type, configure its properties, and click "Place Trap"
5. Click on the canvas to place the trap

### Using Built-in Trap Types

#### Ice Pit Trap

The Ice Pit trap is a hidden pit covered with a thin layer of ice. When a creature steps on it, the ice breaks and they fall in, taking cold damage and becoming prone and slowed.

- **Trigger Type**: Step (activates when stepped on)
- **Saving Throw**: Dexterity (default DC 15)
- **Damage**: Cold (default 2d6)
- **Effects**: Prone (1 round), Slowed (2 rounds)
- **One-Time Use**: Yes (breaks after use)

#### Pressure Pad Dart Trap

The Pressure Pad Dart trap is a hidden pressure plate that shoots poisoned darts when stepped on.

- **Trigger Type**: Step (activates when stepped on)
- **Saving Throw**: Dexterity (default DC 12)
- **Damage**: Piercing (default 1d4+2)
- **Effects**: Poisoned (3 rounds)
- **One-Time Use**: No (can be triggered multiple times)

### Triggering Traps Manually

You can trigger traps manually using:

1. The built-in "TriggerTrap" macro (created automatically)
2. Direct API calls in your own macros

```javascript
// Trigger a trap by ID on the selected token
game.trapMacros.api.triggerTrap('ice-pit');
```

### Creating Custom Traps from Macros

Create custom traps using the API:

```javascript
// Create a custom Ice Pit trap
const icePit = game.trapMacros.api.createIcePitTrap({
    name: 'Deep Ice Pit',
    dc: 18,
    damage: '3d6'
});

// Register the trap
game.trapMacros.api.trapManager.registerTrap(icePit);
```

## API Reference

The module exposes its API through `game.trapMacros.api`:

- `trapManager`: The main trap manager instance
  - `registerTrap(config)`: Register a new trap
  - `triggerTrap(trapId, tokenId?)`: Trigger a trap
  - `getTrap(id)`: Get a trap by ID
  - `getTraps()`: Get all registered traps
- `createIcePitTrap(options)`: Create a new Ice Pit trap
- `createPressureDartTrap(options)`: Create a new Pressure Pad Dart trap

## Compatibility

- Foundry VTT v10+
- Compatible with D&D 5e and Pathfinder 2e (with system-specific adaptations)
- Enhanced functionality with:
  - Sequencer module (for visual effects)
  - JB2A modules (for animated effects)
  - Trigger Happy module (for advanced triggers)

## License

This module is licensed under the MIT License. See the LICENSE file for details.

## Credits

- Created by Jake Orona
- Based on the Foundry VTT TypeScript Template
- Icons from Game-Icons.net