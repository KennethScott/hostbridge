import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import * as fs from 'fs';
//import { stringify } from 'querystring';
import { debug } from 'util';
import { UriOptions } from 'request';
import { QuickPickItem } from 'vscode';

class HostbridgeUtil {
	public filename:string;
	public folder:string;
	public contents:string;
	public options:UriOptions;

	constructor(uri:vscode.Uri, action:string) {
		let uriPieces = uri.fsPath.split("\\");
		this.filename = uriPieces[uriPieces.length-1];
		this.folder = uriPieces[uriPieces.length-2];	
		// no idea why this doesn't seem to work..
		// vscode.workspace.openTextDocument(uri).then((document) => {
		// 	fileContents = document.getText();
		// });
		this.contents = fs.readFileSync(uri.fsPath, 'utf-8');
		this.options = this.getHttpOptions(action);
	}

	/// action = MAKE or RUN
	getHttpOptions(action:string): UriOptions {

		let config = vscode.workspace.getConfiguration('hostbridge');			

		let options =
		{							
			method: 'POST',
			uri: "https://" + config.host + ":" + config.currentRegion.port + "/" + this.folder + "/mscript",
			//uri: "https://" + config.host + ":" + config.port + "/" + '***REMOVED***' + "/mscript",
			headers: {
				'Authorization': "Basic " + Buffer.from(config.userid + ':' + password).toString('base64'),
				'X-HB-ACTION': action,
				'X-HB-ACTION-TARGET': this.filename,
				'X-HB-TRANSLATE': 'text',
				'Content-Type': 'text/plain',
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache'				
			},
			body: this.contents
		};

		return options;
	}		
}


let _channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Hostbridge');
	}
	return _channel;
}


let password: string | undefined;
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

let statusbarRegion: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {	

	console.log('Hostbridge extension active.');

	subscriptions.push(vscode.commands.registerCommand('extension.updateCurrentRegion', async () => {
		
		let regions:QuickPickItem[] = [];
		vscode.workspace.getConfiguration('hostbridge').regions.forEach((r:any) => {
			regions.push({ label: r.name.toString(), description: r.port.toString() });
		});
		
		vscode.window.showQuickPick(regions, { placeHolder: 'Select the desired CICS region.' })
			.then((selection:any) => {
				if (!selection) {
					return;
				}
				vscode.workspace.getConfiguration().update('hostbridge.currentRegion', { name: selection.label, port: +selection.description }, vscode.ConfigurationTarget.Global);
				statusbarRegion.text = selection.label;
			});		

	}));

	// create a new status bar item that we can now manage
	statusbarRegion = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusbarRegion.command = 'extension.updateCurrentRegion';
	let currentRegion = vscode.workspace.getConfiguration('hostbridge').currentRegion as any;
	statusbarRegion.text = (!currentRegion) ? "SET REGION" : currentRegion.name;
	statusbarRegion.show();
	subscriptions.push(statusbarRegion);


	subscriptions.push(vscode.commands.registerCommand('extension.make', async (uri:vscode.Uri) => {
	
		let response: any = {};

		await getPassword();	

		if (password) {

			let hbUtil = new HostbridgeUtil(uri, "MAKE");
			
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

			const result = await request.post(hbUtil.options)
				.then((body) => { response = body; })
				.catch ((err) => { response = err; });
			
			console.log(response);
			//vscode.window.showInformationMessage(response);
			getOutputChannel().appendLine(response);
			getOutputChannel().show(true);		
		}
	}));


	subscriptions.push( vscode.commands.registerCommand('extension.exec', async (uri:vscode.Uri) => {

		//await updateCurrentRegion();

		let response: any = {};

		await getPassword();		

		if (password) {

			let hbUtil = new HostbridgeUtil(uri, "RUN");

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

			const result = await request.post(hbUtil.options)
				.then((body) => { response = body; })
				.catch ((err) => { response = err; });
			
			console.log(response);		
			//vscode.window.showInformationMessage(response);
			getOutputChannel().appendLine(response);
			getOutputChannel().show(true);
		}
	}));	

}

// this method is called when your extension is deactivated
export function deactivate() {}
