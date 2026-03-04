import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast';
import { ToastService } from '../../../services/toast/toast';
import { CommonModule } from '@angular/common';

describe('ToastComponent', () => {
    let component: ToastComponent;
    let fixture: ComponentFixture<ToastComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ToastComponent, CommonModule],
            providers: [ToastService]
        }).compileComponents();
        fixture = TestBed.createComponent(ToastComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should return success icon', () => { expect(component.getIcon('success')).toBe('M5 13l4 4L19 7'); });
    it('should return error icon', () => { expect(component.getIcon('error')).toBe('M6 18L18 6M6 6l12 12'); });
    it('should return info icon for unknown type', () => { expect(component.getIcon('unknown')).toBeTruthy(); });
    it('should return warning icon', () => { expect(component.getIcon('warning')).toContain('M12'); });
    it('should return info icon', () => { expect(component.getIcon('info')).toContain('M21'); });
});
