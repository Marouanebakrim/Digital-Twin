import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalrService } from '../../core/services/signalr.service';
import { SimulatorService } from '../../core/services/simulator.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-40">
      <!-- Left Branding -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
          <div class="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
            <span class="font-extrabold text-xs text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">OCP</span>
          </div>
        </div>
        <div>
          <h1 class="text-sm font-extrabold text-white tracking-tight uppercase">Industrial Digital Twin</h1>
          <p class="text-[11px] text-slate-400">Phosphate Mining & Processing Plant 01</p>
        </div>
      </div>

      <!-- Right Actions & Simulator Mode Controls -->
      <div class="flex items-center gap-4">
        <!-- Simulator Mode Quick Controls -->
        <div class="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <span class="text-[10px] font-semibold uppercase text-slate-500 px-2">Sim Mode:</span>
          <button
            *ngFor="let m of modes"
            (click)="setMode(m.id)"
            [class]="currentMode === m.id ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
            class="px-2.5 py-1 rounded text-xs font-semibold transition-all capitalize"
          >
            {{ m.label }}
          </button>
        </div>

        <!-- SignalR Connection Status -->
        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
          <span
            class="w-2 h-2 rounded-full"
            [class.bg-emerald-400]="signalr.isConnected()"
            [class.animate-pulse]="signalr.isConnected()"
            [class.bg-amber-400]="signalr.connectionState() === 'Reconnecting' || signalr.connectionState() === 'Connecting'"
            [class.bg-rose-500]="!signalr.isConnected() && signalr.connectionState() === 'Disconnected'"
          ></span>
          <span [class.text-emerald-400]="signalr.isConnected()" [class.text-amber-400]="!signalr.isConnected()">
            {{ signalr.connectionState() }}
          </span>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  signalr = inject(SignalrService);
  simulator = inject(SimulatorService);

  currentMode: string = 'normal';

  modes = [
    { id: 'normal', label: 'Normal' },
    { id: 'warning', label: 'Warning' },
    { id: 'critical', label: 'Critical' },
    { id: 'scenario', label: '💥 Crusher Scenario' }
  ];

  ngOnInit(): void {
    this.simulator.getStatus().subscribe({
      next: res => this.currentMode = res.mode || 'normal',
      error: () => {}
    });
  }

  setMode(mode: string): void {
    this.currentMode = mode;
    this.simulator.setMode(mode as any).subscribe({
      next: () => console.log(`Simulator mode changed to ${mode}`),
      error: err => console.error('Failed to change simulator mode', err)
    });
  }
}
