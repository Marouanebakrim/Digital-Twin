import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertBadgeComponent } from './alert-badge.component';

describe('AlertBadgeComponent', () => {
  let component: AlertBadgeComponent;
  let fixture: ComponentFixture<AlertBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display severity text', () => {
    component.severity = 'Warning';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Warning');
  });

  describe('badgeClass', () => {
    it('should return rose classes for Critical', () => {
      component.severity = 'Critical';
      expect(component.badgeClass).toContain('text-rose-400');
      expect(component.badgeClass).toContain('bg-rose-500/20');
    });

    it('should return amber classes for Warning', () => {
      component.severity = 'Warning';
      expect(component.badgeClass).toContain('text-amber-400');
      expect(component.badgeClass).toContain('bg-amber-500/20');
    });

    it('should return cyan classes for Info (default)', () => {
      component.severity = 'Info';
      expect(component.badgeClass).toContain('text-cyan-400');
      expect(component.badgeClass).toContain('bg-cyan-500/20');
    });
  });
});
