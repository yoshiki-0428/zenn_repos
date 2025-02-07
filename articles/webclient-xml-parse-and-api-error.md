---
title: WebClientでXML＋APIエラー時の特定条件でのRetryを定義する
emoji: 🧑🏻‍💻
type: tech
topics: [Java, WebClient]
published: true
---


# はじめに


例えば、特定のエンドポイントにPostするとこのエラーコードのときだけリトライしてくれという仕様があったときにどう実装するかを解説していきます。


皆さんはWebClientを使用していますか？WebClientはSpring WebFluxから追加された新しいClientツールで、効率的にFunctionalに使用できますが、書き方が難しいと感じるかもしれません。今回は、特定の条件下でのRetryの設定方法について解説していきます。


WebClientの基礎からXMLでのParseの仕方。エラー時の挙動設定、Retry処理の設定を解説していきます。


# WebClient基礎


まずは公式を眺めましょう



@[card](https://spring.pleiades.io/spring-framework/docs/current/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html)



どうやらノンブロッキングでリアクティブにコードを書けます。


基本的な書き方はこちらに載っていそうです。



@[card](https://hirabay.net/?p=214)



こんな感じで色々設定値をClientごとに設定できます。


```java
@Bean
public WebClient webClient(MetricsWebClientCustomizer metricsWebClientCustomizer) {
    var connectionProvider = ConnectionProvider.builder("sample")
            .maxConnections(100) // コネクションプール数
            .maxIdleTime(Duration.ofSeconds(59))  // keep aliveタイムアウト
            .metrics(true) // コネクション数のメトリクスを有効化
            .build();

    var httpClient = HttpClient.create(connectionProvider)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 1_000) // connection timeout
            .responseTimeout(Duration.ofMillis(500)); // read timeout

    return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .baseUrl("http://localhost:8080")
            .apply(metricsWebClientCustomizer::customize)  // http clientのメトリクスを収集
            .build();
}
```


# XMLのレスポンスをDecodeしたいときはどうすれば良い？


あまりネット上のサンプルコードにはヒットしないですが、XMLを扱いたいときはこのように書くと勝手にParseしてくれます。


```java
return WebClient.builder()
                .baseUrl("http://localhost:8080")
                // xmlのエンコード・デコーダをセット
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs((conf) -> {
                            conf.defaultCodecs().jaxb2Encoder(new Jaxb2XmlEncoder());
                            conf.defaultCodecs().jaxb2Decoder(new Jaxb2XmlDecoder());
                        })
                        .build())
```



@[card](https://spring.pleiades.io/spring-framework/docs/current/javadoc-api/org/springframework/http/codec/xml/Jaxb2XmlEncoder.html)



これでClient側の準備は完了です。次はエラー時の挙動設定です。


# エラー時の挙動設定


例えば、特定のエンドポイントにPostして、特定コードのときはRetryをしたい。そんな実装をしたいときはこのようにしました。


## XMLをParseする対象のObject class


エラー時のXMLレスポンスを入れるClassを用意しておきます。注意点なのは入れ子で定義したいときにInner Classだと判別してくれないのでどんなに小さいクラスでも別で定義しないといけないです。


```java
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "Error")
public class APIErrorResponse {

    @XmlElement(name = "Code")
    private String code;
    @XmlElement(name = "Message")
    private String message;
}
```


## onStatusで特定の場合にオリジナルなExceptionを起こす

> StatusRetryExceptionは適当に用意が必要です。

```java
webClient.post()
         .uri(UriBuilder::build)
         .contentType(MediaType.APPLICATION_XML)
         .bodyValue(request)
         .retrieve()
         .retryWhen(getRetryPolicy())
         .onStatus(HttpStatus::isError, clientResponse -> clientResponse.bodyToMono(APIErrorResponse.class)
                .flatMap(error -> {
                    log.error("Error failed by errorCode={}, message={}", error.getCode(), error.getMessage());

                    // 特定コードだった場合にRetryを行うためにExceptionを引き起こす
                    if (List.of("ERR-01", "ERR-02").contains(error.getCode())) {
                        return Mono.error(StatusRetryException::new);
                    }
                    return Mono.error(Exception::new);
                }));
```


`clientResponse.bodyToMono(APIErrorResponse.class)` でXMLのデータをParseしてくれる。上記の設定がないと変換できないので注意。


## Retry処理の追加


最後にこんな感じのRetryPolicyを書いてretryWhenのところに追加してあげると望み通りの挙動をしてくれます。


```java
public Retry getRetryPolicy() {
        return Retry
                .backoff(2, Duration.ofMillis(500))
                // 特定ステータスのときはRetryする
                .filter(error -> error instanceof StatusRetryException)
                .onRetryExhaustedThrow((spec, rs) -> rs.failure());
}
```


# 最後に


小規模のAPI開発であれば、とりあえずエラーが起きたらRetryする処理は簡単に作れます。


ですが、大規模開発になってきて各APIの[rps](https://qiita.com/Junichi_M_/items/b83b8bc7bfcfd78f4850)を気にしなきゃいけないAPI開発では全部のエラーをRetryするととんでもないことになるので、こういう地味に調整できるやり方を知っていると非常に強いと思います。

