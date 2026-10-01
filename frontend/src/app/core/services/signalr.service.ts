import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { API_CONFIG } from './api.config';
import {
  SensorReadingUpdatePayload,
  CurrentMachineState,
  AlertItem,
  MachineStatusChangedPayload,
  ImpactAnalysisResult
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection?: signalR.HubConnection;

  // Angular Signals for connection status
  readonly isConnected = signal<boolean>(false);
  readonly connectionState = signal<string>('Disconnected');

  // RxJS Subjects for incoming events
  private sensorReadingSubject = new Subject<SensorReadingUpdatePayload>();
  private machineStateSubject = new Subject<CurrentMachineState>();
  private alertCreatedSubject = new Subject<AlertItem>();
  private statusChangedSubject = new Subject<MachineStatusChangedPayload>();
  private potentialImpactSubject = new Subject<ImpactAnalysisResult>();

  // Public Observables
  readonly sensorReading$: Observable<SensorReadingUpdatePayload> = this.sensorReadingSubject.asObservable();
  readonly machineState$: Observable<CurrentMachineState> = this.machineStateSubject.asObservable();
  readonly alertCreated$: Observable<AlertItem> = this.alertCreatedSubject.asObservable();
  readonly statusChanged$: Observable<MachineStatusChangedPayload> = this.statusChangedSubject.asObservable();
  readonly status$: Observable<MachineStatusChangedPayload> = this.statusChangedSubject.asObservable();
  readonly potentialImpact$: Observable<ImpactAnalysisResult> = this.potentialImpactSubject.asObservable();

  constructor() {
    this.initConnection();
  }

  private initConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(API_CONFIG.hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerEventHandlers();
    this.startConnection();
  }

  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    // Listen to 'SensorReadingUpdated' (and fallback 'SensorReadingReceived')
    this.hubConnection.on('SensorReadingUpdated', (payload: SensorReadingUpdatePayload) => {
      this.sensorReadingSubject.next(payload);
    });

    this.hubConnection.on('SensorReadingReceived', (payload: SensorReadingUpdatePayload) => {
      this.sensorReadingSubject.next(payload);
    });

    // Listen to 'MachineStateUpdated'
    this.hubConnection.on('MachineStateUpdated', (state: CurrentMachineState) => {
      this.machineStateSubject.next(state);
    });

    // Listen to 'AlertCreated'
    this.hubConnection.on('AlertCreated', (alert: AlertItem) => {
      this.alertCreatedSubject.next(alert);
    });

    // Listen to 'MachineStatusChanged'
    this.hubConnection.on('MachineStatusChanged', (payload: MachineStatusChangedPayload) => {
      this.statusChangedSubject.next(payload);
    });

    // Listen to 'PotentialImpactDetected' (and alias 'ImpactAnalysisDetected')
    this.hubConnection.on('PotentialImpactDetected', (impact: ImpactAnalysisResult) => {
      this.potentialImpactSubject.next(impact);
    });

    this.hubConnection.on('ImpactAnalysisDetected', (impact: ImpactAnalysisResult) => {
      this.potentialImpactSubject.next(impact);
    });

    // Reconnection lifecycle
    this.hubConnection.onreconnecting(() => {
      this.isConnected.set(false);
      this.connectionState.set('Reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
      this.connectionState.set('Connected');
      this.joinDashboardGroup();
      this.joinAlertsGroup();
    });

    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
      this.connectionState.set('Disconnected');
    });
  }

  async startConnection(): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      this.connectionState.set('Connecting');
      await this.hubConnection.start();
      this.isConnected.set(true);
      this.connectionState.set('Connected');

      // Default subscriptions
      await this.joinDashboardGroup();
      await this.joinAlertsGroup();
    } catch (err) {
      this.isConnected.set(false);
      this.connectionState.set('Error');
      console.warn('SignalR connection failed, retrying in 5s...', err);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  async joinMachineGroup(machineCode: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinMachineGroup', machineCode);
    }
  }

  async leaveMachineGroup(machineCode: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveMachineGroup', machineCode);
    }
  }

  async joinDashboardGroup(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinDashboardGroup');
    }
  }

  async joinAlertsGroup(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinAlertsGroup');
    }
  }
}
