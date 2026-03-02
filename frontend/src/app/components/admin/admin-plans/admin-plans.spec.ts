import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPlans } from './admin-plans';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminPlans', () => {
    let component: AdminPlans;
    let fixture: ComponentFixture<AdminPlans>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminPlans],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AdminPlans);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
