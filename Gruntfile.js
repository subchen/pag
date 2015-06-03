module.exports = function(grunt) {

    var jsfiles = [
        'Gruntfile.js',
        'index.js',
        'lib/**/*.js',
        'test/**/*.js'
    ];

    grunt.initConfig({
        trimtrailingspaces: {
            main: {
                src: jsfiles
            }
        },
        jsbeautifier: {
            options: {
                config: '.jsbeautifyrc'
            },
            files: jsfiles
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: jsfiles
        },
        jscs: {
            options: {
                config: '.jscsrc'
            },
            files: jsfiles
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('sa-format', ['trimtrailingspaces', 'jsbeautifier']);
    grunt.registerTask('sa-lint', ['jshint', 'jscs']);
    grunt.registerTask('sa', ['sa-format', 'sa-lint']);
};
