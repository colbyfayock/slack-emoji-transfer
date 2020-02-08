# Slack Emoji Transfer

A node script that makes it ~easy~ easier to import all emojis from one Slack workspcae into another.

## Before You Use This
**These actions are undoable** - once you successfully run this script, it will have added emoji to the Slack you're transferring to.

## Getting Started
### Prerequisities
* Oauth token from the Slack you're transferring **from** (`xoxp-*`)
* User token from the Slack you're transferring **to** (`xoxs-*`)

*See below for how to grab tokens.*

### How to Use
* Obtain tokens for the Slack you're transfering from and the Slack you're trasnfering to
* Run `yarn install` to pull in dependencies
* Run `yarn transfer` to initiate the script
* Follow the prompts to enter your token, optionally preview, and to run the scripts

## How this works?
### Slack API
There are 2 methods of the Slack API being utilize to make this work, `emoji.list` and `emoji.add`. `emoji.list` [is documented](https://api.slack.com/methods/emoji.list) however `emoji.list` [is not](https://webapps.stackexchange.com/a/126154).

* `emoji.list`: used along side the Oauth token specified in the from prompt to grab all of the emojis from the workspace
* `emoji.add`: used along side the User token specified in the to prompt to add each individual emoji

### Rate Limits
To avoid too many requests, the script breaks up the requests in batches and performs the requests in the frequency at the top of the `index.js` file.

Rate limit information can be found here: https://api.slack.com/docs/rate-limits

## How to Grab Tokens

If you're doing this as a 1 off (which is what I did), you can use the following methods to grab your tokens. If you're more familiar or trying to integrate something properly with the Slack API, you probably want to follow their instructions for API integration.

### Oauth Token
> Requirement: the token must match the pattern `xoxp-*`

To obtain an Oauth token for a 1 off request, you can utilize Slack's Legacy Token tool to generate a token.

* Log in to your Slack workspace that you want to import from
* Visit https://api.slack.com/legacy/custom-integrations/legacy-tokens
* Next to the workspace you would like to generate, click Create Token or if you already have one generated, simply copy and paste the available token for future use

### User Token
> Requirement: the token must match the pattern `xoxs-*`

Unfortunately as I'm writing this, there's not an easy way to obtain this token. Instead what we can do is log in to our Slack workspace and grab the User token your active session is using to make the requests in the web app.

* Log in to your Slack workspace that you want to transfer to
* Visit the Customize section of the web app (or https://my.slack.com/customize)
* Open up your browser's developer tools, particularly the web console that will allow you to run commands ([Chrome](https://developers.google.com/web/tools/chrome-devtools), [Firefox](https://developer.mozilla.org/en-US/docs/Tools))
* Run the following ocmmand `window.prompt('API Token', TS.boot_data.api_token)`
* Copy the value for future use

*Thanks @jackellenberger via https://github.com/jackellenberger/emojme#finding-a-slack-token*

## TODO
Feel free to submit a PR if you're feeling ambitious :)
* Alias support: currently it just errors when trying to add
