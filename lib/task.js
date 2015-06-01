var fs = require('fs');
var path = require('path');
var glob = require("glob");
var chalk = require('chalk');
var async = require('async');
var mkdirs = require('mkdirs');
var string = require('snack-string');
var stdio = require('./stdio');
var retry = require('./retry');

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
    async.eachSeries(this.object.variables || [], function(variable, callback) {
        retry(function(callback) {
            stdio.write('%s', chalk.yellow(variable.desc));
            stdio.write(': ');            
            if (variable.defaults) {
                stdio.write('(%s) ', variable.defaults);
            }
            stdio.readline(function(data) {
                if (data === '' && variable.required) {
                    callback(new Error(variable.desc + ' is required'));
                } else {
                    context[variable.name] = data || variable.defaults;
                    callback(null);
                }
            });
        }, function(err) {
            callback(err);
        });
    }, done);
};

Task.prototype.confirm = function(done) {
    stdio.info();
    retry(function(callback) {
        stdio.write('Is this ok? [Y/n] ');
        stdio.readline(function(data) {
            var answer = data.toLowerCase();
            if (answer === 'y' || answer === 'n' || answer === '') {
                callback(null, answer);
            } else {
                callback(new Error('not accepted answer: ' + answer));
            }
        });
    }, function(err, results) {
        if (results === 'n') {
            this.abort();
        }
        done(err);
    }, this);
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
