import * as vscode from 'vscode';
import { UriOptions } from 'request';

let _channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Hostbridge');
	}
	return _channel;
}


let _password: string|undefined;
export async function getPassword() {
	if (!_password) {
		_password = await vscode.window.showInputBox({
			password: true,
			prompt: "Please enter your CESN/RACF password.",	
			validateInput: text => {
				return text.length === 0 ? 'Password is required!' : null;
			},
		});
	}
	return _password;
}
export function setPassword(val: string|undefined) {
	_password = val;
}

export function openNewNamedVirtualDoc(schemeAndName: vscode.Uri, docContent: string) {
	vscode.workspace.openTextDocument(schemeAndName).then((doc) => {
		vscode.window.showTextDocument(doc, 1, false).then(e => {
		  e.edit(edit => {
			edit.insert(new vscode.Position(0, 0), docContent);
		  });
		});
	  }, (error) => {
		getOutputChannel().appendLine(error);
		getOutputChannel().show(true); 
	  });
}

let HbActionsToMethods:any = {
	'RUN': 'POST',
	'MAKE': 'POST',
	'LIST2': 'POST',
	'DELETE': 'DELETE',
	'GET': 'POST',
	'PUT': 'PUT'
};

/// action = MAKE or RUN
export function getHttpOptions(o:any): UriOptions {

	let config = vscode.workspace.getConfiguration('hostbridge');			

	let method:any = HbActionsToMethods[o.action];

	let options:any =
	{							
		method: method,
		uri: `https://${config.host}:${o.port}/${o.repository}/${(method==='POST') ? 'mscript' : o.filename}`,
		headers: {			
			'X-HB-ACTION': o.action,
			'X-HB-ACTION-TARGET': o.filename,
			'X-HB-DEFAULT-REPOSITORY': o.repository,
			'Authorization': "Basic " + Buffer.from(`${config.userid}:${_password}`).toString('base64'),
			'Content-Type': (method === 'POST') ? 'text/plain' : 'application/x-www-form-urlencoded',
			'Cache-Control': 'no-cache',
			'Pragma': 'no-cache'				
		}
	};

	if (o.contents) {
		options.body = o.contents;
	}

	if (method !== 'DELETE') {
		options.headers['X-HB-TRANSLATE'] = 'text';
	}

	if (o.resolveWithFullResponse) {
		options.resolveWithFullResponse = o.resolveWithFullResponse;
	}

	return options;
}	

// find a sort extension..
