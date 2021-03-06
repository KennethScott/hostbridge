# Change Log


### 0.9.1 (2019-08-06)
* Fix:  If tempFolderRoot is not set and no workspace is open, properly default to opening virtually


### 0.9.0 (2019-08-04)
* Change get content function to create temp folder if it doesn't exist
* Change repository browser to use host content type (instead of file extension) to determine icon


### 0.8.9 (2019-07-26)
* Capitalized Hostbridge output channel name
* Added setup instructions to README


### 0.8.8 (2019-07-16)
* README updates


### 0.8.7 (2019-07-16)
* Shrink screenshot and add example hostbridge.hosts configuration


### 0.8.6 (2019-07-15)
* Added features and screenshot to README


### 0.8.5 (2019-07-12)
* Display scriptname in messages
* Password failures no longer require a refresh of the host explorer to try again
* Display username/region/host in password prompt  
* Standardized output channel message format
* Updated package dependencies


### 0.8.0 (2019-07-10)
* Setting changes are now detected and the repository browser will automatically refresh to changes.  


### 0.7.3 (2019-07-05)
* Added notification if no hosts found in settings.


### 0.7.2 (2019-07-05)
* Reworked Active Repository status bar item behavior.  Now properly saves between sessions.


### 0.7.1 (2019-07-05)
* Fix: Added line-break at the end of hostbridge script content (prior to save command)


### 0.7.0 (2019-07-04)
* Fix: Added HostBridge-specific encoding for file contents sent to host


### 0.6.4 (2019-07-02)
* Changed Get option to save to disk instead of opening virtual unsaved file.  Two new settings also added to 
allow user to specify both the temp folder root and the temp folder name(s) to save to.
* Disabled feature that would automatically attempt to set the Active Repository every time the active editor changed.
It was driving me crazy...  great in theory, but have to find a better implementation..
* Added autosave feature when doing make/exec/put


### 0.6.3 (2019-07-02)
* Added last updated by userid and date/time to host repository content item tooltip


### 0.6.2 (2019-07-02)
* Cleaned up the output channel so it's not so noisy


### 0.6.1 (2019-07-01)
* Can now set Active Repository from Host Explorer
* Moved view from explorer to actionbar and added hostbridge icon


### 0.6.0 (2019-06-30)
* Reworked settings to allow for multiple hosts.  
* Userid now set per region.


### 0.3.6 (2019-06-28)
* Added ability to notify and retry on login failure.


### 0.3.5 (2019-06-27)
* Added Put option
* Changed folder icons for host/region/repo to use theme default

### 0.2.0 (2019-06-25)
* Added Exec, Get, Delete options
* Added basic repo browser functionality


### 0.0.1 (2019-06-06)
* Added Make script option
