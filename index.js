var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.set('port', (process.env.PORT || 5000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

app.post('/sendmessage/', function (req, res) {
	var key = req.param('key')
	var message = req.param('message')
	//var sender = req.param('sender')
	var type = req.param('type')
	if(key == "yourkey") {
	var sender = "senderID";

	//get all senders and go in a loop

	var sql = require('mssql');

	var config = {
	    user: 'MSSQLUSER',
	    password: 'MSSQLPASSWORD',
	    server: 'MSSQLDB.database.windows.net', // You can use 'localhost\\instance' to connect to named instance
	    database: 'DATABSENAME',
		options: {
		    encrypt: true // Use this if you're on Windows Azure
		}
	}

	var connection = new sql.Connection(config, function(err) {

	// Query
	var request = new sql.Request(connection); // or: var request = connection.request();
	request.query('SELECT * FROM dbo.FBuser', function(err, recordset) {
	//     // ... error checks

	for( var i = 0; i< recordset.length; i++) {
		var sender = recordset[i].FBuserID;
		if(type == 'message'){
			sendTextMessage(sender, message)
		}else if (type == 'content') {
			var cellid = req.param('cellid')
			sendContent(sender, cellid)
		}else if (type == 'contentmessage') {
			var title = req.param('title')
			var subtitle = req.param('subtitle')
			var image = req.param('image')

			var buttonsArray = [];
			var buttonsnumber = req.param('buttonsnumber')

			if(buttonsnumber == 'nobutton' ) {

			}else if(buttonsnumber == 'onebutton' ) {
				var button1title = req.param('button1title')
				var button1link = req.param('button1link')
				var button1type = req.param('button1type')
				buttonsArray =
				[{
					"type": button1type,
					"url": button1link,
					"title": button1title
				}];

			}else if(buttonsnumber == 'twobuttons' ) {
				var button1title = req.param('button1title')
				var button1link = req.param('button1link')
				var button1type = req.param('button1type')

				var button2title = req.param('button2title')
				var button2link = req.param('button2link')
				var button2type = req.param('button2type')
				buttonsArray =
				[{
					"type": button1type,
					"url": button1link,
					"title": button1title
				}, {
					"type": button2type,
					"url": button2link,
					"title": button2title
				}];


			}else if(buttonsnumber == 'threebuttons' ) {
				var button1title = req.param('button1title')
				var button1link = req.param('button1link')
				var button1type = req.param('button1type')

				var button2title = req.param('button2title')
				var button2link = req.param('button2link')
				var button2type = req.param('button2type')

				var button3title = req.param('button3title')
				var button3link = req.param('button3link')
				var button3type = req.param('button3type')
				buttonsArray =
				[{
					"type": button1type,
					"url": button1link,
					"title": button1title
				}, {
					"type": button2type,
					"url": button2link,
					"title": button2title
				}, {
					"type": button3type,
					"url": button3link,
					"title": button3title
				}];
			}


			sendContentMessage(sender, title, subtitle, image, buttonsArray);

		}
	}

				res.send('Your Message is sent !');
	//     console.dir(recordset);
		});
	});


		//res.send('Your Message is sent')
	}else {
		res.send('key is bad!'+key)
	}
})

app.get('/db', function (req, res) {
		res.send('welcome db!')
})

// index
app.get('/', function (req, res) {

	res.send('I am a bot :P !')

})

app.get('/setwelcome', function(req, res) {
	setWelcomeMessage()
	res.send('welcome message set!')
})
// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'YOUR_VERIFY_TOKEN') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

function saveSender(sender) {

	var sql = require('mssql');

	var config = {
	    user: 'MSSQLUSER',
	    password: 'MSSQLPASSWORD',
	    server: 'MSSQLDB.database.windows.net', // You can use 'localhost\\instance' to connect to named instance
	    database: 'DATABSENAME',
		options: {
		    encrypt: true // Use this if you're on Windows Azure
		}
	}

	var connection = new sql.Connection(config, function(err) {

	    var transaction = new sql.Transaction(connection);
		transaction.begin(function(err) {
		    // ... error checks
		    if(err) {
		    		// sendTextMessage(sender, "Transaction error"+err);
		    		return;
		    }

		    var request = new sql.Request(transaction);
		    request.query('insert into dbo.FBuser (FBuserID,DateCreated) values ('+sender+',1) ', function(err, recordset) {
		        // ... error checks
				// sendTextMessage(sender, "insert "+err);
		        transaction.commit(function(err, recordset) {
		            // ... error checks

					// sendTextMessage(sender, "Transaction committed"+err);
		            console.log("Transaction committed.");
		        });
		    });
		});

}

// to post data
app.post('/webhook/', function (req, res) {
	messaging_events = req.body.entry[0].messaging
	for (i = 0; i < messaging_events.length; i++) {
		event = req.body.entry[0].messaging[i]
		sender = event.sender.id
		saveSender(sender);
		if (event.message && event.message.text) {
			text = event.message.text

			if(text === 'regions') {
				sendRegions(sender)
				continue
			}
			//sendContent(sender, "14")
			sendOptions(sender)
			//sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
		}
		if (event.postback) {
			text = JSON.stringify(event.postback.payload)
			var json = JSON.parse(event.postback.payload)
			if(json.action) {
				if(json.action === 'get_contents') {
					sendContent(sender, json.cellid);
				}else if(json.action === 'get_regions') {
						sendRegions(sender);
				}
					//sendTextMessage(sender, "cellid: "+json.cellid, token)
			}else {
				sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
			}

			continue
		}

		saveSender(sender)
	}

	res.sendStatus(200)

})

var token = "you-APP-TOKEN";

function sendContentMessage(sender, title, subtitle, image, actionbuttons) {
		var payload =  JSON.stringify({"action": "get_regions"})
		var payload2 =  JSON.stringify({"action": "get_contents","cellid" : "12"})

		var messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": title,
					"subtitle": subtitle,
					"image_url": image,
					"buttons":  actionbuttons,
				}]
			}
		}
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {

			var sender = "YOUR-SENDER-ID";
			sendTextMessage(sender,'Error sending messages: ', error)
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			var sender = "YOUR-SENDER-ID";
			sendTextMessage(sender,'Error: ', response.body.error)
			console.log('Error: ', response.body.error)
		}
	})
}

