import * as vscode from 'vscode';
import { password, getPassword, getOutputChannel, openInUntitled, getHttpOptions } from "./utils";
import { UriOptions } from 'request';
import * as request from 'request-promise-native';
import * as xml2js from 'xml2js';
import { FileParser } from "./fileParser";

let config = vscode.workspace.getConfiguration('hostbridge');

export class HostTreeDataProvider implements vscode.TreeDataProvider<HostTreeItem> {
   
  private _onDidChangeTreeData:vscode.EventEmitter<HostTreeItem> = new vscode.EventEmitter<HostTreeItem>();
  readonly onDidChangeTreeData:vscode.Event<HostTreeItem> = this._onDidChangeTreeData.event;
  
  data:HostTreeItem[] = [];

  constructor(context:vscode.ExtensionContext) { }

  refresh(node?: HostTreeItem): void {
		this._onDidChangeTreeData.fire(node);
  }
  
  getParent(node?: HostTreeItem): vscode.ProviderResult<HostTreeItem> {    
    return null;  // TODO actually make this work...
  }

  getTreeItem(node: HostTreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {    
    return node;
  }

  getChildren(node?: HostTreeItem): vscode.ProviderResult<HostTreeItem[]> {
    if (node === undefined) {
      //return this.data;
      let hostNode = new HostTreeItem(vscode.workspace.getConfiguration('hostbridge').host, []);
      hostNode.contextValue = 'host';
      hostNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
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

      let regionAndRepo:string[] = repoNode.tooltip.split('\\');
      let region = config.regions.find(x => x.name === regionAndRepo[0]);
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
            result.hbjs_listing.resource[0].entry.sort((a:any,b:any) => a.$.name.localeCompare(b.$.name));                 
            result.hbjs_listing.resource[0].entry.forEach(entry => {
              let contentNode = new HostTreeItem(entry.$.name, [], repoNode);
              contentNode.tooltip = `${region.name}\\${repoNode.label}\\${entry.$.name}`;
              contentNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
              contentNode.contextValue = 'content';
              children.push(contentNode);
            });              
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
      let regionNode = new HostTreeItem(region.name, [], hostNode);
      regionNode.contextValue = 'region';
      regionNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      children.push(regionNode);
    });

    children.sort((a:HostTreeItem,b:HostTreeItem) => a.label.localeCompare(b.label));

    return children;
  }

  getRepositories(regionNode:HostTreeItem): HostTreeItem[] {

    let children:HostTreeItem[] = [];

    vscode.workspace.getConfiguration('hostbridge').repositories.forEach((repo:any) => {
      let repoNode = new HostTreeItem(repo.name, [], regionNode);
      repoNode.contextValue = 'repository';
      repoNode.tooltip = `${regionNode.label}\\${repo.name}`;
      repoNode.command = { command: 'hostView.getRepositoryContents', title: 'Get Repository Contents', arguments: [repoNode] };
      repoNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      children.push(repoNode);
    });

    children.sort((a:HostTreeItem,b:HostTreeItem) => a.label.localeCompare(b.label));

    return children;    
  }

  async delete(contentNode:HostTreeItem) {

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
              this.refresh(contentNode.parent);        
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

  async getFile(contentNode:HostTreeItem) {
    
    let config = vscode.workspace.getConfiguration('hostbridge');			

    await getPassword();		

    if (password) {

      let parts:string[] = contentNode.tooltip.split('\\');
      let region = config.regions.find(x => x.name === parts[0]);
      let options:UriOptions = getHttpOptions({ port: region.port, repository: parts[1], 
                                                action: "GET", password: password, filename: contentNode.label });

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
        .then((body) => {       
          // todo: conditionally determine type
          openInUntitled(body, 'javascript');
        })
        .catch ((err) => { 
          getOutputChannel().appendLine(err);
          getOutputChannel().show(true); 
        })
        .finally(() => { });			
      
    }

  }    
   
	async make (uri:vscode.Uri) {
	
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
          this.refresh();
				})
				.catch ((err) => { response = err; })
				.finally(() => {
					console.log(response);		
					getOutputChannel().appendLine(response);
					getOutputChannel().show(true);
				});					

		}

	}

  async exec (uri:vscode.Uri) {
    
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

export class HostExplorer {

  private hostView: vscode.TreeView<HostTreeItem>;
  private hostTreeDataProvider: HostTreeDataProvider;  

	constructor(context:vscode.ExtensionContext) {
		/* Please note that login information is hardcoded only for this example purpose and recommended not to do it in general. */
		//const ftpModel = new FtpModel('mirror.switch.ch', 'anonymous', 'anonymous@anonymous.de');
    
    // this guy has to be local for creating the treeview, but we also need it exposed.. there has to be a better way...
    const treeDataProvider = new HostTreeDataProvider(context);    
    this.hostView = vscode.window.createTreeView('hostView', { treeDataProvider });
    
    this.hostTreeDataProvider = treeDataProvider;

    context.subscriptions.push(vscode.commands.registerCommand('hostView.refresh', async () => {
      treeDataProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('hostView.getRepositoryContents', async (repoNode:HostTreeItem) => {      
      treeDataProvider.getChildren(repoNode);
      this.reveal(repoNode, { expand: true });
      //this._onDidChangeTreeData.fire(repoNode);
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('hostView.delete', async (contentNode:HostTreeItem) => {      
      treeDataProvider.delete(contentNode);
      this.reveal(contentNode.parent, { expand: true });
    }));      

    context.subscriptions.push(vscode.commands.registerCommand('hostView.getFile', async (contentNode:HostTreeItem) => {      
      treeDataProvider.getFile(contentNode);
    })); 

		//vscode.commands.registerCommand('ftpExplorer.refresh', () => treeDataProvider.refresh());
		//vscode.commands.registerCommand('ftpExplorer.openFtpResource', resource => this.openResource(resource));
		//vscode.commands.registerCommand('ftpExplorer.revealResource', (node) => this.reveal(node));
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

	public reveal(node:HostTreeItem, options:any): Thenable<void> {		
		if (node) {
			return this.hostView.reveal(node, options);
		}
		return null;
  }
  
  public make(uri:vscode.Uri) {
    this.hostTreeDataProvider.make(uri);
  }

  public exec(uri:vscode.Uri) {
    this.hostTreeDataProvider.exec(uri);
  }

}

export class HostTreeItem extends vscode.TreeItem {
  children: HostTreeItem[]|undefined;
  parent: HostTreeItem|undefined;

  constructor(label: string, children?: HostTreeItem[], parent?: HostTreeItem) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
    this.parent = parent;
  }
}