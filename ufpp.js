const Readline = require('readline');
const FS = require('fs');
const GetOpt = require("node-getopt");
const OS = require("os");

var parsedArgs = GetOpt.create([
    ["o", "customargs=ARG+", "custom arguments"]
]).bindHelp().parseSystem();

var customArgs = {};
(parsedArgs.options.customargs || []).forEach(function (keyvalue) {
    var splt = keyvalue.split(":");
    customArgs[splt.shift()] = splt.join(":");
});

const commands = {
    "file-read": function (args, options) {
        var body = FS.readFileSync(args.file).toString().split("\n");
        if (args.indent === 'true') {
            body = body.map(function (s, idx) {
                return (idx > 0 ? Array(options.indent + 1).join(" ") : "") + s;
            });
        }
        return body.join("\n");
    },
    "option-value": function (args, options) {
        return customArgs[args.key];
    },
    "host-ip": function (args, options) {
        var ifaces = OS.networkInterfaces();
        var ips = [];
        Object.keys(ifaces).forEach(function(dev) {
            for (var i = 0, len = ifaces[dev].length; i < len; i++) {
                var details = ifaces[dev][i];
                if (details.family === 'IPv4')
                    ips.push(details.address);
            }
        });
        var hostip = null;
        ips.forEach(function (ip) {
            if (hostip)
                return;
            if (ip.indexOf("192.") === 0 || ip.indexOf("10.") === 0 || ip.indexOf("172.") === 0 || (ip.indexOf("127.") === 0 && ip !== "127.0.0.1"))
                hostip = ip;
        });
        if (!hostip && ips.length > 0)
            hostip = ips[0];
        if (!hostip)
            hostip = "127.0.0.1";
        return hostip;
    }
};

const execute = function (dynamic, options) {
    const splt = dynamic.split(" ");
    const command = splt.shift();
    const args = {};
    splt.forEach(function (arg) {
        const delim = arg.indexOf(":");
        args[arg.substring(0, delim)] = arg.substring(delim + 1);
    });
    return commands[command](args, options);
};

const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function(line) {
    line = line + "\n";
    while (true) {
        const startIdx = line.indexOf("{{");
        if (startIdx === -1)
            break;
        const endIdx = line.indexOf("}}");
        if (endIdx < startIdx)
            break;
        const head = line.substring(0, startIdx);
        const tail = line.substring(endIdx + 2);
        const dynamic = line.substring(startIdx + 2, endIdx);
        line = head + execute(dynamic, {
            indent: head.length
        }) + tail;
    }
    process.stdout.write(line);
});