function sendTextMessage(sender, text) {
	messageData = {
		text:text
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function sendContent(sender, cellId) {
	request({
		url: 'http://TEST.azurewebsites.net/api/contents/'+cellId,
		//qs: {access_token:token},
		method: 'GET',
		// json: {
		// 	recipient: {id:sender},
		// 	message: messageData,
		// }
	}, function(error, response, body) {
		if (error) {
			sendTextMessage('Error sending messages: '+ error)
		} else if (response.body.error) {
			sendTextMessage('Error: '+ response.body.error)
		}else {
			var json = JSON.parse(body)
			var premiums = json.premium
			//var string = " "
			var buttonsArray = []
			var elementsLength = premiums.length <10 ? premiums.length : 10
			for(var i =0; i< elementsLength; i++)
			{
				var premium = premiums[i]
				var url = "http://www.test.com/listing-details.aspx?id="+premium.contentId

				var payload =  JSON.stringify({"action": "get_regions"})
				buttonsArray.push(
					{
							"title": premium.offerText,
							"subtitle": premium.descriptionText,
							"image_url": premium.image,
							"buttons": [
							{
								"type": "web_url",
			                    "title":"View More",
			                    "url":  url
							},
								{
								"type": "web_url",
			                    "title":"Download App",
			                    "url":"http://www.TEST.com"
							},{
								"type": "postback",
								"title": "Discover Beirut",
								"payload": payload,
							}],
						}
					)

			}


			var messageData = {
				"attachment": {
					"type": "template",
					"payload": {
						"template_type": "generic",
						"elements": buttonsArray
					}
				}
			}
			request({
				url: 'https://graph.facebook.com/v2.6/me/messages',
				qs: {access_token:token},
				method: 'POST',
				json: {
					recipient: {id:sender},
					message: messageData,
				}
			}, function(error, response, body) {
				if (error) {
					sendTextMessage(sender, 'Error sending messages: '+ JSON.stringify(error))
					console.log('Error sending messages: ', error)
				} else if (response.body.error) {
					sendTextMessage(sender, 'Error: '+ JSON.stringify(response.body.error))
					console.log('Error: ', JSON.stringify(response.body.error))
				}
			})
		}
	})
}

function sendRegions(sender) {
	request({
		url: 'http://TEST.azurewebsites.net/api/userlocation?lat=33.45&lon=33.34',
		//qs: {access_token:token},
		method: 'GET',
		// json: {
		// 	recipient: {id:sender},
		// 	message: messageData,
		// }
	}, function(error, response, body) {
		if (error) {
			sendTextMessage('Error sending messages: '+ error)
		} else if (response.body.error) {
			sendTextMessage('Error: '+ response.body.error)
		}else {
			var json = JSON.parse(body)
			var regoins = json.cellRegions
			var length = regoins.length;
			if(length >10) {
				length = 10;
			}
			//var string = " "
			var buttonsArray = []
			for(var i =0; i< length; i++)
			{
				var regoin = regoins[i]
				var payload =  JSON.stringify({"action": "get_contents","cellid" : regoin.cellId})
				buttonsArray.push(
					{
							"title": regoin.name,
							"subtitle": "Select a region",
							"buttons": [{
								"type": "postback",
								"title": regoin.name,
								"payload": payload,
							}],
						}
					)

			}


			var messageData = {
				"attachment": {
					"type": "template",
					"payload": {
						"template_type": "generic",
						"elements": buttonsArray
					}
				}
			}
			request({
				url: 'https://graph.facebook.com/v2.6/me/messages',
				qs: {access_token:token},
				method: 'POST',
				json: {
					recipient: {id:sender},
					message: messageData,
				}
			}, function(error, response, body) {
				if (error) {
					sendTextMessage(sender, 'Error sending messages: '+ JSON.stringify(error))
					console.log('Error sending messages: ', error)
				} else if (response.body.error) {
					sendTextMessage(sender, 'Error: '+ JSON.stringify(response.body.error))
					console.log('Error: ', JSON.stringify(response.body.error))
				}
			})
		}
	})
}

function setWelcomeMessage() {
		var payload =  JSON.stringify({"action": "get_regions"})
		var payload2 =  JSON.stringify({"action": "get_contents","cellid" : "12"})

		var json = {
		  "setting_type":"call_to_actions",
		  "thread_state":"new_thread",
		  "call_to_actions":[
		    {
		      "message":{
		        "attachment":{
		          "type":"template",
		          "payload":{
		            "template_type":"generic",
		            "elements":[
		              {
		                "title":"Welcome to TEST!",
		                "item_url":"http://www.TEST.com",
		                "image_url":"http://www.TEST.com/images/TheChatBotBg.png",
		                "subtitle":"Discover the latest deals and events near you!",
		                "buttons": [{
							"type": "web_url",
							"url": "http://www.TEST.com",
							"title": "Visit Website"
							}, {
								"type": "postback",
								"title": "Select your Location",
								"payload": payload,
							},{
		                    "type":"web_url",
		                    "title":"Download App",
		                    "url":"http://TEST.com/"
		                  }],
		              }
		            ]
		          }
		        }
		      }
		    }
		  ]
		}

	request({
		url: 'https://graph.facebook.com/v2.6/MY-FB-PAGE/thread_settings',
		qs: {access_token:token},
		method: 'POST',
		json: json
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function sendOptions(sender) {
		var payload =  JSON.stringify({"action": "get_regions"})
		var payload2 =  JSON.stringify({"action": "get_contents","cellid" : "12"})

		messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": "Welcome to TEST",
					"subtitle": "Discover the latest deals and events near you!",
					"image_url": "http://www.TEST.com/images/TheChatBotBg.png",
					"buttons": [{
						"type": "web_url",
						"url": "http://www.TEST.com",
						"title": "Visit Website"
					}, {
						"type": "postback",
						"title": "Select your Location",
						"payload": payload,
					},{
		                    "type":"web_url",
		                    "title":"Download App",
		                    "url":"http://TEST.com/"
		            	}],
				}]
			}
		}
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
