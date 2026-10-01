import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorCurrentValue } from '../../../core/models/models';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-sensor-card',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  template: `
    <div
      class="glass-card rounded-xl p-5 border transition-all duration-300 relative overflow-hidden"
      [class]="cardBorderClass"
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            {{ sensor.sensorCode }}
          </span>
          <h4 class="text-base font-bold text-white mt-1.5">{{ sensor.sensorName }}</h4>
        </div>
        <span [class]="qualityBadgeClass">
          {{ sensor.isAnomaly ? (sensor.severity || 'WARNING') : 'NORMAL' }}
        </span>
      </div>

      <!-- Main Value Display -->
      <div class="mt-4 flex items-baseline gap-1.5">
        <span class="text-3xl font-extrabold tracking-tight text-white font-mono">
          {{ sensor.value | number:'1.1-2' }}
        </span>
        <span class="text-sm font-semibold text-cyan-400 font-mono">{{ sensor.unit }}</span>
      </div>

      <!-- Dynamic Gauge Bar -->
      <div class="mt-4 space-y-1">
        <div class="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>Min: {{ sensor.minValue !== null && sensor.minValue !== undefined ? sensor.minValue : 'N/A' }}</span>
          <span>Max: {{ sensor.maxValue !== null && sensor.maxValue !== undefined ? sensor.maxValue : 'N/A' }}</span>
        </div>
        <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            [class]="progressFillClass"
            [style.width.%]="progressPercent"
          ></div>
        </div>
      </div>

      <!-- Footer: Type & Last Update -->
      <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span class="font-medium text-slate-400">Type: <strong class="text-slate-300 font-semibold">{{ sensor.sensorType }}</strong></span>
        <span class="font-mono text-slate-500">{{ sensor.timestamp | timeAgo }}</span>
      </div>
    </div>
  `
})
export class SensorCardComponent implements OnChanges {
  @Input({ required: true }) sensor!: SensorCurrentValue;

  progressPercent: number = 50;

  ngOnChanges(): void {
    this.calculateProgress();
  }

  private calculateProgress(): void {
    if (this.sensor.minValue !== undefined && this.sensor.minValue !== null &&
        this.sensor.maxValue !== undefined && this.sensor.maxValue !== null &&
        this.sensor.maxValue > this.sensor.minValue) {
      const range = this.sensor.maxValue - this.sensor.minValue;
      const offset = this.sensor.value - this.sensor.minValue;
      const pct = (offset / range) * 100;
      this.progressPercent = Math.max(0, Math.min(100, pct));
    } else {
      this.progressPercent = 50;
    }
  }

  get cardBorderClass(): string {
    if (this.sensor.isAnomaly) {
      return this.sensor.severity === 'Critical'
        ? 'border-rose-500/60 status-critical-glow'
        : 'border-amber-500/50 status-warning-glow';
    }
    return 'border-slate-800/80 hover:border-slate-700';
  }

  get qualityBadgeClass(): string {
    const base = 'px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ';
    if (this.sensor.isAnomaly) {
      return this.sensor.severity === 'Critical'
        ? base + 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
        : base + 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
    }
    return base + 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  }

  get progressFillClass(): string {
    const base = 'h-full rounded-full transition-all duration-500 ';
    if (this.sensor.isAnomaly) {
      return this.sensor.severity === 'Critical'
        ? base + 'bg-gradient-to-r from-amber-500 to-rose-500'
        : base + 'bg-amber-400';
    }
    return base + 'bg-gradient-to-r from-emerald-500 to-cyan-400';
  }
}
