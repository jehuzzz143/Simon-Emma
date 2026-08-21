/* ==========================================================
   BACKGROUND MUSIC SOURCE — resolves the couple's chosen
   YouTube link (set in admin.html, stored in Supabase table
   site_settings) into a hidden YouTube player driven through
   an adapter that exposes just enough of the <audio> element
   surface (play/pause/paused/volume/currentTime/duration +
   play/pause/timeupdate/loadedmetadata events) for music.js
   and Intro.js to keep working unchanged.

   Falls back to the bundled <audio id="bgMusic"> (src/bg1.mp3)
   if no YouTube link is configured, or anything above fails.

   Exposes window.bgMusicReady — a single memoized Promise
   (shared by music.js and Intro.js) that resolves to whichever
   player ends up playable.
========================================================== */
(function () {
  const SUPABASE_URL = 'https://rxqmvguyntontpgxupeh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cW12Z3V5bnRvbnRwZ3h1cGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTEyMjAsImV4cCI6MjA5OTIyNzIyMH0.4bil8xGsGpMfOygS3JvGdLeP3_M99FCmOTKGgKsHX3s';
  const FALLBACK_START_TIME = 1;

  function extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    return new Promise((resolve) => {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        resolve(window.YT);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  }

  // Adapter: wraps a hidden YT.Player so it can stand in for the
  // <audio id="bgMusic"> element music.js/Intro.js were built around.
  class YouTubeAudio extends EventTarget {
    constructor(YT, videoId, startSeconds) {
      super();
      this.readyState = 0;
      this.defaultStartTime = startSeconds || 0;
      this._paused = true;
      this._volume = 1;
      this._duration = 0;

      const mount = document.createElement('div');
      mount.id = 'bgMusicYT';
      mount.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
      document.body.appendChild(mount);

      this._readyPromise = new Promise((resolveReady) => {
        this._player = new YT.Player(mount, {
          videoId,
          playerVars: {
            autoplay: 0, controls: 0, disablekb: 1, fs: 0,
            modestbranding: 1, playsinline: 1, rel: 0,
            loop: 1, playlist: videoId,
            start: this.defaultStartTime,
          },
          events: {
            onReady: () => {
              this._duration = this._player.getDuration() || 0;
              this.readyState = 1;
              this._isReady = true;
              this.dispatchEvent(new Event('loadedmetadata'));
              resolveReady();
            },
            onStateChange: (e) => this._onStateChange(e.data),
          },
        });
      });

      // YT's API has no native timeupdate event
      setInterval(() => {
        if (!this._paused) this.dispatchEvent(new Event('timeupdate'));
      }, 250);
    }

    _onStateChange(state) {
      const YT = window.YT;
      if (state === YT.PlayerState.PLAYING) {
        if (this._paused) { this._paused = false; this.dispatchEvent(new Event('play')); }
      } else if (state === YT.PlayerState.PAUSED) {
        if (!this._paused) { this._paused = true; this.dispatchEvent(new Event('pause')); }
      } else if (state === YT.PlayerState.ENDED) {
        // safety net; loop:1+playlist should already handle this
        this._player.seekTo(0, true);
        this._player.playVideo();
      }
    }

    play() {
      // call playVideo() synchronously, in the same tick as the caller's
      // click handler, whenever possible — an `await` here (even on an
      // already-resolved promise) pushes the postMessage call into a
      // later microtask, which can be enough for the browser to no
      // longer associate it with the user gesture that triggered it,
      // silently blocking playback in the cross-origin YouTube iframe.
      if (this._isReady) {
        this._player.playVideo();
        return Promise.resolve();
      }
      return this._readyPromise.then(() => this._player.playVideo());
    }
    pause() {
      if (this._player) this._player.pauseVideo();
    }
    get paused() { return this._paused; }
    get volume() { return this._volume; }
    set volume(v) {
      this._volume = Math.max(0, Math.min(1, v));
      if (this._player && this._player.setVolume) this._player.setVolume(Math.round(this._volume * 100));
    }
    get currentTime() {
      return (this._player && this._player.getCurrentTime) ? this._player.getCurrentTime() : 0;
    }
    set currentTime(t) {
      if (this._player && this._player.seekTo) this._player.seekTo(t, true);
    }
    get duration() { return this._duration; }
  }

  async function createYouTubeBackedPlayer(youtubeUrl, startSeconds) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return null;
    const YT = await loadYouTubeApi();
    const adapter = new YouTubeAudio(YT, videoId, startSeconds);
    await adapter._readyPromise;
    return adapter;
  }

  function fallbackAudio() {
    const audio = document.getElementById('bgMusic');
    if (audio) audio.defaultStartTime = FALLBACK_START_TIME;
    return audio;
  }

  async function init() {
    try {
      if (!window.supabase) throw new Error('supabase client library not loaded');
      // reuse a single client across scripts (main.js/admin.js) to avoid
      // the SDK's "multiple GoTrueClient instances" warning
      const client = window.supabaseClient || (window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
      const { data, error } = await client
        .from('site_settings')
        .select('youtube_url, start_time')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      if (data && data.youtube_url) {
        const player = await createYouTubeBackedPlayer(data.youtube_url, data.start_time || 0);
        if (player) return player;
      }
    } catch (err) {
      console.warn('Background music: falling back to local track —', err);
    }
    return fallbackAudio();
  }

  window.bgMusicReady = init();
})();
