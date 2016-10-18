#!/usr/bin/env node

'use strict';
var script = require('commander');
var exec = require('ssh-exec');
var child_process = require('child_process');
var colors = require('colors');
script
  .version('0.1.0')
  .usage('[options]')
  // Can't use -h as it's for help
  .option('-i, --host [hostname]', 'Specify hostname or IP')
  .option('-u, --username [username]', 'Specify username for SSH tunnel')
  .option('-p, --password [password]', 'Specify password for SSH tunnel')
  .option('-P, --port [port]', 'Specify port for SSH tunnel', 22)
  .parse(process.argv);
var shouldUseTunneling = true;
if (!script.host) {
  console.log(colors.yellow('\n[!] No hostname specified, using localhost and no tunnel\n'));
  shouldUseTunneling = false;
}
if (!shouldUseTunneling) {
  child_process.execFile('mongodump', ['--gzip', '--archive=./mongodump.gz'], function(error, stdout, stderr) {
    if(error){
      throw error;
      process.exit(1);
    }
    console.log(stdout);
    console.log(stderr);
  });
}
if (shouldUseTunneling) {
  if (script.username || !script.password || script.port) {
    console.log(colors.red('\n[!] No username or password specified.\n'));
    script.outputHelp();
  }
  console.log('Reverse Tunneling into: ' + script.host);
}
