# Build Suite

## Introduction

Use the Build Suite to automate and customize your build processes. Configure your build and deployment process and hit a single button to package a build, deploy it to your environment, and activate the new code version.

The Build Suite is part of the [Commerce Cloud Community Suite](https://developer.commercecloud.com/s/article/Commerce-Cloud-Community-Suite). It uses the [Grunt](http://gruntjs.com/) JavaScript task runner, feel free to familiarize yourself with Grunt before installing it.


## Getting Started

### Installation

1. In Windows environments, we recommend using [Git Bash](https://git-for-windows.github.io/) or [Cygwin](https://www.cygwin.com/). Alternatively, you can use CMD/Powershell.
2. Install Node.js v10 or later. You can download it from [the OpenJS Foundation](https://nodejs.org/en/download/).

### Using the Build Suite as a Node.js Module

You can install the Build Suite as an npm package. However, it is not available through the npm public registry. Download it from GitHub.

To access it on the private GitHub repository, use a pre-shared SSH key or your GitHub credentials.

* SSH/PSK: `git+ssh://git@github.com/SalesforceCommerceCloud/build-suite.git`
* HTTPS: `git+http://yourUsername:yourPassword@github.com/SalesforceCommerceCloud/build-suite.git`

To install the Build Suite, add it as a dependency, and then run `npm install`.

We recommend running the Build Suite via the `scripts` directive:

```
scripts: {
    "buildsuite": "grunt --gruntfile node_modules/sfcc-cs-build-suite/Gruntfile.js"
}
```

The required  `--gruntfile` parameter tells Grunt where to find the Gruntfile.

*Change from Earlier Versions:* The Build Suite looks for `build.json` in the project root folder instead of looking for `config.json` in the `build` folder.

To use a different path or filename, use the `--project` parameter. For example: `--project=build/config` uses the `config.json` file in the `build` folder.

To run the Build Suite:

```
npm run buildsuite build
```

*Important:* To pass parameters, use npm’s  `--` directive:

```
npm run buildsuite build -- --project=sitegenesis
```

### Using the Build Suite Locally

1. Download or Pull the Build Suite from Github
2. Run `npm install` in the root folder of the repository. Installation might take a while.

### Troubleshooting

* Problems? Refer to the [Frequently asked Questions](https://github.com/SalesforceCommerceCloud/build-suite/blob/master/FAQ.md).
* See also [Grunt Getting Started](http://gruntjs.com/getting-started).

### Quick Start

See `sitegenesis-sample.json` for a working OOTB SiteGenesis configuration example.

The following steps describe the shortest way to run the Build Suite:

1. Create a copy of `sitegenesis-sample.json`, and name it `config.json`.
1. Configure your deployment target in `environments` (instance URL and credentials).
1. Optional: Set `settings.project.version` to the code version name that will be used (for example, 'build-suite-test').
1. Run a complete build and deploy with `grunt dist`.

### Detailed Steps to Run a Build

1. Copy `config.json.sample`, and give it a new name (for example, `myProject.json`).

    * You can configure multiple projects to be processed from the same Build Suite installation by creating multiple JSON files.
    * To select a project, add  `--project=myProject`, for example, to the grunt command.
    * If you don’t specify a project name, the Build Suite looks for a `config.json` file.

1. Configure settings.

    * The `settings.project.version` property represents the name of the code version that will be created and activated on the server.
    * The optional `settings.project.build` property is meant to carry the build, or version, number.

1. Set up dependencies.

    * The Build Suite currently supports SVN and Git.
    * Ensure that the given tool is working properly by using the corresponding command in the command line environment.
    * The dependency file can contain multiple SVN and Git repositories. You can configure each repository separately.
    * Configure local repositories through relative paths. The `build` folder is the CWD, so start with `../`.

1. If you want to use Git SSH URIs, set up the Git SSH key accordingly.

    * If your SSH key contains a passphrase (optional), use a password saver like ssh_agent so that you’re not prompted for your passphrase, which stalls the script when it runs in the UX Studio Plugin. (See https://help.github.com/articles/working-with-ssh-key-passphrases.)
    * We also recommend that you set the GIT_SSH environment variable to the SSH executable that was included in your Git installation, to help avoid problems with the build script stalling in UX Studio Plugin.

1. Set up environments

    * You can configure multiple environments. Those are identified with their key or name.
    * If you set up only one environment, it’s always the default environment.
    * If you set up multiple environments, use the `settings.general.target_environment` property to set the default target.
    * You can also set the target by using the `--target` command line parameter, for example, `--target=mySandbox`.
    * For the `environments.[x].server` property, use the instance hostname with dashes so that you do not run into any SSL exceptions when connecting to the target environment with the Build Suite. For example: `instance-realm-customer.demandware.net`

1. Add front-end build scripts to the build process.

    * The Build Suite supports running scripts through [npm's scripts directive](https://docs.npmjs.com/misc/scripts).
    * After being added to your `package.json`, open your `config.json` and go to the `dependencies.*.npm` section.
    * In that section, list all the scripts that should be called during the build.
    * You can configure the Build Suite to run `npm install` by setting `npm.install` to **true** (or to **production**)

1. Test your configuration by calling, for example, `grunt build --project=[projectName]` and `grunt upload --project=[projectName]`.



## Documentation

### Configuration

For a full list of configuration parameters, default values, and documentation, see the [documented Config example](https://github.com/SalesforceCommerceCloud/build-suite/blob/master/build/config.json.full-doc).

### Available Tasks

Run `grunt help` to receive a list of available tasks. All of the main tasks are defined in the `aliases.yml` file.

**Note:** `grunt --help` lists *all* tasks, even if they are supposed to represent subtasks, or tasks that are run from the command line.

### Build

* `grunt build` performs a checkout and local build of the complete project.
* `grunt upload` performs a code upload of previously built project.
* `grunt activate` activates the configured code version.
* `grunt dist` performs a build, uploads the file, and activates and cleans the uploaded file. (Call `grunt http:deleteUpload` to do this manually.)

### Site Import

You can configure site import after the build or dist task. To configure site import, see the [documented Config example](https://github.com/SalesforceCommerceCloud/build-suite/blob/master/build/config.json.full-doc) and verify the suggested folder structure. You can divide the site import into two parts.
1. Configuration and initialization.
2. Optional. Demo site data.

* `grunt initSite`: Site import initialization and configuration (default source folder: `sites/site_template`).
* `grunt initDemoSite`: Demo site import (default source folder: `sites/site_demo`).
* `grunt importSite`: Complete site import, including demo site (if given).
* `grunt importMeta`: Metadata import. Metadata is always read from the configuration data (default: `sites/site_template/meta`).

### Other Tasks

* `grunt triggerReindex`: Trigger a Search Index rebuild for all sites of the target environment.
* `grunt exportUnits`: Trigger a site export for all sites given in `settings.site_export.sites`.
* `grunt` (without task name): Start Watch task, which constantly checks for updates in JS+SCSS and rebuilds automatically while running.

### Repository Contents

```
 -root
  |-build
  | |-config.json.min-sample            Minimum possible configuration template. Copy to config.json for basic use.
  | |-config.json.min-doc               Documentation for minimum config. Do NOT use as template!
  | |-config.json.full-sample           Full configuration template. Copy to config.json for advanced use.
  | |-config.json.full-doc              Full documentation for config. Do NOT use as template!
  | |-sfra-sample.json                  Sample configuration for Storefront reference architecture (SFRA)
  | |-sfra-sample.md                    Quickstart documentation for SFRA
  | |-sitegenesis-sample.json           SiteGenesis sample configuration (works OOTB)
  | `-sitegenesis-sample.md             Quickstart documentation for SiteGenesis sample
  |
  |-grunt                               Grunt Configuration and tasks
  | |-config                            Alias (alias.yml) and Configuration parameters (*.js)
  | |-lib                               Utility/Initialization modules
  | `-tasks                             All Commerce Cloud specific task implementations
  |
  |-resources                           Sample template for storefront toolkit, OCAPI configuration
  |
  |-Gruntfile.js                        Main Gruntfile 
  `-package.json                        Node Package Manager dependencies
```

### Command Line Parameters

You can select a configuration file and one of the contained target environments.

### Project Selection

Per default, the Build Suite is looking for a `config.json` file in its build folder. If you have multiple files, use of the `--project` parameter.

```
--project=myProject
```

This parameter loads `build/myProject.json`.
You can move your JSON files into subfolders and load them by adding the path accordingly. For example, `--project=myProjectFolder/myProject.json`.

### Environment Selection

You can deploy to multiple target environments. If you configure only one, the Build Suite deploys to that environment by default. If you have multiple environments, you can either select one by using the `settings.general.target_environment` setting or by using the `--target` parameter. For example:

```
--target=dev11
```

This selects `environments.dev11`.
**Note:** If you want to deploy the same build to multiple environments, first call `grunt build` and then call
`grunt upload activate --target=dev11` for every environment you want to deploy to.

### Print Task Configuration

To evaluate whether the configuration is assembled correctly, which is partially generated during startup, you can use the `--print-config` parameter. If you use this parameter without a value, the complete configuration is written to the output. You can also get a partial output by using, for example, `--print-config=cssmin` for printing only the cssmin task configuration.

### Default Repository Structure

The following structure is assumed for a Git repository. All defaults follow this scheme. If your structure differs, adapt the corresponding folder settings. All of them are visible in the documented project configuration example files in the [build](https://github.com/SalesforceCommerceCloud/build-suite/blob/master/build) folder.

```
 -root
    |-cartridges                 (Commerce Cloud cartridges)
    | |-app_sample
  | |-...
  | `-bm_plugin
    |
    `-sites
      |-site_template            (site template structure as defined for site import)
      | |-custom-objects
      | |-meta
      | `-sites
      |   |-site_a               (actual site definitions)
      |   `-site_b               (actual site definitions)
      |-site_demo
      | |-catalogs               (demo site data, example products/customer accounts etc.)
      | |-pricebooks
      | `-sites
      |   |-site_a               (actual site definitions)
      |   `-site_b               (actual site definitions)
      `-config                   (optional: target-instance based configurations that perform replace operations on init/demo data)
        |-dev_a                  (environment config folder)
        |-dev_b
        |-stg
        `-prd
```

### Two-Factor Authentication

Two-factor authentication (2FA) is needed for certain PIG instances. You need the 2FA passphrase and a [certificate file](https://xchange.demandware.com/blogs/pnguyen06/2016/08/20/dw-tut-create-a-p12-certificate). The certificate file must be made available in the file system.
To activate 2FA:

* Make sure you can connect using 2FA (using a WebDAV client of your choice).
* Don’t change the `server` setting of your environment. Start this setting with **staging**.
* In the configuration file, add the following setting to your environment:



```
{
    "two_factor": {
        "enabled": true,
        "password": "secure",
        "cert": "certs/mycert.p12",
        "url": "cert.staging...."
    }
}
```

The certificate file path can be either absolute or relative. If using a relative path, consider the Build Suite root as the root folder for your path.

## Site Import

The Build Suite decides between two kinds of site import:

* Site template, or configuration import (`importConfig` task)
* Demo data import (`importDemo` task)

You can run both together using the `importSite` task. Use `importMeta` to import only updated metadata (for example, `CustomObjects`).

The site import is created only when `settings.siteImport.enabled` is set to **true**. The `build` task prepares the site import (checks out the site import data from the VCS and copies it to a staging folder), while the import task only processes and uploads the site import data.

Although you can import site templates to PIG environments, demo data is meant only for setting up Sandboxes with a representative dataset (for example, content or catalog).

### Site Template

The site template is based on the site structure contained within the site import ZIP files. So the best way to create a site template is to export configuration data from an already configured instance via Business Manager, and then unzip, select, and modify the needed files.

Store the site template in the `sites/site_template` folder of your repository. It should contain only configuration data (for example, basic site setup data and preferences).

Because each repository can contain a site template, the build process combines them all by copying the contents into the same directory and then compressing and uploading it. This way each project can define their own site. 

Files might get overwritten if they are in the same location, so have all global files (for example, metadata) in one cartridge and only site-related configuration in the corresponding site cartridges.

We recommend having just configuration data inside the site template structure—no content or catalog data. Store demo data in a separate directory (see below).
The purpose behind this concept is to enable users to:

* Deploy the site template to a PIG to add new or update existing preferences along with a code release.
* Deploy the site template along with demo data on a plain Sandbox to rapidly set up a development environment that contains representative product catalogs, customer accounts, content libraries, and so on.

### Demo Data

Demo data works similarly to site templates and follows the same structure. Store demo data under `sites/site_demo`. The max upload size limit is 100 MB over WebDAV.

### Metadata

Metadata is expected in the site template. However, it’s also fetched from demo data as a fallback. Accordingly, metadata is imported along with the site import that contains the corresponding files.

### Using OCAPI Data API for Site Imports

To enable OCAPI, take the following steps:

1. Copy the OCAPI preferences from sample file `resources/ocapi_settings.json` and add it to the client ID that you are using. (In Business Manager: **Administration > Site Development > Open Commerce API Settings**)
2. Add the OCAPI Client ID and secret to the configuration. (See the Configuration section.)

The Build Suite automatically switches to OCAPI if credentials are found in the configuration.
Supported tasks are:

* Site import
* Content import (run using the standard site import job)
* Code activation

### Environment-Based Site Import

Based on the selected environment, you can apply particular replacements in the site template, metadata, or even demo data. Use the configured site template as the basis and apply replacements to it. Three types of replacements are possible:

* Text-based replacements (for example, replace `https://mywebserviceurl-production.com` with `https://mywebserviceurl-test.com`)
* XML/XPath-based replacements (see the example below)
* File-based replacements (for example, replace `sites/SiteGenesis/preferences.xml` with another file)

How to use:

1. Make sure the standard site import is configured and working properly.
2. In the desired dependency in your configuration, set `siteImport.environmentPath`. Make sure that the path is relative to the repository root. For example, use  `sites/config` if the sites folder is in your repository root.
3. In the folder that you configured, create a subfolder that matches the target environment key in your configuration. For example, if you want to set up replacements for `environments.dev01`, create a subfolder called `dev01`.
4. In that folder, you can now place files that will overwrite their counterparts in the standard site import.
5. Additionally, create a `config.json` file in the folder to set up replacements. See the following example for configuring replacements.
6. After you run a new build, and when you run the site import again, replacements are applied if the environment is selected.


Sample `config.json` for replacements:


```
{
    "xmlReplacements": [{
        "options": {
            "namespaces": {
                "t": "http://www.demandware.com/xml/impex/preferences/2007-03-31"
            },
            "replacements": [{
                "xpath": "/t:preferences//t:preference[@preference-id=\"SiteLibrary\"]",
                "value": "MyCustomLibrary"
            }]
        },
        "files": ["sites/*/preferences.xml"]
    }],
    "textReplacements": [{
        "options": {
            "replacements": [{
                "from": "production-list-prices",
                "to": "development-list-prices"
            }]
        },
        "files": [
            "sites/*/preferences.xml"
        ]
    }]
}
```

For more information on the mechanism behind xmlReplacements, see the [xmlpoke](https://github.com/bdukes/grunt-xmlpoke) documentation. The `xmlReplacements.options` section represents the xmlpoke options array and is passed as-is. This enables you to use the full feature set of xmlpoke. Especially, pay attention to the namespaces, because xmlpoke relies on the correct namespace reference.

For more information on the mechanism behind textReplacements, see the [grunt-text-replace](https://github.com/yoniholmes/grunt-text-replace) documentation. Text replacements are applied through regular expressions and simple text replacements (as shown above). The `options.replacements` array is passed as-is to the `grunt-text-replace` module.

## Storefront Toolkit Build Information

The Build Suite can add information about the current build into the Storefront Toolkit. If enabled, the Build Suite adds a menu item to the Storefront Toolkit menu that provides an overlay with information about the current build.

To enable this feature, see the `settings.storefront_build_information` section in your configuration file. The sample file provides example and default values.

* `enabled`: Set to **true** or **false** to enable or disable the Build Information for the current target.
* `target_cartridge`: The (storefront) cartridge to add the template that contains the Build Information output. The template is always placed in the default, or debug, template folder and is named `build_info.isml`.
* `target_template`: The template that contains the include of the Build Information output. You don’t have to care about the layout or output, because the template only adds the overlay when you click the corresponding menu item in the Storefront Toolkit. (Note: We use inline Javascript here, so choose a footer template.)

If you're using the standard SiteGenesis template structure, you don't need to change the `target_template` value.

## Deprecated Features

### Sass (Deprecated Due to NPM Script Support)

By default, the `build` task looks for a `style.scss` file in the `scss` directory of every cartridge. The output (the complied `style.css`) is put in `static/default/css` in the same cartridge. Two parts of this process are configurable per dependency: 

* You can change the file name from `style.scss` via `environment.sass.sourceFile` (target filename will always be the same with .css ending). 
* You can also change the source directory from `scss` to anything you want (for example, `sass\source`). 

Because SiteGenesis proposes a fixed folder structure for CSS files, the target directory is not configurable. Also, as we suggest using only one frontend cartridge to provide the CSS, you configure the above mentioned cartridges globally. You can’t configure these properties per cartridge.

### Autoprefixer (Deprecated Due to NPM Script Support)

[Autoprefixer](https://github.com/postcss/autoprefixer) parses CSS and adds vendor-prefixed CSS properties using the [Can I Use](http://caniuse.com/) database. The `build` task runs `autoprefixer` on all `.css` files. By default, `autoprefixer` targets these browsers: `> 1%, last 2 versions, Firefox ESR, Opera 12.1`.

### Resource Optimization (Deprecated Due to NPM Script Support)

You can use the Build Suite to concatenate and minify your CSS and Javascript resources. Enable resource optimization via `settings.optimize.js` and `settings.optimize.css`.

You can enable resource concatenation via `settings.optimize.concatenate`. If enabled, resource cancatenation is controlled via markups in ISML templates: 

* Place special comments before and after an include block. 
* Inside the first comment, define the relative source path along with the target filename. For more details, see the following examples.

**Note:** Only files in the same cartridge can be merged. Also, target filenames must be unique. We recommend using only one storefront cartridge that contains all static files.

### CSS Example

```
<!--- BEGIN CSS files to merge.(source_path=cartridge/static/default;targetfile=css/allinone.css) ---><link rel="stylesheet" href="${URLUtils.staticURL('/css/example1.css')}" /><link rel="stylesheet" media="print" href="${URLUtils.staticURL('/css/example2.css')}" /><link rel="stylesheet" href="${URLUtils.staticURL('/css/example3.css')}" /><!--- END CSS files to merge. --->
```

### JS Example

```
<!--- BEGIN JS files to merge.(source_path=cartridge/static/default;targetfile=js/allinone.js) ---><script src="${URLUtils.staticURL('/lib/example1.js')}" type="text/javascript"></script><script src="${URLUtils.staticURL('/lib/jquery/example2.js')}" type="text/javascript"></script><!--- END JS files to merge. --->
```



## Tips

### Linting, Unit Tests, and So On.

Set up linting and tests as NPM tasks at the repository. If you want to run NPM tasks as a part of the build, add them to the `npm` part of your repository.

### Configuring the Build to Run in Your CI Environment, or via the Command Line

For more information, refer to the CI section in the [FAQ](https://github.com/SalesforceCommerceCloud/build-suite/blob/master/FAQ.md).

### Using a Folder Other than `cartridges` for Your Code

In your configuration, set the repository property `repository.source.path` to match your source folder name. **Note:** The default setting is** **`cartridges`. If there isn’t a `cartridges` folder in your repository but cartridges are in the repository root, configure this folder as `"."`.

### Specifying the directories in your project to upload

In your configuration, set the dependency property `repository.source.glob` to select desired files and directories. By default, it’s set to upload everything `**/*`. Grunt's [globbing pattern](http://gruntjs.com/configuring-tasks#globbing-patterns) is used. **Note:** You can't use curly brackets  `{}` (for “or” operations) as the default, because of the limitation of Java Properties file. If you want to use them, enter the globbing pattern as a CSV string.
Examples:

* For example, to ignore a file, set `glob` to `['**/*','!filename']`.
* To ignore a folder, set `glob` to `['**/*','!**/folder/**']`.
* To use curly brackets, enter a string instead of an array: `"'**/*','!filename'{.js,.css}"`

### Version Numbers

Version numbers should contain three digits (for example,  `1_0_0` ), where the first digit represents a major release, the second represents a minor point release or update, and the third digit represents a hot fix update. If you’re doing multiple releases to UAT, like fixing small issues, you update only the bug fix number. Separate release numbers with only an underscore (_). We recommend following the best practices explained in [semantic versioning](http://semver.org/) along with [an appropriate changelog](http://keepachangelog.com/).

## Contributing

1. Create a fork of this repository.
2. Ensure that your fork is up to date.
3. Create a working branch in your fork.
4. After making changes, submit a [pull request](https://github.com/SalesforceCommerceCloud/build-suite/pull/new/master).

### Who Do I Talk To?

* Commerce Cloud Developer Center
* Maintainer: [Daniel Mersiowsky](https://quip.com/TSFAEAXJ3Ac)

## License

Licensed under the current NDA and licensing agreement that’s in place with your organization. (Open-source licensing does not apply.)

## Support

This repository is a Salesforce B2C Commerce community plugin that’s maintained by the Salesforce Customer Success Group. This repository isn’t supported by Salesforce Commerce Cloud Support. For feature requests or bugs, open a GitHub issue. Contributions are welcome.

### Change Log

Pull the current head to benefit from our latest fixes and improvements. View the complete change log in `CHANGELOG.md`.

