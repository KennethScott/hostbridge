import * as vscode from 'vscode';
import { password, getPassword, getOutputChannel, openNewNamedVirtualDoc, getHttpOptions } from "./utils";
import { UriOptions } from 'request';
import * as request from 'request-promise-native';
import * as xml2js from 'xml2js';
import * as path from 'path';
import { FileParser } from "./fileParser";

let config = vscode.workspace.getConfiguration('hostbridge');

export class HostTreeDataProvider implements vscode.TreeDataProvider<HostTreeItem> {
   
  private _onDidChangeTreeData:vscode.EventEmitter<HostTreeItem> = new vscode.EventEmitter<HostTreeItem>();
  readonly onDidChangeTreeData:vscode.Event<HostTreeItem> = this._onDidChangeTreeData.event;
  
  data:HostTreeItem[] = [];

  constructor() { }

  refresh(node?: HostTreeItem): void {
		this._onDidChangeTreeData.fire(node);
  }
  
  getParent(node?: HostTreeItem): vscode.ProviderResult<HostTreeItem> {    
    // no idea why, but if i return node.parent (which you'd think would be correct), it breaks the auto expand of the repo node...
    return null; //node.parent;
  }

  getTreeItem(node: HostTreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {    
    return node;
  }

  getChildren(node?: HostTreeItem): vscode.ProviderResult<HostTreeItem[]> {
    if (node === undefined) {
      let hostNode = new HostTreeItem(vscode.workspace.getConfiguration('hostbridge').host, 'host', vscode.TreeItemCollapsibleState.Collapsed, []);
      return [hostNode];
    }
    else if (node.contextValue === 'host') {
      return this.getRegions(node);
    }    
    else if (node.contextValue === 'region') {
      return this.getRepositories(node);
    }
    else if (node.contextValue === 'repository') {
      return this.getRepositoryContents(node);
    }
    else { 
      return node.children;    
    }
  }

  async getRepositoryContents(repoNode:HostTreeItem): Promise<HostTreeItem[]> {
    let response: any = {};
    let children:HostTreeItem[] = [];

    let config = vscode.workspace.getConfiguration('hostbridge');			

    await getPassword();		

    if (password) {

      let region = config.regions.find(x => x.name === repoNode.parent.label);
      let options:UriOptions = getHttpOptions({ port: region.port, repository: repoNode.label, 
                                                action: "LIST2", password: password, filename: "*" });

      //#region get repository listing
      //POST https://***REMOVED***:***REMOVED***/***REMOVED***/mscript HTTP/1.1
      //X-HB-ACTION: LIST2
      //X-HB-ACTION-TARGET: *
      //X-HB-PLUGIN-VERSION: 201702011429
      //X-HB-DEFAULT-REPOSITORY: ***REMOVED***
      //Authorization: Basic ===
      //X-HB-TRANSLATE: text
      //Cache-Control: no-cache
      //Pragma: no-cache
      //User-Agent: Java/1.8.0_201
      //Host: ***REMOVED***:***REMOVED***
      //Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
      //Connection: keep-alive
      //Content-type: application/x-www-form-urlencoded
      //Content-Length: 56
      //#endregion

      const result = await request.post(options)
        .then((body) => { 
          response = body; 
          let parser = new xml2js.Parser();            
          parser.parseString(response, function (err, result) {      
            if (result.hbjs_listing.resource[0].entry) {       
              result.hbjs_listing.resource[0].entry.sort((a:any,b:any) => a.$.name.localeCompare(b.$.name));                 
              result.hbjs_listing.resource[0].entry.forEach(entry => {
                let contentNode = new HostTreeItem(entry.$.name, 'content', vscode.TreeItemCollapsibleState.None, [], repoNode);
                contentNode.tooltip = `${region.name}\\${repoNode.label}\\${entry.$.name}`;
                children.push(contentNode);
              });              
            }
          });          
        })
        .catch ((err) => { response = err; })
        .finally(() => {	            
          getOutputChannel().appendLine(response);
          getOutputChannel().show(true);                        
        });			
      
    }

    return children;
  }    

  getRegions (hostNode:HostTreeItem): HostTreeItem[] {

    let children:HostTreeItem[] = [];

    vscode.workspace.getConfiguration('hostbridge').regions.forEach((region:any) => {
      let regionNode = new HostTreeItem(region.name, 'region', vscode.TreeItemCollapsibleState.Collapsed, [], hostNode);
      children.push(regionNode);
    });

    children.sort((a:HostTreeItem,b:HostTreeItem) => a.label.localeCompare(b.label));

    return children;
  }

  getRepositories(regionNode:HostTreeItem): HostTreeItem[] {

    let children:HostTreeItem[] = [];

    vscode.workspace.getConfiguration('hostbridge').repositories.forEach((repo:any) => {
      let repoNode = new HostTreeItem(repo.name, 'repository', vscode.TreeItemCollapsibleState.Collapsed, [], regionNode);
      repoNode.tooltip = `${regionNode.label}\\${repo.name}`;
      repoNode.command = { command: 'hostExplorer.getRepositoryContents', title: 'Get Repository Contents', arguments: [repoNode] };
      children.push(repoNode);
    });

    children.sort((a:HostTreeItem,b:HostTreeItem) => a.label.localeCompare(b.label));

    return children;    
  }
  
}

export class HostExplorer {

