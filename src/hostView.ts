import * as vscode from 'vscode';

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;

  data:TreeItem[] = [];

  constructor() {
    let hostNode = new TreeItem(vscode.workspace.getConfiguration('hostbridge').host, []);

    this.data.push(hostNode);

    //var host = this.data.find(item => item.label === vscode.workspace.getConfiguration('hostbridge').host);

    vscode.workspace.getConfiguration('hostbridge').regions.forEach((region:any) => {
      let regionNode = new TreeItem(region.name, []);
      regionNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

      vscode.workspace.getConfiguration('hostbridge').repositories.forEach((repo:any) => {
        regionNode.children.push(new TreeItem(repo.name));
      });
      
      regionNode.children.sort((a:TreeItem,b:TreeItem) => a.label.localeCompare(b.label));

      hostNode.children.push(regionNode);

      hostNode.children.sort((a:TreeItem,b:TreeItem) => a.label.localeCompare(b.label));

		});
    
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
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
  }
}