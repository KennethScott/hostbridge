import * as vscode from 'vscode';
import { password, getPassword, getOutputChannel, getHttpOptions } from "./utils";
import { UriOptions } from 'request';
import * as request from 'request-promise-native';
import * as xml2js from 'xml2js';


export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  
  onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;

  data:TreeItem[] = [];

  constructor(subscriptions:any) {    

    // subscriptions.push(vscode.commands.registerCommand('hostView.toggleSelection', (treeItem:TreeItem) => {
    //   vscode.window.showInformationMessage(`Clicked a tree item: ${treeItem.label}`);
    // }));

    subscriptions.push(vscode.commands.registerCommand('hostView.getRepositoryContents', async (treeItem:TreeItem) => {
      let response: any = {};
  
      let config = vscode.workspace.getConfiguration('hostbridge');			

      await getPassword();		
  
      if (password) {
        let options:UriOptions = getHttpOptions({ port: config.currentRegion.port, repository: config.currentRepository.name, 
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
              treeItem.children.length = 0;
              result.hbjs_listing.resource[0].entry.sort((a:any,b:any) => a.$.name.localeCompare(b.$.name));   
              let region = config.regions.find(x => x.port === config.currentRegion.port);
              result.hbjs_listing.resource[0].entry.forEach(entry => {
                let contentNode = new TreeItem(entry.$.name, []);
                contentNode.tooltip = `${region.name}\\${treeItem.label}\\${entry.$.name}`;
                treeItem.children.push(contentNode);
              });
            });
          })
          .catch ((err) => { response = err; })
          .finally(() => {
            console.log(response);		
            getOutputChannel().appendLine(response);
            getOutputChannel().show(true);
          });			
  
      }
    }));    


    let hostNode = new TreeItem(vscode.workspace.getConfiguration('hostbridge').host, []);
    hostNode.contextValue = 'host';

    if (hostNode) {
      this.data.push(hostNode);

      vscode.workspace.getConfiguration('hostbridge').regions.forEach((region:any) => {
        let regionNode = new TreeItem(region.name, []);
        regionNode.contextValue = 'region';
        regionNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        vscode.workspace.getConfiguration('hostbridge').repositories.forEach((repo:any) => {
          let repoNode = new TreeItem(repo.name, []);
          repoNode.contextValue = 'repository';
          //repoNode.command = 'hostView.getRepositoryContents';
          repoNode.command = { command: 'hostView.getRepositoryContents', title: 'Get Repository Contents', arguments: [repoNode] };
          regionNode.children.push(repoNode);
        });
        
        regionNode.children.sort((a:TreeItem,b:TreeItem) => a.label.localeCompare(b.label));

        hostNode.children.push(regionNode);

        hostNode.children.sort((a:TreeItem,b:TreeItem) => a.label.localeCompare(b.label));
      });
    }    
  }

  getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}

export class TreeItem extends vscode.TreeItem {
  children: TreeItem[]|undefined;

  constructor(label: string, children?: TreeItem[]) {
    super(
        label,
        //children === undefined ? vscode.TreeItemCollapsibleState.None :
        //                         vscode.TreeItemCollapsibleState.Expanded);
        vscode.TreeItemCollapsibleState.Collapsed);
    this.children = children;
  }
}