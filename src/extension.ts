// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import * as fs from 'fs';
import { stringify } from 'querystring';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "hostbridge" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable2 = vscode.commands.registerCommand('extension.make', async (uri:vscode.Uri) => {
		// The code you place here will be executed every time your command is executed		
		let response: any = {};

		let uriPieces = uri.fsPath.split("\\");
		let filename = uriPieces[uriPieces.length-1];
		let folder = uriPieces[uriPieces.length-2];	

		let fileContents = fs.readFileSync(uri.fsPath, 'utf-8');

		// vscode.workspace.openTextDocument(uri).then((document) => {
		// 	fileContents = document.getText();
		// });

		let options = {
			method: 'POST',
			uri: "https://" + vscode.workspace.getConfiguration('hostbridge').host + ":***REMOVED***/" + folder + "/mscript",
			headers: {
				'Authorization': "Basic " + new Buffer('user:pass').toString('base64'),
				'X-HB-ACTION': "MAKE2",
				'X-HB-ACTION-TARGET': filename.replace(".hbx", "")
				//'Content-Type': 'Application/json'
			},
			body: fileContents,

		};

		// Here we go!
		const result = await request.post(options)
		 	.then((body) => { response = JSON.parse(body); })
		 	.catch ((err) => { response = { "origin": err.toString() }; });
		
		// Now that we have our response, pull out the origin and display it
		// Display a message box to the user
		//vscode.window.showInformationMessage(response.origin);
		vscode.window.showInformationMessage(response);
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable3 = vscode.commands.registerCommand('extension.exec', async () => {
		// The code you place here will be executed every time your command is executed		
		let response: any = {};

		var options = {
			uri: "http://httpbin.org/ip",
		};

		// Here we go!
		const result = await request.get("http://httpbin.org/ip")
		 	.then((body) => { response = JSON.parse(body); })
		 	.catch ((err) => { response = { "origin": err.toString() }; });
		
		// Now that we have our response, pull out the origin and display it
		// Display a message box to the user
		vscode.window.showInformationMessage(response.origin);
	});	

	context.subscriptions.push(disposable, disposable2, disposable3);
}

// this method is called when your extension is deactivated
export function deactivate() {}
