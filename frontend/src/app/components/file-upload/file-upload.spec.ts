import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUpload } from './file-upload';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('FileUploadComponent', () => {
    let component: FileUpload;
    let fixture: ComponentFixture<FileUpload>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FileUpload],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FileUpload);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
