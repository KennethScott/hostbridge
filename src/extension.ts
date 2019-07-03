import * as vscode from 'vscode';
import { QuickPickItem } from 'vscode';
import { statusbarRepository, setupStatusBarItem, updateStatusBarItem } from "./statusBarHelper";
import { HostExplorer, HostTreeItem } from './hostExplorer';

export function activate(context: vscode.ExtensionContext) {	

	let hostExplorer = new HostExplorer(context);

	console.log('HostBridge extension active.');

	setupStatusBarItem(context.subscriptions);
	updateStatusBarItem();

	// this will drive you crazy if you're not watching... it sounded great in theory... reimplement better later..
	//context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));

	context.subscriptions.push(vscode.commands.registerCommand('extension.updateActiveRepository', async (hostTreeItem:HostTreeItem|undefined) => {
		
		let activeRepository:string = "";

		if (hostTreeItem) {
			activeRepository = hostTreeItem.parent.parent.label + "\\" + hostTreeItem.parent.label + "\\" + hostTreeItem.label;
		}
		else {

			let repositories:QuickPickItem[] = [];

			let config = vscode.workspace.getConfiguration('hostbridge');	
	
			config.hosts.forEach((host:any) => {
				host.regions.forEach((region:any) => {
					region.repositories.forEach((repository:any) => {
						repositories.push({ label: host.name + "\\" + region.name + "\\" + repository});
					});
				});
			});

			repositories.sort((a:QuickPickItem,b:QuickPickItem) => a.label.localeCompare(b.label)); 

			await vscode.window.showQuickPick(repositories, { placeHolder: 'Select the desired repository.' })
				.then((selection:any) => {
					if (!selection) {
						return;
					}
					activeRepository = selection.label;
				});			

		}

		vscode.workspace.getConfiguration().update('hostbridge.activeRepository', { name: activeRepository }, vscode.ConfigurationTarget.Global);
		statusbarRepository.text = activeRepository;
	}));
}

export function deactivate() {}

