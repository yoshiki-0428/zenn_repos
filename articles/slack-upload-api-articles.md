---
title: （JSのBuffer, Fileを理解した上で）Slack Upload APIで画像投稿を行う
emoji: 🧑🏻‍💻
type: tech
topics: [TypeScript, Node]
published: true
---


# 💡この記事でわかること・解決すること


Slack bolt 2.0系で画像のアップロードする際に `slack.files.upload` で画像投稿すると古いバージョンすぎてできないので、HttpClientのfetchを使用して、画像アップロードできるようにする


# 前提など

- Slackのbot tokenの取得ができている
- Slack API scopeの[`files:write`](https://api.slack.com/scopes/files:write) がbot側で許可されている
- Slack bot側から使用されること

# TL;DR


> 👉 とりあえずコード見る


[公式Doc](https://api.slack.com/methods/files.upload)


```typescript
import FormData from 'form-data'
import fetch, { RequestInit } from 'node-fetch'

const url = 'https://slack.com/api/files.upload'
function async uploadImage(
    buffer: Buffer,
    filename: string,
    options: { title?: string; channel?: string; thread_ts?: string }
  ): Promise<void> {

    const form = new FormData()
    form.append('file', buffer, { contentType: 'image/png', filename })
    if (options.title) form.append('title', options.title)
    if (options.channel) form.append('channels', options.channel)
    if (options.thread_ts) form.append('thread_ts', options.thread_ts)

    const request: RequestInit = {
      method: 'POST',
      body: form,
      headers: {
        authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
    }

    try {
      await fetch(url, request)
    } catch (e) {
      console.error(e)
      console.error('cannot upload image!!')
      throw new Error(e)
    }
  }
```


今回は保存されているファイルを呼び出して投稿するとかではなく、文字列をQRコード画像化して投稿したかったので`node-qrcode`でBuffer化した値をformとして送信しています。


## Buffer, Blob, Fileについて


まず理解しないといけないのが、Buffer, Blob, Fileの関係性についてです。


この方の記事がかなりわかりやすくまとまっていますが、自己理解のため書いていきます。



@[card](http://var.blog.jp/archives/62330155.html)


- Blob, Fileについて
	- Fileはファイルの場所を参照してファイル名、最終更新日などを取り出せます
	- Blobはバイナリを保持していて、blob.prototype.sizeでファイルサイズ確認や切り出しが出来ます
- Buffer (ArrayBuffer)
	- Node.jsだとBufferが利用されて、JavaScriptだと2015年のECMA ScriptでArrayBufferが使われていました。なのでNodeの場合はBuffer、JSの場合はArrayBufferとして理解すればよいです
	- ArrayBufferはその名の通り、配列でバイナリ情報が埋め込まれています。
	- UnitXXArrayのXXの数字の長さでIntの入る量が変わります
- BinaryString
	- その名の通りでBinaryが横にずらっと並んだような状態です。
- DataURI
	- URL にデータを書けるようにする [DataURI Scheme](https://www.codegrid.net/articles/datauri-1/) の文字列です
	- これ↓とかをURLに打ち込むと最小のgif画像が出ます

	> 👉 data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACwAAAAAAQABAAACAkQBADs=

	- DataURIではbase64を使うことが多いのでただのバイナリー値を64文字の英数字＋記号で表します。
	- **btoa** (binary to ascii)でbase64化、**atob** (ascii to binary)でバイナリ化ができるようになります。
	- 制御文字とか入らないようにしてるので同じデータを表すにも**必要なデータ量がちょっと増えます**
:::details 形式変換のチートシート（上記サイトより引用）


```javascript
// BinaryString -> Uint8Array
Uint8Array.fromBinaryString = function(str){
    return Uint8Array.from(str.split(""), e => e.charCodeAt(0))
}

// Uint8Array -> BinaryString
Uint8Array.prototype.binaryString = function(){
    return Array.from(this, e => String.fromCharCode(e)).join("")
}

// BinaryString -> DataURI
function bStr2dataURI(b_str){
	return "data:application/octet-stream;base64," + btoa(b_str)
}

// DataURI -> BinaryString
function dataURI2bStr(data){
	return atob(data.split(",")[1])
}

// UintXXArray -> ArrayBuffer
function toArrayBuffer(ua){
	return ua.buffer
}

// ArrayBuffer -> Uint8Array
ArrayBuffer.prototype.asUint8Array = function(){
	return new Uint8Array(this)
}
// ArrayBuffer -> Uint16Array
ArrayBuffer.prototype.asUint8Array = function(){
	return new Uint16Array(this)
}
// ArrayBuffer -> Uint32Array
ArrayBuffer.prototype.asUint8Array = function(){
	return new Uint32Array(this)
}

// BinaryString, UintXXArray, ArrayBuffer -> Blob
function toBlob(val){
	return new Blob([val], {type: "application/octet-stream"})
}

// Blob -> ArrayBuffer, BinaryString, DataURL, text
function read(blob){
	var fr = new FileReader()
	var pr = new Promise((resolve, reject) => {
		fr.onload = eve => {
			resolve(fr.result)
		}
		fr.onerror = eve => {
			reject(fr.error)
		}
	})

	return {
		arrayBuffer(){
			fr.readAsArrayBuffer(blob)
			return pr
		},
		binaryString(){
			fr.readAsBinaryString(blob)
			return pr
		},
		dataURL(){
			fr.readAsDataURL(blob)
			return pr
		},
		text(){
			fr.readAsText(blob)
			return pr
		},
	}
}
```



:::


![引用: ](https://livedoor.blogimg.jp/netomemo-techpc/imgs/2/f/2f3dc0e4-s.png)


## 以上の形式を理解した上でコードを見る


今回は formでBufferをファイル保存することなく、サーバに送りたいのでBufferを送ります。


Buffer自体をそのまま送ると上記の内容でファイル名情報がないのでHttpClientは Content-Dispositionでファイル名情報を送れず、Slackサーバもファイル情報がないので保存ができません。


とりあえずなんかのファイルを送るから理解してくれという場合には `application/octet-stream`を使いましょう。分かる場合はちゃんと入れたほうが良いです。


```typescript
// x
form.append('file', buffer)

// o
form.append('file', buffer, { contentType: 'image/png', filename })
```


ここでは contentTypeを決め打ちしていますが、Bufferクラスにはファイルに関する情報は保存されていないので、ライブラリから出力されるcontentTypeを理解しておく必要があります。もしくはDBに入っている場合は、contentTypeとBinaryを分けて保存しておくなどする必要があります。


そして ファイルをappendしたあとのgetHeadersを見てみます。


```typescript
console.log(form.getHeaders())
```


content-typeに multipart/form-data であることと boundaryに値が入っていることがわかります。


```json
{
  'content-type': 'multipart/form-data; boundary=--------------------------12345678'
}
```


boundaryが入っていると `--------------------------12345678` で区切るとファイル情報を書き込んでサーバに理解してもらうためにあります。


こんな感じのデータが送られています。`NODE_DEBUG=http,net,stream` と打ってからアプリケーションを実行すると実際のHTTPのログを見れるのでもしよければ試してみてください。


```json
--------------------------12345678
Content-Disposition: form-data; name="file"; filename="a.png"
Content-Type: image/png

aaaabbbbbccccc
aaaabbbbbccccc
aaaabbbbbccccc
--------------------------12345678
```


# 🏌️‍♂️おわりに


今までファイルアップロード機能を作成するたびにここらへんのHTTPルールをちゃんと理解しないといけないなぁと思いつつ今まで逃げていました。なぜアップロードできないかをHTTPレベルで理解している人はここらへんのトラブルシューティングが早くなるのでHTTPは定期的に振り返っておくとお得です。


ちなみに最初にboltのバージョンが古すぎてとありますが、そもそもはバージョン上げるのが一番早い解決策です。要件のスケジュール上こういう風に対応しました。


# HTTPの良書たち



@[card](https://amzn.to/3VX0KGK)




@[card](https://amzn.to/3VDzq0g)




@[card](https://amzn.to/3VXDXdR)



## 引用(彷徨ったときのリンクたち)



@[card](https://github.com/form-data/form-data/issues/220)




@[card](https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript)




@[card](https://stackoverflow.com/questions/73466429/appending-blob-to-form-data-throws-typeerror-source-on-is-not-a-function)




@[card](https://qiita.com/tanakahb/items/3714683b01642d907cd9)




@[card](https://api.slack.com/methods/files.upload)




@[card](http://var.blog.jp/archives/62330155.html)




@[card](https://www.kwbtblog.com/entry/2019/03/08/043739)




@[card](https://nodejs.org/api/buffer.html#buffer)


