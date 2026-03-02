import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPlans } from './customer-plans';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CustomerPlans', () => {
    let component: CustomerPlans;
    let fixture: ComponentFixture<CustomerPlans>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerPlans],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomerPlans);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
