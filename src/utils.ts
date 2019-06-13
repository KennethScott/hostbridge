import * as vscode from 'vscode';
import { UriOptions } from 'request';

let _channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Hostbridge');
	}
	return _channel;
}


let HbActionsToMethods:any = {
	'RUN': 'POST',
	'EXEC': 'POST',
	'LIST2': 'POST',
	'DELETE': 'DELETE',
	'GET': 'POST',
};

/// action = MAKE or RUN
export function getHttpOptions(action:string, password:string, filename:string, filecontents:string|undefined = undefined): UriOptions {

	let config = vscode.workspace.getConfiguration('hostbridge');			

	let method:any = HbActionsToMethods[action];

	let options:any =
	{							
		method: method,
		uri: `https://${config.host}:${config.currentRegion.port}/${config.currentRepository.name}/mscript`,
		headers: {
			'Authorization': "Basic " + Buffer.from(`${config.userid}:${password}`).toString('base64'),
			'X-HB-ACTION': action,
			'X-HB-ACTION-TARGET': filename,
			'X-HB-TRANSLATE': 'text',
			'Content-Type': (method === 'POST') ? 'text/plain' : 'application/x-www-form-urlencoded',
			'Cache-Control': 'no-cache',
			'Pragma': 'no-cache'				
		}
	};

	if (filecontents) {
		options.body = filecontents;
	}

	return options;
}	

// find a sort extension..
