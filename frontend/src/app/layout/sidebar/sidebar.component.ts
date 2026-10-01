import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 z-30">
      <!-- Navigation Links -->
      <div class="p-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Navigation</p>

        <a
          routerLink="/dashboard"
          routerLinkActive="bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
          [routerLinkActiveOptions]="{exact: true}"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition-all group"
        >
          <svg class="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Dashboard</span>
        </a>

        <a
          routerLink="/plant"
          routerLinkActive="bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition-all group"
        >
          <svg class="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Plant Overview</span>
        </a>

        <a
          routerLink="/machines"
          routerLinkActive="bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition-all group"
        >
          <svg class="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.428 1.428l-.4 1.6a2 2 0 001.428 2.372l11.4 1.9a2 2 0 002.372-1.428l.456-1.824zM12 4a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
          <span>Machines</span>
        </a>

        <a
          routerLink="/alerts"
          routerLinkActive="bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition-all group"
        >
          <svg class="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>Alerts Feed</span>
        </a>
      </div>

      <!-- Footer Info -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div class="text-[11px] text-slate-500 space-y-1">
          <p class="font-bold text-slate-400">OCP Digital Twin v1.0</p>
          <p>Real-time Telemetry Engine</p>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {}
