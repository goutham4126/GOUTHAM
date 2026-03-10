import { Injectable, inject, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';
import AgoraRTC, {
    IAgoraRTCClient,
    IMicrophoneAudioTrack,
    ICameraVideoTrack,
    IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { AuthService } from '../auth/auth';
import { ToastService } from '../toast/toast';
import { ENV_CONFIG } from '../../utils/storage.constants';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'in-call' | 'ended';

export interface IncomingCallInfo {
    claimId: string;
    channelName: string;
    callerName: string;
}

@Injectable({
    providedIn: 'root'
})
export class VideoCallService {
    private hubConnection: signalR.HubConnection | undefined;
    private readonly hubUrl = 'https://localhost:7128/hubs/videocall';

    private agoraClient: IAgoraRTCClient | null = null;
    private localAudioTrack: IMicrophoneAudioTrack | null = null;
    private localVideoTrack: ICameraVideoTrack | null = null;

    // Reactive signals
    public callState = signal<CallState>('idle');
    public incomingCall = signal<IncomingCallInfo | null>(null);
    public remoteUsers = signal<IAgoraRTCRemoteUser[]>([]);
    public currentChannelName = signal<string>('');
    public currentClaimId = signal<string>('');
    public isMuted = signal<boolean>(false);
    public isVideoOff = signal<boolean>(false);
    public callDuration = signal<number>(0);
    public callerName = signal<string>('');

    private durationInterval: any = null;
    private ringtoneTimeout: any = null;

    private authService = inject(AuthService);
    private toastService = inject(ToastService);
    private router = inject(Router);
    private ngZone = inject(NgZone);

    public startConnection(token: string) {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.start()
            .then(() => console.log('VideoCall SignalR Hub connected'))
            .catch(err => console.error('VideoCall Hub error: ' + err));

        // Listen for incoming call
        this.hubConnection.on('IncomingVideoCall', (claimId: string, channelName: string, callerName: string) => {
            this.ngZone.run(() => {
                this.incomingCall.set({ claimId, channelName, callerName });
                this.callerName.set(callerName);
                this.callState.set('ringing');

                // Auto-reject after 30 seconds
                this.ringtoneTimeout = setTimeout(() => {
                    if (this.callState() === 'ringing') {
                        this.rejectCall(claimId);
                    }
                }, 30000);
            });
        });

        // Listen for call accepted
        this.hubConnection.on('CallAccepted', (claimId: string, channelName: string) => {
            this.ngZone.run(() => {
                this.currentChannelName.set(channelName);
                this.currentClaimId.set(claimId);
                this.joinAgoraChannel(channelName);
            });
        });

        // Listen for call rejected
        this.hubConnection.on('CallRejected', (_claimId: string) => {
            this.ngZone.run(() => {
                this.toastService.error('The customer declined the video call.');
                this.resetCallState();
            });
        });

        // Listen for call ended
        this.hubConnection.on('CallEnded', (_claimId: string) => {
            this.ngZone.run(() => {
                this.toastService.success('The other party ended the call.');
                this.leaveChannel();
            });
        });
    }

    public stopConnection() {
        this.hubConnection?.stop()
            .then(() => console.log('VideoCall Hub disconnected'))
            .catch(err => console.error('VideoCall Hub stop error: ' + err));
    }

    // Claims Officer initiates a video call
    public async initiateCall(claimId: string) {
        if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
            this.toastService.error('Video call service not connected. Please try again.');
            return;
        }
        this.callState.set('calling');
        this.currentClaimId.set(claimId);
        this.currentChannelName.set(`claim-${claimId}`);
        try {
            await this.hubConnection.invoke('InitiateCall', claimId);
            this.toastService.success('Calling customer... Waiting for them to answer.');

            // Auto-cancel after 30 seconds if no response
            this.ringtoneTimeout = setTimeout(() => {
                if (this.callState() === 'calling') {
                    this.toastService.error('Customer did not answer.');
                    this.resetCallState();
                }
            }, 30000);
        } catch (err) {
            console.error('Error initiating call:', err);
            this.toastService.error('Failed to initiate video call.');
            this.resetCallState();
        }
    }

    // Customer accepts the call
    public async acceptCall(claimId: string) {
        clearTimeout(this.ringtoneTimeout);
        if (!this.hubConnection) return;

        const info = this.incomingCall();
        if (!info) return;

        // Immediately set connecting state BEFORE any async operations
        // so the video-call page will show the connecting UI
        this.callState.set('connecting');
        this.currentChannelName.set(info.channelName);
        this.currentClaimId.set(claimId);
        this.incomingCall.set(null);

        try {
            await this.hubConnection.invoke('AcceptCall', claimId);
            await this.joinAgoraChannel(info.channelName);
        } catch (err) {
            console.error('Error accepting call:', err);
            this.toastService.error('Failed to accept call.');
            this.resetCallState();
        }
    }

    // Customer rejects the call
    public async rejectCall(claimId: string) {
        clearTimeout(this.ringtoneTimeout);
        if (!this.hubConnection) return;

        this.incomingCall.set(null);
        this.resetCallState();

        try {
            await this.hubConnection.invoke('RejectCall', claimId);
        } catch (err) {
            console.error('Error rejecting call:', err);
        }
    }

    // Either party ends the call
    public async endCall() {
        const claimId = this.currentClaimId();
        if (!claimId || !this.hubConnection) return;

        try {
            await this.hubConnection.invoke('EndCall', claimId);
        } catch (err) {
            console.error('Error ending call:', err);
        }
        await this.leaveChannel();
    }

    // Join a scheduled call directly (bypasses SignalR ringing)
    public async joinScheduledCall(claimId: string) {
        const channelName = `claim-${claimId}`;
        this.callState.set('connecting');
        this.currentClaimId.set(claimId);
        this.currentChannelName.set(channelName);

        try {
            await this.joinAgoraChannel(channelName);
        } catch (err) {
            console.error('Error joining scheduled call:', err);
            this.toastService.error('Failed to join scheduled call.');
            this.resetCallState();
        }
    }

    // Join Agora channel
    private async joinAgoraChannel(channelName: string) {
        try {
            this.agoraClient = AgoraRTC.createClient({
                mode: 'rtc',
                codec: 'h264', // H264 often decodes faster on hardware than VP8
                role: 'host'   // Explicitly setting role helps with rendering speed
            });

            // Handle remote user events
            this.agoraClient.on('user-published', async (user, mediaType) => {
                await this.agoraClient!.subscribe(user, mediaType);
                this.ngZone.run(() => {
                    this.remoteUsers.set([...this.agoraClient!.remoteUsers]);
                });
            });

            this.agoraClient.on('user-unpublished', () => {
                this.ngZone.run(() => {
                    this.remoteUsers.set([...this.agoraClient!.remoteUsers]);
                });
            });

            this.agoraClient.on('user-left', () => {
                this.ngZone.run(() => {
                    this.remoteUsers.set([...this.agoraClient!.remoteUsers]);
                });
            });

            // Fetch Agora token from backend (required when App Certificate is enabled)
            let token: string | null = null;
            try {
                const tokenResponse = await fetch(`https://localhost:7128/api/agora/token?channelName=${encodeURIComponent(channelName)}`, {
                    headers: {
                        'Authorization': `Bearer ${this.authService.currentUser()?.token}`
                    }
                });
                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    token = tokenData.token;
                    console.log('Fetched Agora token for channel:', channelName);
                } else {
                    console.warn('Failed to fetch Agora token, trying without token...');
                }
            } catch (tokenErr) {
                console.warn('Token fetch failed, trying without token...', tokenErr);
            }

            console.log('--- AGORA DEBUG ---');
            console.log('App ID being used:', ENV_CONFIG.AGORA_APP_ID);
            console.log('Channel:', channelName);
            console.log('Token length:', token ? token.length : 'null');

            const uid = await this.agoraClient.join(ENV_CONFIG.AGORA_APP_ID, channelName, token, null);
            console.log('Joined Agora channel:', channelName, 'UID:', uid);

            // Create tracks with specific configuration for faster startup
            this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                encoderConfig: '480p_1', // Use a lower resolution profile initially for faster first-frame rendering
                optimizationMode: 'detail'
            });
            await this.agoraClient.publish([this.localAudioTrack, this.localVideoTrack]);

            this.ngZone.run(() => {
                this.callState.set('in-call');
                this.startDurationTimer();
            });

        } catch (err: any) {
            console.error('Error joining Agora channel:', err);
            const errMsg = err?.message || err?.toString() || 'Unknown error';
            this.ngZone.run(() => {
                this.toastService.error(`Video call failed: ${errMsg}`);
                this.resetCallState();
            });
        }
    }

    // Leave Agora channel
    public async leaveChannel() {
        this.stopDurationTimer();

        if (this.localAudioTrack) {
            this.localAudioTrack.close();
            this.localAudioTrack = null;
        }
        if (this.localVideoTrack) {
            this.localVideoTrack.close();
            this.localVideoTrack = null;
        }
        if (this.agoraClient) {
            await this.agoraClient.leave();
            this.agoraClient = null;
        }

        this.remoteUsers.set([]);
        this.callState.set('ended');

        // Navigate back after a short delay
        setTimeout(() => {
            this.resetCallState();
            const role = this.authService.currentUser()?.role;
            if (role === 'ClaimOfficer') {
                this.router.navigate(['/claim-officer/dashboard']);
            } else {
                this.router.navigate(['/customer/claims']);
            }
        }, 1500);
    }

    // Toggle mute
    public toggleMute() {
        if (this.localAudioTrack) {
            const muted = !this.isMuted();
            this.localAudioTrack.setEnabled(!muted);
            this.isMuted.set(muted);
        }
    }

    // Toggle video
    public toggleVideo() {
        if (this.localVideoTrack) {
            const off = !this.isVideoOff();
            this.localVideoTrack.setEnabled(!off);
            this.isVideoOff.set(off);
        }
    }

    // Get local video track for playback
    public getLocalVideoTrack(): ICameraVideoTrack | null {
        return this.localVideoTrack;
    }

    private startDurationTimer() {
        this.callDuration.set(0);
        this.ngZone.runOutsideAngular(() => {
            this.durationInterval = setInterval(() => {
                this.ngZone.run(() => {
                    this.callDuration.update(d => d + 1);
                });
            }, 1000);
        });
    }

    private stopDurationTimer() {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
    }

    private resetCallState() {
        clearTimeout(this.ringtoneTimeout);
        this.callState.set('idle');
        this.currentChannelName.set('');
        this.currentClaimId.set('');
        this.isMuted.set(false);
        this.isVideoOff.set(false);
        this.callDuration.set(0);
        this.callerName.set('');
    }
}
