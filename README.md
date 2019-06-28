# HostBridge for VSCode

This extension adds options to Make, Execute, and Put Hostbridge scripts on the Explorer context menu as well as the Editor context menu.  It also adds a Hostbridge Explorer that acts as a host repository browser.  The repository browser provides context menu options to Get and Delete content items.

Please note this extension is still considered beta.

## Disclaimer
This is an unofficial HostBridge extension.  I am not affiliated with [HostBridge](http://www.hostbridge.com).

## Features

..coming soon..

## Requirements

It is assumed you have access to a mainframe environment running Hostbridge.

## Extension Settings

This extension contributes the following settings:

* `hostbridge.host`: The default host
* `hostbridge.userid`: The default userid to use for host authentication
* `hostbridge.regions`: The available host CICS regions (specifies both name and port)
* `hostbridge.currentRegion`: The currently selected host region
* `hostbridge.repositories`: The available hostbridge repositories
* `hostbridge.currentRepository`: The currently selected hostbridge repository

## Known Issues

Doesn't prompt to set host and userid (or regions/repos) on first load

Currently limited to a single host.

## Release Notes

Continuing to work toward fully stable 1.0 version of the extension.

### 0.3.6

Added ability to notify and retry on login failure.



-----------------------------------------------------------------------------------------------------------
