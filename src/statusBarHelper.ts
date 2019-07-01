import * as vscode from 'vscode';
import { FileParser } from "./fileParser";

export let statusbarRepository: vscode.StatusBarItem;
export const ACTIVE_REPOSITORY_NOT_SET:string = "SET ACTIVE REPOSITORY";

export function setupStatusBarItem(subscriptions:any) {
	statusbarRepository = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusbarRepository.command = 'extension.updateActiveRepository';
	let currentRepository = vscode.workspace.getConfiguration('hostbridge').currentRepository as any;
	statusbarRepository.text = (!currentRepository) ? ACTIVE_REPOSITORY_NOT_SET : currentRepository.name;
	subscriptions.push(statusbarRepository);
}

export function updateStatusBarItem() {
	let editor:vscode.TextEditor|undefined = vscode.window.activeTextEditor;
	if (editor) {
		let file = new FileParser(editor.document.uri);
		if (file.filename.toLowerCase().endsWith('.hbx')) {
			let pieces = statusbarRepository.text.split("\\");
			if (pieces.length !== 3) {
				statusbarRepository.text = ACTIVE_REPOSITORY_NOT_SET;
			}
			else {
				pieces[2] = file.folder;
				statusbarRepository.text = pieces.join("\\");
			}		
			statusbarRepository.show();
		}
		else {
			statusbarRepository.hide();
		}
	}	
}