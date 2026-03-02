import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentPolicies } from './agent-policies';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AgentPolicies', () => {
    let component: AgentPolicies;
    let fixture: ComponentFixture<AgentPolicies>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AgentPolicies],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AgentPolicies);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
