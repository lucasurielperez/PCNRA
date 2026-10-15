// tslint:disable
/* eslint-disable */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Play,
  RotateCw,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  X,
  Check,
  Sparkles,
  Trophy,
  ArrowRight,
  Eye,
  Sliders,
  Home,
  Music,
  Lock,
  Snowflake,
  Shield,
} from 'lucide-react';
import {
  getConfig,
  THEME,
  HIDING_OBJECTS,
  CHARACTERS,
  HidingObjectDef,
  CharacterDef,
} from './constants';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  createFixedStepper,
  drawAsset,
  drawBackground,
  GameState,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  useAssets,
  useAutoFocus,
  useInput,
  useIsMobile,
  gameAudio,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  useRpc,
} from './utils/usePlayground';
import {
  SpriteRenderer,
  SpriteActionConfig,
  SpriteAnimationState,
} from './SpriteRenderer';

const BACKGROUND_MUSIC_URL = './assets/audio/bgm_playful_hideout.mp3';

const ASSETS_MANIFEST: Record<string, string> = {
  bg_playfield: './assets/images/bg_playfield.png',
  obj_brick_house: './assets/images/obj_brick_house.png',
  obj_toy_rocket: './assets/images/obj_toy_rocket.png',
  obj_hay_bale: './assets/images/obj_hay_bale.png',
  obj_camping_tent: './assets/images/obj_camping_tent.png',
  obj_giant_mushroom: './assets/images/obj_giant_mushroom.png',
  obj_toy_chest: './assets/images/obj_toy_chest.png',
  obj_enchanted_tree: './assets/images/obj_enchanted_tree.png',
  obj_wooden_barrel: './assets/images/obj_wooden_barrel.png',
  char_dino_block: './assets/images/char_dino_block.png',
  char_cubito_explorer_idle: './assets/images/char_cubito_explorer_idle.png',
  char_cubito_explorer_run: './assets/images/char_cubito_explorer_run.png',
  char_cubito_explorer_jump: './assets/images/char_cubito_explorer_jump.png',
  char_robo_block_idle: './assets/images/char_robo_block_idle.png',
  char_robo_block_run: './assets/images/char_robo_block_run.png',
  char_robo_block_jump: './assets/images/char_robo_block_jump.png',
  char_pixel_cat_quad_idle: './assets/images/char_pixel_cat_quad_idle.png',
  char_pixel_cat_quad_running: './assets/images/char_pixel_cat_quad_running.png',
  char_pixel_cat_quad_jump: './assets/images/char_pixel_cat_quad_jump.png',
};

// Spritesheet configs for animated characters
const SPRITE_CONFIGS: Record<string, Record<string, SpriteActionConfig>> = {
  cubito: {
    idle: {
      imageUrl: 'char_cubito_explorer_idle',
      totalFrames: 4,
      frameWidth: 512,
      frameHeight: 512,
      fps: 6,
      loop: true,
    },
    run: {
      imageUrl: 'char_cubito_explorer_run',
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true,
    },
    jump: {
      imageUrl: 'char_cubito_explorer_jump',
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true,
    },
  },
  robo: {
    idle: {
      imageUrl: 'char_robo_block_idle',
      totalFrames: 4,
      frameWidth: 512,
      frameHeight: 512,
      fps: 6,
      loop: true,
    },
    run: {
      imageUrl: 'char_robo_block_run',
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true,
    },
    jump: {
      imageUrl: 'char_robo_block_jump',
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true,
    },
  },
  cat: {
    idle: {
      imageUrl: 'char_pixel_cat_quad_idle',
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 8,
      loop: true,
    },
    run: {
      imageUrl: 'char_pixel_cat_quad_running',
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true,
    },
    jump: {
      imageUrl: 'char_pixel_cat_quad_jump',
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true,
    },
  },
};

interface PlacedObject {
  def: HidingObjectDef;
  x: number;
  y: number;
  w: number;
  h: number;
  baseY: number;
  shakeTimer: number;
  bounceTimer: number;
  isCorrect: boolean;
  revealed: boolean;
  hover: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'square' | 'circle' | 'star' | 'crystal' | 'snowflake';
}

interface AdminSettings {
  lang: 'es' | 'en';
  objectCount: number;
  freezeCooldown: number;
  enabledObjects: Record<string, boolean>;
  enabledCharacters: Record<string, boolean>;
}

