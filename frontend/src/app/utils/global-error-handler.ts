import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private injector: Injector) { }

    handleError(error: any) {
        console.error('Global Error Handler caught an error:', error);

        // Use injector to get router to avoid circular dependency
        const router = this.injector.get(Router);

        // Extract a meaningful error message
        const message = error.message ? error.message : error.toString();

        // Redirect to the error page
        router.navigate(['/error'], {
            queryParams: { status: 'Error', message: message },
            skipLocationChange: true
        });
    }
}
