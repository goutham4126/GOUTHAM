import { HttpInterceptorFn } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * ISO 8601 date string WITHOUT a timezone suffix, e.g. "2026-03-10T13:30:00"
 * The backend (ASP.NET Core) serialises DateTime values in this format.
 * Without the trailing 'Z', JavaScript/Angular treats the string as *local*
 * time instead of UTC, producing a +05:30 shift for IST users.
 *
 * This interceptor walks every JSON response and appends 'Z' to any bare
 * datetime string so that Date parsing is always UTC-aware.
 */
const ISO_DATE_NO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

function fixDates(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string' && ISO_DATE_NO_TZ.test(value)) {
        return value + 'Z';
    }

    if (Array.isArray(value)) {
        return value.map(fixDates);
    }

    if (typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(value as object)) {
            result[key] = fixDates((value as Record<string, unknown>)[key]);
        }
        return result;
    }

    return value;
}

export const utcDateInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        map(event => {
            // Only process HttpResponse bodies that contain objects / arrays
            if (
                event &&
                (event as any).body !== undefined &&
                (event as any).body !== null
            ) {
                (event as any) = (event as any).clone({
                    body: fixDates((event as any).body)
                });
            }
            return event;
        })
    );
};
