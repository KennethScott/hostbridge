import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import { UriOptions } from 'request';
import { QuickPickItem } from 'vscode';
import { getOutputChannel, getHttpOptions } from "./utils";
import { FileParser } from "./fileParser";
import { statusbarRegion, statusbarRepository, setupStatusBarItems, updateStatusBarItems } from "./statusBarHelper";
import { TreeDataProvider, TreeItem } from './hostView';

let password: string|undefined;
export async function getPassword() {
	if (!password) {
		password = await vscode.window.showInputBox({
			password: true,
			prompt: "Please enter your CESN/RACF password.",	
			validateInput: text => {
				return text.length === 0 ? 'Password is required!' : null;
			},
		});
	}
	return password;
}


export function activate({ subscriptions }: vscode.ExtensionContext) {	

	console.log('Hostbridge extension active.');

	setupStatusBarItems(subscriptions);
	updateStatusBarItems();

	subscriptions.push(vscode.commands.registerCommand('extension.updateCurrentRegion', () => {
		
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

	subscriptions.push(vscode.commands.registerCommand('extension.updateCurrentRepository', () => {
		
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

	subscriptions.push(vscode.commands.registerCommand('extension.make', async (uri:vscode.Uri) => {
	
		let response: any = {};

		await getPassword();	

		if (password) {

			let hbFile = new FileParser(uri);
			let options:UriOptions = getHttpOptions("MAKE", password, hbFile.filename, hbFile.contents);
			
			//#region MAKE Headers 
			// POST /***REMOVED***/mscript HTTP/1.1
			// X-HB-ACTION: MAKE
			// X-HB-ACTION-TARGET: Test3.hbx
			// X-HB-PLUGIN-VERSION: 201702011429
			// X-HB-DEFAULT-REPOSITORY: ***REMOVED***
			// Authorization: Basic ---
			// Content-type: text/plain
			// X-HB-TRANSLATE: text
			// Cache-Control: no-cache
			// Pragma: no-cache
			// User-Agent: Java/1.8.0_201
			// Host: ***REMOVED***:***REMOVED***
			// Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
			// Connection: keep-alive
			// Content-Length: 994
			//#endregion

			const result = await request.post(options)
				.then((body) => { response = body; })
				.catch ((err) => { response = err; })
				.finally(() => {
					console.log(response);		
					getOutputChannel().appendLine(response);
					getOutputChannel().show(true);
				});					

		}

	}));

	subscriptions.push(vscode.commands.registerCommand('extension.exec', async (uri:vscode.Uri) => {

		let response: any = {};

		await getPassword();		

		if (password) {

			let hbFile = new FileParser(uri);
			let options:UriOptions = getHttpOptions("RUN", password, hbFile.filename, hbFile.contents);

			//#region RUN (Exec) Headers 
			// POST /***REMOVED***/mscript HTTP/1.1
			// X-HB-ACTION: RUN
			// X-HB-ACTION-TARGET: Test3.hbx
			// X-HB-PLUGIN-VERSION: 201702011429
			// X-HB-DEFAULT-REPOSITORY: ***REMOVED***
			// Authorization: Basic ---
			// Content-type: text/plain
			// X-HB-TRANSLATE: text
			// Cache-Control: no-cache
			// Pragma: no-cache
			// User-Agent: Java/1.8.0_201
			// Host: ***REMOVED***:***REMOVED***
			// Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
			// Connection: keep-alive
			// Content-Length: 979
			//#endregion

			const result = await request.post(options)
				.then((body) => { response = body; })
				.catch ((err) => { response = err; })
				.finally(() => {
					console.log(response);		
					getOutputChannel().appendLine(response);
					getOutputChannel().show(true);
				});			
		}

	}));	

	vscode.window.registerTreeDataProvider('hostView', new TreeDataProvider());	

}

export function deactivate() {}


// to call a function when config changes are made:
//workspace.onDidChangeConfiguration(() => myupdatefunction());

// show output example
//vscode.window.showInformationMessage(response);


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


//#region delete script
//DELETE https://***REMOVED***:***REMOVED***/***REMOVED***/Test3 HTTP/1.1
//X-HB-ACTION: DELETE
//X-HB-ACTION-TARGET: Test3
//X-HB-PLUGIN-VERSION: 201702011429
//X-HB-DEFAULT-REPOSITORY: ***REMOVED***
//Authorization: Basic ===
//Cache-Control: no-cache
//Pragma: no-cache
//User-Agent: Java/1.8.0_201
//Host: ***REMOVED***:***REMOVED***
//Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
//Connection: keep-alive
//#endregion

//#region get script
//POST https://***REMOVED***:***REMOVED***/***REMOVED***/mscript HTTP/1.1
//X-HB-ACTION: GET
//X-HB-ACTION-TARGET: CdoDepCesaInq
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
//Content-Length: 54
//#endregion