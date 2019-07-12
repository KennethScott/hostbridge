import * as vscode from 'vscode';
import { QuickPickItem } from 'vscode';
import { HostTreeItem } from './hostExplorer';
import * as config from "./config";

export let statusbarRepository: vscode.StatusBarItem;
const ACTIVE_REPOSITORY_NOT_SET:string = "SET ACTIVE REPOSITORY";

export function setupStatusBarItem(subscriptions:any) {
	this.statusbarRepository = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	this.statusbarRepository.command = 'extension.updateActiveRepository';
	let activeRepository = config.get().activeRepository;
	this.statusbarRepository.text = (!activeRepository) ? ACTIVE_REPOSITORY_NOT_SET : activeRepository;
	this.statusbarRepository.show();
	subscriptions.push(this.statusbarRepository);
}

// export function updateStatusBarItem() {
// 	let editor:vscode.TextEditor|undefined = vscode.window.activeTextEditor;
// 	if (editor) {
// 		let file = new FileParser(editor.document.uri);
// 		if (file.filename.toLowerCase().endsWith('.hbx')) {
// 			let pieces = this.statusbarRepository.text.split("\\");
// 			if (pieces.length !== 3) {
// 				this.statusbarRepository.text = ACTIVE_REPOSITORY_NOT_SET;
// 			}
// 			else {
// 				pieces[2] = file.folder;
// 				this.statusbarRepository.text = pieces.join("\\");
// 			}		
// 			this.statusbarRepository.show();
// 		}
// 		else {
// 			this.statusbarRepository.hide();
// 		}
// 	}	
// }

export async function updateStatusBarItem(hostTreeItem:HostTreeItem|undefined) {

	let activeRepository:string = "";

	if (hostTreeItem) {
		activeRepository = hostTreeItem.parent.parent.label + "\\" + hostTreeItem.parent.label + "\\" + hostTreeItem.label;
	}
	else {

		let repositories:QuickPickItem[] = [];
	
		config.getHosts().forEach((host:any) => {
			host.regions.forEach((region:any) => {
				region.repositories.forEach((repository:any) => {
					repositories.push({ label: host.name + "\\" + region.name + "\\" + repository});
				});
			});
		});

		repositories.sort((a:QuickPickItem,b:QuickPickItem) => a.label.localeCompare(b.label)); 

		await vscode.window.showQuickPick(repositories, { placeHolder: 'Select the desired repository.' })
			.then((selection:any) => {
				activeRepository = (selection) ? selection.label : this.statusbarRepository.text;
			});			

	}

	await vscode.workspace.getConfiguration().update('hostbridge.activeRepository', activeRepository, vscode.ConfigurationTarget.Global);
	this.statusbarRepository.text = activeRepository;	
}