---
title: SpringBoot3対応したので大体の対応を書いてみる
emoji: 🧑🏻‍💻
type: tech
topics: [Java, Spring]
published: true
---


# 💡この記事でわかること・解決すること


SpringBoot2.7 から 3.0.x へVersionUpする際にぶつかった壁と解決策を載せています。困っている人がいれば参考にしてください。構成は gradle, groovy, spockな構成です。


# そもそもSpringBoot3対応とは？


Spring Bootは、Javaでエンタープライズグレードのアプリケーションを簡単に作成できる人気のあるフレームワークです。幅広い「スターター」テンプレートを提供することで、開発者が無駄な設定や手間を避け、ビジネスロジックに注力できるため、迅速なアプリケーション開発を支援しています。


Spring Boot 3は、この人気のあるフレームワークの次世代バージョンで、さらに強力な機能と改善点を持っています。このバージョンへの対応には、以下のことが含まれます。

- **新機能の活用**：Spring Boot 3では、新たな開発ツールや高度なセキュリティ対策など、新たな機能が導入されることが予想されます。これらの新機能を活用するためには、それらに対応するコードの修正やアップデートが必要です。
- **バージョンアップに伴う変更対応**：バージョンアップには、既存の機能やAPIが変更、廃止される場合があります。そのため、新バージョンに適合させるために、アプリケーションの調整が必要になります。
- **依存性の更新**：Spring Bootのバージョンアップは、他のライブラリやフレームワークのバージョンアップも伴うことがよくあります。これらの変更に対応するためには、依存関係の更新とそれに伴うコードの修正が必要です。
- **テストの更新**：新バージョンへの対応は、単体テストや結合テストの更新を必要とします。新しい機能に対する新たなテストケースや、既存のテストケースの更新が必要となります。調整が必要となるでしょう。

# ✌️やったこと


## 🧱 壁1: Override, abstractメソッドで書かれてるenumクラスでmock化されてるとテスト自体が失敗する！


（Caused by: java.lang.IncompatibleClassChangeError at Hoge.groovy）


### 前提

- org.mockito:mockito-core:5.4.0
- groovy, spock

勘のいい人はわかりましたか？はい。spockで書かれているとenumクラスのmock化はできません。（2023/08/16現在）つまり、どうしてもテスト時にenumをモックしたい場合は、実装クラスをOverrideとabstractメソッドを消さなければいけません。


### サンプル


例えばこんなenumクラスがあったとします。これをモック化してテストしようとすると `Caused by: java.lang.IncompatibleClassChangeError at Hoge.groovy` で死にます。


```java
public enum ItemType {
  A(0) {
    @Override
    public boolean isHoge() { return true; }
  },
  B(1) {
  };
	private final int number;
  
  public boolean isHoge() { return false; }
}
```


こんな感じのenumがあったとして、Overrideもしくはabstractメソッドをoverrideしてるとテスト失敗します。（ {} があると失敗する。デフォルトのみにすると問題ない ）


### ではどうするのか？


選択肢

- enumクラスの実装を書き換える😱
	- テストが動かないから実装を変えるというのは本末転倒です。
	- テストのためにテスタブルな設計をするならまだ良いですが、〇〇のテストが動かないから実装を変えようはあまりよろしくありません。こちらは選択しませんでした。
- **enumクラスをモック化せずにテストを書く <= 私達のチームはこちらを選択**
	- そもそもenumクラスをモックしたいときってどんなときでしょうか？そこまで面倒な処理がenumに入ってるのは設計から疑うべきです。既存のテストコードはモックしたくて書いていたわけではなく、習慣的に書かれていただけなので、修正は1hくらいで終わりました。

## 🧱 壁2: integration-testのMock化のところで呼ばれないメソッドがあり、テスト失敗する


（org.mockito.exceptions.verification.WantedButNotInvoked）


```java
Mockito.verify(
  hogeService,
  Mockito.times(1)
).hogeMethod() == null
```


