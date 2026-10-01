import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DigitalTwinService } from '../../core/services/digital-twin.service';
import { SignalrService } from '../../core/services/signalr.service';
import { SimulatorService } from '../../core/services/simulator.service';
import { SensorService } from '../../core/services/sensor.service';
import { DashboardSummary, MachineSummary, SensorReading, AlertItem, ImpactAnalysisResult } from '../../core/models/models';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { MachineStatusBadgeComponent } from '../../shared/components/machine-status-badge/machine-status-badge.component';
import { SensorChartComponent } from '../../shared/components/sensor-chart/sensor-chart.component';
import { Subscription } from 'rxjs';

interface PipelineNode extends MachineSummary {
  telemetryKey?: string;
  telemetryValue?: number;
  telemetryUnit?: string;
  telemetrySecondary?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    MachineStatusBadgeComponent,
    SensorChartComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Top Title & Scenario Quick Controls Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800/90 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 shadow-2xl">
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                OCP Mining Digital Twin
              </span>
              <span class="text-xs text-slate-400 font-mono">Real-time Telemetry Engine</span>
            </div>
            <h2 class="text-2xl lg:text-3xl font-black text-white tracking-tight mt-1.5 flex items-center gap-3">
              <span>Plant Executive Dashboard</span>
            </h2>
            <p class="text-xs text-slate-300 mt-1 max-w-2xl">
              Demonstration scenario: <strong>Crusher Failure (CR-001)</strong> â€” Live SignalR telemetry, progressive vibration anomalies, dynamic relation pipeline & automated recovery.
            </p>
          </div>

          <!-- Scenario Trigger Actions -->
          <div class="flex flex-wrap items-center gap-2.5 bg-slate-950/80 p-2 rounded-xl border border-slate-800 shadow-inner">
            <span class="text-[11px] font-bold text-slate-400 font-mono uppercase px-2">
              Scenario:
            </span>
            <button
              (click)="triggerCrusherScenario()"
              [disabled]="isStartingScenario"
              class="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-900/30 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <span class="text-sm">ðŸ’¥</span>
              <span>Run Crusher Failure</span>
            </button>

            <button
              (click)="resetToNormal()"
              class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>â†º</span>
              <span>Reset Normal</span>
            </button>

            <button
              (click)="loadData()"
              class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
              title="Refresh Data"
            >
              <svg class="w-4 h-4" [class.animate-spin]="isLoading" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Scenario Phase Timeline Progress Indicator -->
        <div class="mt-5 pt-4 border-t border-slate-800/80">
          <div class="flex items-center justify-between text-[11px] font-mono mb-2">
            <span class="text-slate-400 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full"
                [class.bg-emerald-400]="activeMode === 'normal'"
                [class.bg-rose-500]="activeMode === 'scenario'"
                [class.animate-ping]="activeMode === 'scenario'"
              ></span>
              Current Simulator Mode: <strong class="uppercase text-white">{{ activeMode }}</strong>
            </span>
            <span class="text-cyan-400 font-bold">
              CR-001 Vibration: {{ crusherVibration | number:'1.2-2' }} mm/s
            </span>
          </div>

