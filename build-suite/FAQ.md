There are several questions that we're asked on a regular basis. In order to reduce the amount of issues that are caused by configuration mistakes, please read this FAW before posting an issue.


## 1. How exactly does the build suite work, where do my files go and where can I look for temporary processing results? ##

The Build Suite moves files and folders around quite a lot. Find a step-by-step description below, explaining where files come from, where they are put, and why this is necessary.

 * First, all remote repositories are checked out. They are usually cloned into the `exports` folder.
 * For local repositories, this step ensures that it exists and builds the absolute path to their folders.
 * The `copy` tasks copy all source files to the `output/[projectName]/` folder while applying a configurable globbing pattern. The target folder is cleared completely before this step happens.
 * In the output folder, there will now be a `code` and a `site_import` folder containing folders named with the build version. 
 * The `code/[buildVersion]` folder contains the cartridge directories.
 * The `site_import/[buildVersion]` folder contains the site import files. 
 * At this point, all files and folders are considered to be in the structure that the server will expect inside the uploaded zip files.
 * Afterwards, several steps that work on those output folders are started, depending on your configuration. (e.g. SASS, browserify and CSS minification)
 * Working in this folders happens to ensure that the original source files are not modified. (Imagine using a local repository or just doing an update operation instead of a fresh checkout.)
 * If all the processing is done, the Build Suite zips up the code (or site import) folder. The zip files are put in the `output` folder structure accordingly.
 * The resulting zip file is then uploaded on the server and unzipped there.
 * Finally, the new code version is activated (if e.g. `grunt dist` was called).


## 2. My site/code upload is failing, after some investigation I found out that the uploaded zip file does not contain any files. What am I missing? ##

Code deployment fails:

* Double check your repository configuration, especially the file/folder paths.
* Note: The `source.path` setting defaults to `"cartridges"`! Set it to `"."` if the cartridges are in the root directory of the repository.
* For CVS repositories, run a build and check the ```exports``` folder for successfully checked out files and directory structure inside the repository. Validate against your folder configuration.
* If everything is well until here, check if the ```output/[projectName]/code/[buildVersion]``` folder contains the cartridge folders. If there is nothing here, something is wrong with your cartridge folder configuration (copy task does not copy folder structure properly).

Site import fails:

* Ensure Site Import is enabled: `settings.siteImport.enabled`
* Check whether the site import is enabled for your repository: `[repository].siteImport.enabled`
* Run the build task if not done yet - the build task copies the site import data to the ```output``` folder so this is required for running the site import. Refer to question 1 to understand how this process works.
* Also, note that if you modify the site import data, you will always have to run the build task again before running the site import in order to upload modify data!
* The site import folder (```site_import.init_path```) defaults to ```"sites/site_template"```, check if your path is different
* Run a build and check the ```output/[projectName]/site_import/[buildVersion]``` path. If it is empty, your folder settings are incorrect.
* Double-check the documentation regarding site import configuration and the difference between initialization and demo data and the more complex instance-based configuration if needed.
* Note that we are testing these features on a regular basis, so if there is no error message during the import task there must be something wrong with the folder configuration. Check question 1 in order to understand what happens.


## 3. Feature X from the ANT build suite does not work or exist at all. Can I request to restore it? ##
Yes of course, we try to elaborate the features that are used frequently. But please stick to some rules before creating an issue:

 1. Search/scan **all** issues (see filter in issues section) for the desired feature. There might be a closed issue stating that this feature is now somewhere else or will not be ported due to several reasons. 
 2. If there is an existing issue, please vote and comment.
 3. See changelog for comments on issues. Maybe your problem was fixed in our last release.
 4. See pull requests, maybe your feature has already been restored but was not yet merged. In this particular case, feel free to test and provide feedback!


## 4. Running "npm install" or "grunt [task]" results in weird errors, the Build Suite is not even starting properly. ##

Grunt not found on windows?

1. Grunt must be installed globally and local. Try running ```npm install grunt -g``` and then ```npm install```
2. Try path=%PATH%;%APPDATA%\npm then grunt.  If that works then add %APPDATA%\npm to your PATH
3. Check the [Grunt FAQ](http://gruntjs.com/frequently-asked-questions) and documentation.

NPM not installing modules properly or strange errors when running Grunt?

1) Please check your installed Node.js version. We currently support v4.4 and higher.