  private hostView: vscode.TreeView<HostTreeItem>;

	constructor(context: vscode.ExtensionContext) {
    
    const treeDataProvider = new HostTreeDataProvider();    
    this.hostView = vscode.window.createTreeView('hostView', { treeDataProvider });  

    context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.make', async (uri:vscode.Uri) => { 
      this.make(uri, treeDataProvider); 
    }));
  
    context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.exec', async (uri:vscode.Uri) => {
      this.exec(uri);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.refresh', async () => {
      treeDataProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.getRepositoryContents', async (repoNode:HostTreeItem) => {      
      treeDataProvider.getChildren(repoNode);
      this.reveal(repoNode, { expand: true });
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.delete', async (contentNode:HostTreeItem) => {      
      this.delete(contentNode, treeDataProvider);
      this.reveal(contentNode.parent, { expand: true });
    }));      

    context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.getFile', async (contentNode:HostTreeItem) => {      
      this.getFile(contentNode);
    })); 

	}


	private reveal(node:HostTreeItem, options:any): Thenable<void> {		
		if (node) {
			return this.hostView.reveal(node, options);
		}
		return null;
  }
  
  private async delete(contentNode:HostTreeItem, treeDataProvider:HostTreeDataProvider) {

    await vscode.window.showInputBox({
			prompt: "Enter 'yes' to confirm you want to delete this file from the host."
    })
    .then(async input => {
    
      if (input.toLowerCase() === 'yes') {

        let response: any = {};

        let config = vscode.workspace.getConfiguration('hostbridge');			

        await getPassword();		

        if (password) {

          let parts:string[] = contentNode.tooltip.split('\\');
          let region = config.regions.find(x => x.name === parts[0]);
          let options:UriOptions = getHttpOptions({ port: region.port, repository: parts[1], 
                                                    action: "DELETE", password: password, filename: contentNode.label });

          //#region delete script
          //DELETE https://***REMOVED***:***REMOVED***/***REMOVED***/Test3 HTTP/1.1
          //X-HB-ACTION: DELETE
          //X-HB-ACTION-TARGET: Test3
          //X-HB-PLUGIN-VERSION: 201702011429
          //X-HB-DEFAULT-REPOSITORY: ***REMOVED***
          //Authorization: Basic ===
          //Cache-Control: no-cache
          //Pragma: no-cache
          //User-Agent: Java/1.8.0_201
          //Host: ***REMOVED***:***REMOVED***
          //Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
          //Connection: keep-alive
          //#endregion

          const result = await request.post(options)
            .then((body) => { 
              response = body; 
              treeDataProvider.refresh(contentNode.parent);        
            })
            .catch ((err) => { response = err; })
            .finally(() => {	            
              getOutputChannel().appendLine(response);
              getOutputChannel().show(true);                        
            });			
        }

      }

    });

  }    

  private async getFile(contentNode:HostTreeItem) {
    
    let config = vscode.workspace.getConfiguration('hostbridge');			

    await getPassword();		

    if (password) {

      let region = config.regions.find(x => x.name === contentNode.parent.parent.label);
      let options:UriOptions = getHttpOptions({ port: region.port, repository: contentNode.parent.label, 
                                                action: "GET", password: password, filename: contentNode.label,
                                                resolveWithFullResponse: true });

      //#region get script
      //POST https://***REMOVED***:***REMOVED***/***REMOVED***/mscript HTTP/1.1
      //X-HB-ACTION: GET
      //X-HB-ACTION-TARGET: CdoDepCesaInq
      //X-HB-PLUGIN-VERSION: 201702011429
      //X-HB-DEFAULT-REPOSITORY: ***REMOVED***
      //Authorization: Basic ===
      //X-HB-TRANSLATE: text
      //Cache-Control: no-cache
      //Pragma: no-cache
      //User-Agent: Java/1.8.0_201
      //Host: ***REMOVED***:***REMOVED***
      //Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
      //Connection: keep-alive
      //Content-type: application/x-www-form-urlencoded
      //Content-Length: 54
      //#endregion

      const result = await request.post(options)
        .then((response) => {   

          let filename:string = contentNode.label;
          // append hbx if hostbridge file
          if (response.headers['content-type'] === "text/javascript" && !contentNode.label.endsWith('.hbx')) {
            filename = contentNode.label + '.hbx';
          }

          let schemeAndName:vscode.Uri = vscode.Uri.parse("untitled:" + filename);
          openNewNamedVirtualDoc(schemeAndName, response.body);

        })
        .catch ((err) => { 
          getOutputChannel().appendLine(err);
          getOutputChannel().show(true); 
        });
      
    }

  }  

  private async make(uri:vscode.Uri, treeDataProvider:HostTreeDataProvider) {

    let response: any = {};

		await getPassword();	

		if (password) {

			let hbFile = new FileParser(uri);
			hbFile.contents += "save as " + hbFile.filename.replace(".hbx", "");
			let options:UriOptions = getHttpOptions({ port: config.currentRegion.port, repository: config.currentRepository.name, 
														action: "MAKE", password: password, filename: hbFile.filename, contents: hbFile.contents });
			
			//#region MAKE Headers 
			// POST /***REMOVED***/mscript HTTP/1.1
			// X-HB-ACTION: MAKE
			// X-HB-ACTION-TARGET: Test3.hbx
			// X-HB-PLUGIN-VERSION: 201702011429
			// X-HB-DEFAULT-REPOSITORY: ***REMOVED***
			// Authorization: Basic ---
			// Content-type: text/plain
			// X-HB-TRANSLATE: text
			// Cache-Control: no-cache
			// Pragma: no-cache
			// User-Agent: Java/1.8.0_201
			// Host: ***REMOVED***:***REMOVED***
			// Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
			// Connection: keep-alive
			// Content-Length: 994
			//#endregion

			const result = await request.post(options)
				.then((body) => { 
          response = body; 
          treeDataProvider.refresh();
				})
				.catch ((err) => { response = err; })
				.finally(() => {
					console.log(response);		
					getOutputChannel().appendLine(response);
					getOutputChannel().show(true);
				});					

		}    
  }

  private async exec(uri:vscode.Uri) {

    let response: any = {};

		await getPassword();		

		if (password) {

			let hbFile = new FileParser(uri);
			let options:UriOptions = getHttpOptions({ port: config.currentRegion.port, repository: config.currentRepository.name, 
														action: "RUN", password: password, filename: hbFile.filename, contents: hbFile.contents });

			//#region RUN (Exec) Headers 
			// POST /***REMOVED***/mscript HTTP/1.1
			// X-HB-ACTION: RUN
			// X-HB-ACTION-TARGET: Test3.hbx
			// X-HB-PLUGIN-VERSION: 201702011429
			// X-HB-DEFAULT-REPOSITORY: ***REMOVED***
			// Authorization: Basic ---
			// Content-type: text/plain
			// X-HB-TRANSLATE: text
			// Cache-Control: no-cache
			// Pragma: no-cache
			// User-Agent: Java/1.8.0_201
			// Host: ***REMOVED***:***REMOVED***
			// Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
			// Connection: keep-alive
			// Content-Length: 979
			//#endregion

			const result = await request.post(options)
				.then((body) => { response = body; })
				.catch ((err) => { response = err; })
				.finally(() => {
					//console.log(response);		
					getOutputChannel().appendLine(response);
					getOutputChannel().show(true);
				});			
		}    
  }

}

