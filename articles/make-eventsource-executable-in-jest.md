---
title: JestでEventSourceを実行可能にする
emoji: 📝
type: tech
topics: [Jest, EventSource, Mock]
published: true
---


# はじめに


JestでSSEのネイティブEventSourceをテストするときのEventSourceMockを作成しました。


結構ニッチな内容だけどメモレベルで共有しておく。


# 内容


ネイティブのEventSourceはNode内には存在しないので自分で登録する必要があります。


Mockを定義してそれっぽくしましょう。


```text
export class EventSourceMock {
  constructor(url: string, eventSourceInitDict?: Record<string, string>) {
    this.url = url;
    this.onmessage = null;
  }

  url?: string;
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null;
}

(global as any).EventSource = EventSourceMock;

```


# 参考URL

- [EventSource](https://developer.mozilla.org/ja/docs/Web/API/EventSource)
