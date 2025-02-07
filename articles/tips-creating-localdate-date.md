---
title: Java Stream APIで2つの差分のLocalDateな日付Listを作るTips
emoji: 🧑🏻‍💻
type: tech
topics: [Java, Stream]
published: true
---


# 💡結論として


結論これです。


## Stream APIで2つの日数の差分の日付リストを取得できるコード


```java
LocalDate startDate = LocalDate.of(2023, 02, 14);

long numOfDays = ChronoUnit.DAYS.between(LocalDate.of(2023, 02, 14), LocalDate.of(2023, 02, 18));

List<LocalDate> daysRange = Stream
   .iterate(startDate, date -> date.plusDays(1))
   .limit(numOfDays)
   .collect(Collectors.toList());
```


`Stream.iterate(startDate, date -> date.plusDays(1))`


でdateに対してプラス1日し続けます。


`.limit(numOfDays)`


で制限を書けると。


今回の場合は2つの日付を与えられるとそこから差分を出したいのでこんな感じです。


```java
public List<LocalDate> createBetweenDates(final LocalDate startDate, final LocalDate endDate) {
    if (Objects.isNull(startDate) || Objects.isNull(endDate)) {
        return null;
    }

    long diffDate = ChronoUnit.DAYS.between(startDate, endDate) + 1;

    return Stream
            .iterate(startDate, date -> date.plusDays(1))
            .limit(diffDate).collect(Collectors.toList());
}
```


## ポイント

- ChronoUnitでbetweenを求めるときはどちらかがnullだと落ちるのでnullチェックが必要です
- 日付の差分がないと1個もリストを作成してくれないので1日だけ差分が出るようにする
	- **2022-01-01**と**2022-01-02**にして**[2022-01-01]**が返るようにしている

# 他の手段があるとすれば


## for文で書くとこんな


```java
public static List<Date> getDaysBetweenDates(Date startdate, Date enddate) {
    List<Date> dates = new ArrayList<Date>();
    Calendar calendar = new GregorianCalendar();
    calendar.setTime(startdate);

    while (calendar.getTime().before(enddate))
    {
        Date result = calendar.getTime();
        dates.add(result);
        calendar.add(Calendar.DATE, 1);
    }
    return dates;
}
```


## While文で書くとこんな


```java
List<Date> dates = new ArrayList<Date>();

String str_date ="27/08/2010";
String end_date ="02/09/2010";

DateFormat formatter ; 

formatter = new SimpleDateFormat("dd/MM/yyyy");
Date  startDate = (Date)formatter.parse(str_date); 
Date  endDate = (Date)formatter.parse(end_date);
long interval = 24*1000 * 60 * 60; // 1 hour in millis
long endTime =endDate.getTime() ; // create your endtime here, possibly using Calendar or Date
long curTime = startDate.getTime();
while (curTime <= endTime) {
    dates.add(new Date(curTime));
    curTime += interval;
}
for(int i=0;i<dates.size();i++){
    Date lDate =(Date)dates.get(i);
    String ds = formatter.format(lDate);    
    System.out.println(" Date is ..." + ds);
}
```


# まとめ


意外と簡単そうでぱっと出てこなかったので書いてみました。やはりStream APIすっきりしていいですね！


# 書籍


おすすめJava書籍。Javaをやってる人でも一度でも目を通すとだいぶ理解が深まります。



@[card](https://amzn.to/3XpeqKF)



### 引用など


[https://www.web-dev-qa-db-ja.com/ja/java/javaの2つの日付の間の日付のリストを取得する方法/969894923/](https://www.web-dev-qa-db-ja.com/ja/java/java%E3%81%AE2%E3%81%A4%E3%81%AE%E6%97%A5%E4%BB%98%E3%81%AE%E9%96%93%E3%81%AE%E6%97%A5%E4%BB%98%E3%81%AE%E3%83%AA%E3%82%B9%E3%83%88%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95/969894923/)


[https://m-shige1979.hatenablog.com/entry/2017/03/10/080000](https://m-shige1979.hatenablog.com/entry/2017/03/10/080000)


[https://qiita.com/tsuka611/items/3049c033c67eb93aa09f#streamの途中に挟むパターン](https://qiita.com/tsuka611/items/3049c033c67eb93aa09f#stream%E3%81%AE%E9%80%94%E4%B8%AD%E3%81%AB%E6%8C%9F%E3%82%80%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3)


いかがでしたか？この記事が良いと思ったらシェアお願いします！著者がすごく喜びます。

