# WebAudioTag.js

像 `<audio>` 标签一样使用 AudioContext。

[English](./readme.md) | 简体中文

## 开始

安装 WebAudioTag.js

```
$ npm install webaudiotag.js
```

在项目中使用 WebAudioTag.js

```js
import WebAudioTag from "WebAudioTag.js";

const webAudioTag = new WebAudioTag({
    src: "http://example.com/sound.mp3",
});
// 或者
// webAudioTag.src = "http://example.com/sound.mp3";

webAudioTag.play();
```

## 配置

| key                | 类型                                           | 默认值    | 说明                                 |
| ------------------ | ---------------------------------------------- | --------- | ------------------------------------ |
| config.src         | string                                         | ""        | 音频的 url 地址                      |
| config.volume      | number                                         | 1         | 音频的音量，值为 0 ~ 1 之间的数      |
| config.loop        | boolean                                        | false     | 是否循环播放                         |
| config.muted       | boolean                                        | false     | 音频是否被静音                       |
| config.extraNode   | AudioNode[]                                    | []        | 你想要连接到 AudioContext 的额外节点 |
| config.fetchBuffer | (src: string) => Promise<ArrayBuffer \| null>; | undefined |                                      |

## 属性

| key                  | 类型                  | 说明                               |
| -------------------- | --------------------- | ---------------------------------- |
| instance.currentTime | number                | 以秒为单位，返回音频当前的播放时间 |
| instance.duration    | number                | 只读，以秒为单位，返回音频的总时长 |
| instance.volume      | number                | 参见 `config.volume`               |
| instance.src         | string                | 参见 `config.src`                  |
| instance.loop        | boolean               | 参见 `config.loop`                 |
| instance.muted       | boolean               | 参见 `config.muted`                |
| instance.paused      | boolean               | 只读, 指示音频是否暂停中           |
| instance.playState   | "paused" \| "playing" | 只读, 指示音频的播放状态           |

## Methods

### play

播放音频。

```ts
(offset?: number) => Promise<boolean>;
```

### pause

暂停音频。

```ts
() => Promise<boolean>;
```

### on

为事件绑定处理函数。

```ts
(eventName: string, handler: Function) => void;
```

### off

移除事件的处理函数。

```ts
(eventName: string, handler: Function) => void;
```

## Events

事件处理函数可通过 `on` 方法绑定，通过 `off` 方法移除。

示例:

```js
import WebAudioTag from "WebAudioTag.js";

const webAudioTag = new WebAudioTag();

const handler = (evt) => {};

webAudioTag.on("playStateChange", handler);

webAudioTag.off("playStateChange", handler);
```

关于 `evt` 的类型，参见下文。

### playStateChange

当 playState 改变时触发。

```ts
{
    type: "playStateChange";
    state: "paused" | "playing";
}
```

### timeUpdate

当 currentTime 改变时触发。

```ts
{
    type: "timeUpdate";
    currentTime: number;
}
```

### volumeChange

当 volumn 改变时触发。

```ts
{
    type: "volumeChange";
    volume: number;
}
```

### ended

音频播放结束后触发。

```ts
{
    type: "ended";
}
```

### progress

音频数据下载时触发。

```ts
{
    type: "progress";
    src: string;
    percentage: number;
    chunked: number;
}
```

### loaded

音频数据加载完毕时触发。

```ts
{
    type: "loaded";
}
```

### error

发生错误时触发.

```ts
{
    type: "error";
    message: string;
    error: Error | null;
}
```
