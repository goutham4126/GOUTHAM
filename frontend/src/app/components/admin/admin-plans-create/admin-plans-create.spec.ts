import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPlansCreate } from './admin-plans-create';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminPlansCreate', () => {
    let component: AdminPlansCreate;
    let fixture: ComponentFixture<AdminPlansCreate>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminPlansCreate],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AdminPlansCreate);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
