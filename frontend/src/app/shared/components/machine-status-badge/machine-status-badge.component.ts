import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineStatus } from '../../../core/models/models';

@Component({
  selector: 'app-machine-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass">
      <span [class]="dotClass"></span>
      {{ status }}
    </span>
  `
})
export class MachineStatusBadgeComponent {
  @Input({ required: true }) status: MachineStatus = 'Stopped';

  get badgeClass(): string {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ';
    switch (this.status) {
      case 'Running':
        return base + 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 status-running-glow';
      case 'Warning':
        return base + 'bg-amber-500/15 text-amber-400 border border-amber-500/40 status-warning-glow animate-pulse-fast';
      case 'Critical':
        return base + 'bg-rose-500/20 text-rose-400 border border-rose-500/50 status-critical-glow animate-bounce';
      case 'Maintenance':
        return base + 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      default:
        return base + 'bg-slate-700/40 text-slate-400 border border-slate-600/30';
    }
  }

  get dotClass(): string {
    const base = 'w-1.5 h-1.5 rounded-full ';
    switch (this.status) {
      case 'Running': return base + 'bg-emerald-400 animate-pulse';
      case 'Warning': return base + 'bg-amber-400';
      case 'Critical': return base + 'bg-rose-500 animate-ping';
      case 'Maintenance': return base + 'bg-purple-400';
      default: return base + 'bg-slate-400';
    }
  }
}
