import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastComponent } from './toast';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ToastComponent', () => {
    let component: ToastComponent;
    let fixture: ComponentFixture<ToastComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ToastComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ToastComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
