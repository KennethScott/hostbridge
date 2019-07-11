import * as vscode from 'vscode';
import { utils } from "./utils";
import { UriOptions } from 'request';
import * as request from 'request-promise-native';
import * as xml2js from 'xml2js';
import * as path from 'path';
import { FileParser } from "./fileParser";
import { config } from "./config";

export class HostTreeDataProvider implements vscode.TreeDataProvider<HostTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<HostTreeItem> = new vscode.EventEmitter<HostTreeItem>();
	readonly onDidChangeTreeData: vscode.Event<HostTreeItem> = this._onDidChangeTreeData.event;

	constructor() { }

	refresh(node?: HostTreeItem): void {
		this._onDidChangeTreeData.fire(node);
	}

	getParent(node?: HostTreeItem): vscode.ProviderResult<HostTreeItem> {
		// no idea why, but if i return node.parent (which you'd think would be correct), it breaks the auto expand of the repo node...
		return null; //node.parent;
	}

	getTreeItem(node: HostTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return node;
	}

	getChildren(node?: HostTreeItem): vscode.ProviderResult<HostTreeItem[]> {
		if (node === undefined) {
			return this.getHosts();
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

	async getRepositoryContents(repoNode: HostTreeItem): Promise<HostTreeItem[]> {

		let children: HostTreeItem[] = [];

		let targetRepo = {
			host: repoNode.parent.parent.label,
			region: repoNode.parent.label,
			repository: repoNode.label
		};

		let password = await utils.getPassword(targetRepo);

		if (password) {

			let options: UriOptions = utils.getHttpOptions({
				targetRepo: targetRepo,
				action: "LIST2", password: password, filename: "*"
			});

			const result = await request.post(options)
				.then((body) => {
					let parser = new xml2js.Parser();
					parser.parseString(body, function (err, result) {
						if (result.hbjs_listing.resource[0].entry) {
							result.hbjs_listing.resource[0].entry.sort((a: any, b: any) => a.$.name.localeCompare(b.$.name));
							result.hbjs_listing.resource[0].entry.forEach(entry => {
								let contentNode = new HostTreeItem(entry.$.name, 'content', vscode.TreeItemCollapsibleState.None, [], repoNode);
								let formattedDateTime = utils.formatHostDateTime(entry.$.updated_on);
								contentNode.tooltip = `${targetRepo.region}\\${repoNode.label}\\${entry.$.name} (${entry.$.updated_by} on ${formattedDateTime})`;
								children.push(contentNode);
							});
						}
					});
					console.log(body);
				})
				.catch((err) => {
					if (err.statusCode === 401) {
						utils.setPassword(targetRepo, "");
						vscode.window.showErrorMessage('Login Failed!  Refresh and try again.');
					}
					utils.getOutputChannel().appendLine(err);
					utils.getOutputChannel().show();
				});

		}

		return children;
	}

	getHosts(): HostTreeItem[] {
		let hosts: HostTreeItem[] = [];

		config.getHosts().forEach((host: any) => {
			let hostNode = new HostTreeItem(host.name, 'host', vscode.TreeItemCollapsibleState.Collapsed, []);
			hosts.push(hostNode);
		});

		hosts.sort((a: HostTreeItem, b: HostTreeItem) => a.label.localeCompare(b.label));

		return hosts;
	}

	getRegions(hostNode: HostTreeItem): HostTreeItem[] {

		let regions: HostTreeItem[] = [];

		config.getRegions(hostNode.label).forEach((region: any) => {
			let regionNode = new HostTreeItem(region.name, 'region', vscode.TreeItemCollapsibleState.Collapsed, [], hostNode);
			regions.push(regionNode);
		});

		regions.sort((a: HostTreeItem, b: HostTreeItem) => a.label.localeCompare(b.label));

		return regions;
	}

	getRepositories(regionNode: HostTreeItem): HostTreeItem[] {

		let repositories: HostTreeItem[] = [];

		config.getRepositories(regionNode.parent.label, regionNode.label).forEach((repo: any) => {
			let repoNode = new HostTreeItem(repo, 'repository', vscode.TreeItemCollapsibleState.Collapsed, [], regionNode);
			repoNode.tooltip = `${regionNode.label}\\${repo}`;
			repoNode.command = { command: 'hostExplorer.getRepositoryContents', title: 'Get Repository Contents', arguments: [repoNode] };
			repositories.push(repoNode);
		});

		repositories.sort((a: HostTreeItem, b: HostTreeItem) => a.label.localeCompare(b.label));

		return repositories;
	}

}

export class HostExplorer {

	public hostView: vscode.TreeView<HostTreeItem>;

	constructor(context: vscode.ExtensionContext) {

		const treeDataProvider = new HostTreeDataProvider();
		this.hostView = vscode.window.createTreeView('hostView', { treeDataProvider });

		context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.make', async (uri: vscode.Uri) => {
			this.make(uri, treeDataProvider);
		}));

		context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.exec', async (uri: vscode.Uri) => {
			this.exec(uri);
		}));

		context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.refresh', async () => {
			treeDataProvider.refresh();
		}));

		context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.getRepositoryContents', async (repoNode: HostTreeItem) => {
			treeDataProvider.getChildren(repoNode);
			this.reveal(repoNode, { expand: true });
		}));

		context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.delete', async (contentNode: HostTreeItem) => {
			this.delete(contentNode, treeDataProvider);
			this.reveal(contentNode.parent, { expand: true });
		}));

		context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.get', async (contentNode: HostTreeItem) => {
			this.get(contentNode);
		}));

		context.subscriptions.push(vscode.commands.registerCommand('hostExplorer.put', async (uri: vscode.Uri) => {
			this.put(uri, treeDataProvider);
		}));

	}


	private reveal(node: HostTreeItem, options: any): Thenable<void> {
		if (node) {
			return this.hostView.reveal(node, options);
		}
		return null;
	}

	private async delete(contentNode: HostTreeItem, treeDataProvider: HostTreeDataProvider) {

		await vscode.window.showInputBox({
			prompt: "Enter 'yes' to confirm you want to delete this file from the host."
		})
			.then(async input => {

				if (input.toLowerCase() === 'yes') {

					let response: any = {};

					let targetRepo = {
						host: contentNode.parent.parent.parent.label,
						region: contentNode.parent.parent.label,
						repository: contentNode.parent.label
					};

					let password = await utils.getPassword(targetRepo);

					if (password) {

						let options: UriOptions = utils.getHttpOptions({
							targetRepo: targetRepo,
							action: "DELETE", password: password, filename: contentNode.label
						});

						const result = await request.post(options)
							.then((body) => {
								response = body;
								treeDataProvider.refresh(contentNode.parent);
							})
							.catch((err) => {
								if (err.statusCode === 401) {
									utils.setPassword(targetRepo, "");
									vscode.window.showErrorMessage('Login Failed!  Refresh and try again.');
								}
								response = err;
							})
							.finally(() => {
								utils.getOutputChannel().appendLine(response);
								utils.getOutputChannel().show();
							});
					}

				}

			});

	}

	private async get(contentNode: HostTreeItem) {

		let targetRepo = {
			host: contentNode.parent.parent.parent.label,
			region: contentNode.parent.parent.label,
			repository: contentNode.parent.label
		};

		let password = await utils.getPassword(targetRepo);

		if (password) {

			let options: UriOptions = utils.getHttpOptions({
				targetRepo: targetRepo,
				action: "GET", password: password, filename: contentNode.label,
				resolveWithFullResponse: true
			});

			const result = await request.post(options)
				.then((response) => {

					let filename: string = contentNode.label;
					// append hbx if hostbridge file
					if (response.headers['content-type'] === "text/javascript" && !contentNode.label.endsWith('.hbx')) {
						filename = contentNode.label + '.hbx';
					}

					utils.openHostContent(filename, response.body);

				})
				.catch((err) => {
					if (err.statusCode === 401) {
						utils.setPassword(targetRepo, "");
						vscode.window.showErrorMessage('Login Failed!  Refresh and try again.');
					}
					utils.getOutputChannel().appendLine(err);
					utils.getOutputChannel().show();
				});

		}

	}

	private async make(uri: vscode.Uri, treeDataProvider: HostTreeDataProvider) {

		if (uri.fsPath === vscode.window.activeTextEditor.document.uri.fsPath) {
			await vscode.window.activeTextEditor.document.save();
		}

		let activeRepo:any = utils.getActiveRepository();

		if (activeRepo) {

			let response: any = {};

			let password = await utils.getPassword(activeRepo);

			if (password) {

				let hbFile = new FileParser(uri);

				hbFile.contents += "\n" + "save as " + hbFile.filename.replace(".hbx", "");
				let options: UriOptions = utils.getHttpOptions({
					targetRepo: activeRepo,
					action: "MAKE", password: password, filename: hbFile.filename, contents: hbFile.contents
				});

				const result = await request.post(options)
					.then((body) => {
						response = body;
						treeDataProvider.refresh();
					})
					.catch((err) => {
						if (err.statusCode === 401) {
							utils.setPassword(activeRepo, "");
							vscode.window.showErrorMessage('Login Failed!  Refresh and try again.');
						}
						response = err;
					})
					.finally(() => {
						utils.getOutputChannel().appendLine(response);
						utils.getOutputChannel().show();
					});

			}

		}
	}

	private async put(uri: vscode.Uri, treeDataProvider: HostTreeDataProvider) {

		if (uri.fsPath === vscode.window.activeTextEditor.document.uri.fsPath) {
			await vscode.window.activeTextEditor.document.save();
		}

		let activeRepo:any = utils.getActiveRepository();

		if (activeRepo) {

			let response: any = {};

			let password = await utils.getPassword(activeRepo);

			if (password) {

				let hbFile = new FileParser(uri);

				let options: UriOptions = utils.getHttpOptions({
					targetRepo: activeRepo,
					action: "PUT", password: password, filename: hbFile.filename, contents: hbFile.contents
				});

				const result = await request.post(options)
					.then((body) => {
						response = body;
						treeDataProvider.refresh();
					})
					.catch((err) => {
						if (err.statusCode === 401) {
							utils.setPassword(activeRepo, "");
							vscode.window.showErrorMessage('Login Failed!  Refresh and try again.');
						}
						response = err;
					})
					.finally(() => {
						utils.getOutputChannel().appendLine(response);
						utils.getOutputChannel().show();
					});

			}

		}
	}

	private async exec(uri: vscode.Uri) {

		if (uri.fsPath === vscode.window.activeTextEditor.document.uri.fsPath) {
			await vscode.window.activeTextEditor.document.save();
		}

		let activeRepo:any = utils.getActiveRepository();

		if (activeRepo) {

			let response: any = {};

			let password = await utils.getPassword(activeRepo);

			if (password) {

				let hbFile = new FileParser(uri); 

				let options: UriOptions = utils.getHttpOptions({
					targetRepo: activeRepo,
					action: "RUN", password: password, filename: hbFile.filename, contents: hbFile.contents
				});

				const result = await request.post(options)
					.then((body) => { response = body; })
					.catch((err) => {
						if (err.statusCode === 401) {
							utils.setPassword(activeRepo, "");
							vscode.window.showErrorMessage('Login Failed!  Refresh and try again.');
						}
						response = err;
					})
					.finally(() => {
						utils.getOutputChannel().appendLine(response);
						utils.getOutputChannel().appendLine(">>> End of Response: " + new Date().toLocaleString());					
						utils.getOutputChannel().show();
					});
			}

		}
	}

}

export class HostTreeItem extends vscode.TreeItem {
	children: HostTreeItem[] | undefined;
	parent: HostTreeItem | undefined;

	constructor(label: string, contextValue: string, collapsibleState: vscode.TreeItemCollapsibleState, children?: HostTreeItem[], parent?: HostTreeItem) {

		super(label, collapsibleState);

		this.children = children;
		this.parent = parent;
		this.contextValue = contextValue;

		switch (contextValue) {
			case 'host':
			case 'region':
			case 'repository':
				this.iconPath = vscode.ThemeIcon.Folder;
				break;
			case 'content':
				// get extension if exists and determine type..
				let icon: string;
				let pieces: string[] = label.split('.');
				if (pieces.length > 1) {
					switch (pieces[pieces.length - 1]) {
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
				this.iconPath = {
					light: path.join(__filename, '..', '..', 'resources', 'light', icon),
					dark: path.join(__filename, '..', '..', 'resources', 'dark', icon)
				};
				break;
			default:
				break;
		}

	}
}