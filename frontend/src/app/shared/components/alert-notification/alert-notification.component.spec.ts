import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertNotificationComponent } from './alert-notification.component';
import { AlertItem } from '../../../core/models/models';

describe('AlertNotificationComponent', () => {
  let component: AlertNotificationComponent;
  let fixture: ComponentFixture<AlertNotificationComponent>;

  const makeAlert = (overrides: Partial<AlertItem> = {}): AlertItem => ({
    id: 'a1', machineId: 'm1', machineName: 'Machine A', machineCode: 'MA-001',
    severity: 'Critical', type: 'SensorThreshold', title: 'Alert Title',
    message: 'Alert details', isAcknowledged: false, createdAt: new Date().toISOString(),
    ...overrides
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertNotificationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertNotificationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not render notification when alert is null', () => {
    component.alert = null;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fixed')).toBeNull();
  });

  it('should render notification when alert is provided', () => {
    component.alert = makeAlert();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alert Title');
    expect(el.textContent).toContain('Alert details');
    expect(el.textContent).toContain('MA-001');
    expect(el.textContent).toContain('Machine A');
  });

  it('should emit dismiss event on close button click', () => {
    component.alert = makeAlert();
    fixture.detectChanges();

    spyOn(component.dismiss, 'emit');
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();

    expect(component.dismiss.emit).toHaveBeenCalled();
  });
});
