<img src="happo-dot-io-logo.png" width="200" height="51" />

Happo is a visual regression testing tool. It hooks into your CI environment to
compare the visual appearance of UI components before and after a change.
Screenshots are taken in different browsers and across different screen sizes
to ensure consistent cross-browser and responsive styling of your application.

<!--ts-->
   * [Installation](#installation)
   * [Getting started](#getting-started)
   * [Full-page support](#full-page-support)
   * [Integrating with your Continuous Integration (CI) environment](#integrating-with-your-continuous-integration-ci-environment)
      * [happo-ci-travis](#happo-ci-travis)
      * [happo-ci-circleci](#happo-ci-circleci)
      * [happo-ci](#happo-ci)
      * [Posting statuses back to PRs/commits](#posting-statuses-back-to-prscommits)
         * [Setting the right --link/CHANGE_URL](#setting-the-right---linkchange_url)
      * [Posting statuses without installing the Happo GitHub App](#posting-statuses-without-installing-the-happo-github-app)
   * [Defining examples](#defining-examples)
      * [Conditionally applied stylesheets](#conditionally-applied-stylesheets)
      * [Limiting targets](#limiting-targets)
      * [Generated examples](#generated-examples)
      * [Asynchronous examples](#asynchronous-examples)
   * [Plugins](#plugins)
      * [TypeScript](#typescript)
      * [Scraping](#scraping)
      * [Storybook](#storybook)
      * [Gatsby](#gatsby)
      * [Puppeteer](#puppeteer)
   * [Local development](#local-development)
   * [Image loading](#image-loading)
   * [CSS Loading Strategies](#css-loading-strategies)
   * [Configuration](#configuration)
      * [project](#project)
      * [include](#include)
      * [stylesheets](#stylesheets)
      * [type](#type)
      * [targets](#targets)
      * [customizeWebpackConfig](#customizewebpackconfig)
      * [plugins](#plugins-1)
      * [publicFolders](#publicfolders)
      * [prerender (experimental)](#prerender-experimental)
      * [pages](#pages)
      * [setupScript](#setupscript)
      * [renderWrapperModule](#renderwrappermodule)
      * [rootElementSelector](#rootelementselector)
      * [tmpdir](#tmpdir)
      * [jsdomOptions](#jsdomoptions)
      * [compareThreshold](#comparethreshold)
      * [asyncTimeout](#asynctimeout)
      * [githubApiUrl](#githubapiurl)
   * [Command-Line-Interface (CLI)](#command-line-interface-cli)
   * [Preventing spurious diffs](#preventing-spurious-diffs)
   * [FAQ/Troubleshooting](#faqtroubleshooting)
      * [CSS/Styling](#cssstyling)
      * [Custom fonts](#custom-fonts)
      * [DOM measurements](#dom-measurements)
      * [How do I troubleshoot local issues?](#how-do-i-troubleshoot-local-issues)
      * [View source](#view-source)
      * [Cut-off snapshots, or snapshots with missing content](#cut-off-snapshots-or-snapshots-with-missing-content)
      * [Spurious diffs](#spurious-diffs)

<!-- Added by: henrictrotzig, at: Mon Sep  9 15:29:20 CEST 2019 -->

<!--te-->

# Installation

```bash
npm install --save-dev happo.io
```

Happo depends on `webpack`, `@babel/core`/`babel-core` and `babel-loader` as
well. If you don't already have them installed, you need to add them. What
babel core package you install depends on the version of babel you use in
your project. If you're on babel 6 or earlier, install `babel-core`. If you're
on babel 7 or later, install `@babel/core`. Happo works with both.

```bash
# When you use babel 7 or later
npm install --save-dev webpack @babel/core babel-loader

# When you use babel 6 or earlier
npm install --save-dev webpack babel-core babel-loader@7
```

# Getting started

Before you can run happo, you need to define one or more component example
files. If you already have an existing source of component examples (e.g. an
existing [storybook](https://storybook.js.org/) integration, a
style-guide/component gallery), you can either use a [plugin](#plugins) or
follow the instructions in the [Generated examples](#generated-examples)
section. If you're looking to screenshot pages of an existing application,
check out the [full-page support](#full-page-support). If not, continue
reading!

We'll use React here, which is the default `type` that this client library
supports. Let's assume there's a `<Button>` component that we're adding
examples for. First, create a file called `Button-happo.jsx` and save it next
to your `Button.jsx` file (if this doesn't match your naming scheme you can use
the [`include`](#include) option). Add a few exports to this file (yes, you can
use ES6 here):

```jsx
import React from 'react';
import Button from './Button';

export const primary = () => <Button type="primary">Primary</Button>;
export const secondary = () => <Button type="secondary">Secondary</Button>;
```

Then, we need to add some configuration. API tokens are used to authenticate
you with the remote happo.io service: `apiKey` and `apiSecret`. These can be
found on your account page at https://happo.io/account. You also need to tell
happo what browsers you want to target. In this example, we're using two
Chrome targets. One at 1024 x 768 screen ("desktop") and one on a 320 x 640
screen ("mobile").

```js
// .happo.js
const { RemoteBrowserTarget } = require('happo.io');

module.exports = {
  // It's good practice to never store API tokens directly in the config file.
  // Here, we're using environment variables.
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,

  targets: {
    'chrome-desktop': new RemoteBrowserTarget('chrome', {
      viewport: '1024x768',
    }),
    'chrome-mobile': new RemoteBrowserTarget('chrome', {
      viewport: '320x640',
    }),
  },
};
```

Save this file as `.happo.js`in the root folder of your project.

Once we're done with the configuration it's time to try things out. Before we
do that, let's add a `script` to our `package.json` file so that it's easier to
invoke commands:

```json
{
  "scripts": {
    "happo": "happo"
  }
}
```

This will expose a `happo` script we can run with

```bash
npm run happo run
```

Go ahead and run that command now.

If things are successful, you'll see something like this at the end of the run:

```
Uploading report for h5a4p3p2o1...
View results at https://happo.io/a/28/report/h5a4p3p2o1
Done h5a4p3p2o1
```

This first run will serve as our baseline. But now we need something to compare
that baseline with. A good way to test the whole flow is to make a change to a
component example and verify that happo will catch that difference. Open one of
your `*-happo.jsx` files and make some changes, e.g.

```jsx
export const primary = () => <Button type="primary">PRIMARY</Button>;
export const secondary = () => <Button type="secondary">Secondary</Button>;
export const tertiary = () => <Button type="tertiary">Tertiary</Button>;
```

Here, we made primary button have ALL CAPS and added a `tertiary` variant.

Let's run happo a second time:

```bash
npm run happo run
```

This time, we'll get a different hash:

```
Uploading report for h1a2p3p4o5...
View results at https://happo.io/a/28/report/h1a2p3p4o5
Done h1a2p3p4o5
```

Once the second run is done, we can compare the two runs by passing both hashes
to the `happo compare` action:

```bash
$ npm run --silent happo compare h5a4p3p2o1 h1a2p3p4o5
Differences were found.

- 2 diffs
- 2 added examples
- 2 unchanged examples

View full report at
https://happo.io/a/28/compare/h5a4p3p2o1/h1a2p3p4o5

→ exit status: 1
```

Don't worry about the command failing with a non-zero exit code. This is by
design, scripts use the exit code as a signal that there is a diff.

If you open this URL in a browser, you'll see something like this:

<img src="happo-report.png" alt="Happo report page" width="350" />

We've now covered the most important steps and commands involved in making a
full happo run. Normally, you won't run all these commands locally. Instead,
you'll configure your CI environment to do it for you, on every
PR/commit/branch pushed. When you're ready, jump ahead to the
[Integrating with
CI](#integrating-with-your-continuous-integration-ci-environment) section.

# Full-page support

Apart from making component snapshots, Happo can also be leveraged for
full-page screenshots via the [`pages`](#pages) configuration. In full-page
mode, URLs are loaded and rendered just like a user would see them when they
use their web browser. Any URLs specified here must be publicly accessible.

```js
// .happo.js
module.exports = {
  pages: [
    { url: 'https://www.google.com/', title: 'Google' },
    { url: 'https://www.airbnb.com/', title: 'Airbnb' },
  ],
};
```

# Integrating with your Continuous Integration (CI) environment

Once you've gone through the Getting Started guide, you should have a good
understanding of what commands are involved in making a full, two-pass, Happo
run. Happo works by running twice. Once to create a baseline, and a second time
to compare against this baseline.

Since a lot of projects these days follow a pull-request model using GitHub,
Happo provides ready-made scripts that you can run in CI:

- `happo-ci-travis` - a script designed to be run in a Travis environment.
- `happo-ci-circleci` - a script designed to be run in a CircleCI environment.
- `happo-ci` - a generic script designed to work in any CI environment. This
  script is used by both `happo-ci-travis` and `happo-ci-circleci` under the
  hood.

These scripts will all:

1. Run happo on the commit which the PR is based on
2. Run happo on the current HEAD commit
3. Compare the two reports
4. If allowed to, post back a status to the PR (the HEAD commit)

These scripts will detect your npm client (yarn or npm) and run `npm install`/`yarn install` before running happo on the commits. If you have other
dependencies/preprocessing steps that need to happen, you can override this
with the `INSTALL_CMD` environment variable. E.g.

```bash
INSTALL_CMD="lerna bootstrap" npm run happo-ci-travis
```

In this example, the `lerna bootstrap` command will be invoked before running
`happo run` on each commit, instead of `yarn install`/`npm install`.

## `happo-ci-travis`

This script knows about the Travis build environment, assuming a PR based
model. To run it, first add this to your `package.json`:

```json
{
  "scripts": {
    "happo": "happo",
    "happo-ci-travis": "happo-ci-travis"
  }
}
```

Then, configure `.travis.yml` to run this script:

```yaml
language: node_js
script:
  - npm run happo-ci-travis
```

## `happo-ci-circleci`

_Before you start using this script, have a look at the [Happo CircleCI
Orb](https://circleci.com/orbs/registry/orb/happo/happo). It simplifies some of
the setup required if you use the `happo-ci-circleci` script._

This script knows about the CircleCI build environment, assuming a PR based
model. To run it, first add this to your `package.json`:

```json
{
  "scripts": {
    "happo": "happo",
    "happo-ci-circleci": "happo-ci-circleci"
  }
}
```

Then, configure `.circleci/config.yml` to run this script. Something like this:

```yaml
jobs:
  build:
    docker:
      - image: circleci/node:8
    steps:
      - checkout
      - run:
          name: happo
          command: npm run happo-ci-circleci
```

The `happo-ci-circleci` script assumes your PRs are based off of the master
branch. If you're using a different default branch, you can set the
`BASE_BRANCH` environment variable.

```json
{
  "scripts": {
    "happo": "happo",
    "happo-ci-circleci": "BASE_BRANCH=\"origin/dev\" happo-ci-circleci"
  }
}
```

## `happo-ci`

This is a generic script that can run in most CI environments. Before using it,
you need to set a few environment variables:

- `PREVIOUS_SHA` - the sha of the baseline commit
- `CURRENT_SHA` - the sha of the current HEAD
- `CHANGE_URL` - a link back to the change ([further
  instructions](#setting-the-right---linkchange_url))

```json
{
  "scripts": {
    "happo": "happo",
    "happo-ci": "happo-ci"
  }
}
```

## Posting statuses back to PRs/commits

_The instructions in this section only work if you are using github.com or the
on-premise version of happo.io. If you're using a local GitHub Enterprise setup,
there is an alternative solution described in the [next
section](#posting-statuses-without-installing-the-happo-github-app)_

By installing the [Happo GitHub App](https://github.com/apps/happo) and
connecting to it on the [GitHub integration page on
happo.io](https://happo.io/github-integration), you allow Happo to update the
status of a PR/commit.

![Happo status posted on a commit on github](happo-status-diffs.png)

If there is a diff, the status will be set to failure. To manually flip this to a success status, just go to the Happo comparison page and click the Accept button at the top.

![Accepting diffs](happo-accept.png)

The status over on github.com will then change to green for the PR/commit.

![Happo status manually accepted cross-posted to github](happo-status-accepted.png)

Apart from having the [Happo GitHub App](https://github.com/apps/happo)
installed and connected on
[happo.io/github-integration](https://happo.io/github-integration), you also
need to make sure that you provide a `--link <url>` with your calls to `happo compare`. If you're using any of the standard CI scripts listed above, the
`--link` is automatically taken care of for you. If you're generating/setting
the link yourself, follow the instructions down below.

### Setting the right `--link`/`CHANGE_URL`

To get Happo to update the GitHub Pull Request panel with the comparison
status, the `--link` (for CLI) or `CHANGE_URL` (env variable) needs to be a
link to a GitHub Pull Request or a link to a commit in a GitHub repo. E.g.
- https://github.com/happo/happo-io/pull/3
- https://github.com/happo/happo.io/commit/47054d85bd799b72e46eb2d7b24d7eaaa78445d6

## Posting statuses without installing the Happo GitHub App

If you for some reason can't install the Happo GitHub App (e.g. when using
GitHub Enterprise) you can still get the Happo status posted to your PR -- as a
comment on the pull request. To get this working, you have to provide the Happo
CI script with user credentials containing a username and a personal access
token, through `HAPPO_GITHUB_USER_CREDENTIALS`. E.g.

```bash
HAPPO_GITHUB_USER_CREDENTIALS="trotzig:21A4XgnSkt7f36ehlK5"
```

[Here's a guide from
github.com](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line)
on how to generate the personal token.

The environment variable must contain both the username of the profile and the
personal access token, separated by a colon.

If you're using GitHub Enterprise, apart from defining the environment variable
you also need to add [`githubApiUrl` to `.happo.js`](#githubapiurl).

# Defining examples

The default way of defining happo examples for a component is through a
`ComponentName-happo.jsx` file, with an ES export for each variant you are
looking to test:

```jsx
export const primary = () => <Button type="primary">Primary</Button>;
export const secondary = () => <Button type="secondary">Secondary</Button>;
```

You can use the default export as well:

```jsx
export default () => <Button>Submit</Button>;
```

If you are more comfortable with CommonJS syntax, you can export an object
instead:

```jsx
module.exports = {
  primary: () => <Button type="primary">Primary</Button>,
  secondary: () => <Button type="secondary">Secondary</Button>,
};
```

You can define examples as objects instead of functions if you want to. This
will open up for a few extra features: [conditionally applied
stylesheets](#conditionally-applied-stylesheets) and [limiting targets for an
example](#$limiting-targets). When you use an object, you need at least a
`render` key defining a render function.

```jsx
export default () => {
  render: () => <Button>Submit</Button>,
  stylesheets: ['main'],
  targets: ['chrome-small', 'ios-safari'],
}
```

Happo will infer the component name from the file. In the example above, if the
file is named `Button-happo.jsx`, the inferred name will be `Button`.

## Conditionally applied stylesheets

An example may conditionally apply styles from certain
[`stylesheets`](#stylesheets) by using a `stylesheets` array:

```js
// Button-happo.js
export default () => {
  render: () => <Button>Submit</Button>,
  stylesheets: ['main', 'secondary'],
}
```

The strings in the array need to match `id`s of [`stylesheets`](#stylesheets)
defined in `.happo.js` config.

## Limiting targets

If you want to avoid rendering an example in all targets, you can use a
`targets` array defined for an example. The example will then be rendered in
the specified targets exclusively.

```jsx
export default () => {
  render: () => <Button>Submit</Button>,
  targets: ['chrome-small'],
}
```

The target strings in the array need to match [target keys](#targets) in
`.happo.js` config.

## Generated examples

If you want to group multiple components in one file you can export an array
instead, with objects defining the component and its variants. This can be
handy if you for some reason want to auto-generate happo examples from another
source (e.g. a style-guide, a component gallery etc).

```jsx
export default [
  {
    component: 'Button',
    variants: {
      primary: () => <Button type="primary">Primary</Button>,
      secondary: () => <Button type="secondary">Secondary</Button>,
    },
  },
  {
    component: 'Icon',
    variants: {
      small: () => <Icon size="small" />,
      large: () => <Icon size="large" />,
    },
  },
];
```

## Asynchronous examples

If you have examples that won't look right on the initial render, you can
return a promise from the example function. Happo will then wait for the
promise to resolve before it uses the markup in the DOM. This is useful if you
for instance have components that have some internal state that's hard to reach
without interacting with the component. To simplify rendering to the DOM, Happo
provides you with a function as the first argument to the example function.
When `type` is `react`, this function is a wrapper around `ReactDOM.render`.
When `type` is `plain`, this function is a simple `element.innerHTML` call,
returning a root element where that html got injected.

```jsx
// React example
export const asyncComponent = (renderInDom) => {
  return new Promise((resolve) => {
    const component = renderInDom(<Foo />);
    component.doSomethingAsync(resolve);
  });
};
```

```js
// Plain js example
export const asyncComponent = (renderInDom) => {
  const rootElement = renderInDOM('<div>Loading...</div>');
  return doSomethingAsync().then(() => {
    rootElement.querySelector('div').innerHTML = 'Done!';
  });
};
```

You can use `async`/`await` here as well:

```jsx
export const asyncComponent = async (renderInDom) => {
  const component = renderInDom(<Foo />);
  await component.doSomethingAsync();
  component.doSomethingSync();
};
```

Be careful about overusing async rendering as it has a tendency to lead to a
more complicated setup. In many cases it's better to factor out a "view
component" which you render synchronously in the Happo test.

# Plugins

## TypeScript

The Happo plugin for TypeScript will inject the necessary webpack configuration
to make Happo process TypeScript files correctly. See
https://github.com/happo/happo-plugin-typescript.

```bash
npm install --save-dev happo-plugin-typescript
```

```js
const happoPluginTypescript = require('happo-plugin-typescript');

// .happo.js
module.exports {
  // ...
  plugins: [
    happoPluginTypescript(),
  ],
};
```

## Scraping

The Happo "scrape" plugin will make it possible to grab Happo examples from an
existing website. See https://github.com/happo/happo-plugin-scrape. Make sure
to also check out the built-in [full-page support](#full-page-support).

## Storybook

The Happo plugin for [Storybook](https://storybook.js.org/) will automatically
turn your stories into Happo examples. See https://github.com/happo/happo-plugin-storybook.

```bash
npm install --save-dev happo-plugin-storybook
```

```js
const happoPluginStorybook = require('happo-plugin-storybook');

// .happo.js
module.exports {
  // ...
  plugins: [
    happoPluginStorybook(),
  ],
};
```

## Gatsby

The Happo plugin for [Gatsby](https://www.gatsbyjs.org/) turns all your
static pages into Happo tests. See https://github.com/happo/happo-plugin-gatsby.

```bash
npm install --save-dev happo-plugin-gatsby
```

```js
const happoPluginGatsby = require('happo-plugin-gatsby');

// .happo.js
module.exports {
  // ...
  plugins: [
    happoPluginGatsby(),
  ],
  type: 'plain',
};
```

## Puppeteer

If you have Happo examples that rely on measuring the DOM, the default
pre-renderer (JSDOM) might not produce the results you need. By using a real
browser (Chrome) to pre-render examples, measurements are available on render
time. See https://github.com/happo/happo-plugin-puppeteer.

```bash
npm install --save-dev happo-plugin-puppeteer
```

```js
const happoPluginPuppeteer = require('happo-plugin-puppeteer');

// .happo.js
module.exports {
  // ...
  plugins: [
    happoPluginPuppeteer(),
  ],
};
```

# Local development

The `happo dev` command is designed to help local development of components. In
dev mode, happo will watch the file system for changes, and regenerate
screenshots on every change. Used in combination with the `--only` option, this
is a great tool for iterating on a component. Let's see how it works:

```bash
⨠ yarn happo dev --only Button
Initializing...
Generating screenshots...
Waiting for firefox results (ID=254)...
Waiting for chrome results (ID=255)...
Waiting for internet explorer results (ID=256)...
Preparing report (dev-ff4c58da118671bd8826)...
View results at https://happo.io/report?q=dev-ff4c58da118671bd8826
```

If you then make changes to the code that renders Button, happo will kick off
another run. If there are diffs from the previous run, you'll see those in
the console:

```bash
Initializing...
Generating screenshots...
Waiting for firefox results (ID=254)...
Waiting for chrome results (ID=255)...
Waiting for internet explorer results (ID=256)...
Preparing report (dev-ff4c58da118671bd8826)...
View results at https://happo.io/report?q=dev-ff4c58da118671bd8826

Generating screenshots...
Waiting for firefox results (ID=258)...
Waiting for chrome results (ID=259)...
Waiting for internet explorer results (ID=260)...
Preparing report (dev-87ae2e31d6014fe4bd65)...
View results at https://happo.io/report?q=dev-87ae2e31d6014fe4bd65

Comparing with previous run...

  Differences were found.

  - 2 diffs
  - 2 unchanged examples

  View full report at
  https://happo.io/compare?q=dev-ff4c58da118671bd8826..dev-87ae2e31d6014fe4bd65
```

_NOTE_: The `--only` flag will match against the file name exporting the happo
examples by default. So `--only Button` will match against e.g.
`src/components/Button/happo.jsx`, `src/components/Button-happo.js`. If you are
exporting a lot of happo examples from a single file you can use the `#`
delimiter to signal that you want to filter inside the list of exports. This is
especially useful when you are dynamically generating happo examples in a
single file. Here's an example:

```bash
⨠ yarn happo dev --only AllComponents#Button
```

In this case, only the "Button" component in the file named e.g.
`**/AllComponents/happo.js` will be included in the report.

# Image loading

Examples can reference images in a few different ways:

- Through external URLs, e.g. `<img src="http://domain/image.png" />`. Happo
  will wait for these to be downloaded before the screenshot is taken.
- With internal paths, combined with `publicFolders` configuration. E.g.
  `<img src="/assets/images/foo.png" />`. Make sure to add an (absolute) path
  to the folder containing your assets in the `publicFolders` config option.
  Happo will automatically include these images.
- With images inlined as base64 URLs. This is often automated using webpack
  config, so that for you can `import fooImage from './images/foo.png'`
  directly.

# CSS Loading Strategies

Happo works best when CSS code is co-located with the components. In some
cases, you'll get away with zero configuration to get this working. But in many
cases, you'll have to add a little webpack config to the mix. Happo uses
webpack under the hood when generating browser-executable javascript. The
`customizeWebpackConfig` config option will let you inject things like webpack
loaders to the happo run. E.g.

```js
module.exports = {
  customizeWebpackConfig: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: [{ loader: cssLoader }],
    });
    // it's important that we return the modified config
    return config;
  },
};
```

# Configuration

Happo will look for configuration in a `.happo.js` file in the current working
folder. You can override the path to this file through the `--config` CLI
option or a `HAPPO_CONFIG_FILE` environment variable. The config file isn't
subject to babel transpilation, so it's best to stay with good old CommonJS
syntax unless you're on the very latest Node version. The configuration file
can either export an object containing the configuration options or an (async)
function that resolves with the configuration options.

## `project`

If you have multiple projects configured for your happo.io account, you can
specify the name of the project you want to associate with. If you leave this
empty, the default project will be used.

## `include`

Controls what files happo will grab examples from. The default is
`'**/@(*-happo|happo).@(js|jsx)'`. This option is useful if you want to apply a
different naming scheme, e.g. `**/*-examples.js`.

## `stylesheets`

If you rely on external stylesheets, list their URLs or (absolute) file paths
in this config option, e.g. `['/path/to/file.css', 'http://cdn/style.css']`. If
you're using [conditionally applied
stylesheets](#conditionally-applied-stylesheets), you need to use objects
instead of paths:

```js
module.exports = {
  stylesheets: [
    { id: 'main', source: '/path/to/main.css' },
    { id: 'secondary', source: '/path/to/conditional.css', conditional: true },
  ],
};
```

By default, all stylesheets are applied at render time. If you specify
`conditional: true`, only those examples that conditionally apply the
stylesheet will get styles applied from that stylesheet.

## `type`

Either `react` (default) or `plain`. Decides what strategy happo will use when
rendering examples. When the value is `react`, it is assumed that example
functions return a React component (e.g. `export default () => <Foo />`). When
the value is `plain`, it is assumed that example functions write things
straight to `document`, e.g.
`export default () => { document.body.appendChild(foo()) }`.

## `targets`

This is where you specify the browsers you want to be part of your happo run. E.g.

```js
module.exports = {
  targets: {
    // The first part ('firefox-desktop' in this case) is just a name we give
    // the specific browser target. You'll see this name in the reports generated
    // as part of a happo run.
    'firefox-desktop': new RemoteBrowserTarget('firefox', {
      viewport: '1024x768',
    }),
    'firefox-mobile': new RemoteBrowserTarget('firefox', {
      viewport: '320x640',
    }),
    chrome: new RemoteBrowserTarget('chrome', {
      viewport: '800x600',
    }),
    'internet explorer': new RemoteBrowserTarget('internet explorer', {
      viewport: '800x600',
    }),
  },
};
```

Viewports can range from `300x300` to `2000x2000` for Chrome and Firefox. Edge, Internet Explorer and Safari
need to be in the `400x400` to `1200x1200` range. The `ios-safari` target runs on iPhone 7 which means the
viewport config is always `375x667`.

This is a list of all supported browsers:

- `firefox`
- `chrome`
- `internet explorer` (version 11)
- `edge`
- `safari`
- `ios-safari` (runs on iPhone 7)

Targets are executed in parallel by default. If you want to split up a specific
target into multiple chunks (running in parallel), the experimental `chunks`
option for `RemoteBrowserTarget` can help out:

```js
module.exports = {
  targets: {
    ie: new RemoteBrowserTarget('internet explorer', {
      viewport: '1024x768',
      chunks: 2,
    }),
  },
};
```

You can also use `maxHeight` to override the default max height used by Happo
workers (5000 pixels). This is useful if you're taking screenshots of long
components/pages in your test suite. An example:

```js
module.exports = {
  targets: {
    chrome: new RemoteBrowserTarget('chrome', {
      viewport: '1024x768',
      maxHeight: 10000,
    }),
  },
};
```

Happo.io will do its best to run chunks in parallel, but there's no guarantee.
The `chunks` option also has some overhead. If your test suite isn't large,
using more than one chunk might actually slow things down.

## `customizeWebpackConfig`

A function you can use to override or modify the default webpack config used
internally by happo during a run. Make sure to always return the passed in
`config`. E.g.

```js
module.exports = {
  customizeWebpackConfig: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: [{ loader: cssLoader }],
    });
    // it's important that we return the modified config
    return config;
  },
};
```

In many cases, directly depending on the `modules` object of an existing
webpack configuration is enough. For instance, this is what you would need to
get up and running with a project using
[create-react-app](https://github.com/facebook/create-react-app):

```js
module.exports = {
  customizeWebpackConfig: (config) => {
    config.module = require('react-scripts/config/webpack.config.dev').module;
    return config;
  },
};
```

If you need to perform asynchronous actions to generate a webpack
configuration, you can return a promise that resolves with the config once you
are done. Here's an example using async/await:

```js
module.exports = {
  customizeWebpackConfig: async (config) => {
    config.module = await doSomethingAsync();
    return config;
  },
};
```

## `plugins`

An array of happo plugins. Find available plugins in the [Plugins](#plugins)
section.

```js
const happoPluginStorybook = require('happo-plugin-storybook');

module.exports = {
  plugins: [happoPluginStorybook()],
};
```

## `publicFolders`

An array of (absolute) paths specifying the places where public assets are
located. Useful if you have examples that depend on publicly available images
(e.g. `<img src="/foo.png" />`).

```js
const path = require('path');

module.exports = {
  publicFolders: [path.resolve(__dirname, 'src/public')],
};
```

## `prerender` (experimental)

Controls whether or not examples are pre-rendered in a JSDOM environment (or
Chrome if you are using
[happo-plugin-puppeteer](https://github.com/happo/happo-plugin-puppeteer)). The
default is `true`. Set to `false` to let your examples render remotely on the
happo.io browser workers instead. This can help resolve certain rendering
issues (e.g. when using a shadow DOM). The downside of rendering remotely is
that errors are harder to surface.

```js
module.exports = {
  prerender: false,
};
```

## `pages`

An array containing pages that you want to screenshot. E.g.

```js
module.exports = {
  pages: [
    { url: 'https://www.google.com/', title: 'Google' },
    { url: 'https://www.airbnb.com/', title: 'Airbnb' },
  ],
};
```

The `url` of a page needs to be publicly accessible, else the Happo browser
workers won't be able to find it.

The `title` of a page is used as the "component" identifier in the happo.io UI,
so make sure it is unique for each page.

_Note:_ when you're using the `pages` config, most other configuration options
are ignored.

## `setupScript`

An absolute path to a file that will be executed before rendering your
components. This is useful if you for instance want to inject global css
styling (e.g. a css reset), custom fonts, polyfills etc. This script is
executed in a DOM environment, so it's safe to inject things into the `<head>`.

```js
const path = require('path');

module.exports = {
  setupScript: path.resolve(__dirname, 'happoSetup.js'),
};
```

## `renderWrapperModule`

An absolute path to a file exporting a function where you can wrap rendering of
Happo examples. This can be useful if you for instance have a theme provider or
a store provider.

```js
// .happo.js
const path = require('path');

module.exports = {
  renderWrapperModule: path.resolve(__dirname, 'happoWrapper.js'),
};
```

```js
// happoWrapper.js
import React from 'react';
import ThemeProvider from '../ThemeProvider';

export default (component) => <ThemeProvider>{component}</ThemeProvider>;
```

## `rootElementSelector`

A selector used to find a DOM element that Happo will use as the container. In
most cases, you should leave this empty and let Happo figure out the root
element itself. But in some cases its useful to override the default behavior
and provide a different root. An example would be if you have wrapper
components that you don't want to be part of the screenshot.

```js
module.exports = {
  rootElementSelector: '.react-live-preview',
};
```

(example from [mineral-ui](https://github.com/mineral-ui/mineral-ui/blob/e48a47d917477b58e496fe43edbfa4bb6ceb88e9/.happo.js#L35))

## `tmpdir`

Happo uses webpack internally. By default, bundles are created in the temp
folder provided by the operating system. You can override where bundles are
stored with the `tmpdir` configuration option.

```js
module.exports = {
  tmpdir: '/some/absolute/path/to/an/existing/folder',
};
```

## `jsdomOptions`

Happo uses jsdom internally. By default, it provides sane defaults to the
`JSDOM` constructor. See
[processSnapsInBundle.js](src/processSnapsInBundle.js). You can override any
options here but your mileage may vary. See
https://github.com/jsdom/jsdom#simple-options. Here's an example where the
document's `referrer` is being set:

```js
module.exports = {
  jsdomOptions: {
    referrer: 'http://google.com',
  },
};
```

## `compareThreshold`

By default, a shallow comparison when `happo compare` is called. If two images
are different on one pixels or more, it will be reported as a diff. If you set
a `compareThreshold`, a deep comparison will be performed instead, where
individual pixels are diffed to compute a total euclidean distance between the
two images. The diff value will be between 0 and 1. A value close to 1 means
most pixels are different. A value close to 0 means images are very similar.

```js
module.exports = {
  compareThreshold: 0.005,
};
```

## `asyncTimeout`

If an example renders nothing to the DOM, Happo will wait a short while for content to appear. Specified in milliseconds, the default is `200`.

```js
module.exports = {
  asyncTimeout: 500,
};
```

## `githubApiUrl`

Used when you have the CI script configured to [post Happo statuses as
comments](#posting-statuses-without-installing-the-happo-github-app).
The default if `https://api.github.com`. If you're using GitHub Enterprise,
enter the URL to the local GitHub API here, e.g.
`https://ghe.mycompany.zone/api/v3` (the default for GHE installation is for
the API to be located at `/api/v3`).

# Command-Line-Interface (CLI)

While you are most likely getting most value from the ready-made CI integration
scripts, there are times when you want better control. In these cases, you can
use any combination of the following CLI commands to produce the results you
desire.

- `happo run [sha]` - generate screenshots and upload them to the remote
  happo.io service. Supports the `--link <url>` and `--message <message>`
  flags.
- `happo dev` - start dev mode, where you can make changes incrementally and
  view the results on happo.io as you go along.
- `happo has-report <sha>` - check if there is a report already uploaded for
  the sha. Will exit with a zero exit code if the report exists, 1 otherwise.
- `happo compare <sha1> <sha2>` - compare reports for two different shas. If
  a `--link <url>` is provided, Happo will try to post a status back to the
  commit (see [Posting statuses back to
  PRs/commits](#posting-statuses-back-to-prscommits) for more details)
  being installed). If an `--author <email>` is provided, any comment made on a diff
  will notify the author. Also supports `--message <message>`, which is used
  together with `--link <url>` to further contextualize the comparison.

# Preventing spurious diffs

An important factor when constructing a good screenshot testing setup is to
keep the number of spurious diffs to a minimum. A spurious diff (or a false
positive) is when Happo finds a difference that isn't caused by a change in the
code. These involve (but are not limited to):

- image loading
- font loading
- asynchronous behavior (e.g. components fetching data)
- animations
- random data, counters, etc
- dates

Happo tries to take care of as many of these as possible, automatically. For
instance, the following tasks are performed before taking the screenshot:

- wait for images (including background images, srcset)
- wait for custom fonts
- wait for asynchronous data fetching (XHR, `window.fetch`)
- disable CSS animations/transitions
- stop SVG animations

In some cases however, Happo can't automatically detect things that cause
spuriousness. Here are some tips & tricks that you might find useful when
dealing with spurious diffs:

- If you have dates/timestamps, either injecting a fixed `new Date('2019-05-23T08:28:02.446Z')` into your component or freezing time via
  something like [Sinon.js](https://sinonjs.org/) can help.
- If a component depends on external data (via some API), consider splitting
  out the data-fetching from the component and test the component without data
  fetching, injecting the data needed to render it.
- If you have animations controlled from javascript, find a way to disable them
  for the Happo test suite.
- If individual elements are known to cause spuriousness, consider adding the
  `data-happo-hide` attribute. This will render the element invisible in the
  screenshot. E.g. `<div data-happo-hide>{Math.random()}</div>`.

# FAQ/Troubleshooting

## CSS/Styling

There are multiple ways of letting Happo know what styling to apply. By
default, Happo will record all CSS injected in the page while it's prerendering
examples locally. In some cases (like when using web components), the CSS isn't
always available to extract. In those cases, setting [`prerender: false`](#prerender-experimental) can help.

If you have an external stylesheet, you have to specify it using the
[`stylesheets`](#stylesheets) option.

## Custom fonts

If you're using custom fonts that aren't loaded via webpack, you will most
likely have to use the [`publicFolders`](#publicfolders) option.

## DOM measurements

By default, Happo prerenders components in a JSDOM environment. If you're
depending on measurements from the DOM (e.g. `getBoundingClientRect`), you will
most likely not get the right results. In these cases, you can either inject
the dimensions as properties of the component or use [`prerender: false`](#prerender-experimental)

## How do I troubleshoot local issues?

By running happo with a `VERBOSE=true` environment variable, more logs will show up in
the console. This can help track down certain issues, and is a good tool to use
when asking for support. Here's one way to use it:

```bash
VERBOSE=true npm run happo run
```

## View source

A helpful tool to debug rendering issues is the `View source...` option presented in the
Happo reports for all snapshots, in the overflow (three-dot menu) next to the snapshot/diff.
The source is the html + css recorded by the `happo` command, unless you are running with
`prerender: false` or using the
[Storybook plugin](https://github.com/happo/happo-plugin-storybook). In the latter case,
the source will be a zip file as prepared by the `happo` command.

To save on storage, sources are available a limited time only (currently 24 hours).

## Cut-off snapshots, or snapshots with missing content

To ensure tests run quickly, happo is eager to take the screenshot. As soon as there is some
markup rendered on the page, and all assets (images, fonts, etc) are loaded, the screenshot
capture is made. In most cases, the assumption that components are ready on first render is
okay, but in some cases you might have to tell Happo workers to hold off a little. There are
two ways you can do that, depending on your setup:

- Return a promise from your render method (see [Asynchronous examples](#asynchronous-examples)
- If you're using [the Storybook plugin](https://github.com/happo/happo-plugin-storybook) - set
  [a delay](https://github.com/happo/happo-plugin-storybook#setting-delay-for-a-story)

## Spurious diffs

If you're getting diffs that aren't motivated by changes you've made (i.e. false positives),
see the section on [Preventing spurious diffs](#preventing-spurious-diffs).