2) If you have previously installed npm your version of npm and plugins may be out of date.  

  * Try: npm update npm -g
  * If that does not help on windows you may want to 
    * Use windows installer to re-install node.js. 
    * Check your path to ensure you don't have an old version referenced

3) If you updated the Build Suite, our repository dependencies might have changed.

  * Run ```npm install```
  * If this does not help, remove the ```node_modules``` folder completely and run ```npm install``` again.

## 5. I would like to rebuild my sandbox from scratch. What do I have to do and how does the Build Suite help me here? ##

This guide presupposes that you have configured the build suite directly or are using a properly configured project.

1. Make sure you don't have anything important stored on the target instance. Run a complete Site export if you're not sure.
1. Execute the dbinit for the site from the control center. This will completely
      erase the existing site data. You will need to wait for your new admin account password, 
      that will be re-set by the init process.
1. Log into the Business Manager once this process is done and update your password. On PIG instances, set up an own account for the Build Suite.
1. Update the config file with the credentials you just created.
1. Execute ```grunt dist``` in order to upload all cartridges, code, and static resources.
1. Execute ```grunt importSite``` to trigger the full site import.
1. Log into Business manager and check settings. Don't forget to set correct cartridge path if not part of site import.
1. Done!


## 6. How can I use the Build Suite to elaborate Continuous integration (CI)? ##

The Build Suite can be used to create continuous builds, here is how it can be done with Jenkins CI (but other CI systems will work as well).

1. Install node and Jenkins CI
1. Set up the Build Suite accordingly
1. Create a new Jenkins project
1. Add a shell task and run the command `grunt dist`

### a) Injecting configuration values through environment variables 

If you are creating custom Jenkins environment variables, for example with a build parameter plugin, you will need to export them in the shell before your grunt command to make them available to grunt for replacing: `export TARGET_ENVIRONMENT=${TARGET_ENVIRONMENT}`

For GIT builds, in your Build Suite dependency file you must set the path to the local Jenkins workspace and NOT to your remote GIT repository location as Jenkins will export the version to build locally! e.g. `file://C:/users/me/.jenkins/jobs/sample/workspace`.

Variables substitution from Jenkins is possible. Just use placeholders in the `${PLACEHOLDER_NAME}` format and the Build Suite will replace them with their environment variable counterparts automatically. For more information, refer to https://wiki.jenkins-ci.org/display/JENKINS/Building+a+software+project.

Example (excerpt from JSON file): 

    //...
    "settings": {
        "project": {
          "version": "myProject-release",
          "build": "${BUILD_NUMBER}"
        }
    },
    //...

In this scenario, the build number will be replaced by the corresponding environment variable `BUILD_NUMBER`.

### b) Injecting configuration values based on command line argument

As an alternative to a), you can also use command line arguments to inject values for placeholders.
For placeholders, use the same syntax as above and pass the argument to every command line call that Jenkins is executing:

`grunt build --project=myProject --BUILD_NUMBER=3_2_1`



## 7. I am getting warnings/errors when using Business Manager related tasks. What's wrong? ##

Please refer to related XCHange article: [CSRF protection for Business Manager](https://xchange.demandware.com/thread/20102) 

From a certain release on (TBA), Business Manager is elaborating CSRF tokens to increase security. We enhanced the Build Suite to be compliant to this mechanism. Please update to the latest version of the Build Suite or install the changes in your customized Build Suite.


## 8. When using 2-factor-auth, WebDAV operations give me "mac verify failure", what does that mean? ##

Usually the error points out that something is wrong with verifying the certificate. In most cases it indicates that the passphrase for the .p12 file you're using is wrong. To check that, please use a WebDAV client of your choice and configure it for 2FA. Select the certificate and enter your passphrase. If this is not working, there's the reason.

Please note that the `environment.two_factor.password` property must contain the passphrase for the .p12 file, not the Business Manager password or similar. The .p12 passphrase is the one you used for signing the certificate (Step 3c of ["Creating and using certificates for code deployment"](https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/SiteDevelopment/UsingTwofactorAuthenticationforCodeDeployment.html)).

## 99. I'm totally lost, please HELP! ##
Keep calm and ask the community:

*  Join the `#ci-automation` channel in our [Community Slack Team](https://sfcc-community.slack.com)
*  Search or create discussions in the [Community Suite discussion board](https://xchange.demandware.com/community/developer/community-suite/content)
*  Search or File [Issues](https://github.com/SalesforceCommerceCloud/build-suite/issues)