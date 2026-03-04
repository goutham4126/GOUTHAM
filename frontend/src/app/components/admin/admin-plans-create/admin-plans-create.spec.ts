import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPlansCreate } from './admin-plans-create';

describe('AdminPlansCreate', () => {
    let component: AdminPlansCreate;
    let fixture: ComponentFixture<AdminPlansCreate>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminPlansCreate]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPlansCreate);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
