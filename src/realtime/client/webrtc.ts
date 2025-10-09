import { RealtimeSession } from '../session';
import { AIProviderConfig, AIBehavior } from '@/lib/ai-provider-utils';

const DEFAULT_INSTRUCTIONS = "You are a helpful assistant.";

export class WebRTCClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private audioStream: MediaStream | null = null;
  private session: RealtimeSession;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onMessageCallback: ((message: any) => void) | null = null;

  constructor(session: RealtimeSession) {
    this.session = session;
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.session.sendIceCandidate(event.candidate);
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'connected') {
        this.onConnectCallback?.();
      }
      if (this.peerConnection?.connectionState === 'disconnected' || this.peerConnection?.connectionState === 'failed') {
        this.onDisconnectCallback?.();
      }
    };
  }

  private setupDataChannel() {
    if (this.dataChannel) {
      this.dataChannel.onmessage = (event) => {
        this.onMessageCallback?.(JSON.parse(event.data));
      };
    }
  }

  public async start(isOfferer: boolean) {
    if (isOfferer) {
      this.dataChannel = this.peerConnection!.createDataChannel('chat');
      this.setupDataChannel();
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      this.session.sendSdp(offer);
    }
  }

  public async handleSdp(sdp: RTCSessionDescriptionInit) {
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(sdp));
    if (sdp.type === 'offer') {
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      this.session.sendSdp(answer);
    }
  }

  public async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
  }

  public sendMessage(message: any) {
    this.dataChannel?.send(JSON.stringify(message));
  }

  public async startAudio() {
    this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioTrack = this.audioStream.getAudioTracks()[0];
    this.peerConnection!.addTrack(this.audioTrack, this.audioStream);
  }

  public stopAudio() {
    this.audioTrack?.stop();
    if (this.audioStream && this.audioTrack) {
      const sender = this.peerConnection?.getSenders().find(s => s.track === this.audioTrack);
      if (sender) {
        this.peerConnection?.removeTrack(sender);
      }
    }
  }

  public onConnect(callback: () => void) {
    this.onConnectCallback = callback;
  }

  public onDisconnect(callback: () => void) {
    this.onDisconnectCallback = callback;
  }

  public onMessage(callback: (message: any) => void) {
    this.onMessageCallback = callback;
  }

  public close() {
    this.peerConnection?.close();
  }

  public sendAiConfig(provider: AIProviderConfig, behavior: AIBehavior) {
    const config = {
      ...provider,
      ...behavior,
    };
    this.sendMessage({
      type: 'ai_config',
      payload: {
        provider: config.provider,
        model: config.model,
        modalities: ['text', 'audio'],
            instructions: config.systemPrompt || DEFAULT_INSTRUCTIONS,
            voice: 'alloy',
      },
    });
  }
}