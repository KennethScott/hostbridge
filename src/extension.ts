// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request-promise-native';

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
	let disposable2 = vscode.commands.registerCommand('extension.make', async () => {
		// The code you place here will be executed every time your command is executed
		
		// const baseUrl = 'www.random.org/integers';
		// const queryString = '?num=100&min=1&max=100&col=5&base=10&format=html&rnd=new';
		// var options = {
		// 	uri: baseUrl + queryString,
		// };
		
		// let response: any = {};
		// let respBody: any = {};

		// //const result = await request.get(options);
		// const result = request.get(options)
		// 				.then((body) => { respBody = body; response = JSON.parse(body); });


		let response: any = {};
		// Here we go!
		const result = await request.get("http://httpbin.org/ip")
			.then((body) => { response = JSON.parse(body); })
			.catch ((err) => { response = { "origin": err.toString() }; });
		// Now that we have our response, pull out the origin and return it
		// to the caller.
		//return response.origin;


		// Display a message box to the user
		vscode.window.showInformationMessage(response.origin);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
