import { routes } from './app.routes';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PlantComponent } from './features/plant/plant.component';
import { MachinesComponent } from './features/machines/machines.component';
import { MachineDetailsComponent } from './features/machine-details/machine-details.component';
import { AlertsComponent } from './features/alerts/alerts.component';

describe('App Routes', () => {
  it('should define top-level routes', () => {
    expect(routes.length).toBeGreaterThan(0);
    const mainRoute = routes.find(r => r.component === MainLayoutComponent);
    expect(mainRoute).toBeTruthy();
  });

  it('should define child routes under MainLayoutComponent', () => {
    const mainRoute = routes.find(r => r.component === MainLayoutComponent);
    const children = mainRoute?.children || [];

    const dashboard = children.find(r => r.path === 'dashboard');
    expect(dashboard?.component).toBe(DashboardComponent);

    const plant = children.find(r => r.path === 'plant');
    expect(plant?.component).toBe(PlantComponent);

    const machines = children.find(r => r.path === 'machines');
    expect(machines?.component).toBe(MachinesComponent);

    const machineDetails = children.find(r => r.path === 'machines/:id');
    expect(machineDetails?.component).toBe(MachineDetailsComponent);

    const alerts = children.find(r => r.path === 'alerts');
    expect(alerts?.component).toBe(AlertsComponent);
  });

  it('should redirect empty path to dashboard', () => {
    const mainRoute = routes.find(r => r.component === MainLayoutComponent);
    const children = mainRoute?.children || [];
    const redirect = children.find(r => r.path === '');

    expect(redirect?.redirectTo).toBe('dashboard');
    expect(redirect?.pathMatch).toBe('full');
  });

  it('should redirect wildcard path to dashboard', () => {
    const wildcard = routes.find(r => r.path === '**');
    expect(wildcard?.redirectTo).toBe('dashboard');
  });
});
