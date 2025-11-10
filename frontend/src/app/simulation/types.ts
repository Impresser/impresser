export type FacilityStatus = 'active' | 'inactive' | 'maintenance';
export type FacilityProcessStatus = 'WAITING' | 'RUNNING';

export interface Facility {
  id: string;
  name: string;
  type: string;
  status: FacilityStatus;
  modelName?: string;
  processStatus?: FacilityProcessStatus;
  cpu?: string;
  gpu?: string;
  ram?: string;
  vram?: string;
  installDate?: Date | string;
  canvasX?: number;
  canvasY?: number;
}

