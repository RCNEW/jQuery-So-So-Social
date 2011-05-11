/******************************************************
	* jQuery plug-in
	* So So Social Activity Feed
	* Services accessed: Facebook, Delicious, Twitter, Last.FM, Flickr
	* Developed by J.P. Given (http://johnpatrickgiven.com)
	* Useage: anyone so long as credit is left alone
	
	* UPDATE RC DD 11-05-2011
	*
	* init function moved to HTML (no init.js anymore)
	* removed duplicated code
	* added clear timeout 
	* added prefix and postfix variables
	* Dutch time notation
	* 
	* EXAMPLE USE:
	* $("#divid").soSoSocial('', allRSS, 10);
	* 
	*  Where "allRSS" must be an array like this:
	*
	*	var allRSS = [
	*	{
	*		name: "Twitter",
	*		prefix: "tweet: ",
	*		url: "http://twitter.com/statuses/user_timeline/31100650.rss",
	*		iconurl: "http://img.pho.to/img/thumbs/a/amsterdam.nl_favicon.jpg",
	*		postfix: " gepost"
	*		
	*	},
	*	{
	*		name: "Nieuws Uit Amsterdam",
	*		url: "http://www.nieuwsuitamsterdam.nl/rss.xml",
	*		iconurl: "http://farm5.static.flickr.com/4060/4495300842_3f39a6b514_o.png"		
	*	{
			url: "http://www.nieuws.nl/rss/amsterdam"
		}
	* ];
	*
	* 
******************************************************/

var sss = {};

sss.ACTIVITY_ARRAY = new Array();
sss.FINISHED_ARRAY = new Array();
sss.CONTAINER = null;
sss.COUNT = 0;
sss.LIMIT = 25;
sss.RSSCOUNT = 0
sss.RSSURLSVALID = 0;
sss.Timeout = null;
sss.RSSDONELOADING = false;

function LoadRSS(name,prefix,url,iconurl,postfix,callback) {
			$.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D%22"+encodeURIComponent(url)+"%22&format=json&callback=?", function(d) {
				//grab ever rss item from the json result request
				if (d.query.results.rss) {
					$(d.query.results.rss.channel.item).each(function() {
						//if set up to be infinite or the limit is not reached, keep grabbing items
						var title = this.title;
						var link = this.link;
						var description = this.description;
						var pubDate = this.pubDate;
						pubDate = pubDate.replace(/\,/g,'');

						//append to the div
						if(typeof iconurl == 'undefined') iconurl = "http://img.pho.to/img/thumbs/a/amsterdam.nl_favicon.jpg";
						if(typeof prefix == 'undefined') prefix = "";
						if(typeof postfix == 'undefined') postfix = "";
						sss.ACTIVITY_ARRAY[sss.COUNT] = new Array();
						sss.ACTIVITY_ARRAY[sss.COUNT][0] = '<li style="background: url(' + iconurl + ') no-repeat left center;">' + prefix + '<a href="' + link + '" target="_blank">' + title + '</a>'+postfix;
						sss.ACTIVITY_ARRAY[sss.COUNT][1] = relative_time(pubDate);
						sss.ACTIVITY_ARRAY[sss.COUNT][2] = get_delta(pubDate);
						sss.COUNT++;
					});

					sss.FINISHED_ARRAY[sss.RSSCOUNT] = true;
					sss.RSSCOUNT++;
				} else {
					console.log('SoSoSocial FOUT: ' + name + ' lijkt uit de lucht.');
					sss.FINISHED_ARRAY[sss.RSSCOUNT] = true;
					sss.RSSCOUNT++;
				}
				
				
			});
		
		print_array($(this));
		return;
}

(function($) {

	$.fn.soSoSocial = function(callback,options,maxnumber) {
	sss.CONTAINER = $(this);

	// check for integer 
	var is_number = /^\d+$/.test(maxnumber);
	if(is_number) sss.LIMIT = maxnumber;	
	// get number of valid RSS urls
	jQuery.each(options, function() {
          if(this.url.indexOf("http://") != -1) {
		   sss.RSSURLSVALID++;
		  };
       });
	
	// get each RSS feed	
	jQuery.each(options, function() {
          if(this.url.indexOf("http://") != -1) {
		   LoadRSS(this.name,this.prefix,this.url,this.iconurl,this.postfix)
		  };
       });  
	};
	
	
})(jQuery);


// Print the array! 
function print_array(obj) {
	
	var allFinished = true;
	for (i=0;i<=sss.RSSURLSVALID-1;i++){
		if(!sss.FINISHED_ARRAY[i]) {allFinished = false; break;}
	}
	
	if (allFinished && !sss.RSSDONELOADING) {
		if ( (sss.LIMIT == 0) || (sss.ACTIVITY_ARRAY.length < sss.LIMIT) ) {
			sss.LIMIT = sss.ACTIVITY_ARRAY.length;
		}
		
		sss.CONTAINER.html("");
		
		sss.ACTIVITY_ARRAY.sort(by(2,1));
		var html = '<ul id="activityFeed">';
		for (j = 0; j < sss.LIMIT; j++) {
			html += sss.ACTIVITY_ARRAY[j][0] + ' (' + sss.ACTIVITY_ARRAY[j][1] + ')</li>';
		}
		html += '</ul>';
		sss.CONTAINER.append(html);
		
		// all done so kill timeout
		sss.RSSDONELOADING = true;
		sss.Timeout  = null;
		clearTimeout(sss.imeout);
		return;
		
	} else {
		if ( sss.Timeout != null ) clearTimeout(sss.Timeout);
		sss.Timeout = setTimeout("print_array()", 1000);
	}
}

// pubDate delta function
function get_delta(time_value) {
	var values = time_value.split(" ");
	time_value = values[2] + " " + values[1] + ", " + values[3] + " " + values[4];
	var parsed_date = Date.parse(time_value);
	var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
	var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
	if (values[5] == "+0000") {
		delta = delta + (relative_to.getTimezoneOffset() * 60);
	} else {
		delta = delta + relative_to.getTimezoneOffset();
	}
	
	
	return delta;
}

// Function to return the relative time based off of delta.
function relative_time(time_value) {
	
	var delta = get_delta(time_value);

	if (delta < 60) {
		return 'minder dan 1 minuut geleden';
	} else if(delta < 120) {
		return '1 minuut geleden';
	} else if(delta < (60*60)) {
		return (parseInt(delta / 60)).toString() + ' minuten geleden';
	} else if(delta < (120*60)) {
		return '1 uur geleden';
	} else if(delta < (24*60*60)) {
		return 'ongeveer ' + (parseInt(delta / 3600)).toString() + ' uur geleden';
	} else if(delta < (48*60*60)) {
		return '1 dag geleden';
	} else {
		return (parseInt(delta / 86400)).toString() + ' dagen geleden';
	}
}

// Multi-Dementional Array sort.
function by(i,dir) {
	return function(a,b){a = a[i];b = b[i];return a == b ? 0 : (a < b ? -1*dir : dir)}
}