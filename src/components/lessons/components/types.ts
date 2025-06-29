// Create this file: src/types/spin-wheel.d.ts

declare module 'spin-wheel' {
  export interface WheelItem {
    label?: string;
    backgroundColor?: string;
    labelColor?: string;
    weight?: number;
    value?: any;
    image?: HTMLImageElement;
    imageOpacity?: number;
    imageRadius?: number;
    imageRotation?: number;
    imageScale?: number;
  }

  export interface WheelEvent {
    type: string;
    currentIndex?: number;
    rotation?: number;
    duration?: number;
    method?: string;
    rotationResistance?: number;
    rotationSpeed?: number;
    targetItemIndex?: number;
    targetRotation?: number;
  }

  export interface WheelProps {
    items?: WheelItem[];
    radius?: number;
    itemLabelRadius?: number;
    itemLabelRadiusMax?: number;
    itemLabelRotation?: number;
    itemLabelAlign?: 'left' | 'center' | 'right';
    itemLabelColors?: string[];
    itemLabelFont?: string;
    itemLabelFontSizeMax?: number;
    itemLabelBaselineOffset?: number;
    itemLabelStrokeColor?: string;
    itemLabelStrokeWidth?: number;
    itemBackgroundColors?: string[];
    lineColor?: string;
    lineWidth?: number;
    borderColor?: string;
    borderWidth?: number;
    image?: HTMLImageElement;
    overlayImage?: HTMLImageElement;
    isInteractive?: boolean;
    rotation?: number;
    rotationResistance?: number;
    rotationSpeed?: number;
    rotationSpeedMax?: number;
    pointerAngle?: number;
    pixelRatio?: number;
    offset?: { x: number; y: number };
    debug?: boolean;
    onCurrentIndexChange?: (event: WheelEvent) => void;
    onRest?: (event: WheelEvent) => void;
    onSpin?: (event: WheelEvent) => void;
  }

  export class Wheel {
    constructor(container: HTMLElement, props?: WheelProps);
    
    // Properties
    items: WheelItem[];
    radius: number;
    rotation: number;
    rotationSpeed: number;
    isInteractive: boolean;
    pointerAngle: number;
    
    // Methods
    init(props?: WheelProps): void;
    remove(): void;
    resize(): void;
    spin(rotationSpeed?: number): void;
    spinTo(rotation?: number, duration?: number, easingFunction?: (n: number) => number): void;
    spinToItem(
      itemIndex?: number, 
      duration?: number, 
      spinToCenter?: boolean, 
      numberOfRevolutions?: number, 
      direction?: number, 
      easingFunction?: (n: number) => number
    ): void;
    stop(): void;
    getCurrentIndex(): number;
  }
}