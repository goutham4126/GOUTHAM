import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentCustomers } from './agent-customers';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AgentCustomers', () => {
    let component: AgentCustomers;
    let fixture: ComponentFixture<AgentCustomers>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AgentCustomers],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AgentCustomers);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
