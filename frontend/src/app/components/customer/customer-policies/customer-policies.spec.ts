import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPolicies } from './customer-policies';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

describe('CustomerPolicies', () => {
    let component: CustomerPolicies;
    let fixture: ComponentFixture<CustomerPolicies>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerPolicies],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                {
                    provide: ActivatedRoute,
                    useValue: {}
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomerPolicies);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
