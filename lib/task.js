var fs = require('fs');
var path = require('path');
var glob = require("glob");
var chalk = require('chalk');
var async = require('async');
var mkdirs = require('mkdirs');
var string = require('snack-string');
var stdio = require('./stdio');

function Task(name, destdir) {
    this.object = require(name);
    this.basedir = path.join(require.resolve(name + '/package.json'), '../root');
    this.destdir = path.resolve(destdir);
    this.encoding = this.object.encoding || 'utf-8';
    this.context = {};
}

Task.prototype.run = function() {
    async.series([
        this.ask.bind(this),
        this.confirm.bind(this),
        this.copy.bind(this),
        this.customize.bind(this),
    ], function(err) {
        if (err) {
            stdio.error(err);
            process.exit(1);
        } else {
            this.done();
            process.exit(0);
        }
    }.bind(this));
};

Task.prototype.ask = function(done) {
    stdio.info('Press ^C at any time to quit.');

    var context = this.context;
    async.forEachOfSeries(this.object.variables, function(desc, name, callback) {
        stdio.write('%s: ', chalk.yellow(desc));
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', function(data) {
            context[name] = data.toString().trim();
            callback(null);
        }).resume();
    }, done);
};

Task.prototype.confirm = function(done) {
    stdio.info();
    stdio.write('Is this ok? [Y/n] ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function(data) {
        var answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === '') {
            done(null);
        } else if (answer === 'n') {
            this.abort();
        } else {
            this.confirm(done);
        }
    }.bind(this)).resume();
};

Task.prototype.copy = function(done) {
    var files = glob.sync('**', {
        cwd: this.basedir
    });
    files.forEach(function(file) {
        var src = path.join(this.basedir, file);
        
        var buffer = fs.readFileSync(src);
        if (string.endsWith(src, '.in')) {
            var s = buffer.toString(this.encoding);
            s = string.interpolate(s, this.context);
            buffer = new Buffer(s, this.encoding);
            
            file = string.removeEnd(file, '.in');
        }

        var dest = path.join(this.destdir, file);
        mkdirs(path.dirname(dest));
        fs.writeFileSync(dest, buffer);
        stdio.info('create %s', file);
    }, this);
    
    done(null);
};

Task.prototype.customize = function(done) {
    if (typeof this.object.run === 'function') {
        var config = {
            outputdir: this.destdir,
            variables: this.context
        };
        this.object.run(config, done);
    }
};

Task.prototype.abort = function() {
    stdio.info();
    stdio.info('Abort!');
    process.exit(1);
};

Task.prototype.done = function() {
    stdio.info();
    stdio.info('Successfully!');
    stdio.info();
};

module.exports = Task;
