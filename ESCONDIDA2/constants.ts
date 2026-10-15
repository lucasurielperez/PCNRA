import {SpriteConfig} from './utils/helper';

/**
 * Visual Theme settings for Escondite Cubo
 */
export const THEME = {
  fontFamily: "'Fredoka', 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif",
  primaryColor: '#f59e0b',
  secondaryColor: '#3b82f6',
  accentGreen: '#10b981',
  accentPink: '#ec4899',
  cardBg: '#1e293b',
  boardBg: '#0f172a',
  borderRadius: '1.25rem',
};

/**
 * Configuration for the game.
 */
export const CONFIG = {
  // --- Game Metadata ---
  title: {
    value: 'Escondite Cubo',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1376,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 768,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },

  // --- System Constants for Stepper ---
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // --- Gameplay Rules & Tuning ---
  roundObjectCount: {
    value: 4,
    type: 'number',
    label: 'Objects per Round',
    group: 'Rules',
  },
  peekIntervalSeconds: {
    value: 3.0,
    type: 'number',
    label: 'Peek Interval (Seconds)',
    group: 'Rules',
  },
  clueDelaySeconds: {
    value: 10.0,
    type: 'number',
    label: 'Clue Delay (Seconds)',
    group: 'Rules',
  },
  characterSpeed: {
    value: 380,
    type: 'number',
    label: 'Character Run Speed',
    group: 'Rules',
  },
  freezeCooldownSeconds: {
    value: 5.0,
    type: 'number',
    label: 'Freeze Cooldown (Seconds)',
    group: 'Rules',
  },
  pointsPerFind: {
    value: 100,
    type: 'number',
    label: 'Points per Round',
    group: 'Rules',
  },
  enablePeeking: {
    value: true,
    type: 'boolean',
    label: 'Enable Character Peeking',
    group: 'Rules',
  },

  // --- Audio Settings ---
  defaultMusicVolume: {
    value: 0.5,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.7,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // --- Theme / Visuals ---
  backgroundColor: {
    value: '#7dd3fc',
    type: 'color',
    label: 'Sky Fallback Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#f59e0b',
    type: 'color',
    label: 'Primary Accent Color',
    group: 'THEME',
  },
  fontFamily: {
    value: "'Fredoka', 'Nunito', 'Segoe UI', system-ui, sans-serif",
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // --- Asset Dimensions & Aspect Ratios (from read_assets_metadata) ---
  bgPlayfieldAspectRatio: {
    value: 1.791666667, // 1376x768
    type: 'number',
    label: 'Playfield BG Aspect Ratio',
    group: 'ASSETS',
  },
  bgPlayfieldWidth: {
    value: 1376,
    type: 'number',
    label: 'Playfield BG Width',
    group: 'ASSETS',
  },
  bgPlayfieldHeight: {
    value: 768,
    type: 'number',
    label: 'Playfield BG Height',
    group: 'ASSETS',
  },

  // Objects Aspect Ratios
  objBrickHouseAspectRatio: {
    value: 0.97687, // 718x735
    type: 'number',
    label: 'Brick House Aspect Ratio',
    group: 'ASSETS',
  },
  objToyRocketAspectRatio: {
    value: 1.05735, // 719x680
    type: 'number',
    label: 'Toy Rocket Aspect Ratio',
    group: 'ASSETS',
  },
  objHayBaleAspectRatio: {
    value: 1.00764, // 791x785
    type: 'number',
    label: 'Hay Bale Aspect Ratio',
    group: 'ASSETS',
  },
  objCampingTentAspectRatio: {
    value: 1.2276, // 836x681
    type: 'number',
    label: 'Camping Tent Aspect Ratio',
    group: 'ASSETS',
  },
  objGiantMushroomAspectRatio: {
    value: 0.9576, // 746x779
    type: 'number',
    label: 'Giant Mushroom Aspect Ratio',
    group: 'ASSETS',
  },
  objToyChestAspectRatio: {
    value: 1.03596, // 749x723
    type: 'number',
    label: 'Toy Chest Aspect Ratio',
    group: 'ASSETS',
  },
  objEnchantedTreeAspectRatio: {
    value: 0.7617, // 617x810
    type: 'number',
    label: 'Enchanted Tree Aspect Ratio',
    group: 'ASSETS',
  },
  objWoodenBarrelAspectRatio: {
    value: 0.8128, // 595x732
    type: 'number',
    label: 'Wooden Barrel Aspect Ratio',
    group: 'ASSETS',
  },
  charDinoBlockAspectRatio: {
    value: 1.0728, // 545x508
    type: 'number',
    label: 'Dino Block Aspect Ratio',
    group: 'ASSETS',
  },
  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

/**
 * Object definitions with rich bilingual metadata and color tags
 */
export interface HidingObjectDef {
  id: string;
  nameEs: string;
  nameEn: string;
  aspectRatioKey: ConfigKey;
  colors: {
    primary: {nameEs: string; nameEn: string; hex: string};
    secondary: {nameEs: string; nameEn: string; hex: string};
  };
}

export const HIDING_OBJECTS: HidingObjectDef[] = [
  {
    id: 'obj_brick_house',
    nameEs: 'Casa de Ladrillo',
    nameEn: 'Brick House',
    aspectRatioKey: 'objBrickHouseAspectRatio',
    colors: {
      primary: {nameEs: 'Naranja Ladrillo', nameEn: 'Brick Orange', hex: '#d85d38'},
      secondary: {nameEs: 'Gris Cemento', nameEn: 'Cement Gray', hex: '#5e6b7c'},
    },
  },
  {
    id: 'obj_toy_rocket',
    nameEs: 'Cohete de Juguete',
    nameEn: 'Toy Rocket',
    aspectRatioKey: 'objToyRocketAspectRatio',
    colors: {
      primary: {nameEs: 'Blanco Lunar', nameEn: 'Lunar White', hex: '#f0f4f8'},
      secondary: {nameEs: 'Azul Cielo', nameEn: 'Sky Blue', hex: '#45b7e8'},
    },
  },
  {
    id: 'obj_hay_bale',
    nameEs: 'Fardo de Heno',
    nameEn: 'Hay Bale',
    aspectRatioKey: 'objHayBaleAspectRatio',
    colors: {
      primary: {nameEs: 'Amarillo Trigo', nameEn: 'Wheat Yellow', hex: '#f5ca38'},
      secondary: {nameEs: 'Marrón Tostado', nameEn: 'Toasted Brown', hex: '#9a5f27'},
    },
  },
  {
    id: 'obj_camping_tent',
    nameEs: 'Tienda de Campaña',
    nameEn: 'Camping Tent',
    aspectRatioKey: 'objCampingTentAspectRatio',
    colors: {
      primary: {nameEs: 'Verde Esmeralda', nameEn: 'Emerald Green', hex: '#0f8b5f'},
      secondary: {nameEs: 'Amarillo Mostaza', nameEn: 'Mustard Yellow', hex: '#deb135'},
    },
  },
  {
    id: 'obj_giant_mushroom',
    nameEs: 'Hongo Gigante',
    nameEn: 'Giant Mushroom',
    aspectRatioKey: 'objGiantMushroomAspectRatio',
    colors: {
      primary: {nameEs: 'Rojo Carmesí', nameEn: 'Crimson Red', hex: '#e33434'},
      secondary: {nameEs: 'Blanco Nieve', nameEn: 'Snow White', hex: '#ffffff'},
    },
  },
  {
    id: 'obj_toy_chest',
    nameEs: 'Cofre de Juguetes',
    nameEn: 'Toy Chest',
    aspectRatioKey: 'objToyChestAspectRatio',
    colors: {
      primary: {nameEs: 'Azul Real', nameEn: 'Royal Blue', hex: '#2952b2'},
      secondary: {nameEs: 'Oro Brillante', nameEn: 'Bright Gold', hex: '#f4be22'},
    },
  },
  {
    id: 'obj_enchanted_tree',
    nameEs: 'Árbol Frondoso',
    nameEn: 'Lush Tree',
    aspectRatioKey: 'objEnchantedTreeAspectRatio',
    colors: {
      primary: {nameEs: 'Verde Pino', nameEn: 'Pine Green', hex: '#2d8a4e'},
      secondary: {nameEs: 'Café Roble', nameEn: 'Oak Brown', hex: '#7c4b27'},
    },
  },
  {
    id: 'obj_wooden_barrel',
    nameEs: 'Barril Rústico',
    nameEn: 'Wooden Barrel',
    aspectRatioKey: 'objWoodenBarrelAspectRatio',
    colors: {
      primary: {nameEs: 'Madera Caoba', nameEn: 'Mahogany Wood', hex: '#864123'},
      secondary: {nameEs: 'Hierro Metálico', nameEn: 'Metallic Iron', hex: '#4c5462'},
    },
  },
];

export interface CharacterDef {
  id: string;
  nameEs: string;
  nameEn: string;
  type: 'spritesheet' | 'static';
  idleKey: string;
  runKey?: string;
  jumpKey?: string;
  aspectRatioKey?: ConfigKey;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'cubito',
    nameEs: 'Cubito el Explorador',
    nameEn: 'Cubito Explorer',
    type: 'spritesheet',
    idleKey: 'char_cubito_explorer_idle',
    runKey: 'char_cubito_explorer_run',
    jumpKey: 'char_cubito_explorer_jump',
  },
  {
    id: 'robo',
    nameEs: 'Robo-Bloque',
    nameEn: 'Robo Block',
    type: 'spritesheet',
    idleKey: 'char_robo_block_idle',
    runKey: 'char_robo_block_run',
    jumpKey: 'char_robo_block_jump',
  },
  {
    id: 'cat',
    nameEs: 'Gatito Pixel',
    nameEn: 'Pixel Kitty',
    type: 'spritesheet',
    idleKey: 'char_pixel_cat_quad_idle',
    runKey: 'char_pixel_cat_quad_running',
    jumpKey: 'char_pixel_cat_quad_jump',
  },
  {
    id: 'dino',
    nameEs: 'Dino-Cubo',
    nameEn: 'Dino Block',
    type: 'static',
    idleKey: 'char_dino_block',
    aspectRatioKey: 'charDinoBlockAspectRatio',
  },
];
