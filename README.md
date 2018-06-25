# ![StdLib](http://stdlib.com/static/images/stdlib-logo-wordmark-128.png)
## [Standard Library is a serverless platform for API development and publishing](https://stdlib.com)

**StdLib Setup** |
[Node](https://github.com/stdlib/lib-node) |
[Python](https://github.com/stdlib/lib-python) |
[Ruby](https://github.com/stdlib/lib-ruby) |
[Web](https://github.com/stdlib/lib-js)

# Introduction


StdLib is the *fastest, easiest* way to build infinitely scalable,
self-healing APIs. It has three components:

1. A central registry and library for APIs
2. A scalable, serverless hosting platform
3. Simple command line tooling for building and managing API development

StdLib is based on Function as a Service ("server-less") architecture,
popularized by AWS Lambda. You can use StdLib to build modular, scalable APIs
for yourself and other developers in *minutes* without having to manage servers,
gateways, domains, write documentation, or build SDKs. Your development workflow
has never been easier - focus on writing code you love, let StdLib handle
everything else.

StdLib uses an **open specification** called
[FaaSlang](https://github.com/faaslang/faaslang) for function definitions and
execution - if you run into concerns or questions as you're building from this
guide, please reference the FaaSlang repository. :)

You can view services published by our large and growing developer community
[on the StdLib search page](https://stdlib.com/search).

![stdlib-process](http://stdlib.com/static/images/stdlib_usage.gif)

# Table of Contents

1. [Getting Started](#getting-started)
1. [Creating Your First Service](#creating-your-first-service)
1. [Connecting Service Endpoints](#connecting-service-endpoints)
1. [Accessing Your APIs From Other Applications](#accessing-your-apis-from-other-applications)
1. [Accessing Your APIs Over HTTP](#accessing-your-apis-over-http)
1. [Running Your APIs as Background Workers](#running-your-apis-as-background-workers)
1. [Version Control and Package Management](#version-control-and-package-management)
1. [Logging](#logging)
1. [Sourcecode](#sourcecode)
1. [Additional Functionality](#additional-functionality)
1. [Acknowledgements](#acknowledgements)
1. [Contact](#contact)

# Getting Started

To get started with StdLib, first make sure you have Node 6.x installed,
[available from the official Node.js website](https://nodejs.org). Next install
the StdLib CLI tools with:

```
$ npm install lib.cli -g
```

And you're now ready to start building!

# Upgrading From Previous Versions

If you're running a previous version of StdLib and having issues with the CLI,
try cleaning up the old CLI binary links first;

```
$ rm /usr/local/bin/f
$ rm /usr/local/bin/lib
$ rm /usr/local/bin/stdlib
```

# Creating Your First Service

The first thing you'll want to do is create a workspace. Create a new directory
you intend to build your services in and initialize the workspace.

```
$ mkdir stdlib-workspace
$ cd stdlib-workspace
$ lib init
```

You'll be asked for an e-mail address to log in to the StdLib registry.
If you don't yet have an account, you can create one from the command line.
Note that you can skip account creation with `lib init --no-login`.
You'll be unable to use the registry, but it's useful for creating workspaces
when you don't have internet access.

Next, create your service:

```
$ lib create <service>
```

You'll be asked for a default function name, which is the entry point
into your service (useful if you only want a single entry point). This will automatically
generate a service project scaffold in `stdlib-workspace/<username>/<service>`.

Once created, enter the service directory:

```
$ cd your_username/your_service
```

In this directory, you'll see something like:

```
- functions/
  - __main__.js
- package.json
- env.json
- WELCOME.md
- README.md
```

At this point, there's a "hello world" function that's been automatically
created (`__main__.js`). StdLib comes paired with a simple `lib` command for
testing your functions locally and running them in the cloud.
To test your function:

```shell
$ lib .
"hello world"
```

If we examine the `functions/__main__.js` file, we see the following:

```javascript
/**
* A basic Hello World function
* @param {string} name Who you're saying hello to
* @returns {string}
*/
module.exports = (name = 'world', context, callback) => {
  callback(null, `hello ${name}`);
};
```

We can pass parameters to it using the CLI, either in order:

```shell
$ lib . "jon snow"
"hello jon snow"
```

Or named:

```shell
$ lib . --name "dolores abernathy"
"hello dolores abernathy"
```

Note that `context` is a magic parameter (automatically populated with
  execution details, when provided) as is `callback` (terminates execution),
  so these **don't need to be documented** and **can not be specified as
  parameters when executing the function**.

## Pushing to the Cloud

To push your function to a development environment in the cloud...

```shell
$ lib up dev
$ lib your_username.your_service[@dev]
"hello world"
```

And to release it (when you're ready!)

```shell
$ lib release
$ lib your_username.your_service
"hello world"
```

You can check out your service on the web, and use it in applications using our
functions gateway, `lib.id`.

```
https://functions.lib.id/your_username/your_service/
OR
https://your_username.lib.id/your_service/
```

That's it! You haven't written a line of code yet, and you have mastery over
building a service, testing it in a development (staging) environment online,
and releasing it for private (or public) consumption.

**Note:** You'll need to set `"publish": true` in the `lib` key of your
`package.json` file to see your service appear in the public registry. It's
set to `false` by default.

**Another Note:** Staging environments (like the one created with `lib up dev`)
are *mutable* and can be replaced indefinitely. Releases (`lib release`) are
*immutable* and can never be overwritten. However, any service can be torn down
with `lib down <environment>` or `lib down -r <version>` (but releases
	can't be replaced once removed, to prevent mistakes and / or bad actors).

# Connecting Service Endpoints

You'll notice that you can create more than one function per service. While
you can structure your project however you'd like internally, it should also
be noted that these functions have zero-latency access to each other. You
can access them internally with the `lib` [package on NPM](https://github.com/stdlib/lib-node),
which behaves similarly to the `lib` command for testing. Use:

```
$ npm install lib --save
```

In your main service directory to add it, and use it like so:

#### functions/add.js
```javascript
module.exports = (a = 0, b = 0, callback) => {
  return callback(null, a + b);
};
```

#### functions/add_double.js
```javascript
const lib = require('lib');

module.exports = (a = 0, b = 0, context, callback) => {
  return lib[`${context.service.identifier}.add`](a, b, (err, result) => {
    callback(err, result * 2);
  });
};
```

In this case, calling `lib .add 1 2` will return `3` and `lib .add_double 1 2`
will return `6`. The `context` magic parameter is used for its
`context.service.identifier` property, which will return the string `"your_username.your_service[@local]"`
in the case of local execution, `"your_username.your_service[@ENV]"` when deployed to an
environment or release (where `ENV` is your environment name or semver).

Note that `lib .add --a 1 --b 2` and
`lib .add_double --a 1 --b 2` are also perfectly valid, as is specifying keywords
via an object in the `add_double` function:

#### functions/add_double.js
```javascript
const lib = require('lib');

module.exports = (a = 0, b = 0, context, callback) => {
  return lib[`${context.service.identifier}.add`]({a: a, b: b}, (err, result) => {
    callback(err, result * 2);
  });
};
```

# Accessing Your APIs From Other Applications

As mentioned in the previous section, you can use the NPM `lib` package that's
[available on GitHub and NPM](https://github.com/stdlib/lib-node) to access your
APIs from legacy Node.js applications and even the web browser. We'll
have more SDKs coming out in the following months.

An existing app would call a function (username.bestTrekChar with version 0.2.1):

```javascript
const lib = require('lib');

lib.username.bestTrekChar['@0.2.1']({name: 'spock'}, function (err, result) {

  if (err) {
    // handle it
  }

  // do something with result

});
```

Which would speak to your API...

```javascript
module.exports = (name = 'kirk', callback) => {

  if (name === 'kirk') {
    return callback(null, 'why, thank, you, too, kind');
  } else if (name === 'spock') {
    return callback(null, 'i think this feeling is called "pleased"');
  } else {
    return callback(new Error('Only kirk and spock supported.'));
  }

};
```

# Accessing Your APIs Over HTTP

We definitely recommend using the [lib library on NPM](https://github.com/stdlib/lib-node)
to make API calls as specified above, but you can also make HTTPS
requests directly to the StdLib gateway. HTTP query parameters are mapped
automatically to parameters by name.

```
https://username.lib.id/liveService@1.12.2/?name=BATMAN
```

Maps directly to:

```javascript
/**
* Hello World
* @param {string} name
* @returns {string}
*/
module.exports = (name = 'world', callback) => {
  // returns "HELLO BATMAN" from above HTTP query
  callback(null, `Hello ${name}`);
};
```

# Running Your APIs as Background Workers

To run any StdLib service as a background worker (immediately returns a
  response, runs function after), simply append ":bg" to the URL before
  the HTTP query parameters (search portion of the URL), for example (from
  above):

```
https://username.lib.id/liveService@1.12.2/:bg?name=BATMAN
```

To do so from the `lib-node` library, use:

```javascript
lib({bg: true}).username.liveService['@1.12.2'](...);
```

## Background Responses

The default background response will be a content type of `text/plain` with a
string indicating the function name you're executing. There are currently
three different options for background responses that you define before you
deploy your function.

### info (DEFAULT)

Set `@bg info` in your comment definition like so:

```javascript
/**
* Hello World
* @bg info
* @param {string} name
* @returns {string}
*/
module.exports = (name = 'world', callback) => {
  callback(null, `Hello ${name}`);
};
```

This is the default as well (if nothing is specified).

### empty

Set `@bg empty` in your comment definition like so:

```javascript
/**
* Hello World
* @bg empty
* @param {string} name
* @returns {string}
*/
module.exports = (name = 'world', callback) => {
  callback(null, `Hello ${name}`);
};
```

Will return an empty (0 length) response.

### params

Set `@bg params` in your comment definition like so:

```javascript
/**
* Hello World
* @bg params
* @param {string} name
* @returns {string}
*/
module.exports = (name = 'world', callback) => {
  callback(null, `Hello ${name}`);
};
```

This will return `{"name":"world"}` in this example (if no other parameters are
  specified) as this parameter has a default value. This will spit back any
  and all parameters sent to the function, even if they're not part of the
  function signature.

# Version Control and Package Management

A quick note on version control - StdLib is *not* a replacement for normal
git-based workflows, it is a supplement focused around service creation and
execution.

You have unlimited access to any release (that hasn't been torn down)
with `lib pkg <serviceIdentifier>` to download the tarball (`.tgz`) and
`lib get <serviceIdentifier>` to automatically download and unpack the
tarball to a working directory.

Tarballs (and package contents) are *closed-source*.
Nobody but you (and potentially your teammates) has access to these. It's up to
you whether or not you share the guts of your service with others on GitHub or NPM.

As mentioned above: releases are *immutable* and can not be overwritten (but can
	be removed, just not replaced afterwards) and development / staging environments
	are *mutable*, you can overwrite them as much as you'd like.

# Logging

Logging for services is enabled by default. When running a service locally with
`lib .` or `lib .functionname`, all logs will be output in your console. The very
last output (normally a JSON-compatible string) is the return value of the function.

To view remote logs (in dev or release environments), use the following syntax:

```shell
:: Lists all logs for the service
$ lib logs username.servicename

:: Lists main service endpoint logs for "dev" environment
$ lib logs username.servicename[@dev]

:: Lists service endpoint named "test" logs for "dev" environment
$ lib logs username.servicename[@dev].test

:: Lists all logs for "dev" environment
$ lib logs username.servicename[@dev]*
$ lib logs username.servicename[@dev].*
```

The default log type is `stdout`, though you can specify `stderr` with
`lib logs username.servicename -t stderr`.

Limit the number of lines to show with the `-l` argument (or `--lines`).

# Sourcecode

StdLib Sourcecode is designed to streamline the creation of different types of projects.
Sources provide defaults for things like boilerplate code, workflows, and directory
setup so you can get right to development and implementation of more complex functionality.
You can create services from existing source codes, or create and share your own sources.

## Installing A Service from Sourcecode

You can create a service from a source code directly from the command line. To create a service using a source code,
navigate to a StdLib root directory and run

```
$ lib create -s <source name>
```

Where `<source name>` is something like `@slack/app` with an optionally specified version or
environment. This will create a new service based off the source code.

## Creating Sources

To turn a existing service into a source code, navigate to the service and run

```
$ lib source
```

This will copy the current directory contents into a new folder and add a `source.json` file
based off of the `env.json` file. To deploy a draft of the source code to the cloud, you can run

```
$ lib source:draft <draft environment name>
```

To publish a versioned, immutable source code to the registry you can run

```
$ lib source:publish
```

You can also fork an existing source code, that belongs to you, a teammate, or is publicly available with

```
$ lib source:fork -s <source name> -a <alias>
```

Which you can then modify and publish again under your own account. For more information about source codes, check out the [docs](http://docs.stdlib.com/main/#/introduction)


# Additional Functionality

StdLib comes packed with a bunch of other goodies - if your service goes down
for any reason (the service platform is acting up), use `lib restart`.
Similarly, as we roll out updates to the platform the builds we're using on
AWS Lambda may change. You can update your service to our latest build using
`lib rebuild`. We may recommend this from time-to-time, so pay attention
to e-mails and the community.

To see a full list of commands available for the CLI tools, type:

```
$ lib help
```

We've conveniently copy-and-pasted the output here for you to peruse;

```
* [all arguments converted to parameters]
	-b                   Execute as a Background Function
	-d                   Specify debug mode (prints Gateway logs)
	-t                   Specify a Library Token
	-w                   Specify a Webhook (Deprecated)
	--*                  all verbose flags converted to named keyword parameters

	Runs a StdLib function, i.e. "lib user.service[@ver]" (remote) or "lib ." (local)

create [service]
	-d                   (DEPRECATED) Dev Mode - Specify another HTTP address for the Template Service (e.g. localhost:8170)
	-f                   Force command if not in root directory
	-n                   No login - don't require an internet connection
	-s                   Source - creates service from a StdLib sourcecode
	-t                   (DEPRECATED) Template - a StdLib service template to use
	-w                   Write over - overwrite the current directory contents
	--develop            (DEPRECATED) Dev Mode - Specify another HTTP address for the Template Service (e.g. localhost:8170)
	--force              Force command if not in root directory
	--no-login           No login - don't require an internet connection
	--source             Source - creates service from a StdLib sourcecode
	--template           (DEPRECATED) Template - a stdlib service template to use
	--write-over         Write over - overwrite the current directory contents

	Creates a new (local) service

down [environment]
	-r                   Remove a release version (provide number)
	--release            Remove a release version (provide number)

	Removes StdLib package from registry and cloud environment

function:create [name] [description] [param_1] [param_2] [...] [param_n]
	-n                   New directory: Create as a __main__.js file, with the name representing the directory
	--new                New directory: Create as a __main__.js file, with the name representing the directory

	Creates a new function for a service, locally

get [full service name]
	-f                   Force command if not in root directory
	-w                   Write over - overwrite the target directory contents
	--force              Force command if not in root directory
	--write-over         Write over - overwrite the target directory contents

	Retrieves and extracts StdLib package

hosts
	Displays created hostname routes from source custom hostnames to target services you own

hosts:add [source] [target]
	Adds a new hostname route from a source custom hostname to a target service you own

hosts:remove [source]
	Removes a hostname route from a source custom hostname to a target service you own

http
	-p                   Port (default 8170)
	--port               Port (default 8170)

	Creates HTTP Server for Current Service

info [username | full service name]
	Retrieves information about a user or package

init [environment]
	-f                   Force command to overwrite existing workspace
	-n                   No login - don't require an internet connection
	--force              Force command to overwrite existing workspace
	--no-login           No login - don't require an internet connection

	Initializes StdLib workspace

login
	--email              E-Mail
	--password           Password

	Logs in to StdLib in this directory

logout
	Logs out of StdLib in this workspace

logs [service]
	-l                   The number of log lines you want to retrieve
	-t                   The log type you want to retrieve. Allowed values are "stdout" and "stderr".
	--lines              The number of log lines you want to retrieve
	--type               The log type you want to retrieve. Allowed values are "stdout" and "stderr".

	Retrieves logs for a given service

pkg [full service name]
	-f                   Force command if not in root directory
	-o                   Output path for the .tgz package
	--force              Force command if not in root directory
	--output             Output path for the .tgz package

	Downloads StdLib tarball (.tgz)

rebuild [environment]
	-r                   Rebuild a release package
	--release            Rebuild a release package

	Rebuilds a service (useful for registry performance updates), alias of `lib restart -b`

register
	Registers a new StdLib user account

release
	Pushes release of StdLib package to registry and cloud (Alias of `lib up -r`)

restart [environment]
	-b                   Rebuild service fully
	-r                   Restart a release package
	--build              Rebuild service fully
	--release            Restart a release package

	Restarts a StdLib service (if necessary)

rollback
	Rolls back (removes) release of StdLib package (alias of `lib down -r`)

source

	Converts a local service to StdLib sourcecode by creating "source.json"

source:draft [draftName]
	-p                   Publishes as a release
	--publish            Publishes as a release

	Pushes a draft of StdLib source code to the registry

source:fork
	-a                   Alias (Optional) - The new alias of the source
	-f                   Force command if not in root directory
	-i                   Install - install this sourcecode as a new library service
	-s                   Source (Required) - The name of the sourcecode to fork
	-w                   Write over - overwrite the target directory contents
	--alias              Alias (Optional) - The new alias of the source
	--force              Force command if not in root directory
	--install            Install - install this sourcecode as a new library service
	--source             Source (Required) - The name of the sourcecode to fork
	--write-over         Write over - overwrite the target directory contents

	Downloads and Forks Sourcecode from StdLib

source:publish
	Publishes a versioned release of StdLib sourcecode to registry (alias of `lib source:draft -p`)

source:remove [environment]
	-p                   Removes a published release version (provide number)
	--publish            Removes a published release version (provide number)

	Removes StdLib sourcecode from the registry

tasks:create [service] [function]
	-v                   Service version (default lastest release)
	--version            Service version (default lastest release)

	Creates a Scheduled Task from a StdLib service

tasks:destroy
	Stops a StdLib scheduled task

tasks:list
	-j                   Returns tasks as a JSON object
	--json               Returns tasks as a JSON object

	Lists your scheduled tasks

up [environment]
	-r                   Upload a release package
	--release            Upload a release package

	Pushes StdLib package to registry and cloud environment

user
	-s                   <key> <value> Sets a specified key-value pair
	--new-password       Sets a new password via a prompt
	--reset-password     <email> Sends a password reset request for the specified e-mail address
	--set                <key> <value> Sets a specified key-value pair

	Retrieves (and sets) current user information

version
	Returns currently installed version of StdLib command line tools
```

# That's it!

Yep, it's really that easy. To keep up-to-date on developments, please
star us here on GitHub, and sign up a user account for the registry. You
can read more about service hosting and keep track of official updates on
[the official StdLib website, stdlib.com](https://stdlib.com).

# Acknowledgements

StdLib is a product of and &copy; 2016 - 2017 Polybit Inc.

We'd love for you to pay attention to [@StdLibHQ](https://twitter.com/StdLibHQ) and
what we're building next! If you'd consider joining the team, [shoot us an e-mail](mailto:careers@stdlib.com).

You can also follow me, the original author, on Twitter: [@keithwhor](https://twitter.com/keithwhor).

Issues encouraged, PRs welcome, and we're happy to have you on board!
Enjoy and happy building :)

# Thanks

Special thanks to; [AngelPad](https://angelpad.org),
[Brian LeRoux](https://twitter.com/brianleroux),
[Boris Mann](https://twitter.com/bmann),
[TJ Holowaychuk](https://twitter.com/tjholowaychuk)
