import * as vscode from 'vscode';
import { UriOptions } from 'request';

let _channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Hostbridge');
	}
	return _channel;
}


export let password: string|undefined;
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


let HbActionsToMethods:any = {
	'RUN': 'POST',
	'EXEC': 'POST',
	'LIST2': 'POST',
	'DELETE': 'DELETE',
	'GET': 'POST',
};

/// action = MAKE or RUN
export function getHttpOptions(o:any): UriOptions {

	let config = vscode.workspace.getConfiguration('hostbridge');			

	let method:any = HbActionsToMethods[o.action];

	let options:any =
	{							
		method: o.method,
		//uri: `https://${config.host}:${config.currentRegion.port}/${config.currentRepository.name}/mscript`,
		uri: `https://${config.host}:${o.port}/${o.repository}/mscript`,
		headers: {
			'Authorization': "Basic " + Buffer.from(`${config.userid}:${password}`).toString('base64'),
			'X-HB-ACTION': o.action,
			'X-HB-ACTION-TARGET': o.filename,
			'X-HB-TRANSLATE': 'text',
			'Content-Type': (o.method === 'POST') ? 'text/plain' : 'application/x-www-form-urlencoded',
			'Cache-Control': 'no-cache',
			'Pragma': 'no-cache'				
		}
	};

	if (o.filecontents) {
		options.body = o.filecontents;
	}

	return options;
}	

// find a sort extension..
