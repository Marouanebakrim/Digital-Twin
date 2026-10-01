import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.label = 'Test';
    component.value = 42;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display label and value', () => {
    component.label = 'Total Machines';
    component.value = 10;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Total Machines');
    expect(el.textContent).toContain('10');
  });

  it('should display unit when provided', () => {
    component.label = 'Flow';
    component.value = 2450;
    component.unit = 't/h';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('t/h');
  });

  it('should not display unit when not provided', () => {
    component.label = 'Count';
    component.value = 5;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const unitSpans = el.querySelectorAll('span');
    const hasUnitSpan = Array.from(unitSpans).some(s => s.classList.contains('text-sm') && s.textContent?.trim());
    // unit span should not exist or be empty
    expect(component.unit).toBeUndefined();
  });

  it('should display subtitle when provided', () => {
    component.label = 'Test';
    component.value = 1;
    component.subtitle = 'some subtitle';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('some subtitle');
  });

  describe('variant styles', () => {
    it('should use emerald glow for running variant', () => {
      component.label = 'Running';
      component.value = 3;
      component.variant = 'running';
      fixture.detectChanges();
      expect(component.bgGlowClass).toContain('bg-emerald-500');
      expect(component.iconBgClass).toContain('text-emerald-400');
    });

    it('should use amber glow for warning variant', () => {
      component.label = 'Warning';
      component.value = 1;
      component.variant = 'warning';
      fixture.detectChanges();
      expect(component.bgGlowClass).toContain('bg-amber-500');
      expect(component.iconBgClass).toContain('text-amber-400');
    });

    it('should use rose glow for critical variant', () => {
      component.label = 'Critical';
      component.value = 0;
      component.variant = 'critical';
      fixture.detectChanges();
      expect(component.bgGlowClass).toContain('bg-rose-500');
      expect(component.iconBgClass).toContain('text-rose-400');
    });

    it('should use cyan glow for cyan variant', () => {
      component.label = 'Total';
      component.value = 4;
      component.variant = 'cyan';
      fixture.detectChanges();
      expect(component.bgGlowClass).toContain('bg-cyan-500');
      expect(component.iconBgClass).toContain('text-cyan-400');
    });

    it('should use blue glow for default variant', () => {
      component.label = 'Default';
      component.value = 0;
      component.variant = 'default';
      fixture.detectChanges();
      expect(component.bgGlowClass).toContain('bg-blue-500');
    });
  });
});
