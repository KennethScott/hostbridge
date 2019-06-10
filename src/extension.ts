import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import * as fs from 'fs';
import { stringify } from 'querystring';
import { debug } from 'util';
import { UriOptions } from 'request';
import { OutputChannel } from 'vscode';


class HostbridgeFile {
	public filename: string;
	public folder: string;
	public contents: string;

	constructor(uri: vscode.Uri) {
		let uriPieces = uri.fsPath.split("\\");
		this.filename = uriPieces[uriPieces.length-1];
		this.folder = uriPieces[uriPieces.length-2];	
		// no idea why this doesn't seem to work..
		// vscode.workspace.openTextDocument(uri).then((document) => {
		// 	fileContents = document.getText();
		// });
		this.contents = fs.readFileSync(uri.fsPath, 'utf-8');
	}

	/// action = MAKE or RUN
	getHttpOptions(action:string): UriOptions {

		let config = vscode.workspace.getConfiguration('hostbridge');
			
		let x =  
		{				
			method: 'POST',
			uri: "https://" + config.host + ":" + config.port + "/" + this.folder + "/mscript",
			//uri: "https://" + config.host + ":" + config.port + "/" + '***REMOVED***' + "/mscript",
			headers: {
				'Authorization': "Basic " + Buffer.from(config.userid + ':' + 'nowayjose').toString('base64'),
				'X-HB-ACTION': action,
				'X-HB-ACTION-TARGET': this.filename,
				'X-HB-TRANSLATE': 'text',
				'Content-Type': 'text/plain',
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache'				
			},
			body: this.contents
		};

		return x;
	}		
}


let _channel: vscode.OutputChannel;
function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Hostbridge');
	}
	return _channel;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {	

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Hostbridge extension active.');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableMake = vscode.commands.registerCommand('extension.make', async (uri:vscode.Uri) => {
	
		let response: any = {};

		let hbFile = new HostbridgeFile(uri);
		
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

		let options = hbFile.getHttpOptions("MAKE");

		const result = await request.post(options)
		 	.then((body) => { response = body; })
		 	.catch ((err) => { response = err; });
		
		console.log(response);
		//vscode.window.showInformationMessage(response);
		getOutputChannel().appendLine(response);
		getOutputChannel().show(true);		
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableExec = vscode.commands.registerCommand('extension.exec', async (uri:vscode.Uri) => {

		let response: any = {};

		let hbFile = new HostbridgeFile(uri);

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

		let options = hbFile.getHttpOptions("RUN");

		const result = await request.post(options)
		 	.then((body) => { response = body; })
		 	.catch ((err) => { response = err; });
		
		console.log(response);		
		//vscode.window.showInformationMessage(response);
		getOutputChannel().appendLine(response);
		getOutputChannel().show(true);
	});	

	context.subscriptions.push(disposableMake, disposableExec);
}

// this method is called when your extension is deactivated
export function deactivate() {}
