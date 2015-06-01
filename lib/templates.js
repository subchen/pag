var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var lodash = require('lodash');
var string = require('snack-string');
var Task = require('./task');
var stdio = require('./stdio');

var templates = module.exports = {};

var PREFIX = 'pag-template-';

templates.getTask = function(name, dir) {
    try {
        return new Task(PREFIX + name, dir);
    } catch(e) {
        stdio.error('Error: cannot find installed template: %s', name);
        stdio.error();
        stdio.error('You can try to install template:');
        stdio.error();
        stdio.error('   npm install pag-template-%s -g', name);
        stdio.error();
        stdio.error(e.stack);
        
        process.exit(1);
    }
};

templates.list = function() {
    var templates = [];
    var moduleBasedirs = [];

    // add build-in modules
    moduleBasedirs.push(path.join(__dirname, '../node_modules'));

    // add global module (npm prefix -g)
    moduleBasedirs.push(path.join(__dirname, '../..'));
    
    // add NODE_PATH
    moduleBasedirs = moduleBasedirs.concat((process.env.NODE_PATH || '').split(':'));
    
    // unique them
    moduleBasedirs = lodash.uniq(moduleBasedirs);

    // find available modules
    moduleBasedirs.forEach(function(basedir) {
        fs.readdirSync(basedir).forEach(function(dir) {
            if (string.startsWith(dir, PREFIX)) {
                templates.push({
                    name: string.removeStart(dir, PREFIX),
                    module: dir,
                    dir: path.join(basedir, dir)
                });
            }
        });
    });

    // sort
    templates.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    // print them
    stdio.info('Available templates: %s', chalk.cyan.bold(templates.length));
    stdio.info();
    templates.forEach(function(template) {
        stdio.info('* %s', chalk.cyan.bold(template.name));
        stdio.info('    %s', template.description);
    });
    stdio.info();
    
    // exit
    process.exit(0);
};

