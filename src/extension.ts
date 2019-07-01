import * as vscode from 'vscode';
import { QuickPickItem } from 'vscode';
import { statusbarRepository, setupStatusBarItem, updateStatusBarItem } from "./statusBarHelper";
import { HostExplorer } from './hostExplorer';

export function activate(context: vscode.ExtensionContext) {	

	let hostExplorer = new HostExplorer(context);

	console.log('HostBridge extension active.');

	setupStatusBarItem(context.subscriptions);
	updateStatusBarItem();

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));

	context.subscriptions.push(vscode.commands.registerCommand('extension.updateActiveRepository', () => {
		
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

		vscode.window.showQuickPick(repositories, { placeHolder: 'Select the desired repository.' })
			.then((selection:any) => {
				if (!selection) {
					return;
				}
				vscode.workspace.getConfiguration().update('hostbridge.activeRepository', { name: selection.label }, vscode.ConfigurationTarget.Global);
				statusbarRepository.text = selection.label;
			});		

	}));	

}

export function deactivate() {}

