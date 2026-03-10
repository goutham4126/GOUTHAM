import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VideoCallService } from '../../../services/video-call/video-call.service';

@Component({
    selector: 'app-incoming-call',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './incoming-call.html',
    styleUrl: './incoming-call.css'
})
export class IncomingCall {
    public videoCallService = inject(VideoCallService);
    private router = inject(Router);

    accept() {
        const info = this.videoCallService.incomingCall();
        if (!info) return;
        this.videoCallService.acceptCall(info.claimId);
        this.router.navigate(['/video-call', info.claimId]);
    }

    decline() {
        const info = this.videoCallService.incomingCall();
        if (!info) return;
        this.videoCallService.rejectCall(info.claimId);
    }
}
