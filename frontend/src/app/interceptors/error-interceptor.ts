import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Don't redirect for 401 Unauthorized as AuthInterceptor handles it
            if (error.status !== 401) {
                let errorMessage = 'An unexpected error occurred.';
                let errorStatus = error.status ? error.status.toString() : '500';

                if (error.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = error.error.message;
                } else {
                    // Server-side error
                    errorMessage = error.message || error.statusText || 'Server Error';
                }

                router.navigate(['/error'], {
                    queryParams: { status: errorStatus, message: errorMessage },
                    skipLocationChange: true // Optional: Keeps original URL while showing error page
                });
            }

            return throwError(() => error);
        })
    );
};
