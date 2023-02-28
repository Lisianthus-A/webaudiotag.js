# WebAudioTag.js

Use AudioContext just like an `<audio>` tag.

English | [简体中文](./readme-zh_CN.md)

## Getting Started

Install WebAudioTag.js

```
$ npm install webaudiotag.js
```

Use WebAudioTag.js in your project

```js
import WebAudioTag from "WebAudioTag.js";

const webAudioTag = new WebAudioTag({
  src: "http://example.com/sound.mp3",
});
// or
// webAudioTag.src = "http://example.com/sound.mp3";

webAudioTag.play();
```

## Config

| key                | type                                           | default   | description                                                      |
| ------------------ | ---------------------------------------------- | --------- | ---------------------------------------------------------------- |
| config.src         | string                                         | ""        | The url of audio                                                 |
| config.volume      | number                                         | 1         | The volume of audio, must fall between 0 and 1                   |
| config.loop        | boolean                                        | false     | If the value is true, the audio will loop playback automatically |
| config.muted       | boolean                                        | false     | Indicates whether the audio is muted                             |
| config.extraNode   | AudioNode[]                                    | []        | The extra node that you want to connect to AudioContext          |
| config.fetchBuffer | (src: string) => Promise<ArrayBuffer \| null>; | undefined |                                                                  |

## Attributes

| key                  | type                          | description                                                  |
| -------------------- | ----------------------------- | ------------------------------------------------------------ |
| instance.currentTime | number                        | Indicating the current playback time of the audio in seconds |
| instance.duration    | number                        | Readonly, indicating the duration of the audio in seconds    |
| instance.volume      | number                        | See `config.volume`                                          |
| instance.src         | string                        | See `config.src`                                             |
| instance.loop        | boolean                       | See `config.loop`                                            |
| instance.muted       | boolean                       | See `config.muted`                                           |
| instance.paused      | boolean                       | Readonly, indicates whether the audio is paused              |
| instance.playState   | "paused" \| "playing"         | Readonly, indicating the state of the audio                  |
| instance.sourceNode  | AudioBufferSourceNode \| null | Readonly, current audio source node                          |
| instance.ctx         | AudioContext                  | Readonly, current AudioContext                               |

## Methods

### play

Begin playback of the audio.

```ts
(offset?: number) => Promise<boolean>;
```

### pause

Pause playback of the audio.

```ts
() => Promise<boolean>;
```

### on

Binds event-handling function.

```ts
(type: string, handler: Function) => void;
```

### off

Unbind event-handler function.

```ts
(type: string, handler: Function) => void;
```

## Events

Event handler is bound through `on` method, and unbinded through `off` method.

Example:

```js
import WebAudioTag from "WebAudioTag.js";

const webAudioTag = new WebAudioTag();

const handler = (evt) => {};

webAudioTag.on("playStateChange", handler);

webAudioTag.off("playStateChange", handler);
```

See the following for the types of `evt`.

### playStateChange

Event emmited after playState changed.

```ts
{
  type: "playStateChange";
  state: "paused" | "playing";
}
```

### timeUpdate

Event emitted after currentTime changed.

```ts
{
  type: "timeUpdate";
  currentTime: number;
}
```

### volumeChange

Event emitted after volume changed.

```ts
{
  type: "volumeChange";
  volume: number;
}
```

### ended

Event emitted when the end of audio is reached.

```ts
{
  type: "ended";
}
```

### progress

Event emitted when the audio data is downloading.

```ts
{
  type: "progress";
  src: string;
  percentage: number;
  chunked: number;
}
```

### loaded

Event emitted when the audio data is loaded.

```ts
{
  type: "loaded";
}
```

### error

Event emitted when an error occurred.

```ts
{
  type: "error";
  message: string;
  error: Error | null;
}
```
