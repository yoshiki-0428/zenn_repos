---
title: トランクベース開発をしてみたときの理想と現実
emoji: 🧑🏻‍💻
type: poem
topics: [DevOps, GitHub, Agile]
published: true
---


この記事は [Rakuten Rakuma Advent Calendar 2022](https://qiita.com/advent-calendar/2022/rakuten_rakuma) の9日目の記事です。


# はじめに


こんにちはApplication Engineerの[Yoshiki](https://github.com/yoshiki-0428/)です。


最近チーム内で**「小さくリリース」**をするブランチ戦略としてトランクベース開発を取り入れ始めたので、ブランチ戦略と理想と現実をお伝えしていこうかと思います！


# そもそもGitHub FlowとかGit Flowについて


よくGit FlowとGitHub Flowが混在して語られるので違いを説明していきます！


## Git Flowとは


![ref: https://www.atlassian.com/ja/git/tutorials/comparing-workflows/gitflow-workflow](https://wac-cdn.atlassian.com/dam/jcr:34c86360-8dea-4be4-92f7-6597d4d5bfae/02%20Feature%20branches.svg?cdnVersion=650)

- 5種類のブランチが存在
	- main
	- develop
	- feature
	- release
	- hotfix
- 開発者はdevelopから切る
- QAの際はdevelopから切り、releaseブランチを作成して検証して main マージを行う
- hotfixがあれば main から切りそのまま mainにマージをする

見て分かる通りGitFlowはmainとdevelopの乖離が発生しやすく、開発頻度の高い開発であればあるほど、最新ブランチを全て維持することが難しくなります。


もちろん忘れずにhotfixが起きた場合にmainとdevelopを更新出来ればよいですが、その頃にもmainとdevelopに乖離が生じている可能性が高くコンフリクトしやすいです。


## GitHub Flowとは


![ref: https://image.itmedia.co.jp/ait/articles/1708/01/at-it-git-15-009.jpg](https://image.itmedia.co.jp/ait/articles/1708/01/at-it-git-15-009.jpg)


上記のGit Flowをよりシンプルにしたものが、GitHub Flowです。


こちらではmainとfeatureブランチしか使用しません。developという中間のブランチが存在しなく、リリースバージョンを管理するブランチもないのでライブラリ管理するようなアプリケーションには向いていません。


ですが、現代のWebアプリケーション・サービスにおいてv1.0.0などのバージョン管理は必要でしょうか？恐らくリリース時に障害が起きたときに切り戻す以外に不要でしょう。


> 💡 ラクマではmainにマージするたびに自動的にタグを切るようにしています。リリースする際はそのタグを使用してリリースします


## トランクベース開発とは


最近話題？のトランクベース開発ですが、フロー自体はGitHub Flowと同じですが、featureブランチのマージを1-2日で行うことを求められます。


GitHub Flowとの大きな違いは「**ブランチを放置しておくことが許されない**」であることですが、大きな流れとしてはあまり変わりません。


詳しくはこちらに詳しく記載されているので興味のある人は読んでみてください。


[bookmark](https://rheb.hatenablog.com/entry/2021/08/24/%E3%83%88%E3%83%A9%E3%83%B3%E3%82%AF%E3%83%99%E3%83%BC%E3%82%B9%E9%96%8B%E7%99%BA%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)


## なるべく早くマージするために取り組んでいること

- [**Stale**](https://github.com/marketplace/stale)**を使用して放置されたIssue, PRを自動クローズする**

RepositoryのIssueの数がとんでもないことになっていませんか？2年前のPRが残っていませんか？ソフトウェアはナマモノなので覚えているうちに早く対応して早く綺麗にしましょう。

- **ペアプロやモブプロでレビューコストを下げる**

ペアプロの利点はコードのレビューが同期的にできる点です。PRに対してコメントを受けて修正して、それに返して… だとどうしても時間がかかってしまうので、修正しながらレビューを受けれてマージまでの速度が上がりやすくなります。

- **承認フローをなるべく減らす（意味のあるフローだけ残す）**

ラクマにも承認フローがチームによって数個あります。例えばお金関係のリリースを行う場合は内部監査用に承認履歴を取っておかないと行けないので他の開発承認フローと異なります。


他にも〇〇承認っているんだっけ？という議論をプロセス改善をチーム化して組織として取り組んでいます。

- （小さくリリースするために）[**FeatureFlag**](https://codezine.jp/article/detail/14114)**を利用する**

みんな大好きFeature Flagを使って特定機能のABテストや試験的な機能を出すのに有効的です。


## 今までどうだったか


![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/9e336906-7501-43c0-b5aa-de1ca211a16c/caad38ac-affa-4553-bdc0-a3a847fb8fb9/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466YJVKS54J%2F20250203%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250203T151856Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEP7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIBuUbCCYV734EIDYX0qaVzn9Yaubjk69k2ia65khEtAbAiEAibz69dWaIXHiMOcW7OmS7oYHMFMkHlFCVE9tOY9ScCoq%2FwMIFxAAGgw2Mzc0MjMxODM4MDUiDKK%2BDEJTrzPbdB0%2FpCrcA0Up5UjjCD5H7tpMptUxkhbcgXKiwhoY9oob%2F0X1U%2FB1RqlxATLGbWipIlocuTwvD0woFGxR9yjFZ9v%2FI%2FOe34594JzxusfBYpRVKxc%2FNigUCk32bxpIvtA9sm8U%2BDvZtT3uVvHVtN7MeNBBUjudRFTwuxfg1AtcyWH1kQwVPRe8dlI2BEUitnhbUxC%2FcL3NsXNeuTXubT0%2BXrfzH8TkTh9ZLy43h2qXkC7e%2BTvoAo6ZuVUHr3JKhG4942Orrh6uBGpEV4SiFWNJ2EVFsP9KNZOrZH7xbJDvytHjqM87CAftvbC8GnaP%2FxLWHiQjbuwZ0tl8nKhBTD9ok%2Fx%2BToi9MrwaynLS%2BVmhJQRvy4Dmt357K9CJbSOxDhyUw4c3TNqI4FQ7IS664Gvn4i0sM9O%2FsxSe%2BYLl0kCNp%2B0tE2QhkQt78sK6W1wWRCGYQn9oezBAX2zqnlUR67kjQhkxibe0D6NycLJU7D4z69qNwlZQi3tEErIJCsoZ5OA8dmotLnqzwx7sJI0Hua38JyOmHF6Ph0Vd4vDcyClhSie%2Big1SnAGHvhogBzWe3t%2BObfV7hMI9AiH8%2BhtjfclZgEjA5emWm9NbasHBpjnUe%2BVsX6WSHj4BIfnG1fXvsFh1OQREMPSOg70GOqUBFjCphurlt8HuGhtfp%2BwczlqqbbQxyCaPOTUdE44TMGrMpeRKSsR5%2FOf4%2BmjXofJbtLqdAbNe5HWX1xAIymDBeTjtn%2FdAZ5%2BRE%2F4cdFhUiv9G1MYCxGjyN10sIQdb4x0uaOpNGShsqYv0JdlMynKSGVWdydXXuJ6Y0S%2FKY7uWaxGQqYSuvE16Lfpcv02iqrnCkEbNqg%2FD3MQ%2B3F8Wdm6AO4eRlYSP&X-Amz-Signature=836a8aa454d6efe2be8ecf698129fb77c5a8fc06d11e983af671bdba13cf22fb&X-Amz-SignedHeaders=host&x-id=GetObject)

<details>
<summary>mermaid</summary>

```mermaid
%%{init: { 'gitGraph': {'showCommitLabel':false}} }%%
gitGraph
	commit
	branch reviewed/AA
	commit
	branch BB
  commit
	checkout reviewed/AA
  branch CC
  commit
	checkout reviewed/AA
  branch DD
  commit
	checkout main
  merge reviewed/AA
```


</details>


形式的にはGitHub Flowでしたが、今までは集約ブランチを作成して集約ブランチに対して細かくレビュー＆マージをし、最終的にリリース時は集約ブランチをmain に対してリリースを行うという方法を取っていました。


そうです。分かる通りこれは、GitHub Flowと言いながらやってることはGit Flowのようなものです。develop的な役割のブランチがないのでマシですが、半年もマージされないブランチは想像するだけでも大変ですよね。担当しているエンジニアが途中で退職したらより大変です。


# 理想と現実


ここからは「小さくリリースする」を目標に考えていた理想と現実を書いていきます。


![ref: https://blog-imgs-119.fc2.com/g/a/l/galapagonia/2b55f09a-s.jpg](https://blog-imgs-119.fc2.com/g/a/l/galapagonia/2b55f09a-s.jpg)


## 🦁理想


### 📉コンフリクトの減少


正直ここが一番大変なイメージでした。変更行数が多いと別プロジェクトの集約PRとコンフリクトがよく発生していました。集約Aと集約Bでコンフリクトが発生すると直せる人はもはやプロジェクトの根幹を担っている人同士（＋発生する場所によってはそのエンジニア）なので工数もそれなりに高いです。加えて直しても治っているのかどうかわからないことがあることです。直し方を間違えるとそれなりの障害になりかねないので、これが減ることが一番大きなメリットに感じていました。


### 📉レビュー工数の削減


大規模な組織で開発をしているとレビューの工数って意外と取られますよね？ファイル変更数 100とかきたらげんなりしますよね？？従来の集約リリースだと一番最後のマージまでのPRのレビューは正直何を見たらよいかわからないです。（一応全部見る必要はなく、レビューされていないPR、Commitはないかを確認していました。）


これが物理的に少なくなるので小さくなります。レビューはよりスムーズになります。


### ➡️リリース期間


ここはもともとFeature Flagを使用していたのでmainにマージすること＝リリースまでの期間ではなかったので、Feature Flagをオンにし始めること＝リリース期間なのでそこまで変わらないだろうと考えてました。


## 🐱現実


上記3つの内容がどう変わったかをお伝えする前に（ある程度は想像していたけど）大変だったことをお伝えします


### 承認フローが大変


想像すると分かる通り小さくリリースするということはその分承認も増えるということです。プロジェクトで10個リリースするということは10個承認を通さなければいけず、本当に大変でした。。。


その期間も短くなっているので**「開発 ⇒ 承認 ⇒ リリース」**が10回繰り返すことになります。これは導入前もわかってましたが、承認をなるべく減らす、もしくは簡素化する等の対策をして乗り切っています。（今でもまあまあ大変です）


例えば、○○承認の依頼時期は1日営業日前となっていてレビュー＆修正に2日かかるとします。なので1PRにつき、3日はかかります。


何が言いたいかというとある程度のスケジュール調整をエンジニアがしなければいけず、調整が嫌いなエンジニアにはあまり嬉しくないかもしれません。


なのでなるべく承認をなくすため、簡易化するための努力をしています。


### 作業分担が大変


![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/9e336906-7501-43c0-b5aa-de1ca211a16c/a94e76a2-c893-445a-9ba8-0f66364da0e8/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466YJVKS54J%2F20250203%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250203T151856Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEP7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIBuUbCCYV734EIDYX0qaVzn9Yaubjk69k2ia65khEtAbAiEAibz69dWaIXHiMOcW7OmS7oYHMFMkHlFCVE9tOY9ScCoq%2FwMIFxAAGgw2Mzc0MjMxODM4MDUiDKK%2BDEJTrzPbdB0%2FpCrcA0Up5UjjCD5H7tpMptUxkhbcgXKiwhoY9oob%2F0X1U%2FB1RqlxATLGbWipIlocuTwvD0woFGxR9yjFZ9v%2FI%2FOe34594JzxusfBYpRVKxc%2FNigUCk32bxpIvtA9sm8U%2BDvZtT3uVvHVtN7MeNBBUjudRFTwuxfg1AtcyWH1kQwVPRe8dlI2BEUitnhbUxC%2FcL3NsXNeuTXubT0%2BXrfzH8TkTh9ZLy43h2qXkC7e%2BTvoAo6ZuVUHr3JKhG4942Orrh6uBGpEV4SiFWNJ2EVFsP9KNZOrZH7xbJDvytHjqM87CAftvbC8GnaP%2FxLWHiQjbuwZ0tl8nKhBTD9ok%2Fx%2BToi9MrwaynLS%2BVmhJQRvy4Dmt357K9CJbSOxDhyUw4c3TNqI4FQ7IS664Gvn4i0sM9O%2FsxSe%2BYLl0kCNp%2B0tE2QhkQt78sK6W1wWRCGYQn9oezBAX2zqnlUR67kjQhkxibe0D6NycLJU7D4z69qNwlZQi3tEErIJCsoZ5OA8dmotLnqzwx7sJI0Hua38JyOmHF6Ph0Vd4vDcyClhSie%2Big1SnAGHvhogBzWe3t%2BObfV7hMI9AiH8%2BhtjfclZgEjA5emWm9NbasHBpjnUe%2BVsX6WSHj4BIfnG1fXvsFh1OQREMPSOg70GOqUBFjCphurlt8HuGhtfp%2BwczlqqbbQxyCaPOTUdE44TMGrMpeRKSsR5%2FOf4%2BmjXofJbtLqdAbNe5HWX1xAIymDBeTjtn%2FdAZ5%2BRE%2F4cdFhUiv9G1MYCxGjyN10sIQdb4x0uaOpNGShsqYv0JdlMynKSGVWdydXXuJ6Y0S%2FKY7uWaxGQqYSuvE16Lfpcv02iqrnCkEbNqg%2FD3MQ%2B3F8Wdm6AO4eRlYSP&X-Amz-Signature=9dbcfedeeeb3f4f84ec16644e67ddb9007ca695b8141de2c17bf8b5d966d2f8e&X-Amz-SignedHeaders=host&x-id=GetObject)

<details>
<summary>mermaid</summary>

```mermaid
%%{init: { 'gitGraph': {'showCommitLabel':false}} }%%
gitGraph
	commit
	branch AA
	commit
	branch BB
  commit

```


</details>


集約ブランチではそのブランチを各エンジニアがPullして開発すればよかったですが、トランクベースでは常にmainを見なければいけません。上記の承認フローが加わると正直トランクベース開発はあまり機能しません。なぜなら1〜2日でマージしなければいけないのにマージまでに3日もかかっていると次の作業者は AA を見なければいけません。そしてマージされるまでをちゃんとWatchしておかないと行けないので自分の作業以外のことに注意を注がなければいけないです。


これに対しては解決策はあります。


それは作業を依存させるような状態で割り振らないことです。例えば `hogeAPI` と`hogehogeAPI` があるとします。当たり前ですが、1つのAPI開発に2人のエンジニアをアサインすれば依存度は上がります。例が簡単なのでわかりやすいですが、実際の開発になると意外と何に依存しているかどうかは設計を行わないとわからない事が多いので、これに関しては設計力をあげるしかないです笑


### 1つのPR粒度が難しい


上記のなるべく依存度を下げるために別機能の開発を行うとありますが、どうしても〇〇APIがないと次の開発が進まないなどどうしても待たなければいけないタスクがあると思います。そうしたときに小さくしすぎると待つ人が増えるため、トランクベースのメリットが失われてしまい、ブランチ戦略がごちゃごちゃしてしまいます。


さすがに下記は大げさな例ですが、〇〇ブランチはどこに紐付いているのかわからなくなってしまいます。


![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/9e336906-7501-43c0-b5aa-de1ca211a16c/8f4ddb58-b96a-477a-901b-cd4e662491fe/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466YJVKS54J%2F20250203%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250203T151856Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEP7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIBuUbCCYV734EIDYX0qaVzn9Yaubjk69k2ia65khEtAbAiEAibz69dWaIXHiMOcW7OmS7oYHMFMkHlFCVE9tOY9ScCoq%2FwMIFxAAGgw2Mzc0MjMxODM4MDUiDKK%2BDEJTrzPbdB0%2FpCrcA0Up5UjjCD5H7tpMptUxkhbcgXKiwhoY9oob%2F0X1U%2FB1RqlxATLGbWipIlocuTwvD0woFGxR9yjFZ9v%2FI%2FOe34594JzxusfBYpRVKxc%2FNigUCk32bxpIvtA9sm8U%2BDvZtT3uVvHVtN7MeNBBUjudRFTwuxfg1AtcyWH1kQwVPRe8dlI2BEUitnhbUxC%2FcL3NsXNeuTXubT0%2BXrfzH8TkTh9ZLy43h2qXkC7e%2BTvoAo6ZuVUHr3JKhG4942Orrh6uBGpEV4SiFWNJ2EVFsP9KNZOrZH7xbJDvytHjqM87CAftvbC8GnaP%2FxLWHiQjbuwZ0tl8nKhBTD9ok%2Fx%2BToi9MrwaynLS%2BVmhJQRvy4Dmt357K9CJbSOxDhyUw4c3TNqI4FQ7IS664Gvn4i0sM9O%2FsxSe%2BYLl0kCNp%2B0tE2QhkQt78sK6W1wWRCGYQn9oezBAX2zqnlUR67kjQhkxibe0D6NycLJU7D4z69qNwlZQi3tEErIJCsoZ5OA8dmotLnqzwx7sJI0Hua38JyOmHF6Ph0Vd4vDcyClhSie%2Big1SnAGHvhogBzWe3t%2BObfV7hMI9AiH8%2BhtjfclZgEjA5emWm9NbasHBpjnUe%2BVsX6WSHj4BIfnG1fXvsFh1OQREMPSOg70GOqUBFjCphurlt8HuGhtfp%2BwczlqqbbQxyCaPOTUdE44TMGrMpeRKSsR5%2FOf4%2BmjXofJbtLqdAbNe5HWX1xAIymDBeTjtn%2FdAZ5%2BRE%2F4cdFhUiv9G1MYCxGjyN10sIQdb4x0uaOpNGShsqYv0JdlMynKSGVWdydXXuJ6Y0S%2FKY7uWaxGQqYSuvE16Lfpcv02iqrnCkEbNqg%2FD3MQ%2B3F8Wdm6AO4eRlYSP&X-Amz-Signature=dfb57c02e06bb910c9b653e3abf70d4577d75389d0e3eba9d7b0a161c729c495&X-Amz-SignedHeaders=host&x-id=GetObject)

<details>
<summary>mermaid</summary>

```mermaid
%%{init: { 'gitGraph': {'showCommitLabel':false}} }%%
gitGraph
	commit
	branch AA
	commit
	branch BB
  commit
	branch CC
  commit
  branch DD
	commit
  branch EE
	commit
```


</details>


なので粒度を大きくしてなるべく依存しないために努力をすると今度は「小さくリリース」のメリットが失われてしまうのでここだけは、**段々慣れていって最適なPR粒度を掴んで行くしかありません。**


長々とそれ以外のことについて語ってきましたが、もちろんメリットは大きいです。


### 📉 コンフリクトについて


もちろん集約でのリリースをしていないのでそういうレベルのコンフリクトは起きません。ただし、個人間のタスク同士のコンフリクトはあり、そういうときは作業者同士で解決できることのほうが多いです。むしろコンフリクトのレベルが知らないチームの人からチームメイトになってコンフリクトミスがしににくなったのでその点は最高です。


### 📉 レビュー工数について


レビュー工数としては確実に下がっています。ファイル変更数が多くても15ファイルとかなのでだいぶ負荷は少なく、その機能についてのレビューが出来ます。100ファイルもあると正直神頼み的なLGTMしかできず、リリースも神頼みになってしまいます。


またビジネスロジック的な変更を含む修正はペアプロでやることによってだいぶ負荷が少なくなりレビューまでの道のりが短くなり、良い体験でした。


### ➡️リリース期間


期間的な変化はありませんが、心理的なハードルは下がりました。なぜなら、先にリリースが済んでいる＆コンフリクト発生していないので、ビックバンリリースでのびっくり障害の可能性がないからです。また、QAなどの連携もスムーズです。mainにマージが済んでいるということはStagingブランチなどの更新もmainの取り込みさえしていれば良いからです。QAにはFeature Flagを使ってテストをしてねとお願いすればよいのです。


# まとめ


大規模な開発組織では承認のような煩雑な手順があるとあまり機能しないことが多いのですが、組織の承認フローが改善されれば、よりスムーズな開発が出来るかと思います。現状はまだ承認があり、トランクベース開発の文化がチーム全員に馴染んでいなく、理解がされていないこともあります。


なのでより一層「小さくリリースすること」「デプロイ頻度をあげること」をチームに対して意識させていくことが必要になります。Googleの提唱する有名な[4Keys](https://cloud.google.com/blog/ja/products/gcp/using-the-four-keys-to-measure-your-devops-performance)でもそうですが、組織全体に数値の見える化をすることも重要だと考えています。


トランクベース開発でなくてもマージするために取り組んでいることも参考になるかと思いますのでぜひ取り入れてみてください！長々とした文章にお付き合いいただきありがとうございました。


気になることがあれば[Twitter](https://twitter.com/yoshiki__0428)のDMにてお受けしますのでぜひお気軽に🙏