const DEFAULT_SETTINGS: AdminSettings = {
  lang: 'es',
  objectCount: 4,
  freezeCooldown: 5.0,
  enabledObjects: HIDING_OBJECTS.reduce(
    (acc, obj) => ({...acc, [obj.id]: true}),
    {},
  ),
  enabledCharacters: CHARACTERS.reduce(
    (acc, char) => ({...acc, [char.id]: true}),
    {},
  ),
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const isMobile = useIsMobile();

  // --- PLAYGROUND SDK INTEGRATION ---
  const {sdk} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // --- ASSETS ---
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // --- Audio State ---
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  // --- Menu / Admin / Tutorial Modals ---
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // --- Persistent Admin Settings ---
  const [settings, setSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem('escondite_cubo_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {...DEFAULT_SETTINGS, ...parsed};
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const saveSettings = (newSettings: AdminSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(
        'escondite_cubo_settings',
        JSON.stringify(newSettings),
      );
    } catch (e) {
      // ignore
    }
  };

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    roundsCompleted: 0,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Clue display state for HUD
  const [clueVisible, setClueVisible] = useState(false);
  const [currentClueObject, setCurrentClueObject] =
    useState<HidingObjectDef | null>(null);

  // Round Winner feedback overlay
  const [foundBannerVisible, setFoundBannerVisible] = useState(false);
  const [foundCharacterName, setFoundCharacterName] = useState('');

  // Live Freeze status for HUD
  const [freezeRemaining, setFreezeRemaining] = useState(0);

  // Sprites Renderers Cache
  const spriteRenderersRef = useRef<Record<string, SpriteRenderer>>({});
  if (Object.keys(spriteRenderersRef.current).length === 0) {
    Object.entries(SPRITE_CONFIGS).forEach(([key, configs]) => {
      spriteRenderersRef.current[key] = new SpriteRenderer(configs);
    });
  }

  // --- Simulation Refs (High frequency 60fps state) ---
  const roundStateRef = useRef<{
    phase: 'HIDING' | 'CELEBRATING' | 'ROUND_OVER';
    character: CharacterDef;
    targetObjectDef: HidingObjectDef;
    charAnimState: SpriteAnimationState;
    charX: number;
    charY: number;
    charW: number;
    charH: number;
    charStartPos: {x: number; y: number};
    charTargetPos: {x: number; y: number};
    charProgress: number;
    charFlipX: boolean;
    charBouncePhase: number;
    hideTimer: number;
    peekTimer: number;
    peekInterval: number;
    peekCount: number;
    currentPeek: {
      active: boolean;
      type: 'TOP' | 'LEFT' | 'RIGHT';
      duration: number;
      progress: number;
      peekPercent: number;
    };
    celebrationTimer: number;
    freezeTimer: number;
    freezeDuration: number;
    frozenShake: number;
    ambientSnowTimer: number;
    objects: PlacedObject[];
    particles: Particle[];
    missPuffs: {x: number; y: number; timer: number}[];
    timeInRound: number;
  }>({
    phase: 'HIDING',
    character: CHARACTERS[0],
    targetObjectDef: HIDING_OBJECTS[0],
    charAnimState: {currentAction: 'idle', currentFrame: 0, timer: 0},
    charX: canvasWidth / 2 - 60,
    charY: canvasHeight - 200,
    charW: 120,
    charH: 120,
    charStartPos: {x: canvasWidth / 2 - 60, y: canvasHeight - 200},
    charTargetPos: {x: 0, y: 0},
    charProgress: 1,
    charFlipX: false,
    charBouncePhase: 0,
    hideTimer: 0,
    peekTimer: 0,
    peekInterval: 3.0,
    peekCount: 0,
    currentPeek: {active: false, type: 'TOP', duration: 1.2, progress: 0, peekPercent: 0},
    celebrationTimer: 0,
    freezeTimer: 0,
    freezeDuration: 5.0,
    frozenShake: 0,
    ambientSnowTimer: 0,
    objects: [],
    particles: [],
    missPuffs: [],
    timeInRound: 0,
  });

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });
  const lastCancelRef = useRef(false);
  const pointerHandledRef = useRef(false);

  // --- Particle Spawners ---
  const spawnConfetti = useCallback(
    (originX: number, originY: number, count = 50) => {
      const colors = [
        '#f59e0b',
        '#ec4899',
        '#3b82f6',
        '#10b981',
        '#8b5cf6',
        '#e11d48',
        '#06b6d4',
        '#facc15',
        '#ffffff',
      ];
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 450;
        newParticles.push({
          x: originX + (Math.random() - 0.5) * 40,
          y: originY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 220,
          size: 8 + Math.random() * 12,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 12,
          alpha: 1,
          life: 0,
          maxLife: 1.8 + Math.random() * 1.2,
          shape: Math.random() > 0.4 ? 'square' : 'star',
        });
      }
      roundStateRef.current.particles.push(...newParticles);
    },
    [],
  );

  const spawnIceBurst = useCallback(
    (originX: number, originY: number, count = 20) => {
      const iceColors = [
        '#ffffff',
        '#e0f2fe',
        '#bae6fd',
        '#7dd3fc',
        '#38bdf8',
        '#0284c7',
        '#a5f3fc',
      ];
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 320;
        newParticles.push({
          x: originX + (Math.random() - 0.5) * 20,
          y: originY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          size: 6 + Math.random() * 14,
          color: iceColors[Math.floor(Math.random() * iceColors.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 10,
          alpha: 1,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.8,
          shape: Math.random() > 0.4 ? 'crystal' : 'snowflake',
        });
      }
      roundStateRef.current.particles.push(...newParticles);
    },
    [],
  );

  const spawnMissPuff = useCallback((x: number, y: number) => {
    roundStateRef.current.missPuffs.push({x, y, timer: 0.6});
  }, []);

  // --- Object Placement Generator ---
  const generateObjectPlacements = useCallback(
    (count: number, activeDefs: HidingObjectDef[]): PlacedObject[] => {
      const clampedCount = Math.max(1, Math.min(count, activeDefs.length));
      // Shuffle active definitions
      const shuffledDefs = [...activeDefs].sort(() => Math.random() - 0.5);
      const chosenDefs = shuffledDefs.slice(0, clampedCount);

      // Distribute along an organic, pleasing layout in playfield ground area
      // Playfield ground is roughly Y 340 to 600
      const placements: PlacedObject[] = [];
      const playXMin = 100;
      const playXMax = canvasWidth - 100;
      const playWidth = playXMax - playXMin;

      // Determine rows/cols
      if (clampedCount === 1) {
        const def = chosenDefs[0];
        const w = 240;
        const h = 240;
        placements.push({
          def,
          x: canvasWidth / 2 - w / 2,
          y: 400,
          w,
          h,
          baseY: 400,
          shakeTimer: 0,
          bounceTimer: 0,
          isCorrect: false,
          revealed: false,
          hover: false,
        });
      } else if (clampedCount <= 4) {
        const spacing = playWidth / clampedCount;
        chosenDefs.forEach((def, i) => {
          const w = 210;
          const h = 210;
          // Stagger Y slightly
          const staggerY = (i % 2) * 50;
          const x = playXMin + spacing * i + (spacing - w) / 2;
          const y = 370 + staggerY;
          placements.push({
            def,
            x,
            y,
            w,
            h,
            baseY: y,
            shakeTimer: 0,
            bounceTimer: 0,
            isCorrect: false,
            revealed: false,
            hover: false,
          });
        });
      } else {
        // 5 to 8 objects: 2 staggered rows (back row and front row)
        const row1Count = Math.ceil(clampedCount / 2);
        const row2Count = clampedCount - row1Count;

        const row1Spacing = playWidth / row1Count;
        for (let i = 0; i < row1Count; i++) {
          const def = chosenDefs[i];
          const w = 180;
          const h = 180;
          const x = playXMin + row1Spacing * i + (row1Spacing - w) / 2;
          const y = 320 + (i % 2) * 30;
          placements.push({
            def,
            x,
            y,
            w,
            h,
            baseY: y,
            shakeTimer: 0,
            bounceTimer: 0,
            isCorrect: false,
            revealed: false,
            hover: false,
          });
        }

        const row2Spacing = playWidth / row2Count;
        for (let i = 0; i < row2Count; i++) {
          const def = chosenDefs[row1Count + i];
          const w = 190;
          const h = 190;
          const x = playXMin + row2Spacing * i + (row2Spacing - w) / 2;
          const y = 460 + (i % 2) * 25;
          placements.push({
            def,
            x,
            y,
            w,
            h,
            baseY: y,
            shakeTimer: 0,
            bounceTimer: 0,
            isCorrect: false,
            revealed: false,
            hover: false,
          });
        }
      }

      return placements;
    },
    [canvasWidth],
  );

  // --- Start a New Round ---
  const startNewRound = useCallback(() => {
    // Filter active objects based on settings
    const activeDefs = HIDING_OBJECTS.filter(
      (o) => settings.enabledObjects[o.id] !== false,
    );
    const validDefs = activeDefs.length > 0 ? activeDefs : HIDING_OBJECTS;

    // Filter enabled characters
    const activeChars = CHARACTERS.filter(
      (c) => settings.enabledCharacters[c.id] !== false,
    );
    const validChars = activeChars.length > 0 ? activeChars : CHARACTERS;

    // Pick random character
    const chosenChar =
      validChars[Math.floor(Math.random() * validChars.length)];

    // Generate placements
    const placedObjs = generateObjectPlacements(
      settings.objectCount,
      validDefs,
    );

    // Pick random target object
    const targetIdx = Math.floor(Math.random() * placedObjs.length);
    placedObjs[targetIdx].isCorrect = true;
    const targetDef = placedObjs[targetIdx].def;

    // Target position directly behind center of target object (instant placement, no running)
    const targetX =
      placedObjs[targetIdx].x +
      placedObjs[targetIdx].w / 2 -
      60;
    const targetY =
      placedObjs[targetIdx].y +
      placedObjs[targetIdx].h / 2 -
      40;

    const peekInterval = (getConfig('peekIntervalSeconds') as number) || 3.0;

    roundStateRef.current = {
      phase: 'HIDING',
      character: chosenChar,
      targetObjectDef: targetDef,
      charAnimState: {
        currentAction: 'idle',
        currentFrame: 0,
        timer: 0,
      },
      charX: targetX,
      charY: targetY,
      charW: 120,
      charH: 120,
      charStartPos: {x: targetX, y: targetY},
      charTargetPos: {x: targetX, y: targetY},
      charProgress: 1,
      charFlipX: false,
      charBouncePhase: 0,
      hideTimer: 0,
      peekTimer: 0,
      peekInterval,
      peekCount: 0,
      currentPeek: {active: false, type: 'TOP', duration: 1.2, progress: 0, peekPercent: 0},
      celebrationTimer: 0,
      freezeTimer: 0,
      freezeDuration: settings.freezeCooldown || 5.0,
      frozenShake: 0,
      ambientSnowTimer: 0,
      objects: placedObjs,
      particles: [],
      missPuffs: [],
      timeInRound: 0,
    };

    setClueVisible(false);
    setCurrentClueObject(targetDef);
    setFoundBannerVisible(false);
    setFreezeRemaining(0);
    setGameState((prev) => ({...prev, status: 'PLAYING'}));

    gameAudio.playRetroJump();
  }, [canvasHeight, canvasWidth, generateObjectPlacements, settings]);

  const initGame = useCallback(() => {
    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
      roundsCompleted: 0,
    });
    startNewRound();
    if (sdk) {
      sdk.startGame();
    }
  }, [sdk, startNewRound]);

  const handleInteractionAt = useCallback(
    (clickX: number, clickY: number) => {
      const round = roundStateRef.current;
      if (round.phase !== 'HIDING') return;

      // Check if user is in frozen state
      if (round.freezeTimer > 0) {
        // Locked / Frozen feedback
        spawnIceBurst(clickX, clickY, 14);
        round.frozenShake = 0.25;
        gameAudio.playShieldBlock();
        return;
      }

      // Initiate Freeze Lock for every touch/click on canvas or objects
      const duration =
        settingsRef.current.freezeCooldown ||
        (getConfig('freezeCooldownSeconds') as number) ||
        5.0;
      round.freezeTimer = duration;
      round.freezeDuration = duration;
      spawnIceBurst(clickX, clickY, 18);

      // Check which object was tapped
      let hitAnyObject = false;
      for (let i = 0; i < round.objects.length; i++) {
        const obj = round.objects[i];
        const padding = 15;
        if (
          clickX >= obj.x - padding &&
          clickX <= obj.x + obj.w + padding &&
          clickY >= obj.y - padding &&
          clickY <= obj.y + obj.h + padding
        ) {
          hitAnyObject = true;
          if (obj.isCorrect) {
            round.phase = 'CELEBRATING';
            round.celebrationTimer = 0;
            round.freezeTimer = 0; // Clear freeze on winning find
            obj.revealed = true;
            obj.bounceTimer = 1.0;

            if (round.character.type === 'spritesheet') {
              round.charAnimState.currentAction = 'jump';
              round.charAnimState.currentFrame = 0;
              round.charAnimState.timer = 0;
            }

            spawnConfetti(obj.x + obj.w / 2, obj.y + obj.h / 2, 70);
            gameAudio.playVictoryFanfare();

            const pts = (getConfig('pointsPerFind') as number) || 100;
            setGameState((prev) => ({
              ...prev,
              score: prev.score + pts,
              roundsCompleted: (prev.roundsCompleted || 0) + 1,
            }));

            const lang = settingsRef.current.lang;
            setFoundCharacterName(
              lang === 'es' ? round.character.nameEs : round.character.nameEn,
            );
            setFoundBannerVisible(true);
          } else {
            if (obj.shakeTimer <= 0) {
              obj.shakeTimer = 0.4;
              spawnMissPuff(obj.x + obj.w / 2, obj.y + obj.h / 2);
              gameAudio.playHoverMicroTone();
            }
          }
          break;
        }
      }

      if (!hitAnyObject) {
        // Tapped empty grass/sky area
        gameAudio.playHoverMicroTone();
      }
    },
    [spawnConfetti, spawnIceBurst, spawnMissPuff],
  );

  // Autoplay handler
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  // Lifecycle reporting
  usePlaygroundGameLifecycle(gameState, sdk);

  // --- Main Update Loop ---
  const update = (deltaTime: number) => {
    if (gameState.status !== 'PLAYING' || isGameMenuOpen || isHowToPlayOpen || isAdminOpen)
      return;

    const round = roundStateRef.current;
    round.timeInRound += deltaTime;

    const clueDelay = (getConfig('clueDelaySeconds') as number) || 10.0;
    if (round.timeInRound >= clueDelay && !clueVisible) {
      setClueVisible(true);
      gameAudio.playPowerupChime();
    }

    // Update object animations (gentle idle sway and shake cooldown)
    round.objects.forEach((obj, idx) => {
      if (obj.shakeTimer > 0) {
        obj.shakeTimer = Math.max(0, obj.shakeTimer - deltaTime);
      }
      if (obj.bounceTimer > 0) {
        obj.bounceTimer = Math.max(0, obj.bounceTimer - deltaTime);
      }
    });

    // Update Freeze Cooldown & Shake
    if (round.freezeTimer > 0) {
      round.freezeTimer = Math.max(0, round.freezeTimer - deltaTime);
      setFreezeRemaining(round.freezeTimer);

      // Spawn ambient drifting snowflakes while frozen
      round.ambientSnowTimer += deltaTime;
      if (round.ambientSnowTimer >= 0.08) {
        round.ambientSnowTimer = 0;
        const snowColors = ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc'];
        round.particles.push({
          x: Math.random() * canvasWidth,
          y: -10,
          vx: (Math.random() - 0.5) * 40,
          vy: 60 + Math.random() * 80,
          size: 4 + Math.random() * 8,
          color: snowColors[Math.floor(Math.random() * snowColors.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 4,
          alpha: 0.8,
          life: 0,
          maxLife: 4.0,
          shape: Math.random() > 0.5 ? 'snowflake' : 'crystal',
        });
      }
    } else if (freezeRemaining > 0) {
      setFreezeRemaining(0);
    }

    if (round.frozenShake > 0) {
      round.frozenShake = Math.max(0, round.frozenShake - deltaTime);
    }

    // Update particles
    for (let i = round.particles.length - 1; i >= 0; i--) {
      const p = round.particles[i];
      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        round.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      if (p.shape === 'square' || p.shape === 'star') {
        p.vy += 320 * deltaTime; // gravity for confetti
      } else {
        p.vy += 40 * deltaTime; // soft drift for frost
      }
      p.rotation += p.vRot * deltaTime;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }

    // Update miss puffs
    for (let i = round.missPuffs.length - 1; i >= 0; i--) {
      const puff = round.missPuffs[i];
      puff.timer -= deltaTime;
      if (puff.timer <= 0) {
        round.missPuffs.splice(i, 1);
      }
    }

    // ----------------------------------------------------
    // PHASE 2: HIDING (100% hidden for first 10s, then progressive +1% peeks)
    // ----------------------------------------------------
    if (round.phase === 'HIDING') {
      round.hideTimer += deltaTime;
      const peekingEnabled = getConfig('enablePeeking') as boolean;

      // First 10 seconds of round: 0% visibility, completely concealed.
      // After 10 seconds: begins peeking out with +1% progressive reveal per peek.
      if (peekingEnabled && round.timeInRound >= 10.0) {
        if (!round.currentPeek.active) {
          round.peekTimer += deltaTime;
          if (round.peekTimer >= round.peekInterval) {
            // Trigger a peek!
            round.peekTimer = 0;
            round.peekCount += 1;
            const peekTypes: ('TOP' | 'LEFT' | 'RIGHT')[] = [
              'TOP',
              'LEFT',
              'RIGHT',
            ];
            const type =
              peekTypes[Math.floor(Math.random() * peekTypes.length)];
            round.currentPeek = {
              active: true,
              type,
              duration: 1.3,
              progress: 0,
              peekPercent: round.peekCount,
            };
            gameAudio.playHoverMicroTone();
          }
        } else {
          // Progress peek animation
          round.currentPeek.progress +=
            deltaTime / round.currentPeek.duration;
          if (round.currentPeek.progress >= 1) {
            round.currentPeek.active = false;
            round.currentPeek.progress = 0;
            round.peekInterval = 2.0 + Math.random() * 2.0; // randomize next peek
          }
        }
      }

      // Advance idle animation
      if (round.character.type === 'spritesheet') {
        const renderer = spriteRenderersRef.current[round.character.id];
        if (renderer) {
          round.charAnimState = renderer.getNextState(
            round.charAnimState,
            deltaTime,
          );
        }
      }

      // ----------------------------------------------------
      // HANDLE INPUT / TAPS ON OBJECTS VIA USEINPUT
      // ----------------------------------------------------
      const input = inputRef.current;
      if (input.pointer.down) {
        if (!pointerHandledRef.current) {
          pointerHandledRef.current = true;
          handleInteractionAt(input.pointer.x, input.pointer.y);
        }
      } else {
        pointerHandledRef.current = false;
      }
    }

    // ----------------------------------------------------
    // PHASE 3: CELEBRATION DANCE & VICTORY
    // ----------------------------------------------------
    else if (round.phase === 'CELEBRATING') {
      round.celebrationTimer += deltaTime;
      round.charBouncePhase += deltaTime * 10;

      // Celebrate sprite animation
      if (round.character.type === 'spritesheet') {
        const renderer = spriteRenderersRef.current[round.character.id];
        if (renderer) {
          round.charAnimState = renderer.getNextState(
            round.charAnimState,
            deltaTime,
          );
        }
      }

      // Continuous sparkles during celebration
      if (Math.random() < 0.25) {
        const targetObj = round.objects.find((o) => o.isCorrect);
        if (targetObj) {
          spawnConfetti(
            targetObj.x + targetObj.w / 2 + (Math.random() - 0.5) * 80,
            targetObj.y - 40,
            4,
          );
        }
      }

      // Auto advance round after ~3.5s if not manually clicked
      if (round.celebrationTimer >= 3.8) {
        startNewRound();
      }
    }
  };

  // --- Main Draw Loop ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    const round = roundStateRef.current;

    // Optional canvas shake when clicking while locked/frozen
    ctx.save();
    if (round.frozenShake > 0) {
      const shakeAmp = (round.frozenShake / 0.25) * 8;
      const sx = (Math.random() - 0.5) * shakeAmp;
      const sy = (Math.random() - 0.5) * shakeAmp;
      ctx.translate(sx, sy);
    }

    // 1. Draw Background
    drawBackground(
      ctx,
      assets['bg_playfield'],
      canvasWidth,
      canvasHeight,
      '#7dd3fc',
    );

    // Helper: Draw Character
    const renderCharacter = (
      cx: number,
      cy: number,
      cw: number,
      ch: number,
      alpha = 1,
      flipX = false,
    ) => {
      ctx.save();
      if (alpha < 1) {
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      }

      // Dino block static rendering with juicy bounce
      if (round.character.type === 'static') {
        const dinoImg = assets[round.character.idleKey];
        const bounceScale =
          round.phase === 'CELEBRATING'
            ? 1 + Math.sin(round.charBouncePhase) * 0.12
            : 1;

        ctx.save();
        ctx.translate(cx + cw / 2, cy + ch / 2);
        if (flipX) ctx.scale(-1, 1);
        ctx.scale(bounceScale, 2 - bounceScale); // squash & stretch

        drawAsset(
          ctx,
          dinoImg,
          -cw / 2,
          -ch / 2,
          cw,
          ch,
          (fctx) => {
            fctx.fillStyle = '#84cc16';
            fctx.beginPath();
            fctx.roundRect(-cw / 2, -ch / 2, cw, ch, 16);
            fctx.fill();
          },
        );
        ctx.restore();
      } else {
        // Spritesheet animated rendering
        const renderer = spriteRenderersRef.current[round.character.id];
        if (renderer) {
          renderer.draw(
            ctx,
            round.charAnimState,
            cx,
            cy,
            cw,
            ch,
            assets,
            flipX,
            alpha,
          );
        }
      }
      ctx.restore();
    };

    // ----------------------------------------------------
    // Draw HIDING PEEKING character (Rendered behind target object with +1% progressive emergence)
    // ----------------------------------------------------
    if (round.phase === 'HIDING') {
      const targetObj = round.objects.find((o) => o.isCorrect);
      if (targetObj && round.currentPeek.active) {
        const p = round.currentPeek;
        // Peek progression curve: 0 -> 1 -> 0 sine wave
        const peekOffsetFactor = Math.sin(p.progress * Math.PI);
        // Each successive peek reveals +1% of body (1st peek = 1%, 2nd peek = 2%, etc.)
        const peekFraction = Math.min(1.0, (p.peekPercent || 1) * 0.01);
        const currentReveal = peekFraction * peekOffsetFactor;

        let peekX = targetObj.x + targetObj.w / 2 - round.charW / 2;
        let peekY = targetObj.y + targetObj.h / 2 - round.charH / 2;

        if (p.type === 'TOP') {
          // Emerge upward from the top edge of the object
          peekY = targetObj.y - round.charH * currentReveal;
          peekX = targetObj.x + targetObj.w / 2 - round.charW / 2;
        } else if (p.type === 'LEFT') {
          // Emerge leftward from the left edge of the object
          peekX = targetObj.x - round.charW * currentReveal;
          peekY = targetObj.y + targetObj.h / 2 - round.charH / 2;
        } else if (p.type === 'RIGHT') {
          // Emerge rightward from the right edge of the object
          peekX = targetObj.x + targetObj.w - round.charW + round.charW * currentReveal;
          peekY = targetObj.y + targetObj.h / 2 - round.charH / 2;
        }

        renderCharacter(
          peekX,
          peekY,
          round.charW,
          round.charH,
          1,
          p.type === 'LEFT',
        );
      }
    }

    // ----------------------------------------------------
    // Draw Placed Hiding Objects
    // ----------------------------------------------------
    round.objects.forEach((obj) => {
      ctx.save();

      // Shake offset for wrong guesses
      let shakeX = 0;
      let shakeY = 0;
      if (obj.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * 18 * (obj.shakeTimer / 0.4);
      }

      // Bounce offset for celebration / reveal
      let bounceScale = 1;
      if (obj.bounceTimer > 0) {
        const bt = 1 - obj.bounceTimer;
        bounceScale = 1 + Math.sin(bt * Math.PI * 3) * 0.15;
      }

      const drawX = obj.x + shakeX;
      const drawY = obj.y + shakeY;

      // Soft ground shadow underneath object
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(
        drawX + obj.w / 2,
        drawY + obj.h - 10,
        obj.w * 0.44,
        18,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Object draw with slight transform scale
      ctx.translate(drawX + obj.w / 2, drawY + obj.h / 2);
      ctx.scale(bounceScale, bounceScale);

      const objImg = assets[obj.def.id];
      drawAsset(
        ctx,
        objImg,
        -obj.w / 2,
        -obj.h / 2,
        obj.w,
        obj.h,
        (fctx) => {
          fctx.fillStyle = obj.def.colors.primary.hex;
          fctx.beginPath();
          fctx.roundRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h, 24);
          fctx.fill();
        },
      );

      // If frozen, draw subtle frosty sheen over object
      if (round.freezeTimer > 0) {
        const frostAlpha = Math.min(0.25, (round.freezeTimer / (round.freezeDuration || 5)) * 0.25);
        ctx.fillStyle = `rgba(186, 230, 253, ${frostAlpha})`;
        ctx.beginPath();
        ctx.roundRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h, 20);
        ctx.fill();
      }

      ctx.restore();
    });

    // ----------------------------------------------------
    // Draw CELEBRATION character jumping out above object!
    // ----------------------------------------------------
    if (round.phase === 'CELEBRATING') {
      const targetObj = round.objects.find((o) => o.isCorrect);
      if (targetObj) {
        const jumpY =
          targetObj.y -
          round.charH * 0.85 -
          Math.abs(Math.sin(round.charBouncePhase)) * 60;
        const jumpX = targetObj.x + targetObj.w / 2 - round.charW / 2;

        renderCharacter(
          jumpX,
          jumpY,
          round.charW,
          round.charH,
          1,
          false,
        );
      }
    }

    // ----------------------------------------------------
    // Draw Miss Pastel Puffs
    // ----------------------------------------------------
    round.missPuffs.forEach((puff) => {
      ctx.save();
      const alpha = Math.max(0, puff.timer / 0.6);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, 35 * (1 - alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ----------------------------------------------------
    // Draw Particles (Confetti, Stars, Ice Crystals, Snowflakes)
    // ----------------------------------------------------
    round.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'star') {
        // 5-point star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            Math.cos(((18 + i * 72) * Math.PI) / 180) * p.size,
            -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.size,
          );
          ctx.lineTo(
            Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 2),
            -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 2),
          );
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'crystal') {
        // Diamond ice shard
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.shape === 'snowflake') {
        // 6-armed snowflake
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI) / 3;
          const cos = Math.cos(angle) * p.size * 0.8;
          const sin = Math.sin(angle) * p.size * 0.8;
          ctx.moveTo(-cos, -sin);
          ctx.lineTo(cos, sin);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // ----------------------------------------------------
    // Draw FROZEN SCREEN EFFECTS (Icy Vignette, Crystals & Frosted Gauge)
    // ----------------------------------------------------
    if (round.freezeTimer > 0 && round.phase === 'HIDING') {
      const freezeFraction = Math.max(
        0,
        Math.min(1, round.freezeTimer / (round.freezeDuration || 5.0)),
      );

      ctx.save();

      // 1. Frosted Screen Border Vignette
      const gradL = ctx.createLinearGradient(0, 0, 70, 0);
      gradL.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradL.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = gradL;
      ctx.fillRect(0, 0, 70, canvasHeight);

      const gradR = ctx.createLinearGradient(canvasWidth, 0, canvasWidth - 70, 0);
      gradR.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradR.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = gradR;
      ctx.fillRect(canvasWidth - 70, 0, 70, canvasHeight);

      const gradT = ctx.createLinearGradient(0, 0, 0, 70);
      gradT.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradT.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = gradT;
      ctx.fillRect(0, 0, canvasWidth, 70);

      const gradB = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - 70);
      gradB.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradB.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = gradB;
      ctx.fillRect(0, canvasHeight - 70, canvasWidth, 70);

      // 2. Corner Ice Crystals
      const drawCornerIce = (cx: number, cy: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = `rgba(224, 242, 254, ${0.75 * freezeFraction})`;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 * freezeFraction})`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(55, 12);
        ctx.lineTo(85, 0);
        ctx.lineTo(55, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(35, 28);
        ctx.lineTo(55, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(35, -28);
        ctx.lineTo(55, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      drawCornerIce(0, 0, Math.PI * 0.25);
      drawCornerIce(canvasWidth, 0, Math.PI * 0.75);
      drawCornerIce(canvasWidth, canvasHeight, -Math.PI * 0.75);
      drawCornerIce(0, canvasHeight, -Math.PI * 0.25);

      // 3. Central Icy Frosted Cooldown Badge / Gauge
      const barW = 320;
      const barH = 46;
      const barX = canvasWidth / 2 - barW / 2;
      const barY = 28;

      // Drop shadow / frosted glow
      ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
      ctx.shadowBlur = 16;

      // Dark frosted glass background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 23);
      ctx.fill();

      // Cyan icy border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Inner cooldown fill bar
      const fillW = Math.max(0, (barW - 12) * freezeFraction);
      const fillGrad = ctx.createLinearGradient(barX + 6, barY + 6, barX + 6 + fillW, barY + 6);
      fillGrad.addColorStop(0, '#0284c7');
      fillGrad.addColorStop(0.5, '#38bdf8');
      fillGrad.addColorStop(1, '#e0f2fe');

      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(barX + 6, barY + 6, fillW, barH - 12, 17);
      ctx.fill();

      // Text label inside the frosted badge
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 16px 'Fredoka', 'Nunito', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label =
        settings.lang === 'es'
          ? `❄️ ¡CONGELADO! ${round.freezeTimer.toFixed(1)}s`
          : `❄️ FROZEN! ${round.freezeTimer.toFixed(1)}s`;
      ctx.fillText(label, canvasWidth / 2, barY + barH / 2);

      ctx.restore();
    }

    ctx.restore(); // Restore shake translation
  };

  // Keep latest loop refs
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      // --- Global Pause Logic ---
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !lastCancelRef.current) {
          if (gameStateRef.current.status === 'PLAYING') {
            setIsGameMenuOpen((prev) => !prev);
          } else if (gameStateRef.current.status === 'START') {
            void exitChat({});
          }
        }
        lastCancelRef.current = cancelPressed;
      }

      stepperRef.current?.(time, (dt) => updateRef.current(dt));

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exitChat]);

  const isMusicPlaying =
    gameState.status === 'PLAYING' && !isMusicMuted && !isGameMenuOpen;

  const startButtonRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-center bg-slate-950 text-white select-none"
      style={{fontFamily: THEME.fontFamily}}>
      {/* Asset Loading Screen */}
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-sky-900 text-white">
          <Sparkles className="w-16 h-16 text-yellow-300 animate-spin mb-4" />
          <h2 className="text-2xl md:text-3xl font-black text-yellow-300">
            Cargando el Escondite...
          </h2>
          <p className="text-sky-200 mt-2">Loading adorable buddies...</p>
        </div>
      )}

      <BackgroundMusic
        url={BACKGROUND_MUSIC_URL}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
      />

      {/* ========================================================================= */}
      {/* TOP HUD BAR (Clean, non-overlapping, high contrast, orientation friendly) */}
      {/* ========================================================================= */}
      <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-700/60 flex items-center justify-between px-3 py-2 z-20 shrink-0">
        {/* Left: Score & Round Level Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full px-3 py-1 text-amber-300 text-xs md:text-sm font-bold shadow-inner">
            <Trophy size={16} className="text-amber-400 shrink-0" />
            <span>
              {settings.lang === 'es' ? 'Puntos' : 'Score'}:{' '}
              <span className="text-amber-200 text-sm md:text-base font-black">
                {gameState.score}
              </span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-sky-500/20 border border-sky-400/40 rounded-full px-3 py-1 text-sky-300 text-xs md:text-sm font-semibold">
            <Sparkles size={15} className="text-sky-400 shrink-0" />
            <span>
              {settings.lang === 'es' ? 'Ronda' : 'Round'}:{' '}
              <span className="text-white font-bold">
                {(gameState.roundsCompleted || 0) + 1}
              </span>
            </span>
          </div>
        </div>

        {/* Center: Live Timed Color Clue Banner */}
        <div className="flex-1 max-w-md mx-2 flex items-center justify-center">
          {clueVisible && currentClueObject ? (
            <div className="animate-bounce bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 p-0.5 rounded-full shadow-lg">
              <div className="bg-slate-900/95 rounded-full px-3 py-1 flex items-center gap-2">
                <Eye size={15} className="text-amber-400 shrink-0 animate-pulse" />
                <span className="text-[11px] md:text-xs font-bold text-yellow-300">
                  {settings.lang === 'es' ? 'Pista:' : 'Clue:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                    style={{
                      backgroundColor:
                        currentClueObject.colors.primary.hex,
                    }}
                  />
                  <span className="text-[10px] md:text-xs font-semibold text-white truncate max-w-[80px] md:max-w-none">
                    {settings.lang === 'es'
                      ? currentClueObject.colors.primary.nameEs
                      : currentClueObject.colors.primary.nameEn}
                  </span>
                  <span className="text-slate-500 text-[10px]">&</span>
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                    style={{
                      backgroundColor:
                        currentClueObject.colors.secondary.hex,
                    }}
                  />
                  <span className="text-[10px] md:text-xs font-semibold text-white truncate max-w-[80px] md:max-w-none">
                    {settings.lang === 'es'
                      ? currentClueObject.colors.secondary.nameEs
                      : currentClueObject.colors.secondary.nameEn}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] md:text-xs text-slate-300 flex items-center gap-1 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
              <Eye size={13} className="text-sky-400" />
              <span>
                {settings.lang === 'es'
                  ? '¡Observa bien dónde se esconden!'
                  : 'Look closely where they hide!'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls & Persistent Game Menu */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsAdminOpen(true);
            }}
            title="Ajustes / Admin"
            className="min-w-[40px] min-h-[40px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 rounded-full border border-slate-700 flex items-center justify-center transition-transform">
            <Sliders size={18} />
          </button>

          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsHowToPlayOpen(true);
            }}
            title="Cómo Jugar / How to play"
            className="min-w-[40px] min-h-[40px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 rounded-full border border-slate-700 flex items-center justify-center transition-transform">
            <HelpCircle size={18} />
          </button>

          {/* Reserved Top-Right Menu Button */}
          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsGameMenuOpen(true);
            }}
            title="Menú"
            className="min-w-[44px] min-h-[44px] px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-full shadow-md flex items-center justify-center gap-1 text-xs md:text-sm transition-transform">
            <span>≡</span>
            <span className="hidden xs:inline">
              {settings.lang === 'es' ? 'Menú' : 'Menu'}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CANVAS PLAYFIELD CONTAINER */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-slate-950">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
            touchAction: 'none',
          }}
          className={`h-auto max-w-full max-h-full drop-shadow-2xl shadow-2xl cursor-pointer select-none ${
            !assetsReady ? 'invisible' : ''
          }`}
        />

        {/* Round Found Banner Overlay Juice */}
        {foundBannerVisible && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce flex flex-col items-center">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 border-2 border-yellow-300 px-6 py-2 rounded-full shadow-2xl flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
              <span className="text-lg md:text-2xl font-black text-white drop-shadow">
                {settings.lang === 'es'
                  ? `¡Encontraste a ${foundCharacterName}!`
                  : `You found ${foundCharacterName}!`}
              </span>
              <span className="bg-yellow-400 text-slate-950 text-xs md:text-sm font-black px-2 py-0.5 rounded-full">
                +{getConfig('pointsPerFind')} pts
              </span>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM ACTION BAR (Optional quick skip/next buttons) */}
      {/* ========================================================================= */}
      <footer className="w-full bg-slate-900/80 border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {isMobile
              ? settings.lang === 'es'
                ? 'Toca un escondite para buscar'
                : 'Tap a hiding spot to search'
              : settings.lang === 'es'
              ? 'Haz clic en un objeto para buscar'
              : 'Click an object to search'}
          </span>
        </div>

        {gameState.status === 'PLAYING' && (
          <button
            onClick={() => {
              gameAudio.playCrispClick();
              startNewRound();
            }}
            className="min-w-[48px] min-h-[36px] px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-yellow-400 font-bold rounded-full border border-slate-700 flex items-center gap-1.5 text-xs transition-transform">
            <span>{settings.lang === 'es' ? 'Siguiente' : 'Next'}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </footer>

      {/* ========================================================================= */}
      {/* START SCREEN OVERLAY */}
      {/* ========================================================================= */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center backdrop-blur">
            <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center mb-4 text-4xl shadow-inner">
              🎁
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-amber-400 mb-2 drop-shadow">
              ESCONDITE CUBO
            </h1>
            <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
              {settings.lang === 'es'
                ? '¡Encuentra a tus tiernos amigos cúbicos que se esconden en la pradera!'
                : 'Find adorable blocky friends hiding across the sunny meadow!'}
            </p>

            <button
              ref={startButtonRef}
              autoFocus
              onClick={() => {
                gameAudio.resume();
                gameAudio.playCrispClick();
                initGame();
              }}
              className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 px-6 py-3 rounded-full font-black text-lg md:text-xl transition-all shadow-lg flex items-center justify-center gap-2 mb-3 cursor-pointer">
              <Play size={22} className="fill-current" />
              {settings.lang === 'es' ? '¡JUGAR AHORA!' : 'PLAY NOW!'}
            </button>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  gameAudio.resume();
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl font-bold text-xs md:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <HelpCircle size={16} />
                {settings.lang === 'es' ? 'Cómo Jugar' : 'How to Play'}
              </button>

              <button
                onClick={() => {
                  gameAudio.resume();
                  gameAudio.playCrispClick();
                  setIsAdminOpen(true);
                }}
                className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs md:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Sliders size={16} />
                {settings.lang === 'es' ? 'Ajustes / Admin' : 'Admin Settings'}
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* MANDATORY GAME MENU OVERLAY (with Independent SFX & Music toggles) */}
      {/* ========================================================================= */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-3xl font-black text-amber-400 mb-6 flex items-center gap-2">
              <span>🎮</span>
              <span>{settings.lang === 'es' ? 'Menú del Juego' : 'Game Menu'}</span>
            </h2>

            <div className="w-full flex flex-col gap-3 mb-6">
              {/* Resume Button */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                }}
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base transition-transform">
                <Play size={20} className="fill-current" />
                {settings.lang === 'es' ? 'Reanudar' : 'Resume'}
              </button>

              {/* Independent Audio Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  }}
                  className={`min-h-[48px] px-3 py-2 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors ${
                    isSfxMuted
                      ? 'bg-red-900/40 border-red-700 text-red-300'
                      : 'bg-slate-800 border-slate-700 text-emerald-400'
                  }`}>
                  {isSfxMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  <span>SFX: {isSfxMuted ? 'Off' : 'On'}</span>
                </button>

                <button
                  onClick={() => setIsMusicMuted((prev) => !prev)}
                  className={`min-h-[48px] px-3 py-2 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors ${
                    isMusicMuted
                      ? 'bg-red-900/40 border-red-700 text-red-300'
                      : 'bg-slate-800 border-slate-700 text-emerald-400'
                  }`}>
                  <Music size={18} />
                  <span>
                    {settings.lang === 'es' ? 'Música' : 'Music'}:{' '}
                    {isMusicMuted ? 'Off' : 'On'}
                  </span>
                </button>
              </div>

              {/* Restart Round */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  startNewRound();
                }}
                className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-yellow-300 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-transform">
                <RotateCw size={18} />
                {settings.lang === 'es'
                  ? 'Reiniciar Ronda Actual'
                  : 'Restart Current Round'}
              </button>

              {/* How to Play Guide */}
              <button
                onClick={() => setIsHowToPlayOpen(true)}
                className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-transform">
                <HelpCircle size={18} />
                {settings.lang === 'es' ? 'Cómo Jugar' : 'How to Play'}
              </button>

              {/* Quit to Main Menu */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  setGameState((prev) => ({...prev, status: 'START'}));
                }}
                className="w-full min-h-[48px] bg-rose-900/50 hover:bg-rose-900 text-rose-200 font-bold rounded-xl border border-rose-800 flex items-center justify-center gap-2 text-sm transition-colors">
                <Home size={18} />
                {settings.lang === 'es' ? 'Volver al Inicio' : 'Quit to Title'}
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* HOW TO PLAY GUIDE OVERLAY */}
      {/* ========================================================================= */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={70}>
          <div className="w-full max-w-md bg-slate-900 border-2 border-sky-500 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-black text-sky-400 flex items-center gap-2">
                <HelpCircle size={24} />
                {settings.lang === 'es' ? 'Cómo Jugar' : 'How to Play'}
              </h2>
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 mb-6 text-left w-full">
              <div className="flex gap-3 items-start bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 text-xl">
                  🎁
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    {settings.lang === 'es'
                      ? '1. Ya está oculto'
                      : '1. Instantly Hidden'}
                  </h3>
                  <p>
                    {settings.lang === 'es'
                      ? 'Tu amigo cúbico ya está escondido detrás de uno de los objetos desde el inicio de la ronda.'
                      : 'Your blocky buddy is secretly hidden behind one of the objects right from the start.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg shrink-0 text-xl">
                  🫣
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    {settings.lang === 'es'
                      ? '2. Asomadas progresivas'
                      : '2. Progressive Peeks'}
                  </h3>
                  <p>
                    {settings.lang === 'es'
                      ? 'Durante los primeros 10 segundos permanece 100% oculto. Luego, ¡se asoma poco a poco (+1% cada vez: 1%, 2%, 3%...) con pistas de color!'
                      : 'For the first 10s they stay 100% concealed. After 10s, they peek out (+1% more each time: 1%, 2%, 3%...) with color clues!'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 text-xl">
                  🎉
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    {settings.lang === 'es'
                      ? '3. Toca y celebra'
                      : '3. Tap to Reveal'}
                  </h3>
                  <p>
                    {settings.lang === 'es'
                      ? 'Toca el objeto donde crees que está. ¡Si fallas no pierdes nada, sigue explorando hasta encontrarlo!'
                      : 'Tap the hiding object to celebrate with confetti and stars. No stress, explore freely!'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsHowToPlayOpen(false)}
              className="w-full min-h-[48px] bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-base shadow-md transition-colors">
              {settings.lang === 'es' ? '¡Entendido!' : 'Got it!'}
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* ADMIN / SETTINGS DRAWER OVERLAY */}
      {/* ========================================================================= */}
      {isAdminOpen && (
        <MenuOverlay tone="neutral" zIndex={80}>
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
                <Sliders size={22} />
                {settings.lang === 'es'
                  ? 'Panel de Ajustes'
                  : 'Admin & Settings'}
              </h2>
              <button
                onClick={() => setIsAdminOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="w-full space-y-5 text-left text-xs md:text-sm mb-6 max-h-[60vh] overflow-y-auto pr-1">
              {/* Language Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  {settings.lang === 'es' ? 'Idioma / Language' : 'Language'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      saveSettings({...settings, lang: 'es'})
                    }
                    className={`min-h-[44px] py-2 rounded-xl font-bold border transition-colors ${
                      settings.lang === 'es'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                    🇲🇽 Español
                  </button>
                  <button
                    onClick={() =>
                      saveSettings({...settings, lang: 'en'})
                    }
                    className={`min-h-[44px] py-2 rounded-xl font-bold border transition-colors ${
                      settings.lang === 'en'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                    🇺🇸 English
                  </button>
                </div>
              </div>

              {/* Objects Per Round (1 - 8) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-bold">
                    {settings.lang === 'es'
                      ? 'Objetos por Ronda'
                      : 'Objects per Round'}
                  </span>
                  <span className="text-amber-400 font-black text-base">
                    {settings.objectCount}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-between">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        saveSettings({...settings, objectCount: num})
                      }
                      className={`min-w-[36px] min-h-[36px] rounded-lg font-bold transition-transform ${
                        settings.objectCount === num
                          ? 'bg-amber-500 text-slate-950 scale-110 shadow'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}>
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Freeze Cooldown Duration (1s - 10s) */}
              <div className="bg-slate-800/70 p-3 rounded-xl border border-cyan-500/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Snowflake size={16} className="text-cyan-400" />
                    <span>
                      {settings.lang === 'es'
                        ? 'Tiempo de Congelación (Clics)'
                        : 'Freeze Cooldown (Clicks)'}
                    </span>
                  </div>
                  <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/40 font-black text-sm">
                    {settings.freezeCooldown.toFixed(1)}s
                  </span>
                </div>

                {/* Preset Quick Buttons */}
                <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                  {[1, 2, 3, 5, 10].map((sec) => (
                    <button
                      key={sec}
                      onClick={() =>
                        saveSettings({...settings, freezeCooldown: sec})
                      }
                      className={`min-h-[34px] rounded-lg font-bold text-xs transition-all ${
                        Math.abs(settings.freezeCooldown - sec) < 0.1
                          ? 'bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/30'
                          : 'bg-slate-900/80 text-cyan-200/80 border border-slate-700 hover:border-cyan-500'
                      }`}>
                      {sec}s
                    </button>
                  ))}
                </div>

                {/* Stepper + Slider */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      saveSettings({
                        ...settings,
                        freezeCooldown: Math.max(1, settings.freezeCooldown - 0.5),
                      })
                    }
                    className="min-w-[32px] min-h-[32px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black rounded-lg flex items-center justify-center">
                    -
                  </button>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={settings.freezeCooldown}
                    onChange={(e) =>
                      saveSettings({
                        ...settings,
                        freezeCooldown: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg appearance-none"
                  />
                  <button
                    onClick={() =>
                      saveSettings({
                        ...settings,
                        freezeCooldown: Math.min(10, settings.freezeCooldown + 0.5),
                      })
                    }
                    className="min-w-[32px] min-h-[32px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black rounded-lg flex items-center justify-center">
                    +
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {settings.lang === 'es'
                    ? 'Bloquea la interacción durante este tiempo tras cada toque.'
                    : 'Locks clicks for this duration after each interaction.'}
                </p>
              </div>

              {/* Characters Selection */}
              <div>
                <span className="block text-slate-300 font-bold mb-2">
                  {settings.lang === 'es'
                    ? 'Personajes Activos'
                    : 'Active Characters'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CHARACTERS.map((char) => {
                    const isEnabled = settings.enabledCharacters[char.id] !== false;
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          const updated = {
                            ...settings.enabledCharacters,
                            [char.id]: !isEnabled,
                          };
                          // Ensure at least one character is active
                          if (Object.values(updated).some(Boolean)) {
                            saveSettings({
                              ...settings,
                              enabledCharacters: updated,
                            });
                          }
                        }}
                        className={`min-h-[44px] p-2 rounded-xl font-bold flex items-center justify-between border text-xs transition-colors ${
                          isEnabled
                            ? 'bg-slate-800 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                        <span>
                          {settings.lang === 'es'
                            ? char.nameEs
                            : char.nameEn}
                        </span>
                        {isEnabled && <Check size={16} className="text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hiding Objects Selection */}
              <div>
                <span className="block text-slate-300 font-bold mb-2">
                  {settings.lang === 'es'
                    ? 'Escondites Disponibles'
                    : 'Available Hiding Spots'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {HIDING_OBJECTS.map((obj) => {
                    const isEnabled = settings.enabledObjects[obj.id] !== false;
                    return (
                      <button
                        key={obj.id}
                        onClick={() => {
                          const updated = {
                            ...settings.enabledObjects,
                            [obj.id]: !isEnabled,
                          };
                          // Ensure at least one object is active
                          if (Object.values(updated).some(Boolean)) {
                            saveSettings({
                              ...settings,
                              enabledObjects: updated,
                            });
                          }
                        }}
                        className={`min-h-[44px] p-2 rounded-xl font-bold flex items-center justify-between border text-xs transition-colors ${
                          isEnabled
                            ? 'bg-slate-800 border-amber-500 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{backgroundColor: obj.colors.primary.hex}}
                          />
                          <span className="truncate">
                            {settings.lang === 'es' ? obj.nameEs : obj.nameEn}
                          </span>
                        </div>
                        {isEnabled && <Check size={14} className="text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsAdminOpen(false);
                startNewRound();
              }}
              className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-base shadow-md transition-all">
              {settings.lang === 'es'
                ? 'Guardar y Nueva Ronda'
                : 'Save & Start Round'}
            </button>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
