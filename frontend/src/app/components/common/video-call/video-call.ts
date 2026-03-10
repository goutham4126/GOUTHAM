import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VideoCallService } from '../../../services/video-call/video-call.service';

@Component({
    selector: 'app-video-call',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './video-call.html',
    styleUrl: './video-call.css'
})
export class VideoCall implements OnInit, OnDestroy {
    public videoCallService = inject(VideoCallService);
    private router = inject(Router);

    private _localVideoContainer?: ElementRef;
    @ViewChild('localVideoContainer') set localVideoContainer(el: ElementRef | undefined) {
        this._localVideoContainer = el;
        if (el) this.playLocalVideo(el.nativeElement);
    }

    private _remoteVideoContainer?: ElementRef;
    @ViewChild('remoteVideoContainer') set remoteVideoContainer(el: ElementRef | undefined) {
        this._remoteVideoContainer = el;
        if (el) this.playRemoteVideo(el.nativeElement);
    }

    private localVideoPlaying = false;
    private remoteVideoPlaying = false;

    private cdr = inject(ChangeDetectorRef);

    constructor() {
        // Effect to handle local video playing when call state becomes 'in-call'
        effect(() => {
            const state = this.videoCallService.callState();
            if (state === 'in-call') {
                // Defer slightly to allow DOM to render the container
                setTimeout(() => {
                    if (this._localVideoContainer?.nativeElement) {
                        this.playLocalVideo(this._localVideoContainer.nativeElement);
                    }
                }, 100);
            }
        });

        // Effect to handle remote video playing when remoteUsers array changes
        effect(() => {
            const users = this.videoCallService.remoteUsers();
            if (users.length > 0) {
                // Defer slightly to allow DOM to render the container
                setTimeout(() => {
                    if (this._remoteVideoContainer?.nativeElement) {
                        this.playRemoteVideo(this._remoteVideoContainer.nativeElement);
                    }
                }, 100);
            }
        });
    }

    ngOnInit() {
    }

    private playLocalVideo(container: HTMLElement) {
        if (this.videoCallService.callState() === 'in-call') {
            const localTrack = this.videoCallService.getLocalVideoTrack();
            if (localTrack && !this.localVideoPlaying) {
                try {
                    localTrack.play(container);
                    this.localVideoPlaying = true;
                } catch (e) {
                    console.warn('Local video already playing', e);
                }
            }
        }
    }

    private playRemoteVideo(container: HTMLElement) {
        if (this.videoCallService.callState() === 'in-call') {
            const remoteUsers = this.videoCallService.remoteUsers();
            if (remoteUsers.length > 0) {
                const remoteUser = remoteUsers[0];
                if (remoteUser.videoTrack && !this.remoteVideoPlaying) {
                    try {
                        remoteUser.videoTrack.play(container);
                        this.remoteVideoPlaying = true;
                    } catch (e) {
                        console.warn('Remote video already playing', e);
                    }
                }
                if (remoteUser.audioTrack && !remoteUser.audioTrack.isPlaying) {
                    try {
                        remoteUser.audioTrack.play();
                    } catch (e) { }
                }
            }
        }
    }

    ngOnDestroy() {
        this.localVideoPlaying = false;
        this.remoteVideoPlaying = false;
    }

    formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    endCall() {
        this.localVideoPlaying = false;
        this.remoteVideoPlaying = false;
        this.videoCallService.endCall();
    }

    toggleMute() {
        this.videoCallService.toggleMute();
    }

    toggleVideo() {
        this.videoCallService.toggleVideo();
    }

    goBack() {
        this.router.navigate(['/']);
    }
}
