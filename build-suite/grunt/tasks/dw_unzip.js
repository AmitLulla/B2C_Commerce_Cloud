'use strict';

var http = require('https');

var MAX_RETRIES = 5;

module.exports = function (grunt) {
    /**
     * Triggers Unzip of a given file on WebDAV Server.
     */
    function unzipArchive(httpOptions, grunt, callback, retries) {
        var unzipRequest = http.request(httpOptions, function (res) {
            var success = false;

            if (res.statusCode === 201) {
                grunt.log.ok();
                success = true;
            } else if (res.statusCode === 404) {
                grunt.log.error('File not found on server');
            } else if (res.statusCode === 401) {
                grunt.fail.fatal('Authentication failed. Please check credentials');
            } else if (res.statusCode === 405) {
                grunt.log.error('Remote server does not support webdav!');
            } else {
                grunt.log.error('Unknown error occurred: ' + res.statusCode + ' (' + res.statusMessage + ')!');
            }

            if (success) {
                // OK
                callback();
            } else if (--retries) {
                // Retry
                grunt.log.write('   - Retrying: ');
                unzipArchive(httpOptions, grunt, callback, retries--);
            } else {
                grunt.fail.warn('Maximum retry count reached. Canceling.');
                callback();
            }
        });

        unzipRequest.on('error', function (e) {
            grunt.log.writeln(e.stack);

            // We only want to retry a couple of times on errors.
            if (--retries) {
                grunt.log.warn('  - Error unzipping file: ' + e.message);
                grunt.log.writeln('...Retrying.');
                grunt.log.writeln();
                unzipArchive(httpOptions, grunt, callback, retries--);
            } else {
                grunt.fail.warn('Maximum retry count reached. Canceling.');
                callback();
            }
        });

        grunt.log.write('   * Unzipping file... ');
        unzipRequest.end();
    }


    grunt.registerMultiTask('dw_unzip', 'Unzip a file on WebDAV', function () {
        let options = this.options();
        let done = this.async();

        options.path += '?method=UNZIP';
        options.method = 'POST';

        unzipArchive(options, grunt, done, MAX_RETRIES);
    });
};
