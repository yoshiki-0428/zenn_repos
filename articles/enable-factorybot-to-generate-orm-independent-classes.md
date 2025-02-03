---
title: FactoryBotでORMに依存しないClassを生成できるようにする
emoji: 🧑🏻‍💻
type: tech
topics: [Rails]
published: true
---


# 💡この記事でわかること・解決すること


Railsといえばrspecですが、テストデータの作成によくFactoryBotが使われます。FactoryBotはActiveRecordに依存していて大体ただのクラスを生成するというよりも、データベースに紐付いたモデルが生成されます。今回はActiveRecordに紐付いていなくてもObjectが生成できるよっていう記事になります。


# ✌️やったこと


例えばこんなORMに依存していないUserクラスがあった場合に、 `FactoryBot.build` でクラスをnewしてくれます。 


```ruby
class User
  attr_accessor :name
end

FactoryBot.define do
  factory :user do
    name "Amy"
  end
end

user = FactoryBot.build(:user)
```


> 👉 ちなみに `FactoryBot.create(:user)` するとこのモデルはActiveRecordに紐付いていないのでNoMethodErrorで死ぬので注意


ただ大抵は constructor メソッドである initialize があると思うのでこのままだとinitialize時に NoMethodErrorで死んでしまいます。


そんなときは `initialize_with` でnewをOverrideしてあげましょう。これで生成できるようになります。


```ruby
class User
  attr_reader :name

  def initialize(data = {})
    @name = data[:name]
  end
end

FactoryBot.define do
  factory :user do
    name "Amy"

    initialize_with { new(attributes) }
  end
end
```


では、これほどシンプルではなく initializeにロジックが含まれていた場合はどうでしょうか？


`initialize_with` はOverrideしてるだけなのでFactoryBotに項目に合うデータを突っ込んであげればとりあえず生成はできます。


```ruby
class User
  attr_reader :name

  def initialize(data = {})
    @name = data[:response][:name]
  end
end

FactoryBot.define do
  factory :user do
    initialize_with { 
			name = 'Amy'
			data = { "response": { "name": name } }
			new(name)
		}
  end
end
```


利用用途としては外部APIのResponseが特定の型を書いておいてAPI ClientをMockし、より中間のServiceクラスをMockせずにrspecを書くことができます。


# 🏌️‍♂️おわりに


Serviceクラス自体にも当然テストコードはあると思いますが、中がブラックボックスになりがちなのでController側である程度制御してあげるとより変更してもテストで落ちてくれる強いコードが書けると思います。


え？外部APIのResponseが変わって本番障害が起きた？？？それは知らない 😇


# 参考


[bookmark](https://thoughtbot.com/blog/tips-for-using-factory-bot-without-an-orm)


いかがでしたか？この記事が良いと思ったらシェアお願いします！著者がすごく喜びます。

