// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import * as fs from 'fs';
import { stringify } from 'querystring';
import { debug } from 'util';
import { UriOptions } from 'request';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "hostbridge" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable2 = vscode.commands.registerCommand('extension.make', async (uri:vscode.Uri) => {
		// The code you place here will be executed every time your command is executed		
		let response: any = {};

		let hbFile = new HostbridgeFile(uri);
		
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

		let options = hbFile.getHttpOptions("MAKE");

		// Here we go!
		const result = await request.post(options)
		 	.then((body) => { response = body; })
		 	.catch ((err) => { response = { "origin": err.toString() }; });
		
		// Now that we have our response, pull out the origin and display it
		// Display a message box to the user
		console.log(response);
		vscode.window.showInformationMessage(response);
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable3 = vscode.commands.registerCommand('extension.exec', async (uri:vscode.Uri) => {

		let response: any = {};

		let hbFile = new HostbridgeFile(uri);

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

		let options = hbFile.getHttpOptions("RUN");

		// Here we go!
		const result = await request.post(options)
		 	.then((body) => { response = body; })
		 	.catch ((err) => { response = { "origin": err.toString() }; });
		
		// Now that we have our response, pull out the origin and display it
		// Display a message box to the user
		console.log(response);		
		vscode.window.showInformationMessage(response);
	});	

	context.subscriptions.push(disposable2, disposable3);
}

// this method is called when your extension is deactivated
export function deactivate() {}
