import * as vscode from 'vscode';
import * as statusBarHelper from "./statusBarHelper";
import { HostExplorer, HostTreeItem } from './hostExplorer';

export function activate(context: vscode.ExtensionContext) {	

	let hostExplorer = new HostExplorer(context);

	console.log('HostBridge extension active.');

	statusBarHelper.setupStatusBarItem(context.subscriptions);
	// just reload the last saved active repo.. don't reset based on active editor..
	//statusBarHelper.updateStatusBarItem();

	// this will drive you crazy if you're not watching... it sounded great in theory... reimplement better later..
	//context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));

	context.subscriptions.push(vscode.commands.registerCommand('extension.updateActiveRepository', async (hostTreeItem:HostTreeItem|undefined) => {		
		statusBarHelper.updateStatusBarItem(hostTreeItem);
	}));

	if (!vscode.workspace.getConfiguration('hostbridge').hosts) {
		vscode.window.showInformationMessage('No hosts found.  Please specify hosts via Settings\\Extensions\\HostBridge.');
	}
}

export function deactivate() {}

