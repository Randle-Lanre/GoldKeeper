#!/usr/bin/env node

const shell = require('../node_modules/shelljs');
const request  = require('../node_modules/request');
const red = "\033[31m";
const green = "\033[32m";
const black = "\033[90m";
const yellow = "\033[33m"
const colorReset = "\033[0m";

const { stdout, code } = shell.exec('git rev-parse HEAD', {silent:true});

if (code !== 0) {
  shell.echo('Error: Get git commit failed');
  shell.exit(1);
}

const commit = stdout.replace('\n', '');
const url = `https://api.github.com/repos/carlosharaujo/goldkeeper/commits/${commit}/check-runs`;
let stateMarker;
let color;

request.get({
    url: url,
    headers: {
      'Accept': 'application/vnd.github.antiope-preview+json',
      'User-Agent': 'request'
    }
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
      process.exit(1);
    }
    try {
      data = JSON.parse(data);        
    }
    catch {
        console.log('Error while parsing JSON response.');
        process.exit(1);
    }
    var hasStatus = (res.statusCode === 200 && data.total_count > 0);
    if (hasStatus) {
      const statuses = data.check_runs;
      for (var i = 0; i < statuses.length; i++) {
        let status = statuses[i];
        let state = 'pending';
        
        if (status.status === 'completed') {
          state = status.conclusion;
        }

        switch (state) {
          case "success":
            stateMarker = "✔︎";
            color = green;
            break;
          case "failure": case "error": case "action_required": case "timed_out":
            stateMarker = "✖︎"
            color = red;
            break; 
          case "cancelled":
          case "neutral":
            stateMarker = "◦"
            color = black;
            break;
          case "pending":
            stateMarker = "●"
            color = yellow;
            break;
        }
            
        stateMarker = `${color}${stateMarker} ${state}${colorReset}`;
        console.log(`${stateMarker}    ${status.name}    ${status.html_url}`);
      }
  } else {
    console.log('No status. You may need to push your changes.');
  }
});
