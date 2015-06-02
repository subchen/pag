var cli = require('snack-cli');
var templates = require('./templates');
var stdio = require('./stdio');
var pkg = require('../package.json');

var program = cli
    .name(pkg.name)
    .version(pkg.version)
    .usage('[-t name [-d dir] | --list-templates]')
    .description(pkg.description)
    .option('-t, --template <name>', 'Use the template <name>', '')
    .option('-d, --dir <path>', 'Use the template directory <path>', process.cwd())
    .option('    --list-templates', 'List all supported template')
    .option('-v, --verbose', 'Output verbose logs')
    .parse();

if (program.verbose) {
    stdio.level = stdio.DEBUG;
}

if (program.listTemplates) {
    templates.list();
}

var task = templates.getTask(program.template, program.dir);
task.run();
