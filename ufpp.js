const Readline = require('readline');
const FS = require('fs');

const commands = {
    "file-read": function (args, options) {
        var body = FS.readFileSync(args.file).toString().split("\n");
        if (args.indent === 'true') {
            body = body.map(function (s, idx) {
                return (idx > 0 ? Array(options.indent + 1).join(" ") : "") + s;
            });
        }
        return body.join("\n");
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