export class HostTreeItem extends vscode.TreeItem {
  children: HostTreeItem[]|undefined;
  parent: HostTreeItem|undefined;

  constructor(label: string, contextValue: string, collapsibleState: vscode.TreeItemCollapsibleState, children?: HostTreeItem[], parent?: HostTreeItem) {

    super(label, collapsibleState);

    this.children = children;
    this.parent = parent;
    this.contextValue = contextValue;

    let icon: string;

    switch (contextValue) {
      case 'host':
        icon = 'folder-server.svg'; 
        break;
      case 'region':
        icon = 'folder-environment.svg'; 
        break;
      case 'repository':
        icon = 'folder-javascript.svg'; 
        break;
      case 'content':
        // get extension if exists and determine type..
        let pieces:string[] = label.split('.');
        if (pieces.length > 1) {
          switch (pieces[pieces.length-1]) {
            case 'css':
              icon = 'css.svg'; 
              break;
            case 'jpg':
            case 'gif':
              icon = 'image.svg';
              break;
            case 'htm':
            case 'html':
              icon = 'html.svg';
              break;
            case 'js':
            case 'hbx':
              icon = 'javascript.svg';
              break;
            case 'xml':
              icon = 'xml.svg'; 
              break;
            default:
              icon = 'document.svg';
              break;
          }
        }
        else {
          icon = 'javascript.svg';
        }
        break;
      default:
        break;
    }

    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', icon),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', icon)
    };

  }
}