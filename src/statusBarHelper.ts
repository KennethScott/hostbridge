import * as vscode from 'vscode';

export let statusbarRegion: vscode.StatusBarItem;
export let statusbarRepository: vscode.StatusBarItem;

export function setupStatusBarItems(subscriptions:any) {
	statusbarRegion = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusbarRegion.command = 'extension.updateCurrentRegion';
	let currentRegion = vscode.workspace.getConfiguration('hostbridge').currentRegion as any;
	statusbarRegion.text = (!currentRegion) ? "SET REGION" : currentRegion.name;
	subscriptions.push(statusbarRegion);

	statusbarRepository = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusbarRepository.command = 'extension.updateCurrentRepository';
	let currentRepository = vscode.workspace.getConfiguration('hostbridge').currentRepository as any;
	statusbarRepository.text = (!currentRepository) ? "SET REPOSITORY" : currentRepository.name;
	subscriptions.push(statusbarRepository);
}

export function updateStatusBarItems() {
	let editor:vscode.TextEditor|undefined = vscode.window.activeTextEditor;
	if (editor) {
		if (editor.document.fileName.toLowerCase().endsWith('.hbx')) {
			let uriPieces = editor.document.uri.fsPath.split("\\");
			statusbarRepository.text = uriPieces[uriPieces.length-2];			
			statusbarRegion.show();
			statusbarRepository.show();
		}
		else {
			statusbarRegion.hide();
			statusbarRepository.hide();
		}
	}	
}