          <!-- 6-Stage Visual Progression Steps -->
          <div class="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div
              *ngFor="let step of scenarioSteps; let idx = index"
              class="p-2 rounded-lg border text-center transition-all duration-300"
              [ngClass]="{
                'bg-emerald-500/10 border-emerald-500/30 text-emerald-300': currentStepIndex === idx && step.type === 'normal',
                'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse shadow-lg shadow-amber-950/30': currentStepIndex === idx && step.type === 'warning',
                'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse shadow-lg shadow-rose-950/40': currentStepIndex === idx && step.type === 'critical',
                'bg-slate-900/60 border-slate-800 text-slate-500': currentStepIndex !== idx
              }"
            >
              <p class="text-[10px] font-mono font-bold uppercase">{{ step.phase }}</p>
              <p class="text-xs font-semibold mt-0.5 truncate">{{ step.title }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="p-12 text-center glass-panel rounded-2xl">
        <div class="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-slate-400 mt-3 font-mono">Loading digital twin state & telemetry...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">
        <p class="font-bold">Failed to load dashboard telemetry</p>
        <p class="text-xs text-rose-300 mt-1">{{ errorMessage }}</p>
        <button (click)="loadData()" class="mt-3 px-3 py-1 bg-rose-500 text-white rounded text-xs font-bold">Retry</button>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && !errorMessage" class="space-y-6">
        <!-- KPI Cards Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <app-stat-card label="Total Machines" [value]="summary?.totalMachines || 0" variant="cyan">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </app-stat-card>

          <app-stat-card label="Running" [value]="summary?.running || 0" variant="running">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          </app-stat-card>

          <app-stat-card label="Warning" [value]="summary?.warning || 0" variant="warning">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </app-stat-card>

          <app-stat-card label="Critical" [value]="summary?.critical || 0" variant="critical">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </app-stat-card>

          <app-stat-card label="Active Alerts" [value]="summary?.activeAlerts || 0" variant="warning">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </app-stat-card>

          <app-stat-card label="Plant Flow" [value]="totalFlow" unit="t/h" variant="cyan">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </app-stat-card>
        </div>

        <!-- POTENTIAL IMPACT DETECTED HERO BANNER (Automated Multi-Level Impact Analysis) -->
        <div
          *ngIf="latestImpactAnalysis && latestImpactAnalysis.totalImpactedMachines > 0"
          class="glass-panel rounded-2xl p-6 border-2 border-rose-500/80 bg-gradient-to-r from-rose-950/50 via-slate-900/90 to-amber-950/30 shadow-2xl relative overflow-hidden"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-500/30">
            <div class="flex items-center gap-3.5">
              <span class="p-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center">
                <svg class="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-rose-300 bg-rose-500/30 px-2.5 py-0.5 rounded-full border border-rose-500/50">
                    Impact Analysis Engine
                  </span>
                  <span class="text-xs text-slate-400 font-mono">
                    {{ latestImpactAnalysis.analyzedAt | date:'HH:mm:ss' }}
                  </span>
                </div>
                <h3 class="text-xl font-black text-white mt-1 flex items-center gap-2.5 flex-wrap">
                  <span class="text-rose-400">Potential impact detected</span>
                  <span class="text-xs px-2.5 py-1 rounded bg-rose-600/90 text-white font-mono font-bold shadow-md shadow-rose-950/40">
                    ROOT: {{ latestImpactAnalysis.rootMachineCode }} ({{ latestImpactAnalysis.rootMachineStatus }})
                  </span>
                </h3>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/30">
                {{ latestImpactAnalysis.totalImpactedMachines }} dependent machine(s) affected
              </span>
              <button
                (click)="dismissImpactAnalysis()"
                class="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
                title="Dismiss Impact Banner"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Cascading Multi-Level Machines Display -->
          <div class="mt-5 space-y-4">
            <p class="text-xs text-slate-300 font-medium font-mono">
              {{ latestImpactAnalysis.summaryMessage }}
            </p>

            <!-- Impacted Machines Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                *ngFor="let imp of latestImpactAnalysis.impactedMachines"
                class="p-4 rounded-xl border border-rose-500/40 bg-slate-950/90 backdrop-blur-md relative group hover:border-rose-400 transition-all shadow-lg"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                    [ngClass]="imp.depthLevel === 1 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'"
                  >
                    Level {{ imp.depthLevel }} Direct Impact
                  </span>
                  <span class="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-bold">
                    {{ imp.relationType }}
                  </span>
                </div>

                <div class="mt-3 flex items-center justify-between">
                  <div>
                    <h4 class="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                      {{ imp.machineCode }}
                    </h4>
                    <p class="text-xs text-slate-400">{{ imp.machineName }} ({{ imp.machineType }})</p>
                  </div>
                  <app-machine-status-badge [status]="imp.currentStatus"></app-machine-status-badge>
                </div>

                <!-- Cascade Propagation Breadcrumb -->
                <div class="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
                  <span class="text-slate-400">Cascade Path:</span>
                  <span class="text-rose-300 font-bold">
                    {{ imp.impactPath.join(' ➔ ') }}
                  </span>
                </div>

                <!-- Potential Impact Description -->
                <p class="text-xs text-amber-200 mt-2.5 flex items-start gap-1.5">
                  <span class="text-rose-400 mt-0.5">⚠️</span>
                  <span>{{ imp.potentialImpactMessage }}</span>
                </p>

                <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span class="text-slate-400 font-mono">Source: <strong>{{ imp.directSourceMachineCode }}</strong></span>
                  <a
                    [routerLink]="['/machines', imp.machineId]"
                    class="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Inspect {{ imp.machineCode }}</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Full Linear Propagation Chains -->
            <div *ngIf="latestImpactAnalysis.impactChains.length > 0" class="pt-2 flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-mono text-slate-400 uppercase font-bold">Cascading Chains:</span>
              <span
                *ngFor="let chain of latestImpactAnalysis.impactChains"
                class="text-xs font-mono px-3 py-1 rounded-lg bg-slate-900 border border-rose-500/30 text-rose-300 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                <span>{{ chain.chain }}</span>
                <span class="text-[10px] text-slate-500 font-bold">(depth {{ chain.depth }})</span>
              </span>
            </div>
          </div>
        </div>

        <!-- PRIMARY PRODUCTION LINE 01 PIPELINE: RW-001 -> CR-001 -> CV-001 -> RE-001 -->
        <div class="glass-panel rounded-2xl p-6 border border-slate-800/90 shadow-2xl relative overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                <h3 class="text-lg font-extrabold text-white tracking-tight">
                  Primary Production Line 01 Pipeline
                </h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5 font-mono">
                Process Flow Relation: <strong>RW-001</strong> &rarr; <strong>CR-001</strong> &rarr; <strong>CV-001</strong> &rarr; <strong>RE-001</strong>
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800/40">
                Material Throughput: <strong>{{ totalFlow }} t/h</strong>
              </span>
              <a
                routerLink="/plant"
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <span>Full Relational Graph &rarr;</span>
              </a>
            </div>
          </div>

          <!-- Pipeline Nodes Flow Grid -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
            <div *ngFor="let m of pipelineMachines; let i = index" class="relative">
              <div
                [routerLink]="['/machines', m.id]"
                class="glass-card rounded-2xl p-5 border transition-all duration-300 cursor-pointer hover:-translate-y-1 relative group shadow-lg"
                [ngClass]="{
                  'border-emerald-500/40 status-running-glow': m.status === 'Running',
                  'border-amber-500/60 status-warning-glow bg-amber-950/10 ring-2 ring-amber-500/30 animate-pulse': m.status === 'Warning',
                  'border-rose-500 status-critical-glow bg-rose-950/20 ring-4 ring-rose-500/40 animate-pulse shadow-rose-950/50': m.status === 'Critical',
                  'border-slate-800': m.status === 'Stopped'
                }"
              >
                <!-- Header with Machine Code & Live Status -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                      {{ m.code }}
                    </span>
                    <span *ngIf="m.code === 'CR-001' && (m.status === 'Warning' || m.status === 'Critical')"
                      class="text-[10px] font-bold uppercase px-2 py-0.5 rounded animate-bounce font-mono"
                      [ngClass]="m.status === 'Critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'"
                    >
                      {{ m.status === 'Critical' ? 'CRITICAL ANOMALY' : 'WARNING OVERLOAD' }}
                    </span>
                  </div>
                  <app-machine-status-badge [status]="m.status"></app-machine-status-badge>
                </div>

                <!-- Machine Name & Role -->
                <h4 class="text-base font-bold text-white mt-3 group-hover:text-cyan-300 transition-colors">
                  {{ m.name }}
                </h4>
                <p class="text-xs text-slate-400 mt-0.5">{{ m.type }}</p>

                <!-- Live Dynamic Telemetry Badge -->
                <div class="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p class="text-[10px] uppercase font-mono text-slate-500 font-bold">
                      {{ m.telemetryKey || 'Live Telemetry' }}
                    </p>
                    <p class="text-sm font-bold font-mono"
                      [ngClass]="{
                        'text-emerald-400': m.status === 'Running' || !m.status,
                        'text-amber-400 animate-pulse font-extrabold': m.status === 'Warning',
                        'text-rose-400 animate-pulse font-extrabold text-base': m.status === 'Critical'
                      }"
                    >
                      {{ m.telemetryValue !== undefined ? (m.telemetryValue | number:'1.2-2') : '---' }} {{ m.telemetryUnit }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] uppercase font-mono text-slate-500 font-bold">Alerts</p>
                    <span class="text-xs font-mono font-bold"
                      [class.text-amber-400]="m.activeAlerts > 0"
                      [class.text-slate-400]="m.activeAlerts === 0"
                    >
                      {{ m.activeAlerts }} active
                    </span>
                  </div>
                </div>

                <!-- Node Footer -->
                <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{{ m.sensorCount }} sensors</span>
                  <span class="text-cyan-400 group-hover:underline">View Telemetry &rarr;</span>
                </div>
              </div>

              <!-- Flow Arrow between nodes -->
              <div *ngIf="i < pipelineMachines.length - 1" class="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-cyan-400 shadow-xl font-bold text-sm">
                &rarr;
              </div>
            </div>
          </div>
        </div>

        <!-- 2-COLUMN SECTION: Live Vibration Chart & Real-time Alert Stream -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- CR-001 Live Vibration Trend Chart (2 Cols) -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  CR-001 Vibration Real-time Telemetry Trend
                </h3>
                <p class="text-xs text-slate-400">
                  Real-time SignalR telemetry feed showing vibration evolution across normal &le; 4.0 mm/s, warning & critical &gt; 4.35 mm/s
                </p>
              </div>
              <span class="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
                CR-001-VIB
              </span>
            </div>

            <app-sensor-chart
              title="Crusher CR-001 Vibration"
              unit="mm/s"
              [readings]="crusherVibrationHistory"
              [minValue]="0.5"
              [maxValue]="4.0"
            ></app-sensor-chart>
          </div>

          <!-- Real-Time Anomaly & Alert Feed (1 Col) -->
          <div class="glass-panel p-5 rounded-2xl border border-slate-800/90 flex flex-col h-full shadow-xl">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                Incident Alert Feed
              </h4>
              <a routerLink="/alerts" class="text-xs text-cyan-400 hover:underline font-mono">
                View All &rarr;
              </a>
            </div>
            <p class="text-[11px] text-slate-400 mb-4 font-mono">
              Live SignalR notifications generated during scenario progression
            </p>

            <div class="space-y-2.5 overflow-y-auto max-h-[280px] flex-1 pr-1">
              <div *ngIf="recentAlerts.length === 0" class="p-6 text-center text-slate-500 text-xs font-mono border border-slate-800/60 rounded-xl bg-slate-950/40">
                No active anomaly alerts. All machines operating normally.
              </div>

              <div
                *ngFor="let alert of recentAlerts"
                class="p-3 rounded-xl border transition-all duration-300 bg-slate-950/80"
                [ngClass]="{
                  'border-rose-500/50 bg-rose-950/20': alert.severity === 'Critical',
                  'border-amber-500/50 bg-amber-950/20': alert.severity === 'Warning',
                  'border-slate-800': alert.severity !== 'Critical' && alert.severity !== 'Warning'
                }"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase"
                    [ngClass]="alert.severity === 'Critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'"
                  >
                    {{ alert.severity }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">
                    {{ alert.createdAt | date:'HH:mm:ss' }}
                  </span>
                </div>
                <p class="text-xs font-bold text-white mt-1.5">{{ alert.title }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{{ alert.message }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Machine Fleet Overview Grid -->
        <div>
          <h3 class="text-lg font-bold text-white mb-4">Complete Machine Fleet Overview</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div *ngFor="let m of summary?.machines">
              <div
                [routerLink]="['/machines', m.id]"
                class="glass-card rounded-xl p-5 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                [class.status-warning-glow]="m.status === 'Warning'"
                [class.status-critical-glow]="m.status === 'Critical'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {{ m.code }}
                  </span>
                  <app-machine-status-badge [status]="m.status"></app-machine-status-badge>
                </div>
                <h4 class="text-base font-bold text-white mt-3 group-hover:text-cyan-300 transition-colors">
                  {{ m.name }}
                </h4>
                <p class="text-xs text-slate-400">{{ m.type }}</p>
                <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{{ m.sensorCount }} sensors</span>
                  <span [class.text-amber-400]="m.activeAlerts > 0">{{ m.activeAlerts }} alerts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private digitalTwinService = inject(DigitalTwinService);
  private signalr = inject(SignalrService);
  private simulatorService = inject(SimulatorService);
  private sensorService = inject(SensorService);

  summary: DashboardSummary | null = null;
  pipelineMachines: PipelineNode[] = [];
  totalFlow: number = 2450;
  crusherVibration: number = 2.25;
  crusherVibrationHistory: SensorReading[] = [];
  crusherSensorId: string = '';
  recentAlerts: AlertItem[] = [];
  latestImpactAnalysis: ImpactAnalysisResult | null = null;

  activeMode: string = 'normal';
  currentStepIndex: number = 0;
  isStartingScenario: boolean = false;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  scenarioSteps = [
    { phase: 'Phase 1', title: 'Nominal Baseline', type: 'normal' },
    { phase: 'Phase 2', title: 'Rising Vibration', type: 'warning' },
    { phase: 'Phase 3', title: 'Critical Overload', type: 'critical' },
    { phase: 'Phase 4', title: 'Peak Failure', type: 'critical' },
    { phase: 'Phase 5', title: 'Deceleration', type: 'warning' },
    { phase: 'Phase 6', title: 'Restored Normal', type: 'normal' }
  ];

  private subscriptions: Subscription[] = [];
  private scenarioStartTime: number = 0; // ms since epoch when scenario started

  ngOnInit(): void {
    this.loadData();
    this.subscribeRealtime();
    this.checkSimulatorStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.digitalTwinService.getDashboardSummary().subscribe({
      next: data => {
        this.summary = data;
        this.updatePipeline(data.machines);
        this.isLoading = false;
        this.loadCrusherSensorData();

        const criticalMachine = data.machines.find(m => m.status === 'Critical');
        if (criticalMachine) {
          this.loadImpactAnalysis(criticalMachine.id);
        }
      },
      error: err => {
        this.errorMessage = err?.message || 'Could not connect to Digital Twin API';
        this.isLoading = false;
      }
    });
  }

  loadImpactAnalysis(machineId: string): void {
    this.digitalTwinService.getImpactAnalysis(machineId).subscribe({
      next: res => {
        if (res && res.totalImpactedMachines > 0) {
          this.latestImpactAnalysis = res;
        }
      },
      error: err => console.warn('[Dashboard] Impact analysis fetch note:', err)
    });
  }

  dismissImpactAnalysis(): void {
    this.latestImpactAnalysis = null;
  }

  private loadCrusherSensorData(): void {
    const crusher = this.summary?.machines.find(m => m.code === 'CR-001');
    if (crusher) {
      this.digitalTwinService.getCurrentMachineState(crusher.id).subscribe({
        next: state => {
          const vibSensor = state.sensorValues.find(s => s.sensorCode === 'CR-001-VIB' || s.sensorType === 'Vibration');
          if (vibSensor) {
            this.crusherSensorId = vibSensor.sensorId;
            this.crusherVibration = vibSensor.value;
            this.sensorService.getReadings(vibSensor.sensorId, undefined, undefined, 20).subscribe({
              next: readings => {
                this.crusherVibrationHistory = readings;
              }
            });
          }
        }
      });
    }
  }

  private updatePipeline(machines: MachineSummary[]): void {
    const configs: Record<string, { key: string; unit: string; defaultVal: number }> = {
      'RW-001': { key: 'Extraction Flow', unit: 't/h', defaultVal: 220 },
      'CR-001': { key: 'Crusher Vibration', unit: 'mm/s', defaultVal: this.crusherVibration },
      'CV-001': { key: 'Belt Speed', unit: 'm/s', defaultVal: 2.8 },
      'RE-001': { key: 'Reactor Pressure', unit: 'bar', defaultVal: 3.2 }
    };

    const codes = ['RW-001', 'CR-001', 'CV-001', 'RE-001'];
    this.pipelineMachines = codes
      .map(c => {
        const found = machines.find(m => m.code === c);
        if (!found) return undefined;
        const cfg = configs[c];
        const node: PipelineNode = {
          ...found,
          telemetryKey: cfg?.key,
          telemetryUnit: cfg?.unit,
          telemetryValue: c === 'CR-001' ? this.crusherVibration : cfg?.defaultVal
        };
        return node;
      })
      .filter((m): m is PipelineNode => m !== undefined);
  }

  private checkSimulatorStatus(): void {
    this.simulatorService.getStatus().subscribe({
      next: status => {
        this.activeMode = status.mode || 'normal';
        this.updateStepIndex();
      },
      error: () => {}
    });
  }

  triggerCrusherScenario(): void {
    this.isStartingScenario = true;
    this.scenarioStartTime = Date.now();
    this.simulatorService.setMode('scenario').subscribe({
      next: () => {
        this.activeMode = 'scenario';
        this.currentStepIndex = 0;
        this.latestImpactAnalysis = null;   // reset visual steps to Phase 1
        this.isStartingScenario = false;
        console.log('[Dashboard] Crusher Failure scenario started successfully');
      },
      error: err => {
        // BUG FIX: clear flag and log clearly — previously silent CORS errors hid this
        console.error('[Dashboard] Failed to start scenario. Check CORS config on Simulator (port 5001):', err);
        this.isStartingScenario = false;
      }
    });
  }

  resetToNormal(): void {
    this.simulatorService.setMode('normal').subscribe({
      next: () => {
        this.activeMode = 'normal';
        this.currentStepIndex = 0;
      },
      error: err => console.error('Failed to reset to normal', err)
    });
  }

  private updateStepIndex(): void {
    if (this.activeMode !== 'scenario') {
      this.currentStepIndex = 0;
      return;
    }

    // Use elapsed time since scenario start to determine phase (2s per tick × ticks per phase)
    const elapsedMs = this.scenarioStartTime ? Date.now() - this.scenarioStartTime : 0;
    const elapsedSec = elapsedMs / 1000;

    // Phase boundaries in seconds: 1=0-12s, 2=12-28s, 3=28-48s, 4=48-64s, 5=64-84s, 6=84+s
    // Also use vibration as a secondary signal when available
    if (elapsedSec < 12) {
      this.currentStepIndex = 0;  // Phase 1: Normal Baseline
    } else if (elapsedSec < 28) {
      this.currentStepIndex = 1;  // Phase 2: Rising Vibration (Warning)
    } else if (elapsedSec < 48) {
      this.currentStepIndex = 2;  // Phase 3: Critical Overload
    } else if (elapsedSec < 64) {
      this.currentStepIndex = 3;  // Phase 4: Peak Failure
    } else if (elapsedSec < 84) {
      this.currentStepIndex = 4;  // Phase 5: Deceleration / Recovery
    } else {
      this.currentStepIndex = 5;  // Phase 6: Restored Normal
    }

    // Override with vibration signal if more accurate (SignalR received)
    if (this.crusherVibration > 5.5) this.currentStepIndex = Math.max(this.currentStepIndex, 3);
  }

  private subscribeRealtime(): void {
    // 1. Listen to SensorReadingUpdated
    const subReading = this.signalr.sensorReading$.subscribe(payload => {
      if (payload.machineCode === 'CR-001' && payload.sensorType === 'Vibration') {
        this.crusherVibration = payload.value;
        this.updateStepIndex();

        // Update pipeline node telemetry
        const crNode = this.pipelineMachines.find(m => m.code === 'CR-001');
        if (crNode) {
          crNode.telemetryValue = payload.value;
          crNode.status = payload.machineStatus as any;
        }

        // Push reading to history array
        const newReading: SensorReading = {
          id: Math.random().toString(),
          sensorId: payload.sensorId,
          value: payload.value,
          unit: payload.unit,
          timestamp: payload.timestamp ? payload.timestamp.toString() : new Date().toISOString(),
          quality: 'Good',
          isAnomaly: !!payload.alertInfo
        };

        this.crusherVibrationHistory = [...this.crusherVibrationHistory.slice(-19), newReading];
      }

      if (payload.sensorType === 'MaterialFlow' || payload.sensorType === 'InputFlow') {
        this.totalFlow = Math.round(payload.value);
        const rwNode = this.pipelineMachines.find(m => m.code === 'RW-001');
        if (rwNode) rwNode.telemetryValue = Math.round(payload.value);
      }
    });

    // 2. Listen to MachineStatusChanged
    const subStatus = this.signalr.status$.subscribe(payload => {
      if (this.summary) {
        const m = this.summary.machines.find(x => x.id === payload.machineId);
        if (m) {
          m.status = payload.newStatus;
          this.recalculateKpis();
        }
      }

      const pNode = this.pipelineMachines.find(x => x.id === payload.machineId);
      if (pNode) {
        pNode.status = payload.newStatus as any;
      }

      if (payload.newStatus === 'Critical') {
        this.loadImpactAnalysis(payload.machineId);
      } else if (payload.newStatus === 'Running' && this.latestImpactAnalysis?.rootMachineId === payload.machineId) {
        this.latestImpactAnalysis = null;
      }
    });

    // 3. Listen to AlertCreated
    const subAlert = this.signalr.alertCreated$.subscribe(alert => {
      this.recentAlerts = [alert, ...this.recentAlerts.slice(0, 9)];
      if (this.summary) {
        this.summary.activeAlerts = (this.summary.activeAlerts || 0) + 1;
      }
    });

        const subImpact = this.signalr.potentialImpact$.subscribe(impact => {
      if (impact && impact.totalImpactedMachines > 0) {
        this.latestImpactAnalysis = impact;
      }
    });

    this.subscriptions.push(subReading, subStatus, subAlert, subImpact);
  }

  private recalculateKpis(): void {
    if (!this.summary) return;
    this.summary.running = this.summary.machines.filter(m => m.status === 'Running').length;
    this.summary.warning = this.summary.machines.filter(m => m.status === 'Warning').length;
    this.summary.critical = this.summary.machines.filter(m => m.status === 'Critical').length;
    this.summary.stopped = this.summary.machines.filter(m => m.status === 'Stopped').length;
  }
}
