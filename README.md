# HostBridge for VSCode

This extension adds options to Make, Execute, and Put Hostbridge scripts on the Explorer context menu as well as the Editor context menu.  It also adds a Hostbridge Explorer that acts as a host repository browser.  The repository browser provides context menu options to Get and Delete content items.

_Please note this extension is still considered **beta**._

## Disclaimer
* This is an unofficial HostBridge extension and is therefore unsupported.  I am not affiliated with [HostBridge](http://www.hostbridge.com).  
* This extension was developed against Hostbridge v6.78. 

## Credits
* The functionality in this extension is modeled after the original Eclipse extension provided by Hostbridge. 
* For now the handful of file icons used in the Host Explorer are from Philipp Kief's excellent [Material Icons Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme).

## Features

* Right-click context menu options added on items in the File Explorer as well as in the editor for Execute, Make, and Put
* HBX files automatically associated with javascript
* Adds a Host Explorer that allows browsing host repositories with options to Get and Delete
* Active repository can be set via right-clicking the repository in the Host Explorer, or via the status bar option.
* Multiple hosts with different CICS regions and repositories are supported

![Screenshot](Screenshot.PNG?raw=true)


## Extension Settings

This extension contributes the following settings:

* `hostbridge.hosts`: The available hosts and their respective regions and repositories
* `hostbridge.activeRepository`: The currently selected hostbridge repository
* `hostbridge.tempFolderRoot`: If not set, defaults to current workspace folder
* `hostbridge.tempFolderName`: Folder name relative to Temp Folder Root to use for saving downloaded content (defaults to HostBridge\tempFiles)


```javascript
    "hostbridge.hosts": [
        {
            "name": "HostAbc",
            "regions": [
                {
                    "name": "CICSAAAA",
                    "port": 8888,
                    "protocol": "https",
                    "userid": "MYSIGNON",
                    "repositories": [
                        "Repo1",
                        "Repo2",
                        "Repo3"
                    ]
                },
            ]
        }
    ],
````


## License

[Apache 2.0](LICENSE)