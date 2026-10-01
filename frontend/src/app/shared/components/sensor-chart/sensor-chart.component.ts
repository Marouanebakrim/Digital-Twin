import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { SensorReading } from '../../../core/models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-sensor-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="glass-card rounded-xl p-4 border transition-all duration-300"
      [ngClass]="{
        'border-amber-500/50 bg-amber-950/10': isWarning,
        'border-rose-500/60 bg-rose-950/15': isCritical,
        'border-slate-800/80': !isWarning && !isCritical
      }"
    >
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="flex items-center gap-2">
            <h5 class="text-sm font-bold text-white">{{ title }}</h5>
            <span *ngIf="latestValue !== null"
              class="text-xs font-mono font-bold px-2 py-0.5 rounded transition-all"
              [ngClass]="{
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': !isWarning && !isCritical,
                'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse': isWarning,
                'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-bounce': isCritical
              }"
            >
              {{ latestValue | number:'1.2-2' }} {{ unit }}
            </span>
          </div>
          <p class="text-[11px] text-slate-400 font-mono mt-0.5" *ngIf="maxValue !== undefined">
            Max Limit: {{ maxValue }} {{ unit }}
            <span *ngIf="criticalThreshold" class="text-rose-400/90 ml-2">
              (Critical: {{ criticalThreshold | number:'1.2-2' }} {{ unit }})
            </span>
          </p>
        </div>
        <span
          class="text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-colors"
          [ngClass]="{
            'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20': !isWarning && !isCritical,
            'bg-amber-500/20 text-amber-400 border border-amber-500/40': isWarning,
            'bg-rose-500/20 text-rose-400 border border-rose-500/40': isCritical
          }"
        >
          {{ isCritical ? '● CRITICAL EXCEEDED' : isWarning ? '● WARNING THRESHOLD' : '● Live Telemetry' }}
        </span>
      </div>

      <div class="relative h-48 w-full">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `
})
export class SensorChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() title: string = 'Sensor Trend';
  @Input() unit: string = '';
  @Input() readings: SensorReading[] = [];
  @Input() minValue?: number;
  @Input() maxValue?: number;

  latestValue: number | null = null;
  isWarning: boolean = false;
  isCritical: boolean = false;
  criticalThreshold?: number;

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.calculateThresholds();
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.calculateThresholds();
    if (changes['readings'] && this.chart) {
      this.updateChartData();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private calculateThresholds(): void {
    if (this.maxValue !== undefined && this.minValue !== undefined) {
      const range = this.maxValue - this.minValue;
      this.criticalThreshold = this.maxValue + range * 0.10;
    } else if (this.maxValue !== undefined) {
      this.criticalThreshold = this.maxValue * 1.10;
    }

    if (this.readings.length > 0) {
      const latest = this.readings[this.readings.length - 1].value;
      this.latestValue = latest;
      if (this.criticalThreshold !== undefined && latest > this.criticalThreshold) {
        this.isCritical = true;
        this.isWarning = false;
      } else if (this.maxValue !== undefined && latest > this.maxValue) {
        this.isWarning = true;
        this.isCritical = false;
      } else {
        this.isWarning = false;
        this.isCritical = false;
      }
    }
  }

  private createChart(): void {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const sorted = [...this.readings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const labels = sorted.map(r => new Date(r.timestamp).toLocaleTimeString());
    const dataValues = sorted.map(r => r.value);

    // Color based on status
    const lineColor = this.isCritical ? '#f43f5e' : this.isWarning ? '#f59e0b' : '#06b6d4';

    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    if (this.isCritical) {
      gradient.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
    } else if (this.isWarning) {
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    }

    const datasets: any[] = [
      {
        label: `${this.title} (${this.unit})`,
        data: dataValues,
        borderColor: lineColor,
        borderWidth: 2.5,
        pointBackgroundColor: lineColor,
        pointBorderColor: '#090d16',
        pointHoverRadius: 6,
        pointRadius: 3,
        fill: true,
        backgroundColor: gradient,
        tension: 0.35
      }
    ];

    // Add Max Threshold line if configured
    if (this.maxValue !== undefined && dataValues.length > 0) {
      datasets.push({
        label: `Warning Threshold (${this.maxValue} ${this.unit})`,
        data: Array(dataValues.length).fill(this.maxValue),
        borderColor: 'rgba(245, 158, 11, 0.65)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      });
    }

    // Add Critical Threshold line if configured
    if (this.criticalThreshold !== undefined && dataValues.length > 0) {
      datasets.push({
        label: `Critical Threshold (${this.criticalThreshold.toFixed(2)} ${this.unit})`,
        data: Array(dataValues.length).fill(this.criticalThreshold),
        borderColor: 'rgba(244, 63, 94, 0.75)',
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false
      });
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.maxValue !== undefined,
            position: 'top',
            labels: {
              boxWidth: 12,
              color: '#94a3b8',
              font: { size: 10 }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#38bdf8',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } },
            suggestedMin: this.minValue !== undefined ? this.minValue * 0.9 : undefined,
            suggestedMax: this.criticalThreshold !== undefined ? this.criticalThreshold * 1.15 : undefined
          }
        }
      }
    });
  }

  private updateChartData(): void {
    if (!this.chart) return;
    const sorted = [...this.readings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const labels = sorted.map(r => new Date(r.timestamp).toLocaleTimeString());
    const dataValues = sorted.map(r => r.value);

    const lineColor = this.isCritical ? '#f43f5e' : this.isWarning ? '#f59e0b' : '#06b6d4';

    this.chart.data.labels = labels;
    const ds0 = this.chart.data.datasets[0] as any;
    if (ds0) {
      ds0.data = dataValues;
      ds0.borderColor = lineColor;
      ds0.pointBackgroundColor = lineColor;
    }

    if (this.maxValue !== undefined && this.chart.data.datasets[1]) {
      this.chart.data.datasets[1].data = Array(dataValues.length).fill(this.maxValue);
    }
    if (this.criticalThreshold !== undefined && this.chart.data.datasets[2]) {
      this.chart.data.datasets[2].data = Array(dataValues.length).fill(this.criticalThreshold);
    }

    this.chart.update('none'); // silent update for performance
  }
}
