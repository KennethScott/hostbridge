import * as vscode from 'vscode';
import { QuickPickItem } from 'vscode';
import { statusbarRegion, statusbarRepository, setupStatusBarItems, updateStatusBarItems } from "./statusBarHelper";
import { HostExplorer } from './hostExplorer';

export function activate(context: vscode.ExtensionContext) {	

	let hostExplorer = new HostExplorer(context);

	console.log('Hostbridge extension active.');

	setupStatusBarItems(context.subscriptions);
	updateStatusBarItems();

	context.subscriptions.push(vscode.commands.registerCommand('extension.updateCurrentRegion', () => {
		
		let regions:QuickPickItem[] = [];
		vscode.workspace.getConfiguration('hostbridge').regions.forEach((r:any) => {
			regions.push({ label: r.name.toString(), description: r.port.toString() });
		});
		regions.sort((a:QuickPickItem,b:QuickPickItem) => a.label.localeCompare(b.label)); 

		vscode.window.showQuickPick(regions, { placeHolder: 'Select the desired CICS region.' })
			.then((selection:any) => {
				if (!selection) {
					return;
				}
				vscode.workspace.getConfiguration().update('hostbridge.currentRegion', { name: selection.label, port: +selection.description }, vscode.ConfigurationTarget.Global);
				statusbarRegion.text = selection.label;
			});		

	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.updateCurrentRepository', () => {
		
		let repositories:QuickPickItem[] = [];
		vscode.workspace.getConfiguration('hostbridge').repositories.forEach((r:any) => {
			repositories.push({ label: r.name.toString() });
		});
		repositories.sort((a:QuickPickItem,b:QuickPickItem) => a.label.localeCompare(b.label)); 

		vscode.window.showQuickPick(repositories, { placeHolder: 'Select the desired repository.' })
			.then((selection:any) => {
				if (!selection) {
					return;
				}
				vscode.workspace.getConfiguration().update('hostbridge.currentRepository', { name: selection.label }, vscode.ConfigurationTarget.Global);
				statusbarRepository.text = selection.label;
			});		

	}));	

}

export function deactivate() {}

