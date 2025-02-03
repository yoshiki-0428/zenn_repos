---
title: goroutine
emoji: 🧑🏻‍💻
type: tech
topics: [Golang]
published: true
---


# 💡この記事でわかること・解決すること


Golang初心者なので備忘録も兼ねて**goroutine**で順序を考慮する場合にどうするかを書いています。結論を言うと先に順序を考慮した配列を作成してその配列を操作すれば良いです。


# 🤔順番考慮しないコード


当然といえば当然ですが、goroutineは**マルチスレッド**実行なので実行中にオブジェクトを作ると順番がバラバラになります。まだ数が少ないのでマシですが、Nの数が増えると当然ですが、スレッドも増えるのでもっとバラバラになりま**す。**

> 並列か並行かは[こちら](https://qiita.com/ichi_zamurai/items/b8d137b681c2c9c2f946)の記事を参照するとわかりやすいです。

```go
array := make([]int, 0)
for i := 0; i < 10; i++ {
	array = append(array, i)
}
log.Print(array)
// [0 1 2 3 4 5 6 7 8 9]

newArray := make([]int, 0)
eg := errgroup.Group{}
for _, i := range array {
	i := i
	eg.Go(func() error {
		newArray = append(newArray, i * 2)
		return nil
	})
}

if err := eg.Wait(); err != nil {
	log.Fatal(err)
}
log.Print(newArray)
// [18 0 2 4 6 8 10 12 14 16]
```


[bookmark](https://go.dev/play/p/KpvcJUc-IhG)


> 💡 こちらでコメントされましたが、上のコードはスレッドセーフではなく共有リソースをマルチスレッドでアクセスしてるので、 `sync.Mutex` でLock~Unlockをしたほうが良いです🙏 [参考](https://go-tour-jp.appspot.com/concurrency/9)


[embed](https://twitter.com/yusuktan/status/1590912980287647744?t=aJVQnBezd3RkbnQwSPejRA&s=19)


# ✌️考慮したコード


arrayの配列のindexを使えば順序を維持したまま更新できます。goroutineの中で配列を作成しようとするとバラバラになるので既に作成されている配列なりオブジェクト配列を操作したほうが良いかと思います。


このコードはarrayをそのまま更新していますが、実際にはAモデルからBモデルを作成するなんてときにAモデルをもとにBモデルの配列を作成しておくイメージになります。


```go
array := make([]int, 0)
for i := 0; i < 10; i++ {
	array = append(array, i)
}
log.Print(array)
// [0 1 2 3 4 5 6 7 8 9]

eg := errgroup.Group{}
for idx, i := range array {
	i := i
	idx := idx
	eg.Go(func() error {
		array[idx] = i * 2
		return nil
	})
}

if err := eg.Wait(); err != nil {
	log.Fatal(err)
}
log.Print(array)
// [0 2 4 6 8 10 12 14 16 18]
```


[bookmark](https://go.dev/play/p/iyYUVmh0VG2)


# 🏌️‍♂️おわりに


どちらかというとプログラミングの基礎的な内容だけど。。。


golang何も考えなくてもすらすら書けるようになりたい。。。


# 📚中級者向けな良書たち


## Web Applicationを学びたい人向け


[bookmark](https://amzn.to/3Uklk3p)


## 並行処理を学びたい人向け


[bookmark](https://amzn.to/3TmRABA)


# 参考サイト


[https://deeeet.com/writing/2016/10/12/errgroup/](https://deeeet.com/writing/2016/10/12/errgroup/)

