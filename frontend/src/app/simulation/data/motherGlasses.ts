export interface MotherGlass {
  id: string;
  generationName: string;
  widthMm: number;
  heightMm: number;
  areaMm2: number;
}

export const motherGlasses: MotherGlass[] = [
  {
    id: 'mother-glass-1',
    generationName: '6세대',
    widthMm: 1500,
    heightMm: 1850,
    areaMm2: 1500 * 1850,
  },
  {
    id: 'mother-glass-2',
    generationName: '7세대',
    widthMm: 1870,
    heightMm: 2200,
    areaMm2: 1870 * 2200,
  },
  {
    id: 'mother-glass-3',
    generationName: '8세대',
    widthMm: 2200,
    heightMm: 2500,
    areaMm2: 2200 * 2500,
  },
];