例えばこんなメソッドの実行回数を見るMockがあるとします。エラー内容としては `org.mockito.exceptions.verification.WantedButNotInvoked` と出ており、内容的にはその名の通りメソッドの呼び出しを求めてるけど実行されてないよという内容でした。


なぜこうなっていたのかというと、integration-testの呼び出しURLが `/api/hoge-hoge/` と書かれていたからでした。


SpringBoot3では `@GetMapping(value = { "/api/hoge-hoge" })` と書かれていると許可されるのは  `/api/hoge-hoge` だけです。なのでその場合は `@GetMapping(value = { "/api/hoge-hoge", "/api/hoge-hoge/" })` で書いて上げる必要があります。


たいてい呼び出し元からどう呼ばれてるかは完璧に把握しきれていないのでまずは両方対応するのが良いと思います。完全に呼ばれていないことを確認したらまたリリースすればよいです。


## 🧱 壁x: また何かあれば書きます


## 🍠 TIPS OpenRewriteで一気にSpringBoot対応の変更点をまとめて変更する


[bookmark](https://hirabay.net/?p=292)


OpenRewriteというツールを使うとjavaxやjakartaなどの記述をまとめて書き換えることが可能です。他にもCheckStyleの記述に合わせて強制的に書き換えることも可能みたいです。


**使い方**


rewrite.ymlというファイルをプロジェクト直下に置きます。


```yaml
---
type: specs.openrewrite.org/v1beta/recipe
name: custom.SpringBootMigration
displayName: springboot migration to 3.1
recipeList:
  - org.openrewrite.gradle.plugins.UpgradePluginVersion:
      pluginIdPattern: org.springframework.boot
      newVersion: "3.1.2"
  - org.openrewrite.gradle.plugins.UpgradePluginVersion:
      pluginIdPattern: io.spring.dependency-management
      newVersion: "1.1.0"
  - org.openrewrite.gradle.ChangeDependencyVersion:
      groupId: org.mybatis.spring.boot
      artifactId: mybatis-spring-boot-starter
      newVersion: 3.0.2
  - org.openrewrite.gradle.ChangeDependencyVersion:
      groupId: jp.co.yahoo.cloudtools
      artifactId: contrail-spring-boot-starter
      newVersion: 2.1.0
  # javax → jakartaの更新
  - org.openrewrite.java.migrate.jakarta.JavaxMigrationToJakarta
  # spring.factoriesの移行
  - org.openrewrite.java.spring.boot2.MoveAutoConfigurationToImportsFile
  # プロパティの移行
  - org.openrewrite.java.spring.boot3.SpringBootProperties_3_1_2
```


build.gradleに下記の記述を追加します


```javascript
plugins {
    ...
    // OpenRewriteプラグインを追加する
    id("org.openrewrite.rewrite") version("6.2.1")
}
 
...
 
repositories {
    mavenCentral()
}
 
dependencies {
    // 書換に必要な依存を追加
    rewrite("org.openrewrite.recipe:rewrite-spring:5.0.7")
    rewrite("org.openrewrite:rewrite-gradle:8.1.2")
    // OOMになることがあるので入れる https://github.com/openrewrite/rewrite/issues/1312
    rewrite("io.github.classgraph:classgraph:4.8.143")
}
 
// 実行するレシピを定義
rewrite {
    // 先ほど定義したレシピのnameを指定する
    activeRecipe('custom.SpringBootMigration')
}
```


dryRun可能なので実行してみます。


```shell
./gradlew rewriteDryRun
```


無事に実行が終われば問題ありません。書き換えを実行しましょう。


```shell
./gradlew rewriteRun
```


すると対象のファイルを勝手に書き換えてくれます。


**失敗する場合**


mavenのリポジトリ参照がhttpの場合はhttpsにしましょう


```shell
maven { url "http://example.com" }
```


gradleのバージョンが足りない場合


6系だと動かないことがあります。最新に上げてしまいましょう


```shell
# 下記コマンドを実行してJava17に対応したバージョンに上げる
./gradlew wrapper --gradle-version=8.2.1
```


いかがでしたか？この記事が良いと思ったらシェアお願いします！著者がすごく喜びます。

