---
title: Spring Integration Test Cassandraでハマったこと
emoji: 🧑🏻‍💻
type: tech
topics: [Spring, Integration Test, Java, Mock]
published: true
---


# 💡この記事でわかること・解決すること


Spring Integration Test でCassandraへの接続をモックしたいときにハマったのでその解決方法を書いておく。


# そもそもAPIの結合テストとは


バックエンドでのマイクロサービス間の開発では、例えばBFF APIから荷物API → 配送方法APIなど API同士の通信が往々として増えてきます。そんなときに1APIとしてはJSONファイルを保存しておいて、JSONファイルの中身の一部を比較するテストを書いておけば、**大規模リファクタしたとき**や**新機能追加したとき**の開発でデグレードが起きづらくなります。


しかし、マイクロサービス間では1APIだとしてもHTTP通信以外の別Databaseへの接続も増えてきます。


![API名は適当です。](https://prod-files-secure.s3.us-west-2.amazonaws.com/9e336906-7501-43c0-b5aa-de1ca211a16c/93524988-7edd-47e5-9cf7-c49ead5d13ed/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466XKELZVXX%2F20250203%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250203T145525Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEP7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIF4S8tmFXD54f7BrfZUWgWwE42tm0YN7%2FoV5Uu8ltLVxAiEAxlZPLvo%2BcTwuS3mm6y6cPE3vsbpItvNHc0v7ayeP1LMq%2FwMIFxAAGgw2Mzc0MjMxODM4MDUiDLzPVoEaVTxiOgfFsyrcAw9hw6gF9JK5dMHvwSeJxiOuqBaHIxq6Xfhhodpdejl51DmmVpUFqDue5cq5om3HILgtmAwuZuX3xEap1%2FPU9ieXXwMNDX3VYwua2OnQB5G5%2B5yF%2FWor83cV7Mzz6oS0qPAkaF5XjNr4%2FfiMAGOlwF4Ak9SRE3nK%2FxbclryzAloauqvAJy2ijcUZPParLZ70xWSslYSRrLGqJRo3cEzcTPVT3K4YIVzkCI36Nm5tI10JpI2Qsbr9Pr6B0jpLhjy688TCnR%2FCRFTh3YtlpY%2BMubtwsfSdssjRJFiEcWgM2JoQi538BTXyej9gi9DbRgIfBOlouHjH2KFjeHaedb8QFeFtJJggtuB9JusJVcls7OfF5kpSurF9GYckPLVAd65eCBhtbTg5A4MJtsJ%2BsoZAc1GR9tO0JfVU9n5o94zGHVql5X01yVPYXODn3wIAEUFbgUG84JRx2W0TDMkN8nR3CgTCDIoq8fCF4mtN2kc4aEYLCsUxHQo21fQr81%2BTKtG6nMESFiXTZRlF9E7yynHqECilZFItLGTxXL33wVazot3bM65R%2Fq5%2B7CLPEQ95sQI1ZREjtY23Q5%2FuF7%2BuqYRioR9mzGLqupbITYeMVZH6Ks5u5tSdsdYQXmbF%2BcktMICQg70GOqUB%2F0VWSe0vYMiU7ce64XfEMqLIGf0mv6Rzi9agX51f6tW5%2FadgtGQt08VAP7xRBJ8MqWFkEd1FojvAwbENj3TwzYZCgaWYVBmlJvwZPB55i%2BnsaGyTBlU04whePdrJLJZRPGaVxzZt5iSadCvElvKZSlnuHKu%2BndAMXONa2Zf5J4ID%2FxDHZah2KIjVddFJCFHF9l2l%2FmOGYuKV3Hpg4SP0IHdTFcyp&X-Amz-Signature=4fcbbbc75a14974c2b50dc13865612fc8dd34fdc8dd5d9c5c3470ce9d7d20ed9&X-Amz-SignedHeaders=host&x-id=GetObject)


こんな例のようにAPIだけでなくDBと接続も増えてくるので単純なHTTP Mockだけでは対応しきれない感じです。

> おそらくシンプルなHTTPと通信してるだけであれば karate なんかを使ってセルフE2Eみたいなものも書けると思います。

## SpringのAPI Integration Testについて


もちろんAPI Testingをしたいわけなので一時的にSpring API Serverを立ち上げます。その際に外部接続するクラスをモック化しておいて、仮の値を設定できるようにします。


APIに対してリクエストを行い、レスポンス値が正しいのか検証を行います。Springを立ち上げるのに少し時間がかかるのでユニットテストで使うのには不向きです。


## Cassandraへ接続したときにハマったこと


SpringのIntegration Testでは [`MockBean`](https://dawaan.com/mockbean-vs-mock/) を使用して対象のHTTPやExternal DBとのConfigクラスをモック化できるのですが、Spring CassandraのConfigクラスを設定しても解決しませんでした。

> 接続設定を上書きするようにして自分たちで管理しているクラスとか

```java
@MockBean
CassandraClient cassandraClient;

@MockBean
HogeDBClient hogeDBClient;

@Test
void テストする() {}
```


そんなときはたいていSpringの[Auto Configuration](https://qiita.com/kazuki43zoo/items/8645d9765edd11c6f1dd)を見直しましょう。要は何もしなくても接続設定をFW自体が効かせますよという設定群だと思っています（間違ってたら🙏）


# ✌️解決方法


このままだとSpringのAuto Configurationが効いてしまうので、テスト時だけ無効化しましょう。excludeで無効化できます。


一応もとのソースコード自体に効かせる設定があったので載せておきます。OSSでよかった。。。


[https://github.com/spring-projects/spring-boot/blob/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/cassandra/CassandraAutoConfiguration.java#L71](https://github.com/spring-projects/spring-boot/blob/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/cassandra/CassandraAutoConfiguration.java#L71)


## property-test.ymlを使う方法


```text
spring:
  autoconfigure:
    exclude: org.springframework.boot.autoconfigure.cassandra.CassandraAutoConfiguration
```


## Integration Testのクラスファイルに直接書く


```java
@EnableAutoConfiguration(exclude={CassandraAutoConfiguration.class, ReactiveCassandraConfig.class})
public TestClass {}
```


# 🏌️‍♂️おわりに


少しマニアックな内容でしたが、Springを使う場合にご親切にやってくれてることが多いので、ライブラリを使うことがある場合に気をつけて実装したいですね！


個人的にSpringのテストは難しい気がしているのでちゃんと理解して使いこなせるように他人に説明できるようにしておこうと思います。


今回は結合テストの内容を書きましたが、**これさえあればバグを防げる！**というわけではないですが、転ばぬ先の杖として非常に有用だと思っています。圧倒的にリファクタがしやすくなるのでおすすめです。


# 引用とか


[bookmark](https://spring.pleiades.io/spring-boot/docs/2.1.4.RELEASE/reference/html/using-boot-auto-configuration.html#:~:text=%E4%B8%8D%E8%A6%81%E3%81%AA%E7%89%B9%E5%AE%9A%E3%81%AE%E8%87%AA%E5%8B%95%E6%A7%8B%E6%88%90%E3%82%AF%E3%83%A9%E3%82%B9%E3%81%8C%E9%81%A9%E7%94%A8%E3%81%95%E3%82%8C%E3%81%A6%E3%81%84%E3%82%8B%E5%A0%B4%E5%90%88%E3%81%AF%E3%80%81%E6%AC%A1%E3%81%AE%E4%BE%8B%E3%81%AB%E7%A4%BA%E3%81%99%E3%82%88%E3%81%86%E3%81%AB%E3%80%81%40EnableAutoConfiguration%C2%A0%E3%81%AE%20exclude%20%E5%B1%9E%E6%80%A7%E3%82%92%E4%BD%BF%E7%94%A8%E3%81%97%E3%81%A6%E7%84%A1%E5%8A%B9%E3%81%AB%E3%81%99%E3%82%8B%E3%81%93%E3%81%A8%E3%81%8C%E3%81%A7%E3%81%8D%E3%81%BE%E3%81%99%E3%80%82)


[bookmark](https://github.com/spring-projects/spring-boot/blob/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/cassandra/CassandraAutoConfiguration.java#L71)


# おすすめ書籍


今からSpringを始めるならSpring 3がおすすめです。書籍で完全に理解できるかというと違うと思いますが、参考までに。


[bookmark](https://amzn.to/3WXqhzq)


おすすめな書籍です。良ければ買って下さい！！


[bookmark](https://amzn.to/3YjUqtO)


[bookmark](https://amzn.to/3kZ9TkK)

