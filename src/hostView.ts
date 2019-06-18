import * as vscode from 'vscode';
import { password, getPassword, getOutputChannel, getHttpOptions } from "./utils";
import { UriOptions } from 'request';
import * as request from 'request-promise-native';
import * as xml2js from 'xml2js';


export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
   
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
  //onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;
  //_onDidChangeTreeData: vscode.EventEmitter<TreeItem|undefined> = new vscode.EventEmitter<TreeItem|undefined>();
  //public onDidChangeTreeData?: vscode.Event<TreeItem|undefined> = this._onDidChangeTreeData.event;
  
  private _view: vscode.TreeView<TreeItem>;
	public get view(): vscode.TreeView<TreeItem> {
	 	return this._view;
  }
  

  data:TreeItem[] = [];

  constructor(subscriptions:any) {    

    this._view = vscode.window.createTreeView('hostView', {
			treeDataProvider: this,
			showCollapseAll: true
		});
    subscriptions.push(this._view);
    
    //this.initialize();

    subscriptions.push(vscode.commands.registerCommand('hostView.refresh', async (treeItem:TreeItem) => {
      this.initialize();
    }));

    subscriptions.push(vscode.commands.registerCommand('hostView.getRepositoryContents', async (repoNode:TreeItem) => {
      
      this.getChildren(repoNode);

      // repoNode.children = repoNode.children.concat(await this.getRepositoryContents(repoNode));
      // repoNode.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;              
      // await this._onDidChangeTreeData.fire();      

      // let response: any = {};
  
      // let config = vscode.workspace.getConfiguration('hostbridge');			

      // await getPassword();		
  
      // if (password) {

      //   let regionAndRepo:string[] = repoNode.tooltip.split('\\');
      //   let region = config.regions.find(x => x.name === regionAndRepo[0]);
      //   let options:UriOptions = getHttpOptions({ port: region.port, repository: repoNode.label, 
      //                                             action: "LIST2", password: password, filename: "*" });
  
      //   //#region get repository listing
      //   //POST https://***REMOVED***:***REMOVED***/***REMOVED***/mscript HTTP/1.1
      //   //X-HB-ACTION: LIST2
      //   //X-HB-ACTION-TARGET: *
      //   //X-HB-PLUGIN-VERSION: 201702011429
      //   //X-HB-DEFAULT-REPOSITORY: ***REMOVED***
      //   //Authorization: Basic ===
      //   //X-HB-TRANSLATE: text
      //   //Cache-Control: no-cache
      //   //Pragma: no-cache
      //   //User-Agent: Java/1.8.0_201
      //   //Host: ***REMOVED***:***REMOVED***
      //   //Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
      //   //Connection: keep-alive
      //   //Content-type: application/x-www-form-urlencoded
      //   //Content-Length: 56
      //   //#endregion
  
      //   const result = await request.post(options)
      //     .then((body) => { 
      //       response = body; 
      //       let parser = new xml2js.Parser();            
      //       parser.parseString(response, function (err, result) {
      //         repoNode.children.length = 0;
      //         result.hbjs_listing.resource[0].entry.sort((a:any,b:any) => a.$.name.localeCompare(b.$.name));                 
      //         result.hbjs_listing.resource[0].entry.forEach(entry => {
      //           let contentNode = new TreeItem(entry.$.name, []);
      //           contentNode.tooltip = `${region.name}\\${repoNode.label}\\${entry.$.name}`;
      //           repoNode.children.push(contentNode);
      //         });              
      //       });  
      //       repoNode.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;              
      //       this._onDidChangeTreeData.fire();
      //     })
      //     .catch ((err) => { response = err; })
      //     .finally(() => {	            
      //       getOutputChannel().appendLine(response);
      //       getOutputChannel().show(true);                        
      //     });			
      //   }
    }));    

  }

  async reveal(element: TreeItem, options?: { select?: boolean, focus?: boolean, expand?: boolean | number }): Promise<void> {
		this._view.reveal(element, options);
  }
  
  getParent(node: TreeItem|undefined): vscode.ProviderResult<TreeItem> {
    return node;  // TODO actually make this work...
  }

  getTreeItem(node: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return node;
  }

  getChildren(node?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
    if (node === undefined) {
      //return this.data;
      let hostNode = new TreeItem(vscode.workspace.getConfiguration('hostbridge').host, []);
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

  async getRepositoryContents(repoNode:TreeItem): Promise<TreeItem[]> {
    let response: any = {};
    let children:TreeItem[] = [];

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
              let contentNode = new TreeItem(entry.$.name, []);
              contentNode.tooltip = `${region.name}\\${repoNode.label}\\${entry.$.name}`;
              contentNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
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

  getRegions (hostNode:TreeItem): TreeItem[] {

    let children:TreeItem[] = [];

    vscode.workspace.getConfiguration('hostbridge').regions.forEach((region:any) => {
      let regionNode = new TreeItem(region.name, []);
      regionNode.contextValue = 'region';
      regionNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      children.push(regionNode);
    });

    children.sort((a:TreeItem,b:TreeItem) => a.label.localeCompare(b.label));

    return children;
  }

  getRepositories(regionNode:TreeItem): TreeItem[] {

    let children:TreeItem[] = [];

    vscode.workspace.getConfiguration('hostbridge').repositories.forEach((repo:any) => {
      let repoNode = new TreeItem(repo.name, []);
      repoNode.contextValue = 'repository';
      repoNode.tooltip = `${regionNode.label}\\${repo.name}`;
      repoNode.command = { command: 'hostView.getRepositoryContents', title: 'Get Repository Contents', arguments: [repoNode] };
      repoNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      children.push(repoNode);
    });

    children.sort((a:TreeItem,b:TreeItem) => a.label.localeCompare(b.label));

    return children;    
  }

  initialize() {

    this.data = [];

    let hostNode = new TreeItem(vscode.workspace.getConfiguration('hostbridge').host, []);
    hostNode.contextValue = 'host';
    hostNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

    if (hostNode) {
      this.data.push(hostNode);
    }

    //this._onDidChangeTreeData.fire();
    // this.reveal(hostNode, { select: true, focus: true, expand: 3});
  }    

}

export class TreeItem extends vscode.TreeItem {
  children: TreeItem[]|undefined;

  constructor(label: string, children?: TreeItem[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
        //vscode.TreeItemCollapsibleState.Collapsed);
    this.children = children;
  }
}