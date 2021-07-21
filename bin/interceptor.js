var container = require('rhea').create_container({enable_sasl_external:true});

var forbidden_in = ['apple', 'banana', 'grape'];
var forbidden_out = ['red', 'yellow', 'green'];

function replace(input, word, as) {
    return input.replace(word, Array(word.length+1).join(as))
}

function obfuscate(input, forbidden, c) {
    var output = input;
    for (var i =0 ; i < forbidden.length; i++) {
        output = replace(output, forbidden[i], c);
    }
    return output;
}

function transform_request_body(input) {
    return Buffer.from(obfuscate(input.content.toString(), forbidden_in, '*'))
}

function transform_response_body(input) {
    return Buffer.from(obfuscate(input.content.toString(), forbidden_out, '#'))
}

if (!process.env.SOURCE) {
    console.log("Please specify SOURCE env var");
    process.exit();
}
if (!process.env.TARGET) {
    console.log("Please specify TARGET env var");
    process.exit();
}

var counter = 1;
var lookup = {}
var conn = container.connect();
var rx = conn.open_receiver({source:process.env.SOURCE, credit_window:0});
var tx = conn.open_sender(process.env.TARGET);
var replies = conn.open_receiver({source:{dynamic:true}});
replies.on('receiver_open', function (context) {
    rx.flow(10)
});

rx.on('message', function (context) {
    var msg = context.message;
    message_id = counter++;
    lookup[message_id] = {
        message_id: msg.message_id,
        reply_to: msg.reply_to
    }
    msg.message_id = message_id;
    msg.to = process.env.TARGET;
    msg.reply_to = replies.source.address;
    body = transform_request_body(msg.body);
    msg.application_properties['Content-Length'] = ''+body.length;
    msg.body = container.message.data_section(body);
    tx.send(msg);
    rx.flow(1);
});

replies.on('message', function (context) {
    var msg = context.message;
    original = lookup[msg.correlation_id];
    msg.to = original.reply_to;
    msg.correlation_id = original.message_id;
    body = transform_response_body(msg.body);
    msg.application_properties['Content-Length'] = ''+body.length;
    msg.application_properties['http:status'] = container.types.wrap_int(msg.application_properties['http:status'])
    msg.body = container.message.data_section(body);
    conn.send(msg);
});
