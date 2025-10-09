import { supabase } from "@/integrations/supabase/client";

export class RealtimeSession {
  private channel: any;
  private onSdpCallback: ((sdp: any) => void) | null = null;
  private onIceCandidateCallback: ((candidate: any) => void) | null = null;

  constructor(private sessionId: string) {
    this.channel = supabase.channel(`webrtc_session_${sessionId}`);
  }

  public join() {
    this.channel
      .on('broadcast', { event: 'sdp' }, (payload: any) => {
        this.onSdpCallback?.(payload.sdp);
      })
      .on('broadcast', { event: 'ice_candidate' }, (payload: any) => {
        this.onIceCandidateCallback?.(payload.candidate);
      })
      .subscribe();
  }

  public sendSdp(sdp: any) {
    this.channel.send({
      type: 'broadcast',
      event: 'sdp',
      payload: { sdp },
    });
  }

  public sendIceCandidate(candidate: any) {
    this.channel.send({
      type: 'broadcast',
      event: 'ice_candidate',
      payload: { candidate },
    });
  }

  public onSdp(callback: (sdp: any) => void) {
    this.onSdpCallback = callback;
  }

  public onIceCandidate(callback: (candidate: any) => void) {
    this.onIceCandidateCallback = callback;
  }

  public leave() {
    this.channel.unsubscribe();
  }
}