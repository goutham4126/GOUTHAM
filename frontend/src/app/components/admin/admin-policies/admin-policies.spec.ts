import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPolicies } from './admin-policies';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminPolicies', () => {
    let component: AdminPolicies;
    let fixture: ComponentFixture<AdminPolicies>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminPolicies],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AdminPolicies);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
