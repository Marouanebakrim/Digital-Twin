import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AlertNotificationComponent } from '../../shared/components/alert-notification/alert-notification.component';
import { SignalrService } from '../../core/services/signalr.service';
import { AlertItem } from '../../core/models/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    AlertNotificationComponent
  ],
  template: `
    <div class="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <app-header></app-header>

      <div class="flex flex-1">
        <app-sidebar></app-sidebar>

        <main class="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Live Toast Alert Notification -->
      <app-alert-notification
        [alert]="latestAlert"
        (dismiss)="latestAlert = null"
      ></app-alert-notification>
    </div>
  `
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private signalr = inject(SignalrService);
  private alertSub?: Subscription;

  latestAlert: AlertItem | null = null;

  ngOnInit(): void {
    this.alertSub = this.signalr.alertCreated$.subscribe(alert => {
      this.latestAlert = alert;
      // Auto dismiss after 7 seconds
      setTimeout(() => {
        if (this.latestAlert?.id === alert.id) {
          this.latestAlert = null;
        }
      }, 7000);
    });
  }

  ngOnDestroy(): void {
    this.alertSub?.unsubscribe();
  }
}
