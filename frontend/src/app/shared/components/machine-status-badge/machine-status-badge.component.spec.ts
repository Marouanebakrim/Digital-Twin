import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MachineStatusBadgeComponent } from './machine-status-badge.component';

describe('MachineStatusBadgeComponent', () => {
  let component: MachineStatusBadgeComponent;
  let fixture: ComponentFixture<MachineStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineStatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MachineStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display status text', () => {
    component.status = 'Running';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Running');
  });

  describe('badgeClass', () => {
    it('should return emerald classes for Running', () => {
      component.status = 'Running';
      expect(component.badgeClass).toContain('text-emerald-400');
    });

    it('should return amber classes for Warning', () => {
      component.status = 'Warning';
      expect(component.badgeClass).toContain('text-amber-400');
    });

    it('should return rose classes for Critical', () => {
      component.status = 'Critical';
      expect(component.badgeClass).toContain('text-rose-400');
    });

    it('should return purple classes for Maintenance', () => {
      component.status = 'Maintenance';
      expect(component.badgeClass).toContain('text-purple-400');
    });

    it('should return slate classes for Stopped (default)', () => {
      component.status = 'Stopped';
      expect(component.badgeClass).toContain('text-slate-400');
    });
  });

  describe('dotClass', () => {
    it('should return emerald dot for Running with pulse', () => {
      component.status = 'Running';
      expect(component.dotClass).toContain('bg-emerald-400');
      expect(component.dotClass).toContain('animate-pulse');
    });

    it('should return amber dot for Warning', () => {
      component.status = 'Warning';
      expect(component.dotClass).toContain('bg-amber-400');
    });

    it('should return rose dot for Critical with ping', () => {
      component.status = 'Critical';
      expect(component.dotClass).toContain('bg-rose-500');
      expect(component.dotClass).toContain('animate-ping');
    });

    it('should return purple dot for Maintenance', () => {
      component.status = 'Maintenance';
      expect(component.dotClass).toContain('bg-purple-400');
    });

    it('should return slate dot for Stopped', () => {
      component.status = 'Stopped';
      expect(component.dotClass).toContain('bg-slate-400');
    });
  });
});
