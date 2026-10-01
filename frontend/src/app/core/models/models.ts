// ─── Core Enums ─────────────────────────────────────────────────────────────

export type MachineStatus = 'Running' | 'Stopped' | 'Warning' | 'Critical' | 'Maintenance';
export type MachineType = 'BucketWheel' | 'Crusher' | 'Conveyor' | 'Reactor' | 'Excavator' | string;
export type AlertSeverity = 'Info' | 'Warning' | 'Critical';
export type AlertType = 'SensorThreshold' | 'MachineOffline' | 'CommunicationLoss' | 'MaintenanceRequired';
export type ReadingQuality = 'Good' | 'Bad' | 'Uncertain';

// ─── Plant & Production Line ─────────────────────────────────────────────────

export interface Plant {
  id: string;
  name: string;
  location: string;
  description?: string;
  createdAt: string;
  productionLines: ProductionLine[];
}

export interface ProductionLine {
  id: string;
  plantId: string;
  name: string;
  description?: string;
  machines: MachineSummary[];
}

// ─── Machine ─────────────────────────────────────────────────────────────────

export interface MachineSummary {
  id: string;
  code: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  activeAlerts: number;
  sensorCount: number;
  location?: string;
  updatedAt?: string;
}

export interface MachineDetail {
  id: string;
  code: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  description?: string;
  location?: string;
  installedAt: string;
  createdAt: string;
  sensors: Sensor[];
  relations: MachineRelation[];
}

export interface MachineRelation {
  id: string;
  sourceMachineId: string;
  sourceMachineCode: string;
  sourceMachineName: string;
  targetMachineId: string;
  targetMachineCode: string;
  targetMachineName: string;
  relationType: string;
  description?: string;
}

// ─── Sensor & Readings ───────────────────────────────────────────────────────

export interface Sensor {
  id: string;
  machineId: string;
  code: string;
  name: string;
  sensorType: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  minWarning?: number;
  maxWarning?: number;
  isActive: boolean;
  latestReading?: SensorReading;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string;
  timestamp: string;
  quality: ReadingQuality;
  isAnomaly: boolean;
}

export interface SubmitReadingRequest {
  value: number;
  timestamp?: string;
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export interface AlertItem {
  id: string;
  machineId: string;
  machineName: string;
  machineCode: string;
  sensorId?: string;
  sensorName?: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AcknowledgeAlertRequest {
  acknowledgedBy: string;
}

// ─── Digital Twin & Dashboard ────────────────────────────────────────────────

export interface DashboardSummary {
  totalMachines: number;
  running: number;
  warning: number;
  critical: number;
  stopped: number;
  activeAlerts: number;
  criticalAlerts: number;
  machines: MachineSummary[];
}

export interface PlantTopology {
  plantId: string;
  plantName: string;
  nodes: MachineNode[];
  edges: MachineRelation[];
}

export interface MachineNode {
  id: string;
  code: string;
  name: string;
  type: string;
  status: MachineStatus;
  activeAlerts: number;
  productionLineId?: string;
  productionLineName?: string;
}

export interface SensorCurrentValue {
  sensorId: string;
  sensorCode: string;
  sensorName: string;
  sensorType: string;
  unit: string;
  value: number;
  timestamp: string;
  quality: string;
  isAnomaly: boolean;
  severity?: AlertSeverity;
  minValue?: number;
  maxValue?: number;
}

export interface CurrentMachineState {
  machineId: string;
  machineCode: string;
  machineName: string;
  machineType: string;
  status: MachineStatus;
  computedAt: string;
  sensorValues: SensorCurrentValue[];
  activeAlertCount: number;
  criticalAlertCount: number;
}

// ─── SignalR Payloads ────────────────────────────────────────────────────────

export interface SensorReadingUpdatePayload {
  machineId: string;
  machineCode: string;
  sensorId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
  machineStatus: MachineStatus;
  alertInfo?: {
    alertId: string;
    severity: AlertSeverity;
    title: string;
    message?: string;
  };
}

export interface MachineStatusChangedPayload {
  machineId: string;
  machineCode: string;
  previousStatus: MachineStatus;
  newStatus: MachineStatus;
  reason?: string;
  changedAt: string;
}

// ─── Simulator ───────────────────────────────────────────────────────────────

export interface SimulatorStatus {
  isRunning: boolean;
  mode: 'normal' | 'warning' | 'critical' | 'scenario' | string;
  intervalMs: number;
  startedAt?: string;
}

// ─── Impact Analysis ─────────────────────────────────────────────────────────

export interface ImpactedMachine {
  machineId: string;
  machineCode: string;
  machineName: string;
  machineType: string;
  currentStatus: MachineStatus;
  depthLevel: number;
  relationType: string;
  relationDescription?: string;
  directSourceMachineCode: string;
  impactPath: string[];
  impactSeverity: string;
  potentialImpactMessage: string;
}

export interface ImpactChain {
  chain: string;
  depth: number;
}

export interface ImpactAnalysisResult {
  rootMachineId: string;
  rootMachineCode: string;
  rootMachineName: string;
  rootMachineStatus: string;
  analyzedAt: string;
  totalImpactedMachines: number;
  impactedMachines: ImpactedMachine[];
  impactChains: ImpactChain[];
  summaryMessage: string;
}
