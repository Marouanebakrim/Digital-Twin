import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-xl p-5 border border-slate-800/80 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden group">
      <div [class]="bgGlowClass"></div>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ label }}</p>
          <h3 class="text-2xl font-extrabold text-white mt-1 tracking-tight">
            {{ value }}
            <span *ngIf="unit" class="text-sm font-medium text-slate-400 ml-1">{{ unit }}</span>
          </h3>
          <p *ngIf="subtitle" class="text-xs text-slate-500 mt-1">{{ subtitle }}</p>
        </div>
        <div [class]="iconBgClass">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input({ required: true }) label: string = '';
  @Input({ required: true }) value: string | number = 0;
  @Input() unit?: string;
  @Input() subtitle?: string;
  @Input() variant: 'default' | 'running' | 'warning' | 'critical' | 'cyan' = 'default';

  get bgGlowClass(): string {
    const base = 'absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-500 group-hover:opacity-40 ';
    switch (this.variant) {
      case 'running': return base + 'bg-emerald-500';
      case 'warning': return base + 'bg-amber-500';
      case 'critical': return base + 'bg-rose-500';
      case 'cyan': return base + 'bg-cyan-500';
      default: return base + 'bg-blue-500';
    }
  }

  get iconBgClass(): string {
    const base = 'w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ';
    switch (this.variant) {
      case 'running': return base + 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning': return base + 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'critical': return base + 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'cyan': return base + 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return base + 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }
}
