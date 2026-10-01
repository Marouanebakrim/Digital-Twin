import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PlantComponent } from './features/plant/plant.component';
import { MachinesComponent } from './features/machines/machines.component';
import { MachineDetailsComponent } from './features/machine-details/machine-details.component';
import { AlertsComponent } from './features/alerts/alerts.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, title: 'Dashboard - OCP Digital Twin' },
      { path: 'plant', component: PlantComponent, title: 'Plant Overview - OCP Digital Twin' },
      { path: 'machines', component: MachinesComponent, title: 'Machines - OCP Digital Twin' },
      { path: 'machines/:id', component: MachineDetailsComponent, title: 'Machine Details - OCP Digital Twin' },
      { path: 'alerts', component: AlertsComponent, title: 'Alerts Feed - OCP Digital Twin' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
