import EventBus from "./eventBus";

interface Config {
  src?: string;
  volume?: number;
  loop?: boolean;
  muted?: boolean;
  extraNode?: AudioNode[];
  fetchBuffer?: (src: string) => Promise<ArrayBuffer | null>;
}

interface Current {
  url: string;
  node: AudioBufferSourceNode | null;
  ended: boolean;
}

const defaultConfig: Required<Omit<Config, "fetchBuffer">> = {
  src: "",
  volume: 1,
  loop: false,
  muted: false,
  extraNode: [],
};

class WebAudioTag extends EventBus {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private timer: number = 0;
  private reject: (() => void) | null = null;
  private fetchBuffer?: (src: string) => Promise<ArrayBuffer | null>;
  private abortController = new AbortController();
  private startTime: number | false = false;
  private current: Current = {
    url: "",
    node: null,
    ended: true,
  };
  private _volume = 1;
  private _src = "";
  private _muted = false;
  private _loop = false;

  constructor(config?: Config) {
    super();
    const _config = Object.assign({}, defaultConfig, config);
    const ctx = new AudioContext();
    ctx.suspend();
    const gainNode = ctx.createGain();
    if (_config.extraNode) {
      let preNode: AudioNode = gainNode;
      _config.extraNode.forEach((node) => {
        preNode.connect(node);
        preNode = node;
      });
      preNode.connect(ctx.destination);
    } else {
      gainNode.connect(ctx.destination);
    }

    this.ctx = ctx;
    this.gainNode = gainNode;
    this.volume = _config.volume;
    this.src = _config.src;
    this.loop = _config.loop;
    this.muted = _config.muted;
    this.fetchBuffer = _config.fetchBuffer;
  }

  get currentTime() {
    if (this.startTime === false) {
      return 0;
    }

    return this.ctx.currentTime - this.startTime;
  }

  set currentTime(value: number) {
    if (typeof value !== "number") {
      console.warn(`[WebAudioTag]: currentTime must be a number.`);
      return;
    }

    this.play(value);
  }

  get duration() {
    if (this.current.node) {
      return this.current.node.buffer!.duration;
    }

    return 0;
  }

  get volume() {
    return this._volume;
  }

  set volume(value: number) {
    if (typeof value !== "number") {
      console.warn("[WebAudioTag]: volume must be a number.");
      return;
    }

    if (value < 0 || value > 1) {
      console.warn("[WebAudioTag]: volume must fall between 0 and 1.");
      return;
    }

    this._volume = value;
    if (!this.muted) {
      this.gainNode.gain.value = value;
    }

    this.emit("volumeChange", {
      type: "volumeChange",
      volume: this.volume,
    });
  }

  get src() {
    return this._src;
  }

  set src(value: string) {
    if (typeof value !== "string") {
      console.warn("[WebAudioTag]: src must be a string.");
      return;
    }

    this._src = value;
    if (!this.paused && this._src) {
      this.play();
    }
  }

  get loop() {
    return this._loop;
  }

  set loop(value: boolean) {
    if (typeof value !== "boolean") {
      console.warn("[WebAudioTag]: loop must be a boolean.");
      return;
    }

    this._loop = value;
  }

  get muted() {
    return this._muted;
  }

  set muted(value: boolean) {
    if (typeof value !== "boolean") {
      console.warn("[WebAudioTag]: muted must be a boolean.");
      return;
    }

    this._muted = value;
    if (value) {
      this.gainNode.gain.value = 0;
    } else {
      this.gainNode.gain.value = this.volume;
    }
  }

  get paused() {
    return this.ctx.state === "suspended";
  }

  get playState() {
    if (this.paused) {
      return "paused";
    }

    return "playing";
  }

  private async getAudioBuffer() {
    const fetcher = this.fetchBuffer || this.getArrayBuffer;
    const arrayBuffer = await fetcher(this._src);
    if (!arrayBuffer) {
      return null;
    }

    let rejectCall = false;
    this.reject = () => {
      rejectCall = true;
    };
    const audioBuffer = await this.ctx
      .decodeAudioData(arrayBuffer)
      .then((buffer) => (rejectCall ? null : buffer))
      .catch((err) => {
        this.emit("error", {
          type: "error",
          message: "[WebAudioTag]: failed to decodeAudioData.",
          error: err,
        });
        return null;
      });

    this.reject = null;
    audioBuffer && this.emit("loaded", { type: "loaded" });
    return audioBuffer;
  }

  private async getArrayBuffer(src: string) {
    this.reject = () => {
      this.abortController.abort();
      this.abortController = new AbortController();
    };
    return fetch(src, {
      signal: this.abortController.signal,
    })
      .then(async (res) => {
        if (!res.body) {
          return null;
        }
        const reader = res.body.getReader();
        const totalLength = Number(res.headers.get("content-length")) || 0;
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          chunks.push(value);
          receivedLength += value.length;
          this.emit("progress", {
            type: "progress",
            src,
            percentage: totalLength ? (receivedLength / totalLength) * 100 : 0,
            chunked: receivedLength,
          });
        }

        const unit8Array = new Uint8Array(receivedLength);
        let position = 0;
        for (let i = 0; i < chunks.length; ++i) {
          unit8Array.set(chunks[i], position);
          position += chunks[i].length;
        }

        return unit8Array.buffer;
      })
      .catch((err) => {
        this.emit("error", {
          type: "error",
          message: "[WebAudioTag]: failed to get ArrayBuffer.",
          error: err,
        });
        return null;
      });
  }

  async play(offset?: number) {
    // restart
    if (this.paused) {
      await this.ctx.resume();
      this.timer = setInterval(() => {
        this.emit("timeUpdate", {
          type: "timeUpdate",
          currentTime: this.currentTime,
        });
      }, 250);
      this.emit("playStateChange", {
        type: "playStateChange",
        state: this.playState,
      });
      if (this.current.url === this._src && !this.current.ended && !this.loop) {
        return true;
      }
    }

    // abort previous play call
    if (this.reject) {
      this.reject();
      this.reject = null;
    }

    let audioBuffer: AudioBuffer | null = null;
    if (this._src === this.current.url) {
      audioBuffer = this.current.node!.buffer;
    }

    // stop current node if exist
    if (this.current.node) {
      this.startTime = false;
      this.current.node.onended = null;
      this.current.node.stop(0);
      this.current.node.disconnect();
      this.current = { url: "", node: null, ended: true };
    }

    if (audioBuffer === null) {
      audioBuffer = await this.getAudioBuffer();
    }

    // create sourceNode & play
    if (audioBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);
      this.current = { url: this._src, node: source, ended: false };

      this.startTime = this.ctx.currentTime - (offset || 0);
      source.start(this.ctx.currentTime, offset || 0);
      source.onended = () => {
        this.startTime = false;
        this.ctx.suspend();
        this.emit("playStateChange", {
          type: "playStateChange",
          state: this.playState,
        });
        clearInterval(this.timer);
        this.current.ended = true;
        this.emit("ended", { type: "ended" });
        this._loop && this.play();
      };
      return true;
    }

    return false;
  }

  async pause() {
    if (this.ctx.state === "suspended") {
      return false;
    }

    await this.ctx.suspend();
    clearInterval(this.timer);
    this.emit("playStateChange", {
      type: "playStateChange",
      state: this.playState,
    });
    return true;
  }
}

export default WebAudioTag;
