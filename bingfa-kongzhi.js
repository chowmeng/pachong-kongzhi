var async = require('async');
var eventproxy = require('eventproxy');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');

var cnodeUrl = 'https://cnodejs.org/';//爬取一个论坛中帖子的名称和第一条评论
superagent.get(cnodeUrl)//打开这个论坛
  .end(function (err, res) {
    if (err) {
		return console.error(err);
    }
    var topicUrls = [];
    var $ = cheerio.load(res.text);
    // 获取首页所有的链接
    $(' #topic_list .topic_title').each(function (idx, element) {
		var $element = $(element);
		// $element.attr('href') 本来的样子是 /topic/542acd7d5d28233425538b04
		// 我们用 url.resolve 来自动推断出完整 url，变成
		// https://cnodejs.org/topic/542acd7d5d28233425538b04 的形式
		// 具体请看 http://nodejs.org/api/url.html#url_url_resolve_from_to 的示例
		var href = url.resolve(cnodeUrl, $element.attr('href'));
		topicUrls.push(href);//将所有的href放入topicUrls中
    });
    var concurrencyCount = 0;//只是用来计算并发数
    var fetchUrl = function (url, callback) {//被用来控制并发量的函数
      concurrencyCount++;//并发数+1
      result_send=superagent.get(url)//读取页面内容
        .end(function (err, res) {
			console.log('fetch ' + url + ' successful');
			console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url);
			var $ = cheerio.load(res.text);
			title=$('span.topic_full_title').text().trim()
			comment1=$('.panel .reply_content').eq(0).text().trim(),
			concurrencyCount--;
			callback(null,[title,url,comment1]);
        });
    };
    async.mapLimit(topicUrls, 5, function (url, callback) {//一个控制并发数的遍历方法，被遍历参数为topicUrls，并发数控制为5
		fetchUrl(url, callback);//每5个调用这个函数。执行完一个变量后在加入一个，保证fetchUrl中只有5个在并发运行
    }, function (err, result) {
		console.log('final:');
		console.log(result);
    });
  });
