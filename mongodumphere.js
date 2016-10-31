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


// Pads date elements < 10 with a leading zero
function padEarly(num) {
  return num < 10 ? '0' + num : num.toString();
}

var date = new Date();
var day = padEarly(date.getDate());
var month = padEarly(date.getMonth() + 1);
var year = date.getFullYear();
var todaysDate = day + '-' + month + '-' + year;
var remoteFolder = '~/mongo-backups/' + todaysDate;
console.log(remoteFolder);

var shouldUseTunneling = true;
if (!script.host) {
  console.log(colors.yellow('\n[!] No hostname specified, using localhost and no tunnel\n'));
  shouldUseTunneling = false;
}
if (!shouldUseTunneling) {
  child_process.exec('mongodump', ['--gzip', '--archive=./mongodump.gz'], function (error, stdout, stderr) {
    if (error) {
      throw error;
    }
    console.log(stdout);
    console.log(stderr);
  });
}
if (shouldUseTunneling) {
  sshTunnelingProcedure();
}

function createLocalFoldersIfNotExist(callback){
  child_process.exec('mkdir -p ' + remoteFolder, [], function (error, stdout, stderr) {
    if (error) {
      
      console.log('[1]', stdout);
      console.log('[2]',stderr);
      throw error;
    }
    console.log('[-1]', stdout);
    console.log('[0]',stderr);
    if(callback && typeof callback === 'function'){
      callback();
    }  
  });
  
}

function copyMongoDumpToLocalMachine(){
  child_process.exec('scp drian@' + script.host + ':'+remoteFolder+'/dump-' + todaysDate + '.gz '+remoteFolder + '/dump-'+todaysDate + '.gz', [], function (error, stdout, stderr) {
    if (error) {
      console.log('[5]', stdout);
      console.log('[6]',stderr);
      throw error;
    }
    console.log('[3]', stdout);
      console.log('[4]',stderr);
  });
}

// handler for stdout or error when for remote ssh tunnel execution
function remoteExecHandler(error, stdout, stderr) {
  if (error) {
    console.log(colors.red('[  ERROR]: An error has occured'));
    console.error(stderr);
    throw error;
  }
  console.log(stdout);
  createLocalFoldersIfNotExist(copyMongoDumpToLocalMachine());
}

function sshTunnelingProcedure() {
  if (!script.username || !script.password) {
    console.log(colors.red('\n[!] No username or password specified.\n'));
    script.outputHelp();
    process.exit(1);
  }
  if (!script.port) {
    console.log(colors.red('\n[!] No port specified, using default [22].\n'));
    script.port = 22;
  }

  console.log(colors.green('[ INFO]: Reverse Tunneling into [' + script.host + '] using port [' + script.port + '] as user [' + script.username + ']'));
  // Eventually we will go a gzip upgrade to mongo 3.2
  //'mkdir -p ' + remoteFolder + ' && cd ' + remoteFolder + ' && mongodump --gzip --archive=./dump-' + todaysDate + '.gz'
  exec('mkdir -p ' + remoteFolder + ' && cd ' + remoteFolder + ' && mongodump --gzip --archive=./dump-' + todaysDate + '.gz', {
    user: script.username,
    host: script.host,
    password: script.password
  }, remoteExecHandler